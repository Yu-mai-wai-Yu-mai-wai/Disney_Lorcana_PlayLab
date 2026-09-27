# Serverless Lambdas (source)

Restored from git history (`a5eadb7^:docs/_ARCHIVE/legacy_serverless`) on 2026-09-27. Deployed bundles on AWS date from 2026-08-25; `room/handler.ts` handles the same actions as the deployed bundle (LEAVE_ROOM, REJOIN_ROOM, REQUEST_UNDO, OPPONENT_LEFT verified).

Not part of the EC2 backend build (excluded in `backend/tsconfig.json`).

| Function | Handler | Runtime (deployed) | Env read |
|---|---|---|---|
| lorcana-room | `room/handler.handler` | nodejs20.x | ROOM_TABLE, MATCHMAKING_TABLE |
| lorcana-deck | `deck/handler.handler` | nodejs20.x | DECKS_TABLE, LORCANA_SQS_URL, ALLOWED_ORIGIN, JWT_SECRET (required) |
| lorcana-analyzer | `analyzer/handler.handler` | nodejs20.x | DECKS_TABLE |
| lorcana-auth-login | `auth/login.handler` | nodejs24.x | USERS_TABLE, ALLOWED_ORIGIN, JWT_SECRET (required) |
| lorcana-auth-register | `auth/register.handler` | nodejs24.x | USERS_TABLE, ALLOWED_ORIGIN |

- Realtime WebSocket API: `LorcanaPlayLabWebSocketApi`, stage `prod` → `wss://a86238wqo4.execute-api.us-east-1.amazonaws.com/prod`
- `lorcana-room` does not verify JWT on WebSocket messages (same as the EC2 WS server). Known limitation.
- JWT_SECRET must equal SSM `/lorcana/jwt-secret`; `scripts/lab.ps1 publish` syncs it to the Lambdas.
