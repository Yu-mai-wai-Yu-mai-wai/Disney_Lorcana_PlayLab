# ==============================================================================
# DISNEY LORCANA PLAYLAB - S3 Decommissioner & Retirement Script
# Removes S3 Static Website Bucket to transition 100% to EC2 + Nginx Stack
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [string]$BucketPrefix = "lorcana-playlab-static"
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🗑️  Retiring & Decommissioning S3 Static Website Hosting" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Identify Target S3 Bucket
Write-Host "[1/3] 🔍 Searching for Lorcana S3 Static Bucket..." -ForegroundColor Green
$buckets = aws s3api list-buckets --query "Buckets[?starts_with(Name, '$BucketPrefix')].Name" --output json | ConvertFrom-Json

if (-not $buckets -or $buckets.Count -eq 0) {
    Write-Host "ℹ️  No bucket starting with '$BucketPrefix' found. Already decommissioned!" -ForegroundColor Cyan
    exit 0
}

foreach ($bucketName in $buckets) {
    Write-Host "  🎯 Found Target Bucket: $bucketName" -ForegroundColor Yellow

    # 2. Empty Bucket Objects
    Write-Host "[2/3] 🧹 Emptying all static objects in $bucketName..." -ForegroundColor Green
    aws s3 rm "s3://$bucketName" --recursive --region $Region

    # 3. Delete Bucket & Disable Website
    Write-Host "[3/3] 💥 Deleting bucket $bucketName..." -ForegroundColor Green
    aws s3api delete-bucket-website --bucket $bucketName --region $Region 2>$null | Out-Null
    aws s3api delete-bucket --bucket $bucketName --region $Region

    Write-Host "  ✅ Successfully removed bucket: $bucketName" -ForegroundColor Green
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "🎉 S3 RETIREMENT COMPLETE!" -ForegroundColor Green
Write-Host "Frontend is now 100% served by Nginx Containers on EC2 ASG." -ForegroundColor Yellow
Write-Host "S3 Cloud Storage Cost: $0.00" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
