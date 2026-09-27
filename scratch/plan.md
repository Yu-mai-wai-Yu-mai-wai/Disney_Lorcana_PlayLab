# Spec: Cloud Infra Hardening for Stage 3 (IaaS + Hybrid Realtime)

Status: SPEC READY — รอ "Proceed" ก่อนแตก ticket และลงมือ
Updated: 2026-09-27
Deadline: Stage 3 progress 10 ต.ค. 2569 (ผลทดลอง 10 คะแนน + ออกแบบ 5 คะแนน), รายงานฉบับสมบูรณ์ + นำเสนอ 20-25 ต.ค. 2569

## Problem Statement

ทีมต้องเดโมและส่งผลทดลอง Stage 3 ที่ให้คะแนน "การทำงานของระบบ ข้อจำกัด และการประมาณค่าใช้จ่าย" แต่ stack IaaS ปัจจุบันมีปัญหาที่ทำให้ผลทดลองไม่น่าเชื่อถือหรือพังตอนเดโม:

- ตั้ง ASG Min 2 เพื่อ Multi-AZ แต่ WebSocket เก็บ connection และ game state ใน memory ของแต่ละเครื่อง ผู้เล่นที่ ALB ส่งไปคนละเครื่องจะเล่นด้วยกันไม่ได้ และเครื่องตาย = ห้องหาย
- backend บน EC2 ไม่ได้รับ `JWT_SECRET`/`ADMIN_PASSCODE` จึงใช้ค่า default ที่อยู่ในโค้ด ใครก็ปลอม token เป็น admin ได้ และ deck analyzer ผ่าน SQS ไม่ทำงานบน EC2 เพราะไม่มี queue URL
- destroy ทิ้ง VPC ค้าง (เคยค้าง 3 ตัว ลบแล้ววันที่ 2026-09-27) เพราะไม่ลบ route table และกลืน error, deploy ซ้ำสร้าง VPC ใหม่ทุกครั้ง
- ไม่มีวิธี publish โค้ดใหม่ขึ้น S3 ที่ทำซ้ำได้ ต้องทำมือ
- README เคลม IMDSv2 แต่ไม่ได้บังคับ และตัวเลข ASG ในเอกสารไม่ตรงกับสคริปต์
- ไม่มีหลักฐาน HA ที่วัดได้ (alarm/metric) สำหรับใส่รายงาน

## Solution

- **Hybrid realtime:** ALB + EC2 ASG (Min 2, 2 AZ) ให้บริการเว็บ SPA และ REST API ส่วน realtime match ย้ายไปใช้ API Gateway WebSocket + Lambda `lorcana-room` ที่ deploy อยู่แล้ว (ตรวจแล้วรองรับ action ครบเท่า backend v1.5 รวม LEAVE_ROOM, REJOIN_ROOM, undo) state อยู่ใน DynamoDB อย่างเดียว ไม่ผูกกับเครื่อง
- **Secret ที่เดียว:** JWT secret และ admin passcode อยู่ใน SSM Parameter Store (SecureString) ทั้ง EC2 และ Lambda ใช้ค่าเดียวกัน (ตรวจแล้ว LabRole มีสิทธิ์ `ssm:GetParameter`, `kms:Decrypt`)
- **Lifecycle ที่ทำซ้ำได้:** `lab.ps1` มี `publish` (build → S3 → instance refresh), deploy กันสร้างซ้ำ, destroy ลบครบและบอกเมื่อพลาด
- **หลักฐาน HA:** CloudWatch alarm `UnHealthyHostCount > 0` บน target group + ผลทดลอง failover, scaling, realtime ข้ามเครื่อง และตารางค่าใช้จ่าย

## Settled Decisions (จาก grill 2026-09-27)

| # | เรื่อง | ตัดสิน |
|---|---|---|
| D1 | ASG | Min 2 / Desired 2 / Max 4, 2 AZ — แก้เอกสารให้ตรงสคริปต์ |
| D2 | VPC ค้าง | ลบแล้ว 3 ตัว |
| D3 | Realtime ข้ามเครื่อง | ใช้ API GW WebSocket + Lambda เดิม (Q1 a) |
| D4 | Monitoring | CloudWatch alarm `UnHealthyHostCount > 0` ตัวเดียว (rubric ไม่ได้ขอ dashboard) |
| D5 | Secret | SSM SecureString, สำรอง: สุ่มแล้วฝังใน user_data ถ้า SSM ใช้ไม่ได้ |
| D6 | Legacy cleanup | ลบ bucket `lorcana-playlab-web-tawan` + table `RoomStateTable` แล้ว, bucket static ปิด public + ปิด website hosting แล้ว (2026-09-27) |
| D7 | Publish | `lab.ps1 publish` (ไม่ใช้ GitHub Actions เพราะ credentials Learner Lab หมดทุก 4 ชม.) |
| D8 | HTTPS | ข้าม |

