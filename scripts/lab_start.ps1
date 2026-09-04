# ==============================================================================
# DISNEY LORCANA PLAYLAB - 1-Click Lab Start (Scale to 1)
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [string]$AutoScalingGroupName = "lorcana-asg"
)

$ErrorActionPreference = "Stop"

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
if (Test-Path $stateFile) {
    $state = Get-Content $stateFile | ConvertFrom-Json
    if ($state.Region) { $Region = $state.Region }
    if ($state.AutoScalingGroupName) { $AutoScalingGroupName = $state.AutoScalingGroupName }
    $AlbDnsName = $state.AlbDnsName
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Disney Lorcana Lab Environment (Scale to 1)" -ForegroundColor Yellow
Write-Host "Auto Scaling Group: $AutoScalingGroupName | Region: $Region" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# Scale ASG to 1
Write-Host "Scaling ASG desired capacity to 1..." -ForegroundColor Green
aws autoscaling update-auto-scaling-group `
    --auto-scaling-group-name $AutoScalingGroupName `
    --min-size 1 `
    --desired-capacity 1 `
    --region $Region

Write-Host "✅ ASG updated! Instance is booting..." -ForegroundColor Green
if ($AlbDnsName) {
    Write-Host "`n🌐 Application URL: http://$AlbDnsName" -ForegroundColor Yellow
    Write-Host "🩺 Health Check:   http://$AlbDnsName/health" -ForegroundColor Yellow
}
Write-Host "`n💡 Remember to run `lab_stop.ps1` when you finish to protect your `$50 budget!" -ForegroundColor Magenta
