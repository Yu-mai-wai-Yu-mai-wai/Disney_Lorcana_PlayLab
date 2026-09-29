# ==============================================================================
# DLQ experiment (Stage 3): a poison message must be retried 3 times, then land in the DLQ.
# Sends one invalid message to lorcana-deck-analyzer, times how long it takes to reach
# lorcana-deck-analyzer-dlq, then removes only its own test message from the DLQ.
# Exit 0 = message reached the DLQ and the main queue is empty, 1 = it did not.
# ==============================================================================
[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [int]$TimeoutSeconds = 300,
    [string]$EvidenceDir = (Join-Path (Split-Path $PSScriptRoot -Parent) "docs/01_Reports/stage3_evidence")
)
$ErrorActionPreference = "Stop"

$main = aws sqs get-queue-url --queue-name lorcana-deck-analyzer --region $Region --query QueueUrl --output text
$dlq = aws sqs get-queue-url --queue-name lorcana-deck-analyzer-dlq --region $Region --query QueueUrl --output text
$marker = "dlq-test-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
$body = (@{ marker = $marker; note = "invalid on purpose: no deckId/userId/cards" } | ConvertTo-Json -Compress)

$log = New-Object System.Collections.Generic.List[string]
function Note([string]$m) { $line = "{0}  {1}" -f (Get-Date).ToUniversalTime().ToString("HH:mm:ss"), $m; $log.Add($line); Write-Host $line }

Note "main queue: $main"
Note "dlq:        $dlq"
$sent = Get-Date
aws sqs send-message --queue-url $main --message-body $body --region $Region --query MessageId --output text | ForEach-Object { Note "sent $marker (message id $_)" }

$found = $null
while (((Get-Date) - $sent).TotalSeconds -lt $TimeoutSeconds -and -not $found) {
    Start-Sleep -Seconds 10
    $res = aws sqs receive-message --queue-url $dlq --max-number-of-messages 10 --visibility-timeout 5 --wait-time-seconds 1 --attribute-names ApproximateReceiveCount --region $Region --output json | ConvertFrom-Json
    foreach ($m in @($res.Messages)) {
        if ($m -and $m.Body -like "*$marker*") { $found = $m }
    }
    Note ("waiting... {0}s" -f [int]((Get-Date) - $sent).TotalSeconds)
}

$ok = $false
if ($found) {
    $secs = [int]((Get-Date) - $sent).TotalSeconds
    Note "reached the DLQ after ~$secs s"
    aws sqs delete-message --queue-url $dlq --receipt-handle $found.ReceiptHandle --region $Region
    Note "removed the test message from the DLQ"
    $q = aws sqs get-queue-attributes --queue-url $main --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible --region $Region --output json | ConvertFrom-Json
    $left = [int]$q.Attributes.ApproximateNumberOfMessages + [int]$q.Attributes.ApproximateNumberOfMessagesNotVisible
    Note "main queue messages left: $left"
    $ok = ($left -eq 0)
} else {
    Note "FAIL: message did not reach the DLQ within $TimeoutSeconds s"
}

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
$file = Join-Path $EvidenceDir ("dlq_{0}.log" -f (Get-Date).ToUniversalTime().ToString("yyyyMMdd_HHmmss"))
Set-Content -Path $file -Value $log -Encoding UTF8
Write-Host "evidence: $file"
if ($ok) { exit 0 } else { exit 1 }