## User Stories

1. As a ผู้เล่น, I want เข้าห้องด้วยรหัส 6 หลักแล้วเห็นการเล่นของคู่แข่งแบบ realtime, so that เล่นด้วยกันได้ไม่ว่า ALB จะส่งหน้าเว็บมาจากเครื่องไหน
2. As a ผู้เล่น, I want เกมยังเล่นต่อได้เมื่อ EC2 เครื่องหนึ่งตาย, so that match ไม่หลุดเพราะปัญหาฝั่ง server
3. As a ผู้เล่น, I want login ครั้งเดียวแล้วใช้ token เดียวกันทั้ง REST API และ WebSocket, so that ไม่ต้อง login ซ้ำ
4. As a ผู้เล่น, I want matchmaking จับคู่ได้แม้ผู้เล่นสองคนโหลดเว็บจากคนละ AZ, so that คิวไม่แยกตามเครื่อง
5. As a ผู้เล่น, I want ปุ่ม Exit Match และ rejoin 60 วินาทีทำงานเหมือนเดิม, so that ฟีเจอร์ v1.5 ไม่ถอยหลัง
6. As a ผู้เล่น, I want บันทึก deck แล้ว analyzer วิเคราะห์ ink curve ได้เมื่อใช้งานผ่าน ALB, so that ฟีเจอร์ SQS ทำงานในโหมด IaaS
7. As a ผู้ดูแลระบบ, I want token ที่เซ็นด้วย secret default ถูกปฏิเสธ 401, so that คนนอกปลอมสิทธิ์ admin ไม่ได้
8. As a ผู้ดูแลระบบ, I want secret อยู่ใน SSM และไม่อยู่ใน launch template, user_data, repo หรือ log, so that คนที่อ่าน config ได้ไม่เห็น secret
9. As a ผู้ดูแลระบบ, I want เปลี่ยน secret ได้โดยแก้ SSM แล้ว refresh instance, so that ไม่ต้องแก้โค้ด
10. As a สมาชิกทีม, I want `lab.ps1 publish` คำสั่งเดียว build frontend + backend, อัปขึ้น S3 และ rolling refresh ASG, so that ทุกคน deploy โค้ดใหม่ได้เหมือนกัน
11. As a สมาชิกทีม, I want deploy หยุดพร้อมข้อความชัดเจนถ้ามี `lorcana-lean-vpc` อยู่แล้ว, so that ไม่สร้าง VPC ซ้ำจนชนโควตา 5
12. As a สมาชิกทีม, I want destroy ลบ ASG, LT, ALB, TG, SG, route table, subnet, IGW และ VPC ครบ, so that ไม่มีค่าใช้จ่ายหรือของค้าง
13. As a สมาชิกทีม, I want destroy แจ้ง error และเก็บ state file ไว้ถ้าลบ VPC ไม่สำเร็จ, so that รันซ้ำได้โดยไม่ต้องไล่หา ID เอง
14. As a สมาชิกทีม, I want `lab.ps1 start/stop/status` ใช้ค่า Min 2 เหมือนสคริปต์ deploy, so that เดโมได้ 2 AZ ทุกครั้ง
15. As a ผู้ประเมิน (อาจารย์), I want เห็น target healthy 2 ตัวใน 2 AZ และ alarm เปลี่ยนเป็น ALARM ตอนปิดเครื่องหนึ่ง แล้วกลับเป็น OK เมื่อ ASG สร้างเครื่องใหม่, so that เชื่อได้ว่ามี HA จริง
16. As a ผู้ประเมิน, I want เห็นกราฟ CPU และ activity ของ ASG ตอน stress test ที่ scale จาก 2 ขึ้นไป, so that เห็นว่า scaling ทำงาน
17. As a ผู้ประเมิน, I want เห็นตารางประมาณค่าใช้จ่ายต่อชั่วโมง/เดือนแยกตามบริการ พร้อมเทียบกับงบ $50, so that ประเมินความคุ้มค่าได้
18. As a ผู้ประเมิน, I want รายงานระบุข้อจำกัดตรงๆ (ไม่มี HTTPS, Learner Lab session 4 ชม., ต้อง publish จาก S3, cold start ของ Lambda), so that ผลทดลองครบทุกประเด็นตาม rubric
19. As a ผู้ดูแลระบบ, I want EC2 บังคับ IMDSv2, so that ข้อความใน README เป็นจริง
20. As a ผู้ดูแลระบบ, I want EC2 SG เปิดเฉพาะพอร์ต 80 จาก ALB SG, so that attack surface เล็กที่สุด
21. As a ผู้ดูแลระบบ, I want nginx บน EC2 ส่ง security headers ชุดเดียวกับ `nginx.conf` ใน repo, so that config ไม่แยกกันสองที่
22. As a ผู้ดูแลระบบ, I want bucket static ไม่เปิด public และ EC2 ดึงผ่าน IAM, so that ไม่มีทางเข้าที่ข้าม ALB
23. As a สมาชิกทีม, I want source ของ Lambda อยู่ใน repo, so that แก้และ redeploy ได้ (ตอนนี้โค้ดมีแค่บน AWS)

