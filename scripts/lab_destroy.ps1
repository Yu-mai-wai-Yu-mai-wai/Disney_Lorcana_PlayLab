# ==============================================================================
# DISNEY LORCANA PLAYLAB - 1-Click Complete Teardown ($0.00 Total Cleanup)
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$pythonScript = Join-Path $PSScriptRoot "lab_destroy.py"

if (Test-Path $pythonScript) {
    python $pythonScript
} else {
    Write-Error "lab_destroy.py not found in $PSScriptRoot"
}
