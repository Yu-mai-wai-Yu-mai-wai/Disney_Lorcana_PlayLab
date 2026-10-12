# Runbook: งานต่อบน AWS Learner Lab หลัง merge PR #2

เอกสารนี้เขียนให้ Claude Code ที่รันบนเครื่องของทีม (Windows + PowerShell 7) ทำตามทีละ phase หลังเชื่อม AWS Learner Lab แล้ว
PR #2 แก้เฉพาะโค้ดและไม่ได้ deploy อะไร งานใน runbook นี้คือส่วนที่ต้องใช้ AWS จริง

## สถานะ AWS ที่ตรวจจริง (2026-10-12, Account 953899323223, us-east-1)

ฉบับแรกของ runbook เขียนจาก GitHub อย่างเดียว โดยสมมติว่า stack รันอยู่ เมื่อตรวจกับ AWS จริงพบว่า stack ถูกรื้อไปแล้ว ส่วนที่เหลือคือ:

| กลุ่ม | มีอยู่ | ไม่มี |
|---|---|---|
| Network / compute | (ไม่มี) | VPC `lorcana-lean-vpc`, security group `lorcana*`, ALB, ASG, launch template, EC2, ElastiCache |
| DynamoDB | `UsersTable` (63 แถว, TTL ปิด), `DecksTable` (ไม่มี GSI), `LorcanaRoomStateV2` (TTL เปิด), `LorcanaMatchmaking` (TTL เปิด) | `LorcanaMatchHistory`, `LorcanaPlayerStats` |
| Lambda | `lorcana-auth-login`, `lorcana-deck`, `lorcana-analyzer`, `lorcana-room`, `lorcana-auth-register` | `lorcana-match-history`, `lorcana-player-stats` |
| Messaging | SQS `lorcana-deck-analyzer` และ `lorcana-deck-analyzer-dlq` | SNS `lorcana-match-events`, SQS `lorcana-match-history*`, `lorcana-player-stats*` |
| Edge / อื่นๆ | WebSocket API `a86238wqo4` (route ครบ), S3 `lorcana-playlab-static-<acct>` และ `lorcana-playlab-assets-<acct>`, SSM `/lorcana/jwt-secret`, `/lorcana/admin-passcode`, `/lorcana/sqs-url` | SSM `/lorcana/cache-endpoint` |

ผลต่อลำดับงาน: ต้องสร้าง compute และ pipeline ก่อน แล้วจึง `lab.ps1 publish` ได้ ทดสอบกับ ALB (Phase 3.4 และ Phase 4) ได้หลังมี ALB เท่านั้น
ตัวเลขใน `docs/architecture/PROFESSOR_MEETING_BRIEFING.md` หัวข้อ 3 (E2E 12/12 บน ALB, ASG self-healing, DLQ) เป็นหลักฐานย้อนหลังจากตอนที่ stack ยังรันอยู่ ไม่ใช่สถานะวันนี้

## วิธีสั่ง Claude Code

ให้คนในทีมเปิด Claude Code ที่ root ของ repo แล้วพิมพ์:

```
อ่าน docs/specs/2026-10-11_post-pr2_learner_lab_runbook.md แล้วทำ Phase 0 ถึง Phase 4 ตามลำดับ
หยุดถามฉันทุกจุดที่เขียนว่า [ถามก่อน] และสรุปผลทุก phase ก่อนไป phase ถัดไป
```

## กติกาสำหรับ Claude Code (ใช้ทุก phase)

1. ทำตาม `AGENTS.md` (ladder, ไม่มี NAT Gateway, ไม่มี SSH ใช้ SSM, คอมเมนต์ `// ponytail:` สำหรับทางลัด)
2. **ห้ามพิมพ์ค่า secret ออกหน้าจอหรือลงไฟล์** ได้แก่ค่าใน SSM `/lorcana/*` และ AWS credentials ระบุแค่ชื่อพารามิเตอร์
3. **[ถามก่อน]** ทุกคำสั่งที่ลบข้อมูล (`delete-table`, `delete-item` นอกจากบัญชีทดสอบที่ตัวเองสร้าง, `lab.ps1 destroy`) หรือสร้าง infra ใหม่ที่มีค่าใช้จ่าย (`deploy_ec2_vpc_asg.ps1`, `ensure_cache.ps1`)
4. JSON ที่ส่งให้ AWS CLI ให้เขียนลงไฟล์ชั่วคราวแล้วใช้ `file://` เหมือนสคริปต์ใน `scripts/` เพราะ PowerShell 7 ส่ง quote ใน argument ต่างจาก PowerShell 5 (นี่คือต้นเหตุของบั๊ก `$PkName`)
5. ถ้าผลลัพธ์ไม่ตรงกับที่ runbook คาดไว้ ให้หยุด รายงานสิ่งที่เห็น แล้วรอคำสั่ง ห้ามเดาแล้วแก้เอง
6. Learner Lab session อยู่ได้ราว 4 ชั่วโมง ถ้าเจอ `ExpiredToken` ให้หยุดและบอกผู้ใช้ให้ต่ออายุ session แล้ววาง credentials ใหม่
7. งานที่แก้โค้ดให้ทำบน branch ใหม่และเปิด PR ห้าม push เข้า `main` ตรง

