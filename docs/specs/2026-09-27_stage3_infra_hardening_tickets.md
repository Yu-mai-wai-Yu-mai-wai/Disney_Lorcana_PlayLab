# Tickets: Cloud Infra Hardening for Stage 3

Spec: `scratch/plan.md` | Status: APPROVED — implementing | Updated: 2026-09-27
Deadline: ผลทดลอง Stage 3 วันที่ 10 ต.ค. 2569

Pre-flight: [x] checkpoint commit `9e268ff`

Breakdown changes (ตะวัน 2026-09-27): รวม 05 เข้า 03, 04 ไม่รอ 03/05 แล้ว (ยอมให้แก้ `ec2_user_data.sh` ชนกัน)

Frontier ตอนเริ่ม: 01, 02

```
01 ── 04 ──┐
02 ── 03 ──┼── 07 ── 08
      └── 06
```

---

## 01: เก็บ source ของ Lambda เข้า repo

**What to build:** ดึง bundle ของ Lambda `lorcana-*` ทั้ง 5 ตัวจาก AWS มาเก็บใน repo พร้อมบันทึกว่าแต่ละตัวอ่าน env อะไร โดยเฉพาะชื่อ env ของ JWT secret ที่ `lorcana-room` ใช้ตรวจ token และชื่อ stage ของ `LorcanaPlayLabWebSocketApi` ตอนนี้โค้ดมีอยู่บน AWS ที่เดียว ถ้า account Learner Lab ถูกรีเซ็ตโค้ดจะหายไปด้วย

**Blocked by:** None (can start immediately)

**Status:** done (`ed75da2`) — source คืนจาก git history ไป `backend/serverless/` แทน bundle; room/handler ไม่ตรวจ JWT (known limitation)

- [ ] มี bundle 5 ตัวใน repo ใต้โฟลเดอร์ของ backend แยกตาม function
- [ ] README สั้นๆ ในโฟลเดอร์นั้นระบุ handler, runtime, env ที่อ่าน (ชื่อเท่านั้น ไม่ใส่ค่า secret) และ WebSocket stage URL
- [ ] ยืนยันแล้วว่า Lambda ตรวจ JWT ด้วย env ชื่ออะไร และถ้าไม่มี env จะใช้ค่า default อะไร

---

## 02: Backend ไม่ยอม start ใน production ถ้าไม่มี secret

**What to build:** ถ้า backend รันด้วย `NODE_ENV=production` โดยไม่มี `JWT_SECRET` หรือ `ADMIN_PASSCODE` ให้ process exit ด้วย code ที่ไม่ใช่ 0 พร้อม log ที่บอกว่าขาดตัวไหน (ห้าม log ค่า) ส่วนโหมด dev ใช้ค่า default ได้เหมือนเดิม ใน production ให้ปิด CORS แบบรับทุก origin เพราะ SPA กับ REST API อยู่ origin เดียวกันหลัง ALB

**Blocked by:** None (can start immediately)

**Status:** done (`ed75da2`, `0e9efa1`) — TC-AUTH-00a red→green, เพิ่ม TC-AUTH-00c ปิด backdoor `admin123`

- [ ] Red test ก่อนแก้: เพิ่ม test ใน `backend/__tests__/auth.test.ts` ที่ spawn backend ด้วย `NODE_ENV=production` แบบไม่มี secret แล้ว assert ว่า exit code ≠ 0 ภายใน 10 วินาที รันแล้วต้อง FAIL เก็บ output ไว้
- [ ] หลังแก้ test เดิมผ่าน (GREEN) และ `npm test` ผ่านทั้ง suite
- [ ] test ที่ใส่ secret ครบแล้ว process ไม่ exit ภายใน 5 วินาที
- [ ] `npm run build` ใน `backend/` ผ่าน
- [ ] request จาก origin อื่นใน production ไม่ได้ header `Access-Control-Allow-Origin` กลับไป

---

## 03: Secret และ SQS URL ไปถึง EC2 ผ่าน SSM (fail closed)

**What to build:** deploy สร้าง parameter `/lorcana/jwt-secret`, `/lorcana/admin-passcode` (SecureString, สุ่ม 48 byte) และ `/lorcana/sqs-url` (String) เฉพาะเมื่อยังไม่มี ห้ามเขียนทับค่าเดิม ส่วน user_data อ่านค่าผ่าน `LabInstanceProfile` แล้วเขียนลง systemd `EnvironmentFile` (root, 600) ถ้าอ่านไม่ได้ service ต้องไม่ start ผลที่ได้คือ token ที่เซ็นด้วย secret default ถูกปฏิเสธบนระบบจริง และ deck analyzer ทำงานในโหมด IaaS

**Blocked by:** 02

**Status:** done on live stack 2026-09-27 — SSM v1 ไม่ถูกเขียนทับ, IMDSv2, ไม่มี 3001, guard exit 1, TC-E2E-16 (forged token 401 + headers) ผ่าน; TC-E2E-17 deck save/analyze ผ่าน, SQS sent=1, analyzer Lambda invoked=1

