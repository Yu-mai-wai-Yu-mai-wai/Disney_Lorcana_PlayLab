# ==============================================================================
# DISNEY LORCANA PLAYLAB - Automated Stress Test & Scale-out Verification
# Simulates concurrent traffic to trigger CPU Target Tracking & ASG Scale-out
# ==============================================================================

[CmdletBinding()]
param(
    [string]$AlbDnsName = "",
    [int]$TotalRequests = 2000,
    [int]$Concurrency = 20,
    [string]$Region = "us-east-1",
    [string]$AutoScalingGroupName = "lorcana-asg"
)

$ErrorActionPreference = "Continue"

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
if (Test-Path $stateFile) {
    $state = Get-Content $stateFile | ConvertFrom-Json
    if (-not $AlbDnsName -and $state.AlbDnsName) { $AlbDnsName = $state.AlbDnsName }
    if ($state.Region) { $Region = $state.Region }
    if ($state.AutoScalingGroupName) { $AutoScalingGroupName = $state.AutoScalingGroupName }
}

if (-not $AlbDnsName) {
    Write-Host "❌ Error: ALB DNS Name is required. Provide -AlbDnsName or deploy the stack first." -ForegroundColor Red
    exit 1
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🔥 Starting Disney Lorcana Stress Test & Scale Verification" -ForegroundColor Yellow
Write-Host "Target: http://$AlbDnsName/health" -ForegroundColor Gray
Write-Host "Requests: $TotalRequests | Concurrency: $Concurrency Workers" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Baseline Health Check
Write-Host "`n[1/4] 🩺 Checking Baseline Target Health..." -ForegroundColor Green
try {
    $baseline = Invoke-RestMethod -Uri "http://$AlbDnsName/health" -TimeoutSec 5
    Write-Host "  ✅ Baseline response: $baseline (Target is Healthy)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Target unreachable: $_" -ForegroundColor Yellow
}

# 2. Check Initial ASG Instance Count
Write-Host "`n[2/4] 📊 Checking Initial Auto Scaling Group State..." -ForegroundColor Green
$asgRes = aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AutoScalingGroupName --region $Region --output json | ConvertFrom-Json
$initialCount = $asgRes.AutoScalingGroups[0].Instances.Count
Write-Host "  🎯 Active Instances in ASG: $initialCount" -ForegroundColor Cyan

# 3. Fire Concurrent Load Generator
Write-Host "`n[3/4] 🚀 Firing Concurrent HTTP Traffic Load..." -ForegroundColor Green
$startTime = Get-Date

$jobs = @()
$requestsPerWorker = [Math]::Floor($TotalRequests / $Concurrency)

for ($i = 0; $i -lt $Concurrency; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url, $count)
        $success = 0
        $fail = 0
        for ($j = 0; $j -lt $count; $j++) {
            try {
                $null = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
                $success++
            } catch {
                $fail++
            }
        }
        return @{ Success = $success; Fail = $fail }
    } -ArgumentList "http://$AlbDnsName/health", $requestsPerWorker
}

Write-Host "  ⏳ $Concurrency background load generator workers running..." -ForegroundColor Gray
$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$totalSuccess = ($results | Measure-Object -Property Success -Sum).Sum
$totalFail = ($results | Measure-Object -Property Fail -Sum).Sum
$duration = ((Get-Date) - $startTime).TotalSeconds

Write-Host "`n  ✅ Load Generation Completed in $([Math]::Round($duration, 2))s!" -ForegroundColor Green
Write-Host "     - Total Requests Sent: $($totalSuccess + $totalFail)" -ForegroundColor Gray
Write-Host "     - Success: $totalSuccess | Failed: $totalFail" -ForegroundColor Gray
Write-Host "     - Throughput: $([Math]::Round(($totalSuccess + $totalFail)/$duration, 1)) req/sec" -ForegroundColor Gray

# 4. Verification of Auto Scaling Activity & CloudWatch Metric
Write-Host "`n[4/4] 🔍 Monitoring Scale-out Activity & CloudWatch Alarms..." -ForegroundColor Green
Write-Host "  Querying ASG Activity History..." -ForegroundColor Gray

$activities = aws autoscaling describe-scaling-activities --auto-scaling-group-name $AutoScalingGroupName --max-items 5 --region $Region --output json | ConvertFrom-Json
if ($activities.Activities) {
    foreach ($act in $activities.Activities) {
        Write-Host "  • [$($act.StartTime)] $($act.Description) -> $($act.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "🎉 Stress Test & Experiment Completed!" -ForegroundColor Green
Write-Host "Check AWS Console -> EC2 -> Auto Scaling Groups -> Activity to capture evidence screenshots." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
