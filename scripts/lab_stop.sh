#!/bin/bash
# ==============================================================================
# DISNEY LORCANA PLAYLAB - 1-Click Lab Stop (Bash - Scale to Zero)
# ==============================================================================

set -e

REGION="us-east-1"
ASG_NAME="lorcana-asg"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_FILE="$SCRIPT_DIR/infrastructure_state.json"

if [ -f "$STATE_FILE" ]; then
    REGION=$(jq -r '.Region // "us-east-1"' "$STATE_FILE")
    ASG_NAME=$(jq -r '.AutoScalingGroupName // "lorcana-asg"' "$STATE_FILE")
fi

echo "======================================================="
echo "🛑 Stopping Disney Lorcana Lab (Scale to 0 - $0.00 Cost)"
echo "ASG: $ASG_NAME | Region: $REGION"
echo "======================================================="

aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name "$ASG_NAME" \
    --min-size 0 \
    --desired-capacity 0 \
    --region "$REGION"

echo "✅ All EC2 instances terminating! Compute cost is now $0.00."