- [ ] deploy รันซ้ำแล้วค่าใน SSM ไม่เปลี่ยน (เทียบ `Version` ของ parameter ก่อนและหลัง)
- [ ] ไม่มีค่า secret ใน launch template (`describe-launch-template-versions` + decode UserData แล้ว grep ไม่เจอ)
- [ ] ผ่าน ALB: เรียก `GET /api/decks` ด้วย token ที่เซ็นด้วย `dev-secret-key-do-not-use-in-production` แล้วได้ 401
- [ ] ผ่าน ALB: register → login → save deck → analyze แล้วได้ผล analysis กลับมา (SQS ทำงาน)
- [ ] `bash -n scripts/ec2_user_data.sh` ผ่าน, PowerShell parser ของ deploy script ไม่มี error

**Merged from 05 (Hardening):** EC2 บังคับ IMDSv2 (`HttpTokens=required`, hop limit 1), EC2 SG รับเฉพาะพอร์ต 80 จาก ALB SG, nginx บน EC2 มี security headers ชุดเดียวกับ `nginx.conf`, deploy หยุดถ้าพบ VPC tag `lorcana-lean-vpc`, CloudWatch alarm `lorcana-unhealthy-hosts` (`UnHealthyHostCount` Maximum > 0, period 60s, 1 datapoint, ไม่มี SNS)