---

## Phase 0: เตรียมเครื่องและตรวจการเชื่อมต่อ (อ่านอย่างเดียว)

ผู้ใช้ทำเองก่อน: กด Start Lab ใน Learner Lab, เปิด "AWS Details" แล้วคัดลอกบล็อก AWS CLI ไปวางใน `~/.aws/credentials` (profile `default`)

Claude Code ตรวจ:

```powershell
$PSVersionTable.PSVersion          # ต้องเป็น 7.x (สคริปต์ทดสอบกับ pwsh 7)
node --version                     # 20.x ขึ้นไป
aws --version                      # AWS CLI v2
aws sts get-caller-identity --query Account --output text
aws configure get region           # ต้องเป็น us-east-1 ถ้าไม่ใช่ให้ใช้ --region us-east-1 ทุกคำสั่ง
git checkout main; git pull --ff-only origin main   # remote `old-origin` ชี้ไป repo ที่ไม่มีแล้ว ใช้ `origin` เท่านั้น
git log --oneline -1               # ต้องเป็น merge ของ PR #2 (d49d2b2) หรือใหม่กว่า (PR #3 = ff8a258)
Test-Path scripts/infrastructure_state.json   # ไฟล์นี้ gitignore อยู่ อาจไม่มีบนเครื่องที่ไม่ได้ deploy เอง
```

ผ่านเมื่อ: ได้ Account ID, region us-east-1, อยู่บน main ล่าสุด
ถ้าไม่มี `infrastructure_state.json`: `lab.ps1` จะใช้ชื่อตั้งต้น `lorcana-asg` และ `lorcana-lt` ได้ แต่จะไม่รู้ DNS ของ ALB ให้หาเองใน Phase 1

## Phase 1: สำรวจสถานะปัจจุบัน (อ่านอย่างเดียว)

```powershell
.\scripts\lab.ps1 status
aws elbv2 describe-load-balancers --names lorcana-alb --query "LoadBalancers[0].DNSName" --output text
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names lorcana-asg --query "AutoScalingGroups[0].[MinSize,DesiredCapacity,MaxSize]"
aws lambda list-functions --query "Functions[?starts_with(FunctionName,'lorcana')].[FunctionName,Runtime,LastModified]" --output table
aws apigatewayv2 get-apis --query "Items[?Name=='LorcanaPlayLabWebSocketApi'].[ApiId,ApiEndpoint]" --output table
foreach ($t in 'UsersTable','DecksTable','LorcanaRoomStateV2','LorcanaMatchmaking','LorcanaMatchHistory','LorcanaPlayerStats') {
  "== $t"
  aws dynamodb describe-table --table-name $t --query "Table.[KeySchema,GlobalSecondaryIndexes[].IndexName]" --output json
  aws dynamodb describe-time-to-live --table-name $t --query "TimeToLiveDescription" --output json
}
```

บันทึกผลลงไฟล์ `docs/01_Reports/stage3_evidence/aws_inventory_<วันที่>.txt` (ห้ามมีค่า secret)