## Implementation Decisions

**Realtime (D3)**
- frontend build ตอน publish ใส่ `VITE_WS_ENDPOINT` = URL stage ของ `LorcanaPlayLabWebSocketApi` ตัว resolver ใน websocket service รองรับ env นี้อยู่แล้ว ไม่ต้องแก้ frontend logic
- nginx บน EC2 เลิก proxy `/ws` และ backend EC2 ไม่เปิด WebSocket server อีก (ลบ path นั้นออก ไม่ต้องคงไว้ "เผื่อ") REST API และ `/health` คงเดิม
- ต้องยืนยันก่อนลงมือ: Lambda `lorcana-room` ตรวจ JWT จาก env ไหน และ stage name ของ WebSocket API (ใช้ประกอบ URL)
- นำ source ของ Lambda ทั้ง 5 ตัวที่ดึงจาก AWS มาเก็บใน repo ในโฟลเดอร์ของ backend (เก็บเป็น bundle เดิมก่อน แยกเป็น source ทีหลังถ้าต้องแก้ logic)

**Secret (D5)**
- SSM path: `/lorcana/jwt-secret`, `/lorcana/admin-passcode` (SecureString), `/lorcana/sqs-url` (String)
- deploy สร้าง parameter เฉพาะเมื่อยังไม่มี (สุ่ม 48 byte) ไม่เขียนทับค่าเดิม
- user_data อ่านด้วย `aws ssm get-parameter --with-decryption` แล้วเขียนเป็น systemd `EnvironmentFile` (root, 600) ถ้าอ่านไม่ได้ให้ service ไม่ start (fail closed) แทนที่จะ fallback ไปค่า default
- backend: ถ้า `NODE_ENV=production` แต่ไม่มี `JWT_SECRET` หรือ `ADMIN_PASSCODE` ให้ exit ตอนเริ่ม ค่า default ใช้ได้เฉพาะ dev
- Lambda ทั้ง 5 ตัวได้ `JWT_SECRET` ค่าเดียวกันผ่าน `update-function-configuration` ตอน publish
  - ponytail: ค่าอยู่ใน Lambda env แบบ plaintext (อ่านได้ถ้ามีสิทธิ์ `GetFunctionConfiguration`) อัปเกรดเป็นดึงจาก SSM ตอน cold start ถ้าต้องการ rotation บ่อย

**Lifecycle (D7, F3, F4)**
- `lab.ps1` เพิ่ม action `publish`: `npm run build` (frontend พร้อม `VITE_WS_ENDPOINT`) + build backend → `s3 sync` ไป bucket static / `s3 cp` bundle ไป bucket assets → sync secret ให้ Lambda → `start-instance-refresh` (MinHealthyPercentage 50)
- deploy: ถ้าพบ VPC tag `lorcana-lean-vpc` ให้หยุดพร้อมบอกให้รัน destroy
- destroy: ลำดับ ASG → LT → ALB → รอ ALB ENI หมด (poll ไม่ใช่ sleep คงที่) → TG → SG → route table ที่ไม่ใช่ main → subnet → IGW → VPC, ถ้าขั้นใดล้มให้ exit non-zero และไม่ลบ state file
- ตัดสคริปต์ `lab_start.ps1`/`lab_stop.ps1`/`lab_destroy.ps1` ออกไหม: คงไว้ (เป็น wrapper บรรทัดเดียวที่เอกสารอ้างถึง)

