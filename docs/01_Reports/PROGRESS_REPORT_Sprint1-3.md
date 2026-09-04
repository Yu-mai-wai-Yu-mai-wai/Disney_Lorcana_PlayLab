# รายงานความคืบหน้าโครงการ Disney Lorcana PlayLab Cloud (Sprint 1-3)
**วิชา:** Cloud Technology (KMITL)
**สถานะปัจจุบัน:** เสร็จสิ้น Sprint 1-3 (บรรลุ 100% พร้อมส่งมอบรายงานความก้าวหน้า Stage 2 วันที่ 10 ก.ย. และนำเสนอ 22–26 ก.ย.)
**วันที่อัปเดต:** 4 กันยายน 2026 (ปรับปรุงสถาปัตยกรรมสู่ Lean Multi-AZ IaaS & WebSockets v1.5.0)

## 1. สรุปความคืบหน้า Sprint 1-3

การพัฒนาระบบ Disney Lorcana PlayLab Cloud ดำเนินการเสร็จสิ้น Sprint 3 อย่างสมบูรณ์ โดยได้พัฒนาครบทั้ง Core Gameplay UI, ระบบ Authentication & Deck Management, ระบบ Real-time Multiplayer ด้วย WebSocket, และที่สำคัญคือได้ทำการ**ยกระดับสถาปัตยกรรมโครงสร้างพื้นฐาน (Infrastructure Evolution)** จากเดิมที่โฮสต์บน Amazon S3 สู่ระบบ **Lean Multi-AZ IaaS Stack (VPC + ALB + EC2 Auto Scaling Group + Multi-stage Docker)** ซึ่งผ่านการทดสอบจริงบน AWS Learner Lab และผ่านเกณฑ์การประเมิน Stage 2 เต็มรูปแบบ

### 1.1 ผลการดำเนินงานแต่ละ Sprint
* **Sprint 1 (Board UI & Card Pool):** พัฒนา Frontend อย่างสมบูรณ์ด้วย React 19, TypeScript 5.x, Tailwind CSS v4 มีไฟล์หลัก `LorcanaBoard.tsx` รองรับระบบ Drag-and-Drop, โซน Inkwell, Lore Counter (0-20), ระบบหมุนการ์ด Ready/Exert พร้อมชุดข้อมูลการ์ดอย่างเป็นทางการ 3,242 ใบ (`cardPool.ts`) โค้ดผ่านการทำ Type Checking (`tsc`) และ Build สำเร็จด้วย Vite 6
* **Sprint 2 (Auth+Deck Microservices):** พัฒนา Backend สำหรับจัดการผู้ใช้และเด็ค มีระบบ Login/Register ด้วยการเข้ารหัส Password แบบ `bcrypt` (Salt Rounds = 10) และออกสิทธิ์ด้วย `JWT Token` รวมทั้งระบบ CRUD เด็คการ์ดบน Amazon DynamoDB ที่บังคับใช้กฎทางการ (อย่างน้อย 60 ใบ, ไม่เกิน 2 สี, ห้ามใส่การ์ดชื่อซ้ำเกิน 4 ใบ)
* **Sprint 3 (WebSockets & IaaS Auto Scaling Stack):**
  * **Real-time Match Sync:** พัฒนาระบบห้องแข่งขัน 2 ผู้เล่นแบบเรียลไทม์ ซิงค์พิกัดและการกระทำข้ามหน้าจอภายในเวลาต่ำกว่า 100ms รองรับรหัสห้อง 6 หลัก พร้อมระบบ Rejoin Grace Period 60 วินาที และปุ่ม Exit Match คืนสล็อตห้องทันที
  * **IaaS Cloud Migration:** ออกแบบและปรับใช้ **Lean Multi-AZ VPC** (`10.0.0.0/16`) บน `us-east-1a` และ `us-east-1b` ไร้ต้นทุน NAT Gateway ($0.00 network cost)
  * **Application Load Balancer & ASG:** ติดตั้ง ALB ตรวจสอบสุขภาพเครื่องผ่าน Health Check (`GET /health`) และกำหนด Auto Scaling Group (Min 1, Max 3, Desired 1) สเกลเครื่องอัตโนมัติตาม CloudWatch CPU Utilization > 60%
  * **Docker Containerization:** จัดทำ Multi-stage Dockerfile บน Alpine Linux รัน Nginx Reverse Proxy คู่กับ Node.js 20 Backend Server โดยใช้ RAM รวมเพียง ~120MB–150MB ป้องกันปัญหา Memory ขาดแคลนบน `t3.micro`