สิ่งที่ต้องรายงานผู้ใช้:
- ASG ทำงานอยู่กี่เครื่อง หรือหยุดอยู่ (desired 0) หรือไม่มีเลย (ตรวจ 2026-10-12: ไม่มี ASG, ALB, VPC ตามตารางสถานะด้านบน คำสั่งข้างบนจะคืน `null` หรือ error `LoadBalancerNotFound` ซึ่งเป็นผลปกติของกรณีนี้ ไม่ต้องหยุด)
- ตาราง `LorcanaMatchHistory` และ `LorcanaPlayerStats` มีอยู่หรือไม่ ถ้ามี key ของ `LorcanaMatchHistory` ต้องเป็น `userId` (HASH) + `finishedAt#matchId` (RANGE) และ `LorcanaPlayerStats` ต้องเป็น `userId` (HASH) ถ้าเห็น `$PkName` หรือ `$SkName` แปลว่าโดนบั๊ก PowerShell 7 ไปทำ Phase 2 (ตรวจ 2026-10-12: ทั้งสองตารางไม่มี คำสั่ง describe จะ error `ResourceNotFoundException` ซึ่งเป็นผลปกติ ไปทำ Phase 2 ฝั่ง "ไม่มีตาราง")
- `DecksTable` มี GSI `userId-index` หรือไม่ (โค้ด query GSI นี้ ถ้าไม่มีจะถอยไป Scan)
- TTL เปิดบน `LorcanaRoomStateV2`, `LorcanaMatchmaking`, `LorcanaPlayerStats` (attribute `ttl`) หรือไม่ ถ้าปิดอยู่ แถวเก่าจะไม่ถูกลบ [ถามก่อน] ค่อยเปิดด้วย `aws dynamodb update-time-to-live --table-name <t> --time-to-live-specification "Enabled=true,AttributeName=ttl"`
- `lorcana-room` แก้ล่าสุดเมื่อไร (README บอกว่า bundle ที่ deploy ลงวันที่ 2026-08-25; ตรวจ 2026-10-12 พบ `LastModified` 2026-09-27)

## Phase 2: สร้างหรือแก้ pipeline ของผลแข่ง (ตารางสถิติ, SNS/SQS, Lambda)

เลือกกรณีตามที่ Phase 1 พบ:

**กรณี ก: ไม่มีตาราง `LorcanaMatchHistory` / `LorcanaPlayerStats` (สถานะที่พบ 2026-10-12)**
ไม่มีอะไรต้องลบ `scripts/ensure_pipeline.ps1` สร้างให้ครบ: ตารางทั้งสอง, SNS `lorcana-match-events`, SQS `lorcana-match-history*` และ `lorcana-player-stats*` พร้อม DLQ, Lambda `lorcana-match-history` และ `lorcana-player-stats` พร้อม event source mapping (ตรวจ `lorcana-deck-analyzer` ที่มีอยู่แล้วโดยไม่สร้างซ้ำ)
**[ถามก่อน]** เพราะเป็นการสร้างทรัพยากรใหม่ ก่อนรันให้อ่านสคริปต์ทั้งไฟล์และบอกผู้ใช้ว่าจะสร้างอะไร

```powershell
pwsh -File .\scripts\ensure_pipeline.ps1 -Region us-east-1
aws dynamodb describe-table --table-name LorcanaMatchHistory --query "Table.KeySchema"
aws dynamodb describe-table --table-name LorcanaPlayerStats --query "Table.KeySchema"
aws lambda list-functions --query "Functions[?starts_with(FunctionName,'lorcana-match') || starts_with(FunctionName,'lorcana-player')].FunctionName" --output text
```

**กรณี ข: มีตารางแต่ key ผิด**
**[ถามก่อน]** การลบตารางทำให้ประวัติการแข่งและสถิติที่มีอยู่หายทั้งหมด ถ้า key ผิดอยู่จริง Lambda เขียนข้อมูลลงไม่ได้มาตั้งแต่แรก ข้อมูลจึงน่าจะว่างอยู่แล้ว ให้ตรวจด้วย `aws dynamodb scan --table-name <t> --select COUNT` ก่อนถาม

เมื่อผู้ใช้อนุญาต:

```powershell
aws dynamodb delete-table --table-name LorcanaMatchHistory
aws dynamodb wait table-not-exists --table-name LorcanaMatchHistory
# ทำซ้ำกับ LorcanaPlayerStats ถ้าผิดเหมือนกัน
pwsh -File .\scripts\ensure_pipeline.ps1 -Region us-east-1
aws dynamodb describe-table --table-name LorcanaMatchHistory --query "Table.KeySchema"
aws dynamodb describe-table --table-name LorcanaPlayerStats --query "Table.KeySchema"
```

ผ่านเมื่อ: key ตรงกับ Phase 1 และ `ensure_pipeline.ps1` จบโดยไม่มี error

## Phase 3: deploy โค้ดจาก main

ลำดับที่ต้องทำเมื่อไม่มี compute (สถานะ 2026-10-12): 3.1 ตรวจในเครื่อง, 3.2 สร้าง VPC/ASG/cache, 3.3 publish, 3.4 ตรวจหลัง deploy `lab.ps1 publish` ขั้น 6 อ่าน launch template `lorcana-lt` ถ้าไม่มีจะหยุดด้วย error "run deploy first" จึงรัน publish ก่อน 3.2 ไม่ได้

