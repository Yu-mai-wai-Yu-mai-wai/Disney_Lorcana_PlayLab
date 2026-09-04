#!/bin/bash
# ==============================================================================
# DISNEY LORCANA PLAYLAB - Automated Stress Test (Bash)
# ==============================================================================

ALB_DNS="$1"
TOTAL_REQUESTS="${2:-1000}"
CONCURRENCY="${3:-20}"
REGION="us-east-1"
ASG_NAME="lorcana-asg"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_FILE="$SCRIPT_DIR/infrastructure_state.json"

if [ -z "$ALB_DNS" ] && [ -f "$STATE_FILE" ]; then
    ALB_DNS=$(jq -r '.AlbDnsName // ""' "$STATE_FILE")
    REGION=$(jq -r '.Region // "us-east-1"' "$STATE_FILE")
    ASG_NAME=$(jq -r '.AutoScalingGroupName // "lorcana-asg"' "$STATE_FILE")
fi

if [ -z "$ALB_DNS" ]; then
    echo "❌ Error: ALB DNS Name required"
    exit 1
fi

echo "======================================================="
echo "🔥 Starting Disney Lorcana Stress Test"
echo "Target: http://$ALB_DNS/health | Requests: $TOTAL_REQUESTS"
echo "======================================================="

# Run Apache Benchmark or curl loop
if command -v ab &> /dev/null; then
    ab -n "$TOTAL_REQUESTS" -c "$CONCURRENCY" "http://$ALB_DNS/health"
else
    echo "Running curl load generator loop..."
    for i in $(seq 1 "$TOTAL_REQUESTS"); do
        curl -s -o /dev/null "http://$ALB_DNS/health" &
        if (( i % CONCURRENCY == 0 )); then
            wait
        fi
    done
    wait
fi

echo "======================================================="
echo "📊 Querying Auto Scaling Activities..."
aws autoscaling describe-scaling-activities --auto-scaling-group-name "$ASG_NAME" --max-items 5 --region "$REGION" --query "Activities[*].[StartTime,Description,StatusCode]" --output table
