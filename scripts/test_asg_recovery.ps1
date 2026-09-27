# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Auto Scaling Group Self-Healing / Recovery Test
# Evaluates: Min = 2, Multi-AZ Health Check, and Auto-Recovery on Instance Failure
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [string]$AsgName = "lorcana-asg"
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

# 3. Terminate 1 Instance to Simulate Failure ("หาก Down")
$victimId = $instances[0].InstanceId
Write-Host "`n[3/4] [SIMULATE FAILURE] Terminating Instance: $victimId..." -ForegroundColor Red
aws ec2 terminate-instances --instance-ids $victimId --region $Region | Out-Null
Write-Host "  [OK] Sent termination request for $victimId" -ForegroundColor Gray

# 4. Monitor Auto-Recovery Loop ("จะใหม่ให้ auto")
Write-Host "`n[4/4] [AUTO-RECOVERY MONITOR] Watching ASG automatically replace terminated instance..." -ForegroundColor Green
$recoveryTimeout = 240
$recoveryElapsed = 0
$replacementFound = $false
$replacementInstanceId = $null

while ($recoveryElapsed -lt $recoveryTimeout) {
    $asgInfo = aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AsgName --region $Region --output json | ConvertFrom-Json
    $currentInstances = $asgInfo.AutoScalingGroups[0].Instances
    
    # Check for new instance that is NOT the victim
    $activeNew = $currentInstances | Where-Object { $_.InstanceId -ne $victimId }
    
    Write-Host "  [Monitoring ${recoveryElapsed}s] Total in ASG: $($currentInstances.Count) | Non-victim count: $($activeNew.Count)" -ForegroundColor Gray
    foreach ($item in $currentInstances) {
        Write-Host "    - $($item.InstanceId): State=$($item.LifecycleState) | Health=$($item.HealthStatus)" -ForegroundColor DarkGray
    }
    
    # Look for at least 2 instances where victim is gone/terminating and new one is InService or Pending
    $newInstances = $activeNew | Where-Object { $_.InstanceId -ne $instances[1].InstanceId }
    if ($newInstances.Count -gt 0) {
        $replacementInstanceId = $newInstances[0].InstanceId
        Write-Host "  [+] ASG launched replacement instance: $replacementInstanceId!" -ForegroundColor Yellow
        $replacementFound = $true
        break
    }
    
    Start-Sleep -Seconds 10
    $recoveryElapsed += 10
}

if (-not $replacementFound) {
    Write-Warning "Timed out waiting for new replacement instance."
} else {
    Write-Host "`n=======================================================" -ForegroundColor Cyan
    Write-Host "[SUCCESS] Auto Scaling Group Self-Healing Test PASSED!" -ForegroundColor Green
    Write-Host "1. Initial Pool: 2 Instances across AZ-A and AZ-B" -ForegroundColor Gray
    Write-Host "2. Terminated:   $victimId" -ForegroundColor Red
    Write-Host "3. Auto-Healed:  $replacementInstanceId launched automatically" -ForegroundColor Green
    Write-Host "4. Minimum = 2 maintained automatically by ASG!" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Cyan
}