### 3.1 ตรวจในเครื่องก่อน publish

```powershell
npm ci; Push-Location backend; npm ci; Pop-Location
npx tsc --noEmit
npx tsc --noEmit -p backend
npx vitest run          # ต้องผ่านทั้งหมด (135 ข้อ ณ PR #2)
```

ถ้าไม่ผ่าน ให้หยุดและรายงาน ห้าม publish

### 3.2 เปิดเครื่อง (ถ้า Phase 1 พบว่า desired = 0)

```powershell
.\scripts\lab.ps1 start      # ASG -> 2 เครื่อง เริ่มเสียค่า EC2
```

รอจน `lab.ps1 status` แสดง 2 เครื่อง `InService` / `Healthy`

ถ้าไม่มี VPC `lorcana-lean-vpc` เลย (stack ถูก destroy ไปแล้ว ซึ่งเป็นสถานะที่ตรวจพบ 2026-10-12 จึงข้าม `lab.ps1 start` และทำข้อนี้แทน) **[ถามก่อน]** แล้วรัน `.\scripts\deploy_ec2_vpc_asg.ps1` ตามด้วย `.\scripts\ensure_cache.ps1` ก่อนรันให้อ่านสคริปต์ทั้งสองและบอกผู้ใช้ว่าจะสร้างอะไร ค่าใช้จ่ายที่เริ่มนับ: EC2 t3.micro 2 เครื่อง, ALB ประมาณ 0.03 ดอลลาร์ต่อชั่วโมง, ElastiCache `cache.t3.micro` ประมาณ 0.017 ดอลลาร์ต่อชั่วโมง ไม่มี NAT Gateway และไม่มี SSH (เข้าเครื่องผ่าน SSM)
ต้องมี SSM `/lorcana/jwt-secret` (มีอยู่แล้ว) และ `/lorcana/cache-endpoint` (ยังไม่มี `ensure_cache.ps1` ควรสร้างให้ ตรวจหลังรัน โดยดูเฉพาะชื่อพารามิเตอร์ ห้ามพิมพ์ค่า)

### 3.3 Publish

```powershell
.\scripts\lab.ps1 publish
```

ขั้นนี้ build SPA, bundle backend, อัปโหลด S3, sync JWT ให้ Lambda รุ่นเก่า, deploy Lambda `analyzer`/`match-history`/`player-stats`, อัปเดต launch template ถ้า user data เปลี่ยน และเปลี่ยนเครื่องทีละเครื่อง (ใช้เวลาราว 5-10 นาที)
หมายเหตุ: `lab.ps1 publish` ไม่ deploy `lorcana-room` (ดู Phase 5a)

### 3.4 ตรวจหลัง deploy

```powershell
$alb = "http://<ALB DNS จาก Phase 1>"
Invoke-RestMethod "$alb/api/health"
(Invoke-WebRequest "$alb/api/leaderboard").Headers["X-Cache"]   # ครั้งแรก MISS ครั้งที่สองภายใน 60 วินาที HIT
```

ตรวจการแก้ role admin บน production ด้วยบัญชีทดสอบ แล้วลบทิ้ง:

```powershell
$name = "aDmIn"   # รูปแบบตัวพิมพ์ที่ยังไม่มีใครใช้ ถ้าได้ 409 ให้เปลี่ยนเป็นแบบอื่น เช่น "ADmin"
$pw = [guid]::NewGuid().ToString()
$body = @{ username = $name; email = "$name@e2e.test"; password = $pw } | ConvertTo-Json
(Invoke-RestMethod "$alb/api/auth/register" -Method Post -ContentType 'application/json' -Body $body).user.role   # ต้องได้ user
'{"username":{"S":"' + $name + '"}}' | Set-Content -Encoding ascii key.json
aws dynamodb delete-item --table-name UsersTable --key file://key.json; Remove-Item key.json
```

### 3.5 ตรวจบัญชี admin ที่มีอยู่ (สำคัญ)

ก่อน PR #2 ใครสมัครชื่อ `admin` ในรูปแบบตัวพิมพ์ใดก็ได้ role admin ให้ list บัญชี admin ทั้งหมด (แสดงแค่ชื่อและวันที่สร้าง ห้ามแสดง hash รหัสผ่าน):

```powershell
'{"#r":"role"}' | Set-Content -Encoding ascii names.json
'{":a":{"S":"admin"}}' | Set-Content -Encoding ascii values.json
aws dynamodb scan --table-name UsersTable --filter-expression "#r = :a" --expression-attribute-names file://names.json --expression-attribute-values file://values.json --projection-expression "username, createdAt" --output table
Remove-Item names.json, values.json
```

