# ==============================================================================
# DISNEY LORCANA PLAYLAB - Lean Auto Scaling Stress Test & Verification
# Default load = successful logins (bcrypt cost 10 on Node), which is what burns CPU.
# /health is answered by nginx without touching Node, so it cannot trigger scale-out.
# Requires PowerShell 7 (ForEach-Object -Parallel).
# ==============================================================================

[CmdletBinding()]
param(
    [string]$AlbDnsName = "",
    [int]$DurationSeconds = 600,
    [int]$Concurrency = 40,
    [string]$Region = "us-east-1",
    [string]$AutoScalingGroupName = "lorcana-asg",
    [string]$StressUser = "stress_bot"
)

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
if (Test-Path $stateFile) {
    $state = Get-Content $stateFile | ConvertFrom-Json
    if (-not $AlbDnsName -and $state.AlbDnsName) { $AlbDnsName = $state.AlbDnsName }
    if ($state.Region) { $Region = $state.Region }
    if ($state.AutoScalingGroupName) { $AutoScalingGroupName = $state.AutoScalingGroupName }
}
if (-not $AlbDnsName) { Write-Error "ALB DNS Name required. Pass -AlbDnsName or deploy the stack first."; exit 1 }

# Throwaway load-test account (random password each run; register is a no-op if the user exists)
$password = [guid]::NewGuid().ToString()
$base = "http://$AlbDnsName/api"
try { Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{ username = $StressUser; email = "$StressUser@loadtest.local"; password = $password } | ConvertTo-Json) | Out-Null }
catch { Write-Error "Stress user '$StressUser' already exists with another password; pass -StressUser <new name>"; exit 1 }
$body = @{ username = $StressUser; password = $password } | ConvertTo-Json

$startUtc = (Get-Date).ToUniversalTime()
Write-Host "Stress test: POST $base/auth/login for ${DurationSeconds}s with $Concurrency workers (start $($startUtc.ToString('HH:mm:ss')) UTC)" -ForegroundColor Yellow
$deadline = (Get-Date).AddSeconds($DurationSeconds)

$results = 1..$Concurrency | ForEach-Object -Parallel {
    $ok = 0; $fail = 0
    while ((Get-Date) -lt $using:deadline) {
        try { $null = Invoke-RestMethod -Method Post -Uri "$($using:base)/auth/login" -ContentType "application/json" -Body $using:body -TimeoutSec 15; $ok++ }
        catch { $fail++ }
    }
    [pscustomobject]@{ Ok = $ok; Fail = $fail }
} -ThrottleLimit $Concurrency

$totalOk = ($results | Measure-Object Ok -Sum).Sum
$totalFail = ($results | Measure-Object Fail -Sum).Sum
$rps = [Math]::Round($totalOk / $DurationSeconds, 1)
Write-Host "Done at $((Get-Date).ToUniversalTime().ToString('HH:mm:ss')) UTC | OK: $totalOk | Failed: $totalFail | $rps logins/s" -ForegroundColor Green

Write-Host "`nAuto Scaling activity since start:" -ForegroundColor Cyan
aws autoscaling describe-scaling-activities --auto-scaling-group-name $AutoScalingGroupName --region $Region --max-items 10 --query "Activities[?StartTime>='$($startUtc.ToString('yyyy-MM-ddTHH:mm:ss'))'].[StartTime,StatusCode,Description]" --output table