### 1.2 ข้อจำกัดและการแก้ปัญหา (AWS Learner Lab Guardrails)
1. **ข้อจำกัด `iam:CreateRole`:** สภาพแวดล้อม Learner Lab ไม่อนุญาตให้สร้าง IAM Role ใหม่ เราแก้ปัญหาโดยการนำ `LabRole` และ `LabInstanceProfile` ที่มีอยู่แล้วมาแนบกับ EC2 ผ่าน Launch Template และดึงสิทธิ์ผ่าน Instance Metadata Service (IMDSv2)
2. **การควบคุมงบประมาณ $50 (Scale-to-Zero):** พัฒนาชุดสคริปต์ 1-Click ได้แก่ `lab_start.ps1` (เปิดเครื่อง Desired=1 เฉพาะตอนทำแล็บ/เดโม) และ `lab_stop.ps1` (ปรับ Desired=0 ยุบเครื่อง EC2 ทั้งหมดเมื่อเลิกใช้งาน ทำให้ค่าใช้จ่าย Compute กลายเป็น $0.00/ชม. ทันที)
3. **การตัดภาระต้นทุน NAT Gateway:** สถาปัตยกรรมทั่วไปต้องใช้ NAT Gateway (~$32.40/เดือน) ซึ่งจะผลาญงบ $50 ใน 1.5 เดือน เราจึงออกแบบ **Lean VPC** โดยวาง EC2 ใน Public Subnet แต่ใช้ **Chained Security Groups** บล็อกการเข้าถึงตรงจากอินเทอร์เน็ตทั้งหมด รับเฉพาะทราฟฟิกที่ส่งต่อมาจาก ALB SG เท่านั้น ทำให้ปลอดภัยเทียบเท่า Private Subnet ในต้นทุน $0.00

---

## 2. ตารางสถานะ Sprint เทียบกำหนดการส่งงาน

| ระยะเวลา/กำหนดการ | กิจกรรม / งานที่ต้องส่ง | สถานะ |
| :--- | :--- | :--- |
| **Sprint 1-3 (เสร็จสิ้นแล้ว)** | Board UI, Auth/Deck, WebSockets Sync, Lean VPC, ALB, ASG, Scale-to-Zero | **เสร็จสิ้น (100%)** |
| **10 ก.ย. 2026** | **ส่งรายงานความก้าวหน้า Stage 2 (12 คะแนน)** | 🔜 พร้อมส่งมอบ |
| **22-26 ก.ย. 2026** | **นำเสนอความก้าวหน้า Stage 2 (3 คะแนน)** | 🔜 พร้อมนำเสนอ (เตรียมสไลด์ Canva ครบ 14 สไลด์) |
| **Sprint 4-5 (ถึง 10 ต.ค.)** | Async Deck Analyzer (Amazon SQS), Distributed Tracing (AWS X-Ray) | กำลังดำเนินการ |
| **10 ต.ค. 2026** | **ส่งผลการทดลอง Stage 3 (10 คะแนน)** | ตามแผน |
| **20-25 ต.ค. 2026** | **นำเสนอ Stage 3 และส่งรายงานฉบับสมบูรณ์ (5 คะแนน)** | ตามแผน |

---

## 3. โครงสร้างระบบ Cloud AWS (Dual Infrastructure Architecture)

ปัจจุบันระบบทำงานบนสถาปัตยกรรมแบบไฮบริด (Primary IaaS Stack + Secondary Serverless Fallback):

