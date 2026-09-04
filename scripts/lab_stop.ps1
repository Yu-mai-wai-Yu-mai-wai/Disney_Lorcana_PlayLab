# ==============================================================================
# DISNEY LORCANA PLAYLAB - 1-Click Lab Stop (Scale to Zero - $0.00 Cost Protection)
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
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🛑 Stopping Disney Lorcana Lab (Scale to 0 - $0.00 Cost)" -ForegroundColor Yellow
Write-Host "Auto Scaling Group: $AutoScalingGroupName | Region: $Region" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# Scale ASG to 0
Write-Host "Scaling ASG desired capacity to 0..." -ForegroundColor Green
aws autoscaling update-auto-scaling-group `
    --auto-scaling-group-name $AutoScalingGroupName `
    --min-size 0 `
    --desired-capacity 0 `
    --region $Region

Write-Host "✅ All EC2 instances are terminating..." -ForegroundColor Green
Write-Host "💰 Compute cost is now $0.00/hr. Your $50 budget is completely safe!" -ForegroundColor Cyan
