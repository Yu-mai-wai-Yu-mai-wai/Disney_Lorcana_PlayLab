# ==============================================================================
# Async pipeline (SQS / SNS / Lambda wiring). Idempotent: safe to run on every deploy.
#   1. Deck Analyzer: SQS lorcana-deck-analyzer -> Lambda lorcana-analyzer -> DecksTable.analysis (with DLQ)
#   2. Decoupling: SNS lorcana-match-events fan-out ->
#        -> SQS lorcana-match-history -> Lambda lorcana-match-history -> DynamoDB LorcanaMatchHistory (with DLQ)
#        -> SQS lorcana-player-stats  -> Lambda lorcana-player-stats  -> DynamoDB LorcanaPlayerStats (with DLQ)
# The queues and tables live in the account, safe to re-run anytime.
# ==============================================================================
[CmdletBinding()]
param([string]$Region = "us-east-1")

$ErrorActionPreference = "Continue"

function Invoke-Checked([string]$What, [scriptblock]$Cmd) {
    $out = & $Cmd
    if ($LASTEXITCODE -ne 0) { throw "$What failed" }
    return $out
}

$callerId = aws sts get-caller-identity --output json | ConvertFrom-Json
$AccountId = $callerId.Account
$LabRoleArn = "arn:aws:iam::$($AccountId):role/LabRole"

# --- DynamoDB Tables (PAY_PER_REQUEST) ----------------------------------------
$existingTables = (aws dynamodb list-tables --region $Region --output json | ConvertFrom-Json).TableNames

function Ensure-DynamoTable([string]$Name, [string]$PkName, [string]$SkName = $null) {
    if ($existingTables -contains $Name) {
        Write-Host "  [OK] DynamoDB table $Name already exists" -ForegroundColor Gray
        return
    }
    Write-Host "[pipeline] creating DynamoDB table $Name..." -ForegroundColor Green
    if ($SkName) {
        Invoke-Checked "create table $Name" {
            aws dynamodb create-table `
                --table-name $Name `
                --attribute-definitions AttributeName=$PkName,AttributeType=S AttributeName=$SkName,AttributeType=S `
                --key-schema AttributeName=$PkName,KeyType=HASH AttributeName=$SkName,KeyType=RANGE `
                --billing-mode PAY_PER_REQUEST `
                --region $Region --query "TableDescription.TableStatus" --output text
        } | Out-Null
    } else {
        Invoke-Checked "create table $Name" {
            aws dynamodb create-table `
                --table-name $Name `
                --attribute-definitions AttributeName=$PkName,AttributeType=S `
                --key-schema AttributeName=$PkName,KeyType=HASH `
                --billing-mode PAY_PER_REQUEST `
                --region $Region --query "TableDescription.TableStatus" --output text
        } | Out-Null
    }
    aws dynamodb wait table-exists --table-name $Name --region $Region
    Write-Host "  [OK] DynamoDB table $Name ready" -ForegroundColor Gray
}

Write-Host "[pipeline] DynamoDB Match and Stats tables" -ForegroundColor Green
Ensure-DynamoTable "LorcanaMatchHistory" "userId" "finishedAt#matchId"
Ensure-DynamoTable "LorcanaPlayerStats" "userId"

# --- SQS Helpers --------------------------------------------------------------
function Get-OrCreateQueue([string]$Name, [hashtable]$Attributes = @{}) {
    $url = aws sqs get-queue-url --queue-name $Name --region $Region --query QueueUrl --output text 2>$null
    if ($LASTEXITCODE -eq 0 -and $url -and $url -ne "None") { return $url }
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        $Attributes | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
        return (Invoke-Checked "create queue $Name" { aws sqs create-queue --queue-name $Name --attributes "file://$tmp" --region $Region --query QueueUrl --output text })
    } finally { Remove-Item $tmp -Force }
}

function Get-QueueArn([string]$Url) {
    return (Invoke-Checked "get arn of $Url" { aws sqs get-queue-attributes --queue-url $Url --attribute-names QueueArn --region $Region --query Attributes.QueueArn --output text })
}

function Set-SqsRedrivePolicy([string]$QueueUrl, [string]$DlqArn, [int]$MaxReceiveCount = 3, [int]$VisibilityTimeout = 30) {
    $redrive = @{ deadLetterTargetArn = $DlqArn; maxReceiveCount = $MaxReceiveCount } | ConvertTo-Json -Compress
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        @{ RedrivePolicy = $redrive; VisibilityTimeout = "$VisibilityTimeout" } | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
        Invoke-Checked "set redrive policy on $QueueUrl" { aws sqs set-queue-attributes --queue-url $QueueUrl --attributes "file://$tmp" --region $Region } | Out-Null
    } finally { Remove-Item $tmp -Force }
}

