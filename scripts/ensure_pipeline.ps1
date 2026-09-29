# ==============================================================================
# Async pipeline (SQS / Lambda wiring). Idempotent: safe to run on every deploy.
#   deck save -> SQS lorcana-deck-analyzer -> Lambda lorcana-analyzer -> DecksTable.analysis
#   failed records: retried, then moved to lorcana-deck-analyzer-dlq after 3 receives
# The queues live in the account (not in the VPC), so destroy leaves them in place like the main queue.
# ==============================================================================
[CmdletBinding()]
param([string]$Region = "us-east-1")

$ErrorActionPreference = "Stop"

function Invoke-Checked([string]$What, [scriptblock]$Cmd) {
    $out = & $Cmd
    if ($LASTEXITCODE -ne 0) { throw "$What failed" }
    return $out
}

# Get the queue URL, creating the queue when it does not exist yet
function Get-OrCreateQueue([string]$Name, [hashtable]$Attributes = @{}) {
    $url = aws sqs get-queue-url --queue-name $Name --region $Region --query QueueUrl --output text 2>$null
    if ($LASTEXITCODE -eq 0 -and $url) { return $url }
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        $Attributes | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
        return (Invoke-Checked "create queue $Name" { aws sqs create-queue --queue-name $Name --attributes "file://$tmp" --region $Region --query QueueUrl --output text })
    } finally { Remove-Item $tmp -Force }
}

function Get-QueueArn([string]$Url) {
    return (Invoke-Checked "get arn of $Url" { aws sqs get-queue-attributes --queue-url $Url --attribute-names QueueArn --region $Region --query Attributes.QueueArn --output text })
}

# --- deck analyzer: DLQ + redrive + partial batch failures -------------------
Write-Host "[pipeline] deck analyzer queue + DLQ" -ForegroundColor Green
$mainUrl = Get-OrCreateQueue "lorcana-deck-analyzer" @{ VisibilityTimeout = "30" }
$mainArn = Get-QueueArn $mainUrl
$dlqUrl = Get-OrCreateQueue "lorcana-deck-analyzer-dlq" @{ MessageRetentionPeriod = "1209600" } # 14 days to inspect failures
$dlqArn = Get-QueueArn $dlqUrl

# Lambda timeout is 3s; AWS advises a visibility timeout of at least 6x the function timeout (30s >= 18s)
$redrive = @{ deadLetterTargetArn = $dlqArn; maxReceiveCount = 3 } | ConvertTo-Json -Compress
$tmp = [System.IO.Path]::GetTempFileName()
try {
    @{ RedrivePolicy = $redrive; VisibilityTimeout = "30" } | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
    Invoke-Checked "set redrive policy" { aws sqs set-queue-attributes --queue-url $mainUrl --attributes "file://$tmp" --region $Region } | Out-Null
} finally { Remove-Item $tmp -Force }

$uuid = aws lambda list-event-source-mappings --function-name lorcana-analyzer --event-source-arn $mainArn --region $Region --query "EventSourceMappings[0].UUID" --output text
if ($uuid -and $uuid -ne "None") {
    Invoke-Checked "update event source mapping" { aws lambda update-event-source-mapping --uuid $uuid --function-response-types ReportBatchItemFailures --region $Region --query State --output text } | Out-Null
} else {
    Invoke-Checked "create event source mapping" { aws lambda create-event-source-mapping --function-name lorcana-analyzer --event-source-arn $mainArn --batch-size 10 --function-response-types ReportBatchItemFailures --region $Region --query State --output text } | Out-Null
}
Write-Host "  [OK] $mainUrl -> DLQ $dlqUrl (maxReceiveCount 3, ReportBatchItemFailures on)" -ForegroundColor Gray
