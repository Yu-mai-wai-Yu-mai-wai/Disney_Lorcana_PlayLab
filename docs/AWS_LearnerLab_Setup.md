# 🎓 AWS Academy Learner Lab — ขั้นตอนเตรียมการ (Sprint 2 & 3)

> คู่มือทีละขั้นสำหรับเตรียม AWS Learner Lab ให้รัน Lorcana PlayLab ได้ (Free Tier $0)
> ใช้กับ: Sprint 2 (Auth + Deck REST) และ Sprint 3 (WebSockets Room Sync)

---

## Step 1 — เปิด Learner Lab & เอา Credentials

1. เข้า **AWS Academy** (learn.aWsacademy.com) → คอร์ส Cloud 69 → **Learner Lab**
2. กด **Start Lab** (สีเขียว) → รอ ~2-3 นาทีให้ environment ขึ้น (เหลือเวลาประมาณ 4 ชม.)
3. กด **AWS Details** (ซ้ายบน) → **Show** → copy 3 ค่านี้ไว้:
   - `aws_access_key_id`
   - `aws_secret_access_key`
   - `aws_session_token`
4. เปิด **Terminal** (บนเครื่องเรา) → ตั้งค่า AWS CLI:
   ```bash
   aws configure set aws_access_key_id <AKIA...>
   aws configure set aws_secret_access_key <...>
   aws configure set aws_session_token <...>
   aws configure set region us-east-1
   aws configure set output json
   ```
   > ⚠️ Learner Lab ใช้ **session token** (หมดอายุ ~4 ชม. พร้อม lab) — ถ้า deploy นานเกิน lab ต้อง Start Lab ใหม่ + ตั้งค่าซ้ำ

## Step 2 — ติดตั้งเครื่องมือ (ครั้งเดียว)

```bash
# 1. AWS CLI (เช็คว่ามีแล้ว)
aws --version

# 2. SAM CLI (สำหรับ deploy template.yaml)
sam --version
# ถ้าไม่มี: ใช้วิธี pip install aws-sam-cli หรือติดตั้งจาก sam build ตาม OS

# 3. Node 20+ (มีแล้วจากโปรเจกต์)
node --version
```

## Step 3 — ตรวจสอบสิทธิ์ใน Learner Lab

```bash
aws sts get-caller-identity        # ควรเห็น AccountId + Arn
aws dynamodb list-tables           # ควรตอบ (อาจว่าง)
```
> ถ้า `AccessDenied` → กลับไป Step 1 ตั้งค่าใหม่ (token หมดอายุ)

## Step 4 — Deploy (Sprint 2: Auth + Deck)

```bash
cd D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD
npm install
# build backend
cd backend && npm install && npx tsc --outDir dist && cd ..
# deploy
sam build
sam deploy --guided   # ครั้งแรก: ตั้ง stack name, region us-east-1, confirm IAM = Y
```
> จำ **stack name** ไว้ (เช่น `lorcana-playlab`) — deploy ครั้งต่อไปใช้ `sam deploy --no-confirm-changeset`

## Step 5 — Deploy (Sprint 3: WebSockets) — อัตโนมัติ

```bash
cd scripts
bash deploy_ws.sh
```
> สคริปต์จะ build + deploy + เขียน `.env.production` ให้อัตโนมัติ

## Step 6 — ตรวจผล

```bash
# ดู endpoints
aws cloudformation describe-stacks --stack-name lorcana-playlab \
  --query "Stacks[0].Outputs" --output table

# ดู Lambda logs
sam logs --stack-name lorcana-playlab --tail
```

## Step 7 — ใช้กับ Frontend

1. Build frontend ด้วย `.env.production` (มี WS + API URL แล้ว)
   ```bash
   npm run build
   ```
2. Deploy หน้าเว็บ: upload `dist/` ขึ้น S3 + CloudFront (หรือ GitHub Pages — ฟรี)
3. เปิด 2 แท็บ → เข้า Playmat → Join ห้องเดียวกัน → ทดสอบซิงก์

---

## 🚨 ข้อควรระวัง

| เรื่อง | รายละเอียด |
|---|---|
| **Lab หมดอายุ** | ทุก ~4 ชม. ต้อง Start Lab ใหม่ + ตั้ง AWS CLI ใหม่ (session token) |
| **เรียนจบ lab ปิด** | **Resources จะถูกลบอัตโนมัติ** — อย่าใช้เก็บข้อมูลสำคัญ |
| **อย่าแตะ S3 รูปการ์ด** | ใช้ Hotlink จาก lorcana-api.com เท่านั้น (README ย้ำ) |
| **Free Tier ขีดจำกัด** | Lambda 1M req/เดือน, API GW WS 1M msg/เดือน, DynamoDB 25GB — โปรเจกต์เราไกลเกินไม่ถึง |
| **ประหยัด token** | ถ้า deploy บ่อย → ใช้ `sam deploy --no-confirm-changeset` |
