#!/bin/bash
# ==============================================================================
# DISNEY LORCANA PLAYLAB - S3 Decommissioner (Bash)
# ==============================================================================

set -e

REGION="us-east-1"
BUCKET_PREFIX="lorcana-playlab-static"

echo "======================================================="
echo "🗑️  Retiring & Decommissioning S3 Static Website Hosting"
echo "======================================================="

BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '$BUCKET_PREFIX')].Name" --output text)

if [ -z "$BUCKETS" ]; then
    echo "ℹ️  No bucket starting with '$BUCKET_PREFIX' found. Already decommissioned!"
    exit 0
fi

for BUCKET in $BUCKETS; do
    echo "🎯 Decommissioning bucket: $BUCKET"
    aws s3 rm "s3://$BUCKET" --recursive --region "$REGION"
    aws s3api delete-bucket-website --bucket "$BUCKET" --region "$REGION" 2>/dev/null || true
    aws s3api delete-bucket --bucket "$BUCKET" --region "$REGION"
    echo "✅ Deleted S3 bucket: $BUCKET"
done

echo "======================================================="
echo "🎉 S3 RETIREMENT COMPLETE!"
echo "======================================================="
