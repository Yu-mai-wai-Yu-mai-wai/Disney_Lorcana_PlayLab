# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Auto Scaling Group Self-Healing / Recovery Test
# Evaluates: Min = 2, Multi-AZ Health Check, and Auto-Recovery on Instance Failure
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [string]$AsgName = "lorcana-asg",
    # app: stop Node via SSM Run Command (health check -> alarm -> ASG replace); terminate: kill the EC2 instance
    [ValidateSet("app", "terminate")]
    [string]$FailureMode = "app"
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[*] AWS Auto Scaling Group Self-Healing Test (Min = 2)" -ForegroundColor Yellow
Write-Host "ASG: $AsgName | Region: $Region" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Fetch current ASG state
Write-Host "`n[1/4] Checking current ASG instance pool..." -ForegroundColor Green
$asg = aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AsgName --region $Region --output json | ConvertFrom-Json
$group = $asg.AutoScalingGroups[0]

if (-not $group) {
    Write-Error "Auto Scaling Group '$AsgName' not found."
    exit 1
}

Write-Host "  Min Size:          $($group.MinSize)" -ForegroundColor Gray
Write-Host "  Desired Capacity:  $($group.DesiredCapacity)" -ForegroundColor Gray
Write-Host "  Max Size:          $($group.MaxSize)" -ForegroundColor Gray

# 2. Wait until instances are InService
Write-Host "`n[2/4] Waiting for initial instances to reach InService (Min = 2)..." -ForegroundColor Green
$timeout = 180
$elapsed = 0
$instances = @()

while ($elapsed -lt $timeout) {
    $asgInfo = aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AsgName --region $Region --output json | ConvertFrom-Json
    $instances = $asgInfo.AutoScalingGroups[0].Instances | Where-Object { $_.LifecycleState -eq "InService" }
    
    if ($instances.Count -ge 2) {
        Write-Host "  [OK] 2/2 Instances are InService!" -ForegroundColor Green
        break
    }
    
    Write-Host "  Waiting for instances... ($($instances.Count)/2 InService, elapsed: ${elapsed}s)" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    $elapsed += 10
}

# Display initial instances
Write-Host "`n[+] Current Active Instances:" -ForegroundColor Cyan
foreach ($inst in $instances) {
    $desc = aws ec2 describe-instances --instance-ids $inst.InstanceId --region $Region --output json | ConvertFrom-Json
    $az = $desc.Reservations[0].Instances[0].Placement.AvailabilityZone
    $ip = $desc.Reservations[0].Instances[0].PublicIpAddress
    Write-Host "  - Instance ID: $($inst.InstanceId) | AZ: $az | IP: $ip | Status: $($inst.HealthStatus)" -ForegroundColor Gray
}

# 3. Terminate 1 Instance to Simulate Failure
$victimId = $instances[0].InstanceId
$survivorId = $instances[1].InstanceId
$tgArn = $group.TargetGroupARNs[0]
$alarmName = "lorcana-unhealthy-hosts"
$t0 = Get-Date
function Stamp { "T+{0,4:N0}s {1:HH:mm:ss}Z" -f ((Get-Date) - $t0).TotalSeconds, (Get-Date).ToUniversalTime() }

Write-Host "`n[3/4] [SIMULATE FAILURE: $FailureMode] on $victimId..." -ForegroundColor Red
if ($FailureMode -eq "app") {
    # Explicit stop is not auto-restarted by Restart=always, so /api/health returns 502 through nginx
    # Shorthand without inner quotes: PowerShell mangles embedded JSON quotes for native commands
    $cmdId = aws ssm send-command --instance-ids $victimId --document-name "AWS-RunShellScript" --parameters "commands=systemctl stop lorcana-backend" --region $Region --query "Command.CommandId" --output text
    if ($LASTEXITCODE -ne 0) { Write-Error "SSM send-command failed"; exit 1 }
    aws ssm wait command-executed --command-id $cmdId --instance-id $victimId --region $Region
    $status = aws ssm get-command-invocation --command-id $cmdId --instance-id $victimId --region $Region --query Status --output text
    if ($status -ne "Success") { Write-Error "Failure injection did not run (SSM status: $status)"; exit 1 }
} else {
    aws ec2 terminate-instances --instance-ids $victimId --region $Region | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Error "terminate-instances failed"; exit 1 }
}
Write-Host "  $(Stamp) failure injected on $victimId (survivor: $survivorId)" -ForegroundColor Gray

# 4. Watch: replacement launched -> healthy in TG, alarm ALARM -> OK
Write-Host "`n[4/4] [AUTO-RECOVERY MONITOR] polling every 10s (timeout 15 min)..." -ForegroundColor Green
$events = [ordered]@{}
$replacementId = $null
$lastAlarm = $null
$deadline = $t0.AddMinutes(15)

while ((Get-Date) -lt $deadline) {
    $alarm = aws cloudwatch describe-alarms --alarm-names $alarmName --region $Region --query "MetricAlarms[0].StateValue" --output text
    if ($alarm -ne $lastAlarm) { Write-Host "  $(Stamp) alarm $alarmName = $alarm" -ForegroundColor Yellow; $lastAlarm = $alarm }
    if ($alarm -eq "ALARM" -and -not $events.AlarmFired) { $events.AlarmFired = Stamp }

    $current = (aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AsgName --region $Region --output json | ConvertFrom-Json).AutoScalingGroups[0].Instances
    $new = $current | Where-Object { $_.InstanceId -notin @($victimId, $survivorId) } | Select-Object -First 1
    if ($new -and -not $replacementId) { $replacementId = $new.InstanceId; $events.ReplacementLaunched = Stamp; Write-Host "  $(Stamp) ASG launched replacement $replacementId" -ForegroundColor Yellow }

    if ($replacementId -and -not $events.ReplacementHealthy) {
        $h = aws elbv2 describe-target-health --target-group-arn $tgArn --region $Region --query "TargetHealthDescriptions[?Target.Id=='$replacementId'].TargetHealth.State | [0]" --output text
        if ($h -eq "healthy") { $events.ReplacementHealthy = Stamp; Write-Host "  $(Stamp) $replacementId healthy in target group" -ForegroundColor Green }
    }
    if ($events.ReplacementHealthy -and $events.AlarmFired -and $alarm -eq "OK") { $events.AlarmRecovered = Stamp; break }
    Start-Sleep -Seconds 10
}

Write-Host "`n=== Recovery timeline ===" -ForegroundColor Cyan
Write-Host "  FailureInjected:     $victimId ($FailureMode) at T+0s $($t0.ToUniversalTime().ToString('HH:mm:ss'))Z"
$events.GetEnumerator() | ForEach-Object { Write-Host ("  {0,-20} {1}" -f "$($_.Key):", $_.Value) }

if (-not ($events.ReplacementHealthy -and $events.AlarmRecovered)) {
    Write-Host "[FAIL] Recovery not complete within 15 min (see timeline above)" -ForegroundColor Red
    exit 1
}
Write-Host "[PASS] ASG replaced $victimId with $replacementId; alarm returned to OK" -ForegroundColor Green
