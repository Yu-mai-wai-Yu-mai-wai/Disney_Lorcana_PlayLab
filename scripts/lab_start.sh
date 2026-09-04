#!/bin/bash
# ==============================================================================
# DISNEY LORCANA PLAYLAB - 1-Click Lab Start (Bash)
# ==============================================================================

set -e

REGION="us-east-1"
ASG_NAME="lorcana-asg"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_FILE="$SCRIPT_DIR/infrastructure_state.json"

if [ -f "$STATE_FILE" ]; then
    REGION=$(jq -r '.Region // "us-east-1"' "$STATE_FILE")
    ASG_NAME=$(jq -r '.AutoScalingGroupName // "lorcana-asg"' "$STATE_FILE")
    ALB_DNS=$(jq -r '.AlbDnsName // ""' "$STATE_FILE")
fi

echo "======================================================="
echo "🚀 Starting Disney Lorcana Lab Environment (Scale to 1)"
echo "ASG: $ASG_NAME | Region: $REGION"
echo "======================================================="

aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name "$ASG_NAME" \
    --min-size 1 \
    --desired-capacity 1 \
    --region "$REGION"

echo "✅ ASG updated! Instance is booting..."
if [ -n "$ALB_DNS" ]; then
    echo "🌐 App URL: http://$ALB_DNS"
fi