- [ ] `describe-launch-template-versions` แสดง `HttpTokens: required`
- [ ] ใน EC2 SG ไม่มีกฎพอร์ต 3001
- [ ] `curl -I http://<ALB>/` มี `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] รัน deploy ซ้ำตอนที่ stack ยังอยู่ → exit ≠ 0 พร้อมข้อความให้ destroy ก่อน และจำนวน VPC ไม่เพิ่ม
- [ ] target healthy 2 ตัวใน us-east-1a และ 1b, alarm อยู่ในสถานะ `OK`

---

## 06: Destroy ลบครบและแจ้งเมื่อพลาด

**What to build:** `lab.ps1 destroy` ลบตามลำดับนี้: ASG → LT → alarm → ALB → รอให้ ENI ของ ALB หายหมด (poll ไม่ใช่ sleep คงที่) → TG → SG → route table ที่ไม่ใช่ main → subnet → IGW → VPC ถ้าขั้นไหนพลาดให้ exit ≠ 0 และเก็บ state file ไว้ รันซ้ำแล้วต้องทำต่อได้

**Blocked by:** 03 (ต้องรู้ชื่อ alarm ที่ต้องลบ)

**Status:** done on live stack 2026-09-27 — destroy เหลือแค่ default VPC, รันซ้ำหลังถูกขัดจังหวะได้

- [ ] หลัง destroy: `describe-vpcs` เหลือแค่ default VPC, ไม่มี ALB/TG/LT/ASG/alarm ชื่อ `lorcana-*`, ไม่มี SG `lorcana-*`
- [ ] จำลองกรณีพลาด (เช่นเหลือ SG ที่ถูกอ้างอิงอยู่) → exit ≠ 0 และ state file ยังอยู่
- [ ] รอบ deploy → destroy → deploy ผ่านโดยไม่ต้องลบอะไรด้วยมือ

---

## 04: `lab.ps1 publish` และ realtime ผ่าน API Gateway WebSocket

**What to build:** คำสั่ง `lab.ps1 publish` ทำครบในคำสั่งเดียว: build frontend โดยใส่ `VITE_WS_ENDPOINT` = WebSocket stage URL, build backend, sync ขึ้น bucket static/assets, ตั้ง JWT secret ค่าเดียวกับ SSM ให้ Lambda `lorcana-*` แล้วเริ่ม ASG instance refresh (MinHealthyPercentage 50) ฝั่ง EC2 เลิกให้บริการ WebSocket (ลบ `/ws` ใน nginx และ WS server ใน backend) ผลที่ได้คือผู้เล่นสองคนที่ ALB ส่งไปคนละเครื่องเล่นด้วยกันได้

**Blocked by:** 01 (ต้องรู้ชื่อ env JWT ของ Lambda และ stage URL)

**Status:** done on live stack 2026-09-27 — publish ผ่าน (rolling replace แทน instance refresh ที่ SCP ปฏิเสธ), TC-E2E-15 ผ่าน 5/5 ข้าม 2 AZ, Lambda มี JWT_SECRET แล้ว; Exit Match/rejoin ยังไม่ได้เช็กด้วยมือ; red run ของ TC-E2E-15 บน stack เก่าไม่ได้ทำ

- [ ] Red test ก่อนแก้: ต่อยอด `e2e/05-match-realtime-sync.spec.ts` ให้เปิด 2 browser context ผ่าน ALB (`baseURL` จาก env) โดย P1 สร้างห้อง, P2 เข้าด้วยรหัส, P1 ย้ายการ์ด แล้ว P2 ต้องเห็นภายใน 5 วินาที รันกับ stack ก่อนแก้ (Min 2) แล้วต้อง FAIL หรือ flaky เก็บผลไว้
- [ ] หลังแก้ test เดียวกันผ่าน 5 รอบติด
- [ ] token ที่ได้จาก REST login ใช้กับ WebSocket ได้ (เข้าห้องได้โดยไม่ต้อง login ซ้ำ)
- [ ] Exit Match และ rejoin 60 วินาทียังทำงาน (เช็กด้วยมือ บันทึกผลลง ticket)
- [ ] ระหว่าง instance refresh `/health` ผ่าน ALB ไม่มี 5xx (poll ทุก 2 วินาทีตลอดการ refresh)
- [ ] `npm run build` และ `npm test` ผ่าน

---

## 07: ผลทดลอง HA และ scaling สำหรับรายงาน

**What to build:** รันการทดลองที่ rubric ให้คะแนนแล้วเก็บผลเป็นตัวเลขและ timestamp ใช้สคริปต์ที่มีอยู่ แก้แค่ให้สคริปต์บอกผลตรงตามจริง: `test_asg_recovery.ps1` ต้อง exit 1 เมื่อหมดเวลา (ตอนนี้แค่ warning แล้ว exit 0) และบันทึกสถานะ alarm ทุกรอบ poll ส่วน `stress_test.ps1` ตอนนี้ยิง `/health` ซึ่ง nginx ตอบเองโดยไม่แตะ Node และปิด access log ไว้ CPU แทบไม่ขยับ จึงต้องเปลี่ยนไปยิง endpoint ที่ใช้ CPU จริง

**Blocked by:** 03, 04

**Status:** done 2026-09-27 (`321e55d`, `00a7022`, `3377d40`) — failover 2 รอบ (T+231s, T+166s), e2e ผ่านระหว่างเครื่องล่มจริง, scaling รอบ 1 ติด 50% (Node thread เดียว) แก้ด้วย cluster รอบ 2 CPU 99.8% scale 2->4; scale-in ไม่ได้ทดลอง

- [ ] Failover: terminate 1 เครื่อง → alarm เป็น `ALARM` → ASG สร้างเครื่องใหม่ → alarm กลับ `OK` บันทึก timestamp ทุกขั้นและ recovery time (วินาที)
- [ ] ระหว่าง failover match ที่เล่นอยู่ (2 browser) ไม่หลุด
- [ ] Scaling: stress test ทำให้ ASG มากกว่า 2 เครื่อง และมี scaling activity เป็นหลักฐาน ถ้า t3.micro ยังไม่ถึง 60% ให้บันทึกเป็นข้อจำกัดพร้อมตัวเลข CPU ที่วัดได้ ห้ามปรับ threshold เพื่อให้ผ่าน
- [ ] ผลทั้งหมดอยู่ในไฟล์ evidence ใต้ `docs/01_Reports/` พร้อมรายการภาพหน้าจอที่ต้องแคป (Target Group healthy, ASG activity, alarm history, CPU graph)

---

## 08: เอกสาร, ตารางค่าใช้จ่าย และข้อจำกัด

**What to build:** README และคู่มือ LearnerLab ตรงกับระบบจริง: ASG Min 2 / Max 4, `lab start` = 2 เครื่อง, แผนภาพเพิ่ม API Gateway WebSocket + Lambda, คำสั่ง `publish` ส่วนรายงาน Stage 3 มีตารางประมาณค่าใช้จ่ายต่อชั่วโมงและต่อเดือนแยกตามบริการเทียบงบ $50 และ section ข้อจำกัด (ไม่มี HTTPS, session 4 ชม., Lambda env plaintext, cold start, ผล scaling) ตามถ้อยคำ rubric

**Blocked by:** 07

**Status:** done 2026-09-27 (`3377d40`, `7e82c51`) — STAGE3_EXPERIMENT_RESULTS.md (ผล, ข้อจำกัด, ค่าใช้จ่าย, checklist ภาพ, อ้างอิง), README + คู่มือ LearnerLab ตรงระบบจริง; ราคาต้องตรวจกับ AWS Pricing ก่อนส่ง

- [ ] grep `Min 1`, `Max 3`, `Desired 1` ใน README และคู่มือแล้วไม่เจอ
- [ ] ตารางค่าใช้จ่ายระบุราคาต่อหน่วย, แหล่งอ้างอิงราคา (AWS pricing page พร้อมวันที่เข้าถึง) และชั่วโมงใช้งานที่สมมติ
- [ ] ตัวเลขทุกตัวในรายงานมาจากผลของ ticket 07 ไม่มีตัวเลขที่ไม่มีหลักฐาน
- [ ] ผ่านการตรวจ `humanizer` (ไม่มีคำโม้)
