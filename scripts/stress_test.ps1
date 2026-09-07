# ==============================================================================
# DISNEY LORCANA PLAYLAB - Lean Auto Scaling Stress Test & Verification
# Fires concurrent HTTP requests to /health to verify Target Tracking Scale-out
# ==============================================================================

[CmdletBinding()]
param(
    [string]$AlbDnsName = "",
    [int]$TotalRequests = 1000,
    [int]$Concurrency = 20,
    [string]$Region = "us-east-1",
    [string]$AutoScalingGroupName = "lorcana-asg"
)

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
if (Test-Path $stateFile) {
    $state = Get-Content $stateFile | ConvertFrom-Json
    if (-not $AlbDnsName -and $state.AlbDnsName) { $AlbDnsName = $state.AlbDnsName }
    if ($state.Region) { $Region = $state.Region }
    if ($state.AutoScalingGroupName) { $AutoScalingGroupName = $state.AutoScalingGroupName }
}

if (-not $AlbDnsName) {
    Write-Error "ALB DNS Name required. Pass -AlbDnsName or deploy the stack first."
    exit 1
}

$targetUrl = "http://$AlbDnsName/health"
Write-Host "🔥 Stress Test: Sending $TotalRequests requests to $targetUrl (Workers: $Concurrency)..." -ForegroundColor Yellow

$reqPerWorker = [Math]::Ceiling($TotalRequests / $Concurrency)
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$results = 1..$Concurrency | ForEach-Object -Parallel {
    $url = $using:targetUrl
    $count = $using:reqPerWorker
    $ok = 0
    for ($i = 0; $i -lt $count; $i++) {
        try {
            $null = Invoke-RestMethod -Uri $url -TimeoutSec 2
            $ok++
        } catch {}
    }
    $ok
} -ThrottleLimit $Concurrency

$sw.Stop()
$totalOk = ($results | Measure-Object -Sum).Sum
$elapsedSec = [Math]::Max($sw.Elapsed.TotalSeconds, 0.01)
$rps = [Math]::Round($totalOk / $elapsedSec, 1)

Write-Host "✅ Completed in $([Math]::Round($elapsedSec, 2))s | Success: $totalOk / $TotalRequests ($rps req/s)" -ForegroundColor Green
Write-Host "`n🔍 Auto Scaling Activity History:" -ForegroundColor Cyan
aws autoscaling describe-scaling-activities --auto-scaling-group-name $AutoScalingGroupName --max-items 3 --region $Region --query "Activities[*].[StartTime,StatusCode,Description]" --output table
