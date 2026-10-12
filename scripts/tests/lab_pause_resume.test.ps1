# Static checks for lab.ps1 pause/resume (spec: scratch/plan.md, D1-D3, D7-D9).
# Reads lab.ps1 with the PowerShell parser only. It never runs lab.ps1 and never calls AWS.
# Usage: pwsh scripts/tests/lab_pause_resume.test.ps1   (exit 0 = all pass, exit 1 = at least one failure)

$labPath = Join-Path (Split-Path $PSScriptRoot -Parent) "lab.ps1"
$tokens = $null; $errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($labPath, [ref]$tokens, [ref]$errors)

$script:fail = 0
function Check([string]$name, [bool]$ok) {
    if ($ok) { Write-Host "  [PASS] $name" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $name" -ForegroundColor Red; $script:fail++ }
}

# Body text of one action of the top-level switch ($Action)
$switchAst = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.SwitchStatementAst] }, $false) | Select-Object -First 1
function Get-ActionText([string]$action) {
    foreach ($c in $switchAst.Clauses) {
        if ($c.Item1.Extent.Text.Trim('"', "'") -eq $action) { return $c.Item2.Extent.Text }
    }
    return $null
}

Write-Host "lab.ps1 pause/resume static checks"
Check "lab.ps1 parses without errors" ($errors.Count -eq 0)

$validate = $ast.ParamBlock.Parameters | Where-Object { $_.Name.VariablePath.UserPath -eq "Action" } |
    ForEach-Object { $_.Attributes } | Where-Object { $_.TypeName.Name -eq "ValidateSet" } | Select-Object -First 1
$allowed = if ($validate) { $validate.PositionalArguments | ForEach-Object { $_.Value } } else { @() }
Check "ValidateSet accepts pause" ($allowed -contains "pause")
Check "ValidateSet accepts resume" ($allowed -contains "resume")
Check "existing actions still accepted (start, stop, status, publish, lambdas, destroy)" ((@("start","stop","status","publish","lambdas","destroy") | Where-Object { $allowed -notcontains $_ }).Count -eq 0)

$pause = Get-ActionText "pause"
$resume = Get-ActionText "resume"
$start = Get-ActionText "start"
$status = Get-ActionText "status"

Check "switch has a pause branch" ($null -ne $pause)
Check "switch has a resume branch" ($null -ne $resume)

if ($pause) {
    Check "pause scales the ASG to 0" ($pause -match "update-auto-scaling-group" -and $pause -match "--desired-capacity 0")
    Check "pause deletes the ALB" ($pause -match "delete-load-balancer")
    Check "pause deletes the cache cluster" ($pause -match "delete-cache-cluster")
    Check "pause checks existence before deleting (idempotent)" ($pause -match "describe-load-balancers" -and $pause -match "describe-cache-clusters")
    Check "pause refuses when ALB deletion protection is on" ($pause -match "deletion_protection")
    Check "pause records Paused in the state file" ($pause -match "Paused")
    foreach ($forbidden in "delete-vpc", "delete-auto-scaling-group", "delete-target-group", "delete-security-group", "delete-subnet", "delete-launch-template", "delete-table", "delete-queue") {
        Check "pause never calls $forbidden" ($pause -notmatch [regex]::Escape($forbidden))
    }
}
if ($resume) {
    Check "resume checks AWS credentials first" ($resume -match "sts get-caller-identity")
    Check "resume creates the ALB" ($resume -match "create-load-balancer")
    Check "resume creates the :80 listener to the existing target group" ($resume -match "create-listener" -and $resume -match "TargetGroupArn")
    Check "resume skips creation when ALB or listener exists (idempotent)" ($resume -match "describe-load-balancers" -and $resume -match "describe-listeners")
    Check "resume runs ensure_cache.ps1" ($resume -match "ensure_cache\.ps1")
    $iCache = $resume.IndexOf("ensure_cache.ps1"); $iScale = $resume.IndexOf("--desired-capacity 2")
    Check "resume starts the cache BEFORE scaling the ASG up (instances read the new endpoint at boot)" ($iCache -ge 0 -and $iScale -gt $iCache)
    Check "resume writes the new ALB DNS back to the state file" ($resume -match "AlbDnsName" -and $resume -match "Set-Content")
    Check "resume waits for healthy targets" ($resume -match "describe-target-health")
    Check "resume prints the new URL" ($resume -match "Application URL")
}
if ($start) { Check "start refuses while paused" ($start -match "Paused" -and $start -match "resume") }
if ($status) { Check "status handles the paused state" ($status -match "Paused") }

if ($script:fail -gt 0) { Write-Host "`n$($script:fail) check(s) failed" -ForegroundColor Red; exit 1 }
Write-Host "`nAll checks passed" -ForegroundColor Green
exit 0