**Hardening (F5-F7, F9)**
- launch template `MetadataOptions: HttpTokens=required, HttpPutResponseHopLimit=1`
- ลบกฎ ingress 3001
- user_data ใช้ nginx config ชุดเดียวกับ `nginx.conf` ใน repo (มี security headers) แทน heredoc ที่ต่างกัน
- CORS: frontend กับ REST API อยู่ origin เดียวกันผ่าน ALB → ปิด CORS middleware ใน production หรือจำกัดเป็น origin ของ ALB

**Monitoring (D4)**
- deploy สร้าง CloudWatch alarm `lorcana-unhealthy-hosts`: metric `UnHealthyHostCount` (namespace `AWS/ApplicationELB`, dimensions TargetGroup + LoadBalancer), Maximum, period 60s, threshold > 0, 1 datapoint ไม่มี SNS action (ใช้เป็นหลักฐานในรายงาน)
- destroy ลบ alarm นี้ด้วย

**Docs (F8)**
- README และคู่มือ LearnerLab: Min 2 / Max 4 / start = 2 เครื่อง, แผนภาพเพิ่ม API GW WebSocket + Lambda, section ข้อจำกัดและตารางค่าใช้จ่าย

## Testing Decisions

Test ภายนอกเท่านั้น (HTTP status, พฤติกรรมที่ผู้ใช้เห็น, สถานะ resource บน AWS) ไม่ test implementation ข้างใน

- **Red test ก่อนแก้ (security):** เซ็น JWT ด้วย `dev-secret-key-do-not-use-in-production` แล้วเรียก Deck API → ก่อนแก้ต้องได้ 200 (ยืนยันช่องโหว่), หลังแก้ต้องได้ 401 เพิ่มเป็น test ใน backend auth test ที่มีอยู่ (prior art: `backend/__tests__/auth.test.ts`)
- **Backend startup:** production ไม่มี secret → process exit non-zero (test เดียวใน backend suite)
- **Realtime ข้ามเครื่อง:** Playwright 2 browser context เข้าห้องเดียวกันผ่าน ALB แล้วเห็น CARD_MOVED ของอีกฝั่ง (prior art: `e2e/05-match-realtime-sync.spec.ts`)
- **Failover:** ใช้ `scripts/test_asg_recovery.ps1` ที่มีอยู่ terminate 1 เครื่อง → alarm เป็น ALARM → ASG สร้างเครื่องใหม่ → alarm กลับ OK, match ที่กำลังเล่นไม่หลุด เก็บ timestamp ทุกขั้นลงรายงาน
- **Scaling:** `scripts/stress_test.ps1` ที่มีอยู่ → ASG ขึ้นเกิน 2
- **IaC:** deploy → destroy → `describe-vpcs` เหลือแค่ default และไม่มี ALB/TG/SG/LT/alarm ค้าง, deploy ซ้ำตอนมี VPC อยู่ → หยุดพร้อมข้อความ
- **Static checks:** `bash -n` user_data, PowerShell parser ทั้งสองสคริปต์, `npm test`, backend test, `npm run build`
- **OWASP ครอบคลุม:** A01 (401 เมื่อ token ไม่ถูก), A02 (ไม่มี secret default ใน production), A05 (IMDSv2, SG แคบ, S3 ไม่ public, security headers), A07 (token ปลอม), A09 (alarm)

## Out of Scope

- HTTPS / CloudFront / ACM
- ElastiCache / Redis
- CloudWatch dashboard, SNS notification, AWS Budgets
- เปลี่ยน game logic, UI, responsive (แผน Responsive Board เดิมถูกเขียนทับแล้ว ถ้ายังต้องทำให้เปิดแผนใหม่ภายหลัง)
- GitHub Actions CI/CD
- ย้าย Lambda bundle เป็น source ที่แก้ได้ (เก็บ bundle เดิมเข้า repo เท่านั้น)

## Further Notes

- ต้อง commit checkpoint ก่อนเริ่ม เพราะไฟล์ที่จะแก้มี uncommitted changes อยู่ (`backend/server.ts`, `scripts/*.ps1`, `scripts/ec2_user_data.sh`)
- เปลี่ยน secret แล้ว token เก่าใช้ไม่ได้ ผู้ใช้ต้อง login ใหม่ (ตะวันรับทราบแล้ว)
- Learner Lab session หมดทุก 4 ชม. ตอนทดลองจริงให้เริ่ม lab ใหม่ก่อนเสมอ
- หลังเสร็จ: ย้ายสเปกนี้ไป `docs/specs/` ของโปรเจกต์ และสรุปการตัดสินใจลง `07_MEMORY/Decisions.md`