รายงานรายชื่อให้ผู้ใช้ตัดสินใจว่าบัญชีไหนควรเป็น admin จริง **[ถามก่อน]** ก่อนลด role หรือลบบัญชีใด

## Phase 4: E2E กับระบบจริง

```powershell
npx playwright install chromium
$env:E2E_BASE_URL = "http://<ALB DNS>"
npx playwright test
Remove-Item Env:E2E_BASE_URL
```

ผลที่คาด:
- ทุก spec ควรผ่าน รวมเทสต์ที่ติดป้าย "ALB only" (TC-E2E-16 ถึง 24) ที่ทดสอบในเครื่องไม่ได้
- `qa-campaign-uxui` ใช้บัญชี `io5` บน production ถ้าบัญชีนี้ไม่มี TC-UXUI-005 ถึง 007 จะตก ให้รายงานแทนการสร้างบัญชีเอง
- ถ้า login ตกหลายข้อติดกัน อาจโดน rate limit (5 ครั้งต่อ IP+username ล็อก 5 นาที) ให้รอ 5 นาทีแล้วรันเฉพาะข้อที่ตก
- TC-E2E-25 ผ่านแล้วบนระบบเดียวกันเมื่อ 2026-10-05 และผ่าน 4/4 บน local stack หลังเปลี่ยนการสับไพ่ ถ้าตกด้วยข้อความ `change SEED` ให้ลองเปลี่ยน `SEED` แล้วรายงาน

บันทึกผลลง `docs/01_Reports/stage3_evidence/e2e_after_pr2_<วันที่>.txt` แล้ว commit บน branch ใหม่และเปิด PR

## Phase 5: งานปรับปรุงที่ต้องแตะ AWS (แยก PR ละเรื่อง, [ถามก่อน] เริ่มแต่ละข้อ)

เรียงตามความคุ้มค่า แต่ละข้อให้เขียน spec สั้น ๆ ใน `docs/specs/` ก่อนเขียนโค้ด

a. **ให้ `lab.ps1` deploy `lorcana-room` ได้**: ดาวน์โหลดโค้ดที่ deploy อยู่ (`aws lambda get-function --function-name lorcana-room --query Code.Location`) มาเทียบกับ `backend/serverless/room/handler.ts` ก่อน ถ้าต่างให้รายงาน จากนั้นเพิ่มลง `$lambdaFns` และประกาศ dependency ที่ handler ใช้ (`@aws-sdk/client-apigatewaymanagementapi`, `@types/aws-lambda`)
b. **ยืนยันตัวตนบน WebSocket**: ส่ง JWT ตอน `$connect` (query string) ตรวจใน Lambda เก็บ username คู่กับ `connectionId` และเลิกเชื่อ `username`/`role` ที่ client ส่งมา ต้องแก้ทั้ง `src/services/websocket.ts` และ Lambda
c. **ให้ room Lambda เป็นผู้บันทึกผลแข่ง**: publish `match.finished` จาก Lambda เมื่อทั้งสองฝั่งส่ง `GAME_OVER` ที่ข้อมูลตรงกัน แล้วปิดไม่ให้ client เรียก `POST /matches` โดยตรง
d. **secret ของ Lambda อ่านจาก SSM ตอน cold start** แทน environment variable แบบข้อความเปล่า
e. **HTTPS**: ทำได้เมื่อมีโดเมนและ ACM certificate (Learner Lab ยังทำไม่ได้)

## Phase 6: ปิดงานและคุมงบ

- **[ถามก่อน]** `.\scripts\lab.ps1 stop` เพื่อหยุด EC2 (ALB ยังคิดเงินประมาณ 0.03 ดอลลาร์ต่อชั่วโมง)
- ถ้าจะหยุดยาว **[ถามก่อน]** `.\scripts\lab.ps1 destroy`
- สรุปให้ผู้ใช้: สิ่งที่ deploy, ผล e2e, ไฟล์หลักฐาน, PR ที่เปิด, และงาน Phase 5 ที่เหลือ

## งานที่ผู้ใช้ต้องทำเอง (Claude Code ทำแทนไม่ได้)

- ใน dashboard ของ GitGuardian ตั้ง incident 37668453 และ 38106116 เป็น test credential หรือ false positive ทั้งคู่เป็นรหัสผ่านของบัญชีทดสอบใน `e2e/07-four-turn-game.spec.ts` ไม่ใช่ secret จริง
- เติม `\todo{...}` 8 จุดในร่างรายงาน Final (`docs/01_Reports/final/*.tex`)
