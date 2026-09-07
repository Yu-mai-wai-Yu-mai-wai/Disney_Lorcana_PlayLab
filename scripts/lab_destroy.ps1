[CmdletBinding()]
param()
& "$PSScriptRoot\lab.ps1" -Action destroy @args