### 3.1 Primary IaaS Mode (Production Stack สำหรับประเมิน Stage 2/3)
* **VPC & Networking:** Custom Lean VPC (`10.0.0.0/16`) แบ่ง 2 Public Subnets บน `us-east-1a` (`10.0.1.0/24`) และ `us-east-1b` (`10.0.2.0/24`) พร้อม Internet Gateway
* **Load Balancing:** Application Load Balancer (`lorcana-alb-687861613.us-east-1.elb.amazonaws.com`) ตรวจจับ Health Check ที่ Port 80 (`/health`) ทุก 15 วินาที
* **Compute & Scaling:** Auto Scaling Group (`lorcana-asg`, Min 1, Max 3, Desired 1) บน `t3.micro` (Amazon Linux 2023) ขับเคลื่อนด้วย Target Tracking Policy (CPU > 60%)
* **Container Layer:** Multi-stage Docker รัน Nginx Alpine (เสิร์ฟ React 19 SPA + Reverse Proxy) และ Node.js 20 Express & WebSocket Server (`backend/server.ts` Port 3001)
* **Database & Storage:** Amazon DynamoDB (On-demand mode สำหรับ Users, Decks, และ Room State)
* **Security Layer:** Chained Security Groups (`lorcana-alb-sg` -> `lorcana-ec2-sg`) ป้องกัน Direct External Access 100% พร้อม IMDSv2 Token Protection

### 3.2 Secondary Serverless Mode (Zero Maintenance Fallback)
* **Compute:** AWS Lambda ฟังก์ชันอิสระ (Login, Register, Deck CRUD, Room Handler)
* **API Routing:** HTTP API Gateway (5 REST Routes) + WebSocket API Gateway
* **Database:** Amazon DynamoDB 3 ตาราง

---

## 4. โครงสร้างเว็บและระบบเกม (Frontend & WebSockets v1.5.0)

* **Components หลัก:**
  * `LorcanaBoard.tsx`: จัดการ State การเล่นแบบ Local และเรนเดอร์บอร์ด Drag-and-Drop
  * `BoosterPackModal.tsx`: ระบบจำลองเปิดซองการ์ด 3D พร้อมแอนิเมชันฉีกฟอยล์และสุ่มการ์ด 12 ใบด้วย Fisher-Yates Shuffle
  * `Card3DInspectorModal.tsx`: ตรวจสอบการ์ดสามมิติ พร้อม Real-time Mouse Tilt Physics และเอฟเฟกต์สะท้อนแสงฟอยล์ตามระดับความหายาก
* **WebSockets Sync Flow:**
  * ผู้เล่นขยับการ์ด -> UI อัปเดตทันที (Optimistic Update 0ms) -> ส่ง Payload ผ่าน WebSocket ไปยังเซิร์ฟเวอร์
  * เซิร์ฟเวอร์ตรวจสอบความถูกต้องและ Relay ข้อมูลไปยังอีกฝั่งภายในเวลา < 100ms
  * **Rejoin & Exit Grace Protocol:** หากเน็ตหลุดจะเก็บ Session ไว้ 60 วินาทีให้ Rejoin แต่หากกดยอมแพ้ (Exit Match) จะส่ง `LEAVE_ROOM` ลบสล็อตห้องทันทีเพื่อคืนทรัพยากร

---

## 5. ผลการทดสอบและหลักฐานเชิงประจักษ์ (Empirical Evidence)

1. **Unit & Store Test Suite (Vitest 4.x):** ผ่าน 33 / 33 การทดสอบ (100%) ครอบคลุม Auth Store, Deck Store, กฎการ์ดไม่เกิน 4 ใบ, และ JWT Signing
2. **End-to-End Test Suite (Playwright):** ผ่าน 49 / 50 การทดสอบ (98%) บนเบราว์เซอร์ Chromium จำลองการเล่นจริง
3. **Stress Load Benchmark (`stress_test.ps1`):** ยิงจำลองโหลด 2,000 HTTP Requests แบบ Concurrent 20 บน ALB พบว่า Error Rate เป็น 0.00% และ CloudWatch Alarm ทริกเกอร์ให้ ASG สปอว์น EC2 เครื่องที่ 2 ขึ้นมาช่วยแบ่งเบาภาระงานได้จริง