function Set-SqsSnsPolicy([string]$QueueUrl, [string]$QueueArn, [string]$TopicArn) {
    $policy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Sid = "AllowSnsSendMessage"
                Effect = "Allow"
                Principal = @{ Service = "sns.amazonaws.com" }
                Action = "sqs:SendMessage"
                Resource = $QueueArn
                Condition = @{
                    ArnEquals = @{ "aws:SourceArn" = $TopicArn }
                }
            }
        )
    } | ConvertTo-Json -Depth 5 -Compress
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        @{ Policy = $policy } | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
        Invoke-Checked "set queue policy on $QueueUrl" { aws sqs set-queue-attributes --queue-url $QueueUrl --attributes "file://$tmp" --region $Region } | Out-Null
    } finally { Remove-Item $tmp -Force }
}

# --- 1. Deck Analyzer: DLQ + redrive + partial batch failures ------------------
Write-Host "[pipeline] deck analyzer queue + DLQ" -ForegroundColor Green
$analyzerMainUrl = Get-OrCreateQueue "lorcana-deck-analyzer" @{ VisibilityTimeout = "30" }
$analyzerMainArn = Get-QueueArn $analyzerMainUrl
$analyzerDlqUrl = Get-OrCreateQueue "lorcana-deck-analyzer-dlq" @{ MessageRetentionPeriod = "1209600" } # 14 days
$analyzerDlqArn = Get-QueueArn $analyzerDlqUrl
Set-SqsRedrivePolicy $analyzerMainUrl $analyzerDlqArn 3 30

$analyzerMapping = (aws lambda list-event-source-mappings --function-name lorcana-analyzer --event-source-arn $analyzerMainArn --region $Region --output json 2>$null | ConvertFrom-Json).EventSourceMappings | Select-Object -First 1
if ($analyzerMapping) {
    if (-not ($analyzerMapping.FunctionResponseTypes -contains "ReportBatchItemFailures")) {
        Invoke-Checked "update event source mapping" { aws lambda update-event-source-mapping --uuid $analyzerMapping.UUID --function-response-types ReportBatchItemFailures --region $Region --query State --output text } | Out-Null
    }
} else {
    Invoke-Checked "create event source mapping" { aws lambda create-event-source-mapping --function-name lorcana-analyzer --event-source-arn $analyzerMainArn --batch-size 10 --function-response-types ReportBatchItemFailures --region $Region --query State --output text } | Out-Null
}
Write-Host "  [OK] $analyzerMainUrl -> DLQ $analyzerDlqUrl (maxReceiveCount 3, ReportBatchItemFailures on)" -ForegroundColor Gray

# --- 2. Decoupling: SNS Topic -> SQS Queues (T04) -----------------------------
Write-Host "[pipeline] match events SNS topic + SQS queues + DLQs" -ForegroundColor Green
$topicArn = aws sns create-topic --name lorcana-match-events --region $Region --query TopicArn --output text
if (-not $topicArn -or $topicArn -eq "None") { throw "Failed to create or get lorcana-match-events topic" }
Write-Host "  [OK] SNS Topic: $topicArn" -ForegroundColor Gray

# Match History SQS + DLQ
$histMainUrl = Get-OrCreateQueue "lorcana-match-history" @{ VisibilityTimeout = "30" }
$histMainArn = Get-QueueArn $histMainUrl
$histDlqUrl = Get-OrCreateQueue "lorcana-match-history-dlq" @{ MessageRetentionPeriod = "1209600" }
$histDlqArn = Get-QueueArn $histDlqUrl
Set-SqsRedrivePolicy $histMainUrl $histDlqArn 3 30
Set-SqsSnsPolicy $histMainUrl $histMainArn $topicArn

# Player Stats SQS + DLQ
$statsMainUrl = Get-OrCreateQueue "lorcana-player-stats" @{ VisibilityTimeout = "30" }
$statsMainArn = Get-QueueArn $statsMainUrl
$statsDlqUrl = Get-OrCreateQueue "lorcana-player-stats-dlq" @{ MessageRetentionPeriod = "1209600" }
$statsDlqArn = Get-QueueArn $statsDlqUrl
Set-SqsRedrivePolicy $statsMainUrl $statsDlqArn 3 30
Set-SqsSnsPolicy $statsMainUrl $statsMainArn $topicArn

# Subscriptions
function Ensure-SnsSubscription([string]$TopicArn, [string]$QueueArn) {
    $subs = aws sns list-subscriptions-by-topic --topic-arn $TopicArn --region $Region --output json | ConvertFrom-Json
    $existing = $subs.Subscriptions | Where-Object { $_.Endpoint -eq $QueueArn -and $_.SubscriptionArn -ne "PendingConfirmation" }
    if (-not $existing) {
        Invoke-Checked "subscribe $QueueArn to $TopicArn" {
            aws sns subscribe --topic-arn $TopicArn --protocol sqs --notification-endpoint $QueueArn --region $Region --query SubscriptionArn --output text
        } | Out-Null
        Write-Host "  [OK] Subscribed $QueueArn to $TopicArn" -ForegroundColor Gray
    } else {
        Write-Host "  [OK] Subscription exists for $QueueArn" -ForegroundColor Gray
    }
}
Ensure-SnsSubscription $topicArn $histMainArn
Ensure-SnsSubscription $topicArn $statsMainArn

