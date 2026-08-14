#!/usr/bin/env bash
# ============================================================
# Deploy Lorcana PlayLab — MANUAL mode for AWS Academy Learner Lab
# (SAM can't create IAM roles in Learner Lab → use existing LabRole)
# Prereq: aws configure set (from AWS Details) + npm build done
# ============================================================
set -euo pipefail
export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"

REGION="${AWS_REGION:-us-east-1}"
ROLE_ARN="arn:aws:iam::953899323223:role/LabRole"   # from `aws iam get-role --role-name LabRole`
BACKEND="D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/backend"
WORK="$(mktemp -d)"

echo "======================================"
echo " 1/5 Package Lambda zips (auth/deck/room)"
echo "======================================"
cd "$BACKEND"
for fn in auth deck room; do
  rm -rf "$WORK/$fn" && mkdir -p "$WORK/$fn"
  cp -r dist/$fn "$WORK/$fn/"
  cp package.json "$WORK/$fn/"
  # bundle node_modules per function (only used deps — keep simple: full copy)
  cp -r node_modules "$WORK/$fn/"
  (cd "$WORK/$fn" && zip -qr "$WORK/$fn.zip" .)
  echo "  packaged $fn.zip ($(du -h "$WORK/$fn.zip" | cut -f1))"
done

echo "======================================"
echo " 2/5 Create/Update Lambda functions"
echo "======================================"
# Note: existing auth lambdas (lorcana-auth-login/register) already deployed via console — update them
for spec in "lorcana-auth-login:auth/login.handler" "lorcana-auth-register:auth/register.handler" "lorcana-deck:deck/handler.handler" "lorcana-room:room/handler.handler"; do
  name="${spec%%:*}"; handler="${spec##*:}"
  zipname=$(echo "$name" | sed 's/lorcana-//')
  if aws lambda get-function --function-name "$name" --region "$REGION" >/dev/null 2>&1; then
    echo "  [update] $name"
    aws lambda update-function-code --function-name "$name" --zip-file "fileb://$WORK/$zipname.zip" --region "$REGION" >/dev/null
  else
    echo "  [create] $name"
    aws lambda create-function \
      --function-name "$name" --runtime nodejs20.x --handler "$handler" \
      --role "$ROLE_ARN" --zip-file "fileb://$WORK/$zipname.zip" \
      --region "$REGION" \
      --environment "Variables={USERS_TABLE=UsersTable,DECKS_TABLE=DecksTable,ROOM_TABLE=RoomStateTable,JWT_SECRET=disney_lorcana_secret_key_2026}" \
      >/dev/null
  fi
done

echo "======================================"
echo " 3/5 HTTP API Gateway (REST) — auth + decks"
echo "======================================"
# Reuse existing HTTP API if present, else create
HTTP_API=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='LorcanaPlayLabApi'].ApiId" --output text 2>/dev/null || true)
if [ -z "$HTTP_API" ] || [ "$HTTP_API" = "None" ]; then
  HTTP_API=$(aws apigatewayv2 create-api --name "LorcanaPlayLabApi" --protocol-type HTTP --region "$REGION" --query "ApiId" --output text)
  echo "  created HTTP API: $HTTP_API"
fi
STAGE="prod"
aws apigatewayv2 create-stage --api-id "$HTTP_API" --stage-name "$STAGE" --auto-deploy --region "$REGION" >/dev/null 2>&1 || true

# helper to add integration+route
add_route() { # $1=path $2=method $3=fnName
  INT=$(aws apigatewayv2 create-integration --api-id "$HTTP_API" --integration-type AWS_PROXY \
    --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/$(aws lambda get-function --function-name "$3" --region "$REGION" --query 'Configuration.FunctionArn' --output text)/invocations" \
    --payload-format-version 2.0 --region "$REGION" --query "IntegrationId" --output text)
  ROUTE=$(aws apigatewayv2 create-route --api-id "$HTTP_API" --route-key "$1 $2" --target "integrations/$INT" --region "$REGION" --query "RouteId" --output text)
  echo "  route: $1 $2 -> $3"
}
# (auth routes already exist on the console-deployed API — add deck routes if missing)
add_route "/decks" "POST" "lorcana-deck" 2>/dev/null || echo "  /decks POST exists"
add_route "/decks" "GET" "lorcana-deck" 2>/dev/null || echo "  /decks GET exists"
add_route "/decks/{deckId}" "DELETE" "lorcana-deck" 2>/dev/null || echo "  /decks/{deckId} DELETE exists"

echo "======================================"
echo " 4/5 WebSocket API Gateway"
echo "======================================"
WS_API=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='LorcanaPlayLabWebSocketApi'].ApiId" --output text 2>/dev/null || true)
if [ -z "$WS_API" ] || [ "$WS_API" = "None" ]; then
  WS_API=$(aws apigatewayv2 create-api --name "LorcanaPlayLabWebSocketApi" --protocol-type WEBSOCKET \
    --route-selection-expression '$request.body.action' --region "$REGION" --query "ApiId" --output text)
  echo "  created WS API: $WS_API"
fi
aws apigatewayv2 create-stage --api-id "$WS_API" --stage-name "$STAGE" --auto-deploy --region "$REGION" >/dev/null 2>&1 || true

# WS routes -> lorcana-room lambda
WS_INT=$(aws apigatewayv2 create-integration --api-id "$WS_API" --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/$(aws lambda get-function --function-name lorcana-room --region "$REGION" --query 'Configuration.FunctionArn' --output text)/invocations" \
  --region "$REGION" --query "IntegrationId" --output text)
for route in '$connect' '$disconnect' 'sendAction'; do
  aws apigatewayv2 create-route --api-id "$WS_API" --route-key "$route" --target "integrations/$WS_INT" --region "$REGION" >/dev/null 2>&1 && echo "  WS route: $route" || echo "  WS route $route exists"
done

echo "======================================"
echo " 5/5 Outputs"
echo "======================================"
HTTP_URL="https://${HTTP_API}.execute-api.${REGION}.amazonaws.com/${STAGE}"
WS_URL="wss://${WS_API}.execute-api.${REGION}.amazonaws.com/${STAGE}"
echo "  REST API:  $HTTP_URL"
echo "  WebSocket: $WS_URL"
echo ""
echo "  Write these into the frontend .env:"
echo "  VITE_API_ENDPOINT=$HTTP_URL"
echo "  VITE_WS_ENDPOINT=$WS_URL"

rm -rf "$WORK"
