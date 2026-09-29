# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Lean Lab Lifecycle Controller
# Controls Start (Scale 1), Stop (Scale 0), Status, and Teardown
# ==============================================================================

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "status", "publish", "lambdas", "destroy")]
    [string]$Action = "status",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"
$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
$state = if (Test-Path $stateFile) { Get-Content $stateFile | ConvertFrom-Json } else { $null }

if ($state -and $state.Region) { $Region = $state.Region }
$asg = if ($state -and $state.AsgName) { $state.AsgName } elseif ($state -and $state.AutoScalingGroupName) { $state.AutoScalingGroupName } else { "lorcana-asg" }
$albDns = if ($state) { $state.AlbDnsName } else { $null }
$ltName = if ($state -and $state.LaunchTemplateName) { $state.LaunchTemplateName } else { "lorcana-lt" }

# Lambda functions whose source lives in this repo: bundle with esbuild, zip, update-function-code.
# @aws-sdk/* ships with the nodejs20.x runtime, so it stays external.
$lambdaFns = @(
    @{ Name = "lorcana-analyzer"; Entry = "backend/serverless/analyzer/handler.ts"; Out = "analyzer/handler.js" },
    @{ Name = "lorcana-match-history"; Entry = "backend/serverless/match-history/handler.ts"; Out = "match-history/handler.js" },
    @{ Name = "lorcana-player-stats"; Entry = "backend/serverless/player-stats/handler.ts"; Out = "player-stats/handler.js" }
)
function Publish-Lambdas {
    $root = Split-Path $PSScriptRoot -Parent
    foreach ($fn in $lambdaFns) {
        $work = Join-Path ([System.IO.Path]::GetTempPath()) ("lorcana_lambda_" + [guid]::NewGuid().ToString("N"))
        New-Item -ItemType Directory -Path $work | Out-Null
        try {
            Push-Location $root
            try {
                npx esbuild $fn.Entry --bundle --platform=node --target=node20 --format=cjs "--external:@aws-sdk/*" "--outfile=$(Join-Path $work $fn.Out)" --log-level=warning
                if ($LASTEXITCODE -ne 0) { throw "esbuild failed for $($fn.Name)" }
            } finally { Pop-Location }
            $zip = Join-Path $work "code.zip"
            Compress-Archive -Path (Join-Path $work (Split-Path $fn.Out -Parent)) -DestinationPath $zip
            aws lambda update-function-code --function-name $fn.Name --zip-file "fileb://$zip" --region $Region --query LastUpdateStatus --output text
            if ($LASTEXITCODE -ne 0) { throw "update-function-code failed for $($fn.Name)" }
            aws lambda wait function-updated --function-name $fn.Name --region $Region
            Write-Host "  [OK] $($fn.Name) code updated" -ForegroundColor Gray
        } finally { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

switch ($Action) {
    "start" {
        Write-Host ("[START] Scaling ASG (" + $asg + ") to 2 (Multi-AZ Minimum 2)...") -ForegroundColor Green
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 2 --desired-capacity 2 --region $Region
        Write-Host "[OK] 2 Instances are booting across AZ-a and AZ-b. Expected online in 60-90s." -ForegroundColor Green
        if ($albDns) {
            Write-Host ("Application URL: http://" + $albDns) -ForegroundColor Yellow
            Write-Host ("Health Check:    http://" + $albDns + "/health") -ForegroundColor Yellow
        }
    }
    "stop" {
        Write-Host ("[STOP] Scaling ASG (" + $asg + ") to 0 (Scale-to-Zero)...") -ForegroundColor Green
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 0 --desired-capacity 0 --region $Region
        Write-Host "[OK] Instances terminating. Compute cost is now `$0.00/hr." -ForegroundColor Cyan
    }
    "status" {
        Write-Host ("[STATUS] Disney Lorcana Lab Status (" + $asg + " - " + $Region + "):") -ForegroundColor Cyan
        aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $asg --region $Region --query "AutoScalingGroups[0].Instances[*].[InstanceId,AvailabilityZone,LifecycleState,HealthStatus]" --output table
        if ($albDns) {
            try {
                $h = Invoke-RestMethod -Uri ("http://" + $albDns + "/health") -TimeoutSec 3
                Write-Host ("ALB Health: ONLINE (" + $h + ")") -ForegroundColor Green
            } catch {
                Write-Host "ALB Health: Standby / Unreachable" -ForegroundColor Yellow
            }
        }
    }
    "lambdas" {
        Write-Host "[LAMBDAS] Bundling and deploying Lambda code..." -ForegroundColor Green
        Publish-Lambdas
    }
    "publish" {
        # Build SPA (realtime -> API Gateway WebSocket) + backend bundle, upload to S3, sync Lambda secret, rolling refresh
        $root = Split-Path $PSScriptRoot -Parent
        $wsApi = aws apigatewayv2 get-apis --region $Region --query "Items[?Name=='LorcanaPlayLabWebSocketApi'].ApiEndpoint | [0]" --output text
        if (-not $wsApi -or $wsApi -eq "None") { Write-Error "LorcanaPlayLabWebSocketApi not found"; exit 1 }

        Write-Host "[1/7] Building frontend (VITE_WS_ENDPOINT=$wsApi/prod)..." -ForegroundColor Green
        Push-Location $root
        try {
            # Process env beats .env files in Vite; API stays same-origin behind the ALB
            $env:VITE_WS_ENDPOINT = "$wsApi/prod"; $env:VITE_API_BASE_URL = "/api"
            npm run build; if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
            Write-Host "[2/7] Bundling backend -> backend/dist_bundle/server.cjs..." -ForegroundColor Green
            npx esbuild backend/cluster.ts --bundle --platform=node --target=node18 --format=cjs --outfile=backend/dist_bundle/server.cjs --log-level=warning
            if ($LASTEXITCODE -ne 0) { throw "backend bundle failed" }
        } finally {
            Remove-Item Env:VITE_WS_ENDPOINT, Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue
            Pop-Location
        }

        Write-Host "[3/7] Uploading to S3..." -ForegroundColor Green
        $acct = aws sts get-caller-identity --query Account --output text
        aws s3 sync (Join-Path $root "dist") "s3://lorcana-playlab-static-$acct" --region $Region --only-show-errors
        if ($LASTEXITCODE -ne 0) { Write-Error "s3 sync failed"; exit 1 }
        aws s3 cp (Join-Path $root "backend/dist_bundle/server.cjs") "s3://lorcana-playlab-assets-$acct/server.cjs" --region $Region --only-show-errors
        if ($LASTEXITCODE -ne 0) { Write-Error "s3 cp server.cjs failed"; exit 1 }

        Write-Host "[4/7] Syncing JWT secret from SSM to legacy Lambdas..." -ForegroundColor Green
        $jwt = aws ssm get-parameter --name /lorcana/jwt-secret --with-decryption --region $Region --query Parameter.Value --output text
        if ($LASTEXITCODE -ne 0 -or -not $jwt) { Write-Error "SSM /lorcana/jwt-secret missing (run deploy first)"; exit 1 }
        foreach ($fn in @("lorcana-auth-login", "lorcana-deck")) {
            $vars = aws lambda get-function-configuration --function-name $fn --region $Region --query "Environment.Variables" --output json | ConvertFrom-Json
            if (-not $vars) { $vars = [pscustomobject]@{} }
            $vars | Add-Member -NotePropertyName JWT_SECRET -NotePropertyValue $jwt -Force
            $tmp = [System.IO.Path]::GetTempFileName()
            try {
                @{ Variables = $vars } | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
                aws lambda update-function-configuration --function-name $fn --environment "file://$tmp" --region $Region --query "LastUpdateStatus" --output text
            } finally { Remove-Item $tmp -Force }
        }
        Remove-Variable jwt

        Write-Host "[5/7] Deploying Lambda code..." -ForegroundColor Green
        Publish-Lambdas

        # nginx/systemd config lives in the launch template's user_data and the ASG launches from $Latest,
        # so a changed ec2_user_data.sh only reaches new instances if we push a new template version
        Write-Host "[6/7] Syncing launch template user_data..." -ForegroundColor Green
        $ud = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content (Join-Path $PSScriptRoot "ec2_user_data.sh") -Raw)))
        $curUd = aws ec2 describe-launch-template-versions --launch-template-name $ltName --versions '$Latest' --region $Region --query "LaunchTemplateVersions[0].LaunchTemplateData.UserData" --output text
        if ($LASTEXITCODE -ne 0) { Write-Error "cannot read launch template $ltName (run deploy first)"; exit 1 }
        if ($curUd -eq $ud) {
            Write-Host "  user_data unchanged" -ForegroundColor Gray
        } else {
            $tmp = [System.IO.Path]::GetTempFileName()
            try {
                @{ UserData = $ud } | ConvertTo-Json -Compress | Set-Content -Path $tmp -Encoding Ascii
                $ver = aws ec2 create-launch-template-version --launch-template-name $ltName --source-version '$Latest' --launch-template-data "file://$tmp" --version-description ("publish " + (Get-Date -Format s)) --region $Region --query "LaunchTemplateVersion.VersionNumber" --output text
                if ($LASTEXITCODE -ne 0) { Write-Error "create-launch-template-version failed"; exit 1 }
                Write-Host "  new launch template version $ver" -ForegroundColor Gray
            } finally { Remove-Item $tmp -Force }
        }

        # Learner Lab SCP denies StartInstanceRefresh, so replace instances one at a time instead
        Write-Host "[7/7] Rolling replace (one instance at a time)..." -ForegroundColor Green
        $group = (aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $asg --region $Region --output json | ConvertFrom-Json).AutoScalingGroups[0]
        if (-not $group) { Write-Host "  ASG not deployed; new instances will pull this build on boot." -ForegroundColor Yellow; break }
        $tgArn = $group.TargetGroupARNs[0]
        # only instances that are serving: a Terminating one from an earlier replacement cannot be terminated again
        foreach ($old in ($group.Instances | Where-Object { $_.LifecycleState -eq 'InService' }).InstanceId) {
            Write-Host "  Replacing $old..." -ForegroundColor Gray
            aws autoscaling terminate-instance-in-auto-scaling-group --instance-id $old --no-should-decrement-desired-capacity --region $Region | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Error "terminate $old failed"; exit 1 }
            $healthy = 0
            for ($i = 0; $i -lt 60; $i++) {
                Start-Sleep -Seconds 10
                $healthy = [int](aws elbv2 describe-target-health --target-group-arn $tgArn --region $Region --query "length(TargetHealthDescriptions[?TargetHealth.State=='healthy' && Target.Id!='$old'])" --output text)
                if ($healthy -ge $group.DesiredCapacity) { break }
            }
            if ($healthy -lt $group.DesiredCapacity) { Write-Error "Replacement for $old not healthy after 10 min"; exit 1 }
            Write-Host "  [OK] $healthy/$($group.DesiredCapacity) healthy" -ForegroundColor Gray
        }
    }
    "destroy" {
        Write-Host "[TEARDOWN] Deleting all Lorcana cloud infrastructure..." -ForegroundColor Red
        $failed = @()
        function Invoke-Aws([string]$What, [scriptblock]$Cmd) {
            $out = & $Cmd 2>&1
            if ($LASTEXITCODE -ne 0 -and "$out" -notmatch "NotFound|does not exist|InvalidGroup.NotFound|ValidationError.*not found") {
                Write-Host "  [FAIL] $What : $out" -ForegroundColor Red
                $script:failed += $What
            }
        }
        $vpc = if ($state -and $state.VpcId) { $state.VpcId } else {
            aws ec2 describe-vpcs --filters "Name=tag:Name,Values=lorcana-lean-vpc" --region $Region --query "Vpcs[0].VpcId" --output text
        }
        if ($vpc -eq "None") { $vpc = $null }

        Write-Host "[1/6] ASG, Launch Template, Alarm..." -ForegroundColor Gray
        Invoke-Aws "delete ASG" { aws autoscaling delete-auto-scaling-group --auto-scaling-group-name $asg --force-delete --region $Region }
        Invoke-Aws "delete LT" { aws ec2 delete-launch-template --launch-template-name $ltName --region $Region }
        Invoke-Aws "delete alarm" { aws cloudwatch delete-alarms --alarm-names "lorcana-unhealthy-hosts" --region $Region }

        Write-Host "[2/6] Load Balancer & Target Group..." -ForegroundColor Gray
        $albArn = aws elbv2 describe-load-balancers --names "lorcana-alb" --region $Region --query "LoadBalancers[0].LoadBalancerArn" --output text 2>$null
        if ($albArn -and $albArn -ne "None") {
            Invoke-Aws "delete ALB" { aws elbv2 delete-load-balancer --load-balancer-arn $albArn --region $Region }
            aws elbv2 wait load-balancers-deleted --load-balancer-arns $albArn --region $Region
        }
        $tgArn = aws elbv2 describe-target-groups --names "lorcana-tg" --region $Region --query "TargetGroups[0].TargetGroupArn" --output text 2>$null
        if ($tgArn -and $tgArn -ne "None") {
            # Listener release lags ALB deletion, so the TG can report ResourceInUse for a short while
            for ($i = 0; $i -lt 12; $i++) {
                aws elbv2 delete-target-group --target-group-arn $tgArn --region $Region 2>$null
                if ($LASTEXITCODE -eq 0) { break }
                Start-Sleep -Seconds 10
            }
            if ($LASTEXITCODE -ne 0) { Invoke-Aws "delete TG" { aws elbv2 delete-target-group --target-group-arn $tgArn --region $Region } }
        }

        # The cache node sits in the VPC subnets and its SG references lorcana-ec2-sg, so it must go BEFORE the ENI wait, SGs, subnets and VPC
        Write-Host "[ElastiCache] Deleting cache cluster, subnet group, SG, and parameter..." -ForegroundColor Gray
        $clusterStatus = aws elasticache describe-cache-clusters --cache-cluster-id "lorcana-cache" --region $Region --query "CacheClusters[0].CacheClusterStatus" --output text 2>$null
        if ($clusterStatus -and $clusterStatus -ne "None") {
            Invoke-Aws "delete cache cluster" { aws elasticache delete-cache-cluster --cache-cluster-id "lorcana-cache" --region $Region }
            Write-Host "  Waiting for cache cluster to delete..." -ForegroundColor Gray
            for ($i = 0; $i -lt 40; $i++) {
                $c = aws elasticache describe-cache-clusters --cache-cluster-id "lorcana-cache" --region $Region 2>$null
                if ($LASTEXITCODE -ne 0) { break }
                Start-Sleep -Seconds 10
            }
        }
        $subG = aws elasticache describe-cache-subnet-groups --cache-subnet-group-name "lorcana-cache-subnets" --region $Region --query "CacheSubnetGroups[0].CacheSubnetGroupName" --output text 2>$null
        if ($subG -and $subG -ne "None") {
            Invoke-Aws "delete cache subnet group" { aws elasticache delete-cache-subnet-group --cache-subnet-group-name "lorcana-cache-subnets" --region $Region }
        }
        $cacheSg = aws ec2 describe-security-groups --filters "Name=group-name,Values=lorcana-cache-sg" --region $Region --query "SecurityGroups[0].GroupId" --output text 2>$null
        if ($cacheSg -and $cacheSg -ne "None") {
            # ElastiCache releases its network interface about a minute after the cluster is gone
            for ($i = 0; $i -lt 12; $i++) {
                aws ec2 delete-security-group --group-id $cacheSg --region $Region 2>$null
                if ($LASTEXITCODE -eq 0) { break }
                Start-Sleep -Seconds 10
            }
            if ($LASTEXITCODE -ne 0) { Invoke-Aws "delete cache SG" { aws ec2 delete-security-group --group-id $cacheSg --region $Region } }
        }
        aws ssm delete-parameter --name "/lorcana/cache-endpoint" --region $Region 2>$null

        if ($vpc) {
            Write-Host "[3/6] Waiting for EC2/ALB network interfaces in $vpc to disappear..." -ForegroundColor Gray
            for ($i = 0; $i -lt 60; $i++) {
                $eni = aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc" --region $Region --query "length(NetworkInterfaces)" --output text
                if ($eni -eq "0") { break }
                Start-Sleep -Seconds 10
            }
            if ($eni -ne "0") { $failed += "ENIs still attached after 10 min" }

            Write-Host "[4/6] Security Groups..." -ForegroundColor Gray
            foreach ($sgName in @("lorcana-ec2-sg", "lorcana-alb-sg")) {
                $sg = aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc" "Name=group-name,Values=$sgName" --region $Region --query "SecurityGroups[0].GroupId" --output text
                if ($sg -and $sg -ne "None") { Invoke-Aws "delete $sgName" { aws ec2 delete-security-group --group-id $sg --region $Region } }
            }

            Write-Host "[5/6] Subnets, Route Tables, Internet Gateway..." -ForegroundColor Gray
            foreach ($s in ((aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc" --region $Region --query "Subnets[].SubnetId" --output text) -split "\s+" | Where-Object { $_ })) {
                Invoke-Aws "delete subnet $s" { aws ec2 delete-subnet --subnet-id $s --region $Region }
            }
            foreach ($rt in ((aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --region $Region --query "RouteTables[?Associations[0].Main!=``true``].RouteTableId" --output text) -split "\s+" | Where-Object { $_ })) {
                Invoke-Aws "delete route table $rt" { aws ec2 delete-route-table --route-table-id $rt --region $Region }
            }
            foreach ($igw in ((aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpc" --region $Region --query "InternetGateways[].InternetGatewayId" --output text) -split "\s+" | Where-Object { $_ })) {
                Invoke-Aws "detach IGW $igw" { aws ec2 detach-internet-gateway --internet-gateway-id $igw --vpc-id $vpc --region $Region }
                Invoke-Aws "delete IGW $igw" { aws ec2 delete-internet-gateway --internet-gateway-id $igw --region $Region }
            }

            Write-Host "[6/6] VPC..." -ForegroundColor Gray
            Invoke-Aws "delete VPC $vpc" { aws ec2 delete-vpc --vpc-id $vpc --region $Region }
        }

        Write-Host "[Decoupling] Deleting match events queues, topics, lambdas, tables..." -ForegroundColor Gray
        foreach ($q in @("lorcana-match-history", "lorcana-match-history-dlq", "lorcana-player-stats", "lorcana-player-stats-dlq")) {
            $u = aws sqs get-queue-url --queue-name $q --region $Region --query QueueUrl --output text 2>$null
            if ($u -and $u -ne "None") { Invoke-Aws "delete queue $q" { aws sqs delete-queue --queue-url $u --region $Region } }
        }
        $topArn = aws sns list-topics --region $Region --query "Topics[?ends_with(TopicArn, ':lorcana-match-events')].TopicArn | [0]" --output text 2>$null
        if ($topArn -and $topArn -ne "None") { Invoke-Aws "delete SNS topic" { aws sns delete-topic --topic-arn $topArn --region $Region } }
        foreach ($fn in @("lorcana-match-history", "lorcana-player-stats")) {
            $fnExists = aws lambda get-function --function-name $fn --region $Region 2>$null
            if ($LASTEXITCODE -eq 0) { Invoke-Aws "delete Lambda $fn" { aws lambda delete-function --function-name $fn --region $Region } }
        }
        foreach ($tbl in @("LorcanaMatchHistory", "LorcanaPlayerStats")) {
            $tblExists = aws dynamodb describe-table --table-name $tbl --region $Region 2>$null
            if ($LASTEXITCODE -eq 0) { Invoke-Aws "delete table $tbl" { aws dynamodb delete-table --table-name $tbl --region $Region } }
        }
        aws ssm delete-parameter --name "/lorcana/match-events-topic-arn" --region $Region 2>$null



        if ($failed.Count -gt 0) {
            Write-Host "[INCOMPLETE] $($failed.Count) step(s) failed; state file kept. Fix and re-run destroy:" -ForegroundColor Red
            $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
            exit 1
        }
        Remove-Item -Path $stateFile -Force -ErrorAction SilentlyContinue
        Write-Host "[DONE] Complete Teardown Finished. Hourly cost is `$0.0000." -ForegroundColor Green
    }
}
