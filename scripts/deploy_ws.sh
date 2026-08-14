#!/usr/bin/env bash
# ============================================================
# Deploy Disney Lorcana PlayLab Cloud — AWS SAM (Free Tier $0)
# Sprint 3: WebSockets Room Sync + REST Auth/Deck
# Prereq: AWS CLI configured (AWS Academy Learner Lab credentials),
#         sam-cli installed, Node 20+
# ============================================================
set -euo pipefail

STACK_NAME="lorcana-playlab"
REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="lorcana-playlab-sam-bucket"

echo "======================================"
echo " 1/5 Build backend TypeScript"
echo "======================================"
cd "$(dirname "$0")/../backend"
npm install --silent
npx tsc --noEmit && echo "  tsc OK"
npx tsc -p tsconfig.build.json || npx tsc --outDir dist

echo "======================================"
echo " 2/5 SAM Build"
echo "======================================"
cd ..
sam build

echo "======================================"
echo " 3/5 Ensure S3 bucket (SAM artifact)"
echo "======================================"
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" 2>/dev/null; then
  aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
fi

echo "======================================"
echo " 4/5 SAM Deploy (Free Tier: Lambda 1M req, API GW 1M msg, DynamoDB 25GB)"
echo "======================================"
sam deploy \
  --stack-name "$STACK_NAME" \
  --s3-bucket "$S3_BUCKET" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "======================================"
echo " 5/5 Outputs"
echo "======================================"
sam list stack-outputs --stack-name "$STACK_NAME" --region "$REGION"

# Write frontend env file
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
WS_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketEndpoint'].OutputValue" --output text)

cat > ../.env.production <<EOF
VITE_API_ENDPOINT=$API_URL
VITE_WS_ENDPOINT=$WS_URL
EOF

echo ""
echo "✅ Deployed!"
echo "   REST API:  $API_URL"
echo "   WebSocket: $WS_URL"
echo "   (.env.production written — check into frontend build)"
