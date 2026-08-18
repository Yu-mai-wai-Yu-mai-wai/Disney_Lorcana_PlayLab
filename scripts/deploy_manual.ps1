$ErrorActionPreference = "Stop"
$Region = "us-east-1"
$RoleArn = "arn:aws:iam::953899323223:role/LabRole"
$BackendDir = "D:\Tawanagent\TAWAN-OS\02_STUDY\2026-Semester\Cloud_Computing\Cloud_Project\DISNEY_LORCANA_PLAYLAB_CLOUD\backend"
$TempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " 1/5 Building & Packaging Lambda Zips" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1. Room Lambda Package
$RoomPkg = Join-Path $TempDir "room"
New-Item -ItemType Directory -Path (Join-Path $RoomPkg "room") -Force | Out-Null
Copy-Item (Join-Path $BackendDir "dist\room\*") (Join-Path $RoomPkg "room") -Recurse -Force
Copy-Item (Join-Path $BackendDir "package.json") $RoomPkg -Force
$RoomZip = Join-Path $TempDir "room.zip"
Compress-Archive -Path "$RoomPkg\*" -DestinationPath $RoomZip -Force
Write-Host "  [packaged] room.zip" -ForegroundColor Green

# 2. Deck Lambda Package
$DeckPkg = Join-Path $TempDir "deck"
New-Item -ItemType Directory -Path (Join-Path $DeckPkg "deck") -Force | Out-Null
Copy-Item (Join-Path $BackendDir "dist\deck\*") (Join-Path $DeckPkg "deck") -Recurse -Force
Copy-Item (Join-Path $BackendDir "package.json") $DeckPkg -Force
$DeckZip = Join-Path $TempDir "deck.zip"
Compress-Archive -Path "$DeckPkg\*" -DestinationPath $DeckZip -Force
Write-Host "  [packaged] deck.zip" -ForegroundColor Green

# 3. Auth Lambda Package
$AuthPkg = Join-Path $TempDir "auth"
New-Item -ItemType Directory -Path (Join-Path $AuthPkg "auth") -Force | Out-Null
Copy-Item (Join-Path $BackendDir "dist\auth\*") (Join-Path $AuthPkg "auth") -Recurse -Force
$AuthZip = Join-Path $TempDir "auth.zip"
Compress-Archive -Path "$AuthPkg\*" -DestinationPath $AuthZip -Force
Write-Host "  [packaged] auth.zip" -ForegroundColor Green

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " 2/5 Deploying Lambda Functions" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Update lorcana-room
Write-Host "  Updating lorcana-room..." -ForegroundColor Yellow
aws lambda update-function-code --function-name "lorcana-room" --zip-file "fileb://$RoomZip" --region $Region | Out-Null
aws lambda update-function-configuration --function-name "lorcana-room" --environment "Variables={ROOM_TABLE=LorcanaRoomStateV2,MATCHMAKING_TABLE=LorcanaMatchmaking,USERS_TABLE=UsersTable,DECKS_TABLE=DecksTable,JWT_SECRET=disney_lorcana_secret_key_2026,LORCANA_SQS_URL=https://sqs.us-east-1.amazonaws.com/953899323223/lorcana-deck-analyzer}" --region $Region | Out-Null
Write-Host "  lorcana-room deployed & configured successfully." -ForegroundColor Green

# Update lorcana-deck
Write-Host "  Updating lorcana-deck..." -ForegroundColor Yellow
aws lambda update-function-code --function-name "lorcana-deck" --zip-file "fileb://$DeckZip" --region $Region | Out-Null
aws lambda update-function-configuration --function-name "lorcana-deck" --environment "Variables={ROOM_TABLE=LorcanaRoomStateV2,MATCHMAKING_TABLE=LorcanaMatchmaking,USERS_TABLE=UsersTable,DECKS_TABLE=DecksTable,JWT_SECRET=disney_lorcana_secret_key_2026,LORCANA_SQS_URL=https://sqs.us-east-1.amazonaws.com/953899323223/lorcana-deck-analyzer}" --region $Region | Out-Null
Write-Host "  lorcana-deck deployed successfully." -ForegroundColor Green

# Update lorcana-auth-login / register
Write-Host "  Updating auth lambdas..." -ForegroundColor Yellow
aws lambda update-function-code --function-name "lorcana-auth-login" --zip-file "fileb://$AuthZip" --region $Region | Out-Null
aws lambda update-function-code --function-name "lorcana-auth-register" --zip-file "fileb://$AuthZip" --region $Region | Out-Null
Write-Host "  auth lambdas deployed successfully." -ForegroundColor Green

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " 3/5 WebSocket API Gateway Routes" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$WsApiId = "a86238wqo4"
$RoomArn = (aws lambda get-function --function-name "lorcana-room" --region $Region --query "Configuration.FunctionArn" --output text).Trim()

# Find or create integration
$Integrations = (aws apigatewayv2 get-integrations --api-id $WsApiId --region $Region | ConvertFrom-Json).Items
$WsInt = $Integrations[0].IntegrationId

Write-Host "  Using WebSocket Integration: $WsInt -> $RoomArn" -ForegroundColor Yellow

$Routes = @(
    '$connect', '$disconnect', '$default', 'sendAction',
    'CREATE_ROOM', 'JOIN_ROOM', 'MATCHMAKING_JOIN', 'MATCHMAKING_LEAVE',
    'DICE_CHOICE', 'DICE_ROLLED', 'DICE_REROLL', 'FIRST_PLAYER_CHOSEN',
    'CARD_MOVED', 'CARD_EXERTED', 'CARD_DRAWN', 'INK_PLAYED',
    'LORE_UPDATED', 'QUEST_DONE', 'CHALLENGE_DONE', 'TURN_PASSED',
    'CHAT_MESSAGE', 'DECK_SELECTED', 'GAME_RESTART'
)

$ExistingRoutes = (aws apigatewayv2 get-routes --api-id $WsApiId --region $Region | ConvertFrom-Json).Items
$ExistingKeys = @($ExistingRoutes | ForEach-Object { $_.RouteKey })

foreach ($r in $Routes) {
    if ($ExistingKeys -contains $r) {
        Write-Host "  Route exists: $r" -ForegroundColor Gray
    } else {
        aws apigatewayv2 create-route --api-id $WsApiId --route-key "$r" --target "integrations/$WsInt" --region $Region | Out-Null
        Write-Host "  [CREATED ROUTE]: $r" -ForegroundColor Green
    }
}

# Create deployment to apply routes to prod stage immediately
Write-Host "  Deploying WebSocket Stage 'prod'..." -ForegroundColor Yellow
aws apigatewayv2 create-deployment --api-id $WsApiId --stage-name "prod" --region $Region | Out-Null
Write-Host "  WebSocket Stage 'prod' deployed successfully." -ForegroundColor Green

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " 4/5 Deployment Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "WebSocket URL: wss://$WsApiId.execute-api.$Region.amazonaws.com/prod" -ForegroundColor Green

Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