# --- 3. Lambda Provisioning & Event Source Mappings (T04) -----------------------
Write-Host "[pipeline] Lambda functions for Decoupling" -ForegroundColor Green
$root = Split-Path $PSScriptRoot -Parent
$existingFuncs = (aws lambda list-functions --region $Region --output json | ConvertFrom-Json).Functions.FunctionName

function Ensure-Lambda([string]$Name, [string]$Entry, [string]$OutRel, [hashtable]$EnvVars = @{}) {
    $work = Join-Path ([System.IO.Path]::GetTempPath()) ("lorcana_lambda_" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $work | Out-Null
    try {
        $outPath = Join-Path $work $OutRel
        $outDir = Split-Path $outPath -Parent
        if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
        
        Push-Location $root
        try {
            npx esbuild $Entry --bundle --platform=node --target=node20 --format=cjs "--external:@aws-sdk/*" "--outfile=$outPath" --log-level=warning
            if ($LASTEXITCODE -ne 0) { throw "esbuild failed for $Name" }
        } finally { Pop-Location }

        $zip = Join-Path $work "code.zip"
        Compress-Archive -Path $outDir -DestinationPath $zip

        $parentFolder = Split-Path $OutRel -Parent
        $handlerName = "$parentFolder/handler.handler"

        if ($existingFuncs -contains $Name) {
            aws lambda update-function-code --function-name $Name --zip-file "fileb://$zip" --region $Region --query LastUpdateStatus --output text | Out-Null
            aws lambda wait function-updated --function-name $Name --region $Region
            Write-Host "  [OK] Lambda $Name updated" -ForegroundColor Gray
        } else {
            $envJson = @{ Variables = $EnvVars } | ConvertTo-Json -Compress
            $tmp = [System.IO.Path]::GetTempFileName()
            try {
                Set-Content -Path $tmp -Value $envJson -Encoding Ascii
                aws lambda create-function `
                    --function-name $Name `
                    --runtime nodejs20.x `
                    --role $LabRoleArn `
                    --handler $handlerName `
                    --zip-file "fileb://$zip" `
                    --timeout 5 `
                    --memory-size 128 `
                    --environment "file://$tmp" `
                    --region $Region `
                    --query "FunctionArn" --output text | Out-Null
            } finally { Remove-Item $tmp -Force }
            aws lambda wait function-active --function-name $Name --region $Region
            Write-Host "  [OK] Lambda $Name created" -ForegroundColor Gray
        }
    } finally { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
}

Ensure-Lambda "lorcana-match-history" "backend/serverless/match-history/handler.ts" "match-history/handler.js" @{ MATCH_HISTORY_TABLE = "LorcanaMatchHistory" }
Ensure-Lambda "lorcana-player-stats" "backend/serverless/player-stats/handler.ts" "player-stats/handler.js" @{ PLAYER_STATS_TABLE = "LorcanaPlayerStats" }

# Event source mappings for new Lambdas
function Ensure-EventSourceMapping([string]$FunctionName, [string]$QueueArn) {
    $raw = aws lambda list-event-source-mappings --function-name $FunctionName --event-source-arn $QueueArn --region $Region --output json 2>$null | ConvertFrom-Json
    $mapping = if ($raw.EventSourceMappings) { $raw.EventSourceMappings | Select-Object -First 1 } else { $null }
    if ($mapping) {
        if (-not ($mapping.FunctionResponseTypes -contains "ReportBatchItemFailures")) {
            Invoke-Checked "update mapping $FunctionName" {
                aws lambda update-event-source-mapping --uuid $mapping.UUID --function-response-types ReportBatchItemFailures --region $Region --query State --output text
            } | Out-Null
        }
    } else {
        Invoke-Checked "create mapping $FunctionName" {
            aws lambda create-event-source-mapping --function-name $FunctionName --event-source-arn $QueueArn --batch-size 10 --function-response-types ReportBatchItemFailures --region $Region --query State --output text
        } | Out-Null
    }
    Write-Host "  [OK] Event source mapping for $FunctionName -> $QueueArn" -ForegroundColor Gray
}

Ensure-EventSourceMapping "lorcana-match-history" $histMainArn
Ensure-EventSourceMapping "lorcana-player-stats" $statsMainArn

# --- 4. SSM Parameter: match events topic ARN ---------------------------------
$out = aws ssm put-parameter --name "/lorcana/match-events-topic-arn" --type "String" --value $topicArn --overwrite --region $Region 2>&1
if ($LASTEXITCODE -ne 0) { throw "SSM put-parameter failed: $out" }
Write-Host "  [OK] SSM /lorcana/match-events-topic-arn updated ($topicArn)" -ForegroundColor Gray

Write-Host "[pipeline] All async pipelines, topics, queues, and Lambdas verified and ready!" -ForegroundColor Green
