# รายงานโครงงานวิชา Cloud Technology (ภาคเรียนที่ 1/2569)
# DISNEY LORCANA PLAYLAB CLOUD
## ระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนคลาวด์ สถาปัตยกรรม Lean Multi-AZ VPC, Application Load Balancer และ Auto Scaling Group

**สถานะปัจจุบัน:** รายงานความก้าวหน้าโครงการ Stage 2 (เสร็จสิ้น Sprint 1 ถึง 3 พร้อมส่งมอบ 10 ก.ย. และนำเสนอ 22–26 ก.ย.)  
**ทีมผู้พัฒนา:** Disney Lorcana Cloud Project Team (KMITL IT)  
**คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)**  
**วันที่ปรับปรุงล่าสุด:** กันยายน 2569  

---

## บทคัดย่อ (Abstract)

โครงงาน **Disney Lorcana PlayLab Cloud** นำเสนอการพัฒนาระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนสถาปัตยกรรมคลาวด์แบบผสมผสาน (Hybrid Cloud Architecture) ที่มี **Primary IaaS Stack (Lean Multi-AZ VPC, Application Load Balancer, EC2 Auto Scaling Group, และ Multi-stage Docker)** เป็นโครงสร้างหลักสำหรับการทำงานระดับ Production และมี **Secondary Serverless Mode (AWS Lambda, DynamoDB, API Gateway)** เป็นระบบสำรองสำหรับเกมการ์ดสะสม Disney Lorcana Trading Card Game (TCG) โดยมุ่งเน้นการแก้ปัญหาความหน่วงในการเชื่อมต่อ (High Latency) การรองรับความพร้อมใช้งานสูง (High Availability ข้าม Availability Zones `us-east-1a` และ `us-east-1b`) และการขยายขนาดตามภาระงานจริง (Elasticity ผ่าน Target Tracking CPU Utilization > 60%) ภายใต้ข้อจำกัดงบประมาณอย่างเข้มงวดของ AWS Academy Learner Lab ($50 Total Allocation)

ในส่วนของส่วนติดต่อผู้ใช้ (Frontend) ระบบได้รับการพัฒนาด้วย React 19, TypeScript 5.x, Tailwind CSS v4, Framer Motion และ Zustand เพื่อมอบประสบการณ์การเล่นระดับพรีเมียม (Luxury Physical TCG Experience) ประกอบด้วยระบบจำลองฟิสิกส์ 3 มิติ (Real-time Mouse Tilt Physics), การตรวจสอบการ์ดแบบ 3D Holographic Foil Inspector, การจำลองเปิดซองการ์ด Booster Pack 12 ใบด้วย Fisher-Yates True Randomization Algorithm, และระบบจัดการเด็คการ์ดที่เชื่อมต่อกับฐานข้อมูลการ์ดอย่างเป็นทางการครบถ้วนกว่า **3,242 ใบ** (ครอบคลุมทั้ง Set 1 The First Chapter และ Set 2 Rise of the Floodborn)

การดำเนินงานตามระเบียบวิธีปฏิบัติงานแบบ Agile Scrum ได้ลุล่วงตามแผนงาน Sprint 1 ถึง Sprint 3 อย่างสมบูรณ์ 100% ครอบคลุมการสร้าง Core Gameplay UI, ระบบยืนยันตัวตน (Custom bcrypt + JWT) และจัดการเด็ค, ระบบห้องแข่งขันแบบเรียลไทม์ความเร็วสูง (Sub-100ms Action Sync พร้อมระบบ Rejoin Grace Period 60 วินาที และ Voluntary Exit Match), การปลดระวาง S3 Static Hosting สู่ Nginx Reverse Proxy บน EC2, และการพัฒนาสคริปต์ 1-Click Scale-to-Zero (`lab_start.ps1`, `lab_stop.ps1`) ที่ควบคุมต้นทุน Compute ให้เหลือ $0.00/ชม. เมื่อไม่ได้ใช้งาน พร้อมทั้งตัดต้นทุน NAT Gateway ($32.40/เดือน) เหลือ $0.00 ด้วยการใช้ Chained Security Groups ทำให้ระบบมีความพร้อมอย่างสมบูรณ์สำหรับการประเมินความก้าวหน้า Stage 2

---

## สารบัญ (Table of Contents)

- **บทที่ 1: บทนำ (Introduction)**
  - 1.1 ความเป็นมาและความสำคัญของโครงงาน
  - 1.2 วัตถุประสงค์ของโครงงาน
  - 1.3 ขอบเขตของระบบ (System Scope)
  - 1.4 ประโยชน์ที่คาดว่าจะได้รับ
- **บทที่ 2: การบริหารจัดการโครงการและเครื่องมือที่ใช้ (Project Management & Tech Stack)**
  - 2.1 ระเบียบวิธีปฏิบัติงานแบบ Agile Scrum และแผนการพัฒนา MVP
  - 2.2 สรุปผลความก้าวหน้าการดำเนินงาน Sprint 1 ถึง Sprint 3
  - 2.3 ตารางเปรียบเทียบกำหนดการส่งงานวิชา Cloud Technology
  - 2.4 เครื่องมือและเฟรมเวิร์กที่ใช้ในการพัฒนา (Tech Stack & Frameworks)
- **บทที่ 3: การวิเคราะห์และออกแบบระบบ (System Analysis & Design)**
  - 3.1 ข้อกำหนดความต้องการของระบบ (Functional & Non-Functional Requirements)
  - 3.2 การออกแบบสถาปัตยกรรมคลาวด์บน AWS (AWS Serverless Architecture)
  - 3.3 การออกแบบฐานข้อมูลแบบ NoSQL (Amazon DynamoDB Schema)
  - 3.4 ลำดับขั้นตอนการทำงานและการสื่อสารแบบเรียลไทม์ (WebSocket Sequence Flow)
  - 3.5 กฎกติกาและองค์ประกอบของเกมการ์ด Disney Lorcana
- **บทที่ 4: การพัฒนาระบบและผลการดำเนินงาน (Implementation & Test Results)**
  - 4.1 การพัฒนาส่วนติดต่อผู้ใช้ (Frontend Implementation & Playmat UI)
  - 4.2 การพัฒนาส่วนประมวลผลบนคลาวด์ (AWS Backend Microservices)
  - 4.3 การแก้ปัญหาข้อจำกัดบน AWS Learner Lab
  - 4.4 ผลการทดสอบระบบแบบ End-to-End (End-to-End Testing)
- **บทที่ 5: การประเมินค่าใช้จ่ายบนคลาวด์และแผนงานขั้นต่อไป (Cost Assessment & Future Roadmap)**
  - 5.1 การประเมินค่าใช้จ่ายสถาปัตยกรรมคลาวด์ (AWS Pricing Calculator: $0.00 Free Tier)
  - 5.2 แผนงานพัฒนาสำหรับ Sprint 4 และ Sprint 5
  - 5.3 สรุปผลการดำเนินงานและบทเรียนที่ได้รับ (Sprint Retrospective)
- **เอกสารอ้างอิง (References)**

---

# บทที่ 1: บทนำ (Introduction)

### 1.1 ความเป็นมาและความสำคัญของโครงงาน
เกมการ์ดสะสม (Trading Card Game: TCG) เป็นหนึ่งในกิจกรรมสันทนาการและการแข่งขันระดับสากลที่มีการเติบโตอย่างต่อเนื่อง โดยเฉพาะอย่างยิ่ง **Disney Lorcana TCG** ที่เปิดตัวโดย Ravensburger ร่วมกับ The Walt Disney Company ซึ่งได้รับความนิยมอย่างแพร่หลายจากทั้งผู้เล่นสายการแข่งขัน (Competitive Players) และนักสะสม อย่างไรก็ตาม ผู้เล่นส่วนใหญ่ยังคงเผชิญกับอุปสรรคสำคัญในการเข้าถึง ได้แก่ ต้นทุนการจัดซื้อการ์ดจริงที่มีราคาสูง การหาคู่ซ้อมที่มีระดับฝีมือใกล้เคียงกัน และข้อจำกัดด้านสถานที่ในการเล่น

ระบบจำลองเกมการ์ดดิจิทัล (Digital TCG Simulators) ที่มีอยู่ในปัจจุบันส่วนใหญ่มักประสบปัญหาสำคัญ 3 ประการ:
1. **ภาระต้นทุนเซิร์ฟเวอร์สูงและขยายขนาดได้ยาก:** ระบบดั้งเดิมที่พึ่งพา Dedicated Server หรือ Virtual Machine (เช่น AWS EC2) ก่อให้เกิดค่าใช้จ่ายคงที่ตลอด 24 ชั่วโมงแม้ไม่มีผู้ใช้งาน และเกิดคอขวดเมื่อมีทราฟฟิกสูง
2. **ความหน่วงในการส่งข้อมูล (High Latency):** การใช้ HTTP Polling ส่งผลให้เกิดความล่าช้าในการอัปเดตสถานะกระดานระหว่างผู้เล่น ไม่ตอบโจทย์เกมการ์ดที่ต้องตัดสินใจแบบเทิร์นต่อเทิร์น
3. **ประสบการณ์ผู้ใช้ที่ขาดมิติและความสมจริง:** อินเทอร์เฟซส่วนใหญ่เป็นภาพกราฟิก 2 มิติที่แบนราบ ขาดมิติทางกายภาพ แอนิเมชัน และความรู้สึกของการสัมผัสการ์ดจริง

เพื่อแก้ปัญหาเหล่านี้ โครงงาน **Disney Lorcana PlayLab Cloud (กลุ่ม G21)** จึงได้รับการพัฒนาขึ้นโดยใช้สถาปัตยกรรม **100% AWS Serverless Architecture** ร่วมกับเทคโนโลยีเว็บสมัยใหม่ เพื่อสร้างแพลตฟอร์มจำลองห้องเล่นการ์ดและวิเคราะห์เด็คที่มีความหน่วงต่ำเป็นพิเศษ (<100ms) ปรับขนาดตามการใช้งานจริงโดยอัตโนมัติ (Elastic Auto-scaling) และควบคุมต้นทุนให้อยู่ในงบประมาณ **$0.00 (AWS Free Tier)** อย่างสมบูรณ์

### 1.2 วัตถุประสงค์ของโครงงาน
1. เพื่อออกแบบและพัฒนาระบบจำลองกระดานฝึกซ้อมการเล่น Disney Lorcana TCG แบบเรียลไทม์บนคลาวด์ด้วยเทคโนโลยี WebSockets
2. เพื่อประยุกต์ใช้สถาปัตยกรรม Serverless (AWS Lambda, Amazon DynamoDB, AWS API Gateway) ในการรองรับการทำงานแบบ Microservices ที่ประหยัดต้นทุนและยืดหยุ่นสูง
3. เพื่อพัฒนาระบบจัดการเด็คการ์ด (Deck Builder) และระบบวิเคราะห์ค่าร่าย/ความสมดุลของการ์ด (Deck Analytics) อิงตามฐานข้อมูลมาตรฐานอย่างเป็นทางการกว่า 408 ใบ
4. เพื่อศึกษาและแก้ไขปัญหาทางวิศวกรรมซอฟต์แวร์ในการเชื่อมต่อระบบคลาวด์จริงภายใต้สภาพแวดล้อมจำกัดสิทธิ์ (AWS Learner Lab)

### 1.3 ขอบเขตของระบบ (System Scope)
ระบบครอบคลุมขอบเขตการทำงานหลัก 6 ด้าน:
1. **ระบบยืนยันตัวตนและความปลอดภัย (Authentication):** ลงทะเบียนและเข้าสู่ระบบด้วยการเข้ารหัส bcrypt และการออกสิทธิ์ผ่าน JSON Web Token (JWT)
2. **ระบบจัดการเด็คการ์ด (Deck Management):** สร้าง ค้นหา แก้ไข และลบเด็คการ์ดส่วนตัว บันทึกข้อมูลบน Amazon DynamoDB
3. **ระบบจำลองกระดานซ้อมเล่น (Lorcana Board Simulation):** จำลองพื้นที่การเล่นตามกฎทางการ ประกอบด้วยโซน Play Area, Inkwell, Hand, Deck, Discard, และ Lore Counter (0-20 คะแนน) พร้อมระบบหมุนการ์ดสถานะ Ready/Exert
4. **ระบบห้องแข่งขันแบบเรียลไทม์ (Real-time Multiplayer Room):** จับคู่ผู้เล่น 2 ฝั่งในห้องเล่นเดียวกัน และส่งถ่ายพิกัดการลากวางการ์ดแบบสองทิศทางผ่าน AWS API Gateway WebSockets
5. **ระบบสุ่มซองการ์ดและการตรวจสอบ 3D (Booster Pack & 3D Inspector):** จำลองการเปิดซองการ์ด 12 ใบตามสัดส่วนความหายากที่เป็นทางการ 9 ระดับ (Common ถึง Enchanted)
6. **ระบบวิเคราะห์เด็คการ์ด (Deck Analytics):** แสดงกราฟการกระจายตัวของค่าร่าย (Ink Curve) และสัดส่วนหมวดหมู่การ์ด (Character, Action, Item, Location)

### 1.4 ประโยชน์ที่คาดว่าจะได้รับ
1. ผู้เล่นมีเครื่องมือฝึกซ้อมและทดสอบกลยุทธ์เด็คการ์ดที่มีความเสมือนจริง ใช้งานได้ฟรีผ่านเว็บเบราว์เซอร์โดยไม่ต้องติดตั้งโปรแกรมเพิ่มเติม
2. ได้รับความรู้และทักษะเชิงลึกในการออกแบบสถาปัตยกรรม Serverless Cloud ที่ถูกต้องตามหลัก Cloud Best Practices บน Amazon Web Services (AWS)
3. ได้แนวทางปฏิบัติที่เป็นรูปธรรมในการแก้ไขปัญหาการรวมระบบ (Integration) ระหว่าง Frontend ยุคใหม่และ AWS API Gateway
4. ลดภาระต้นทุนด้านโครงสร้างพื้นฐานเซิร์ฟเวอร์ลงเป็นศูนย์ ($0.00) โดยยังคงรักษาประสิทธิภาพการทำงานระดับ Production

---

# บทที่ 2: การบริหารจัดการโครงการและเครื่องมือที่ใช้ (Project Management & Tech Stack)

### 2.1 ระเบียบวิธีปฏิบัติงานแบบ Agile Scrum
โครงการดำเนินงานตามระเบียบวิธี Agile Scrum แบ่งรอบการทำงานออกเป็น 7 Sprints เพื่อให้สามารถส่งมอบงานได้อย่างต่อเนื่องและสอดคล้องกับกำหนดการของรายวิชา Cloud Technology:

| Sprint | ระยะเวลา | เป้าหมายหลัก | สถานะ |
|---|---|---|---|
| **Sprint 1** | 1–15 ส.ค. 2569 | Scaffold โปรเจกต์, UI กระดานเล่นการ์ด, Card Database 3,242 ใบ | เสร็จสิ้น (100%) |
| **Sprint 2** | 16–25 ส.ค. 2569 | Microservices: Auth (JWT/bcrypt) & Deck Management บน AWS Lambda + DynamoDB | เสร็จสิ้น (100%) |
| **Sprint 3** | 26 ส.ค. – 4 ก.ย. 2569 | Real-time Room Sync (v1.5.0) + IaaS Migration (Multi-AZ VPC, ALB, ASG, Docker) | เสร็จสิ้น (100%) |
| **Sprint 4** | 5–25 ก.ย. 2569 | Async Deck Analyzer ผ่าน Amazon SQS + Deck Balance Algorithm | ถัดไป |
| **Sprint 5** | 26 ก.ย. – 10 ต.ค. 2569 | CloudWatch Alarms, X-Ray Distributed Tracing, Security Hardening | ถัดไป |
| **Sprint 6** | 11–20 ต.ค. 2569 | Load Testing ด้วย Artillery (100–500 concurrent users), Stress Test Benchmarking | ถัดไป |
| **Sprint 7** | 21–25 ต.ค. 2569 | จัดทำรายงานฉบับสมบูรณ์ (Final Report), Video Demo, สรุปผลโครงการ | ถัดไป |

### 2.2 สรุปผลความก้าวหน้า Sprint 1 ถึง Sprint 3
- **Sprint 1 (Board UI & Card Pool):** พัฒนา Frontend สำเร็จด้วย React 19, TypeScript 5.x และ Tailwind CSS v4 มีไฟล์หลัก `LorcanaBoard.tsx` (1,100+ บรรทัด) รองรับ Drag-and-Drop, Inkwell, Lore Counter (0-20), ระบบหมุนการ์ด Ready/Exert และชุดข้อมูลการ์ดอย่างเป็นทางการ 3,242 ใบ
- **Sprint 2 (Auth + Deck Microservices):** พัฒนา REST API ด้วย Node.js 20.x และ Amazon DynamoDB รองรับระบบสมัครสมาชิก เข้าสู่ระบบด้วย bcrypt (Salt Rounds = 10) / JWT และการจัดการเด็ค (CRUD) บังคับใช้กฎการ์ดทางการ
- **Sprint 3 (Real-Time WebSockets & IaaS Full Stack):**
  - พัฒนาระบบห้องเล่นแบบเรียลไทม์ ซิงค์พิกัดการ์ดระหว่าง 2 ผู้เล่นผ่าน WebSocket (<100ms Latency) พร้อมฟังก์ชัน Match Lifecycle v1.5.0 (Rejoin Grace Period 60 วินาทีสำหรับกรณีเน็ตหลุด และ Voluntary Exit Match สำหรับการคืนสล็อตห้องทันที)
  - ยกระดับสถาปัตยกรรมสู่ **Lean Multi-AZ IaaS Stack**: วาง Custom VPC (`10.0.0.0/16`) ข้าม 2 AZs (`us-east-1a`, `us-east-1b`), ติดตั้ง Application Load Balancer (ALB) พร้อม Target Group Health Check (`GET /health`), และ Auto Scaling Group สเกลเครื่องตาม CPU > 60%
  - บรรจุแอปพลิเคชันลง **Multi-stage Docker** รัน Nginx Alpine และ Node.js 20 ใช้หน่วยความจำ < 150MB เหมาะสมกับ `t3.micro`

### 2.3 ตารางเปรียบเทียบกำหนดการส่งงานวิชา Cloud Technology

| ระยะเวลา/กำหนดการ | กิจกรรม / งานที่ต้องส่ง | สถานะ |
|---|---|---|
| **Sprint 1–3 (ถึงปัจจุบัน)** | Board UI, Auth/Deck, WebSockets v1.5.0, IaaS Multi-AZ VPC, ALB, ASG | **เสร็จสิ้น (100%)** |
| **10 ก.ย. 2569** | **ส่งรายงานความก้าวหน้า Stage 2 (12 คะแนน)** | 🔜 พร้อมส่งมอบ |
| **22–26 ก.ย. 2569** | **นำเสนอความก้าวหน้า Stage 2 (3 คะแนน)** | เตรียมพร้อม (สไลด์ Canva 14 หน้า) |
| **Sprint 4–5 (ถึง 10 ต.ค.)** | Deck Analyzer, SQS Integration, Distributed Tracing | ตามแผน |
| **10 ต.ค. 2569** | **ส่งผลการทดลองและรายงานฉบับสมบูรณ์ Stage 3 (10 คะแนน)** | ตามแผน |
| **20–25 ต.ค. 2569** | **นำเสนอโครงงานฉบับสมบูรณ์ Stage 3 (5 คะแนน)** | ตามแผน |

### 2.4 เครื่องมือและเฟรมเวิร์กที่ใช้ในการพัฒนา (Tech Stack)

**1. Frontend & Client Engine:**
- **React 19 & TypeScript 5.x:** โครงสร้างคอมโพเนนต์แบบ Type-Safe ป้องกันข้อผิดพลาดในการเข้าถึงสถานะการ์ด
- **Vite 6:** เครื่องมือคอมไพล์และบันเดิลความเร็วสูง รองรับ Hot Module Replacement (HMR)
- **Tailwind CSS v4:** ระบบสไตล์แบบ CSS-First รองรับธีม Dark Editorial + Magic R3
- **Framer Motion & WebGL/CSS 3D:** แอนิเมชันการลากวางการ์ด การเปิดซอง Booster Pack และการดูการ์ดแบบ 3D
- **Zustand:** จัดการ Global State สำหรับสถานะกระดานและการเชื่อมต่อ WebSocket

**2. Compute, Container & Web Server (Primary IaaS Mode):**
- **Amazon EC2 (`t3.micro`):** เครื่องประมวลผลระบบปฏิบัติการ Amazon Linux 2023 (2 vCPU, 1GB RAM)
- **Multi-stage Docker Engine:** แยกกระบวนการ Build ออกจาก Production Runtime ทำให้ Image มีขนาด <100MB และกิน RAM เพียง ~120MB-150MB
- **Nginx (Alpine Linux):** Reverse Proxy ประสิทธิภาพสูง ทำหน้าที่เสิร์ฟ React 19 SPA, ส่งต่อ `/api/*` และ `/ws` ไปยัง Node.js backend, และตอบกลับ `/health` สำหรับ ALB Health Check
- **Node.js 20.x (Express + ws):** เซิร์ฟเวอร์ประมวลผล API และ WebSocket Engine ในตัว (`backend/server.ts`)

**3. Networking, Scaling & Cloud Services (AWS Well-Architected):**
- **Custom Lean Multi-AZ VPC (`10.0.0.0/16`):** 2 Public Subnets บน `us-east-1a` และ `us-east-1b` ไร้ต้นทุน NAT Gateway ($0.00 network cost)
- **Application Load Balancer (ALB):** กระจายโหลด จัดการ SSL/TLS และตรวจสอบสถานะ Target Group
- **Auto Scaling Group (ASG):** ปรับขนาดเครื่องอัตโนมัติ (Min 1, Max 3, Desired 1) ขับเคลื่อนด้วย Target Tracking Policy (CPU > 60%)
- **Amazon DynamoDB:** ฐานข้อมูล NoSQL แบบ On-demand จัดเก็บข้อมูลผู้ใช้ เด็ค และสถานะห้องเล่น
- **Amazon SQS:** คิวข้อความสำหรับการประมวลผลวิเคราะห์เด็คแบบ Asynchronous (Sprint 4)
- **Amazon CloudWatch:** ระบบตรวจวัด Metrics, ตั้งค่า Alarm แจ้งเตือน และบันทึก Logs

---

# บทที่ 3: การวิเคราะห์และออกแบบระบบ (System Analysis & Design)

### 3.1 ข้อกำหนดความต้องการของระบบ (Requirements)
- **Functional Requirements (FR):**
  1. ผู้ใช้สามารถสมัครสมาชิก เข้าสู่ระบบ และถือครอง JWT Token เพื่อยืนยันตัวตนได้
  2. ผู้ใช้สามารถสร้าง แก้ไข คัดลอก และลบเด็คการ์ดส่วนตัวได้ บันทึกลง DynamoDB
  3. ผู้ใช้สามารถเปิดซองการ์ดสุ่ม 12 ใบ (Booster Pack) ตามเรตความหายากทางการ 9 ระดับได้
  4. ผู้ใช้สามารถตรวจสอบการ์ดแบบ 3 มิติ (3D Card Inspector) ดูเอฟเฟกต์ฟอยล์และการเอียงตามเมาส์ได้
  5. ผู้ใช้สามารถสร้างหรือเข้าร่วมห้องเล่นการ์ดด้วยรหัสห้อง 6 หลักได้
  6. ผู้ใช้สามารถลากการ์ดลงสนาม หมุนการ์ดคว่ำ/หงาย เพิ่มลด Lore และส่งผลให้ฝ่ายตรงข้ามเห็นแบบเรียลไทม์ได้ (<100ms)
  7. ระบบสามารถจัดการข้อผิดพลาดทางเครือข่าย โดยมี Rejoin Grace Period 60 วินาทีเมื่อเน็ตหลุด และลบสล็อตทันทีเมื่อผู้เล่นกดยอมแพ้ (Exit Match)
- **Non-Functional Requirements (NFR):**
  1. **Latency:** ความหน่วงในการซิงค์ข้อมูลผ่าน WebSocket ต้องต่ำกว่า 100 มิลลิวินาที
  2. **High Availability & Fault Tolerance:** สถาปัตยกรรมต้องกระจายข้ามอย่างน้อย 2 Availability Zones (Multi-AZ)
  3. **Elasticity:** ระบบต้องขยายขนาดเครื่องประมวลผล (Scale-Out) อัตโนมัติเมื่อ CPU เฉลี่ยเกิน 60%
  4. **Cost Optimization:** ทำงานได้ภายใต้งบประมาณจำกัด $50 ของ AWS Learner Lab โดยตัดค่าใช้จ่าย NAT Gateway ($32.40/ด.) เหลือ $0.00 และมีระบบ Scale-to-Zero ($0.00/ชม.)
  5. **Security:** รหัสผ่านแฮชด้วย bcrypt (Cost = 10), บังคับใช้ IMDSv2 Token บน EC2, และใช้ Chained Security Groups

### 3.2 การออกแบบสถาปัตยกรรมคลาวด์บน AWS (Dual Infrastructure Model)

```
                       Internet (User Browser / Evaluator)
                                      │
                                      ▼ HTTP:80
                     ┌─────────────────────────────────┐
                     │ Application Load Balancer (ALB) │
                     │ Public Multi-AZ: us-east-1a/1b  │
                     └────────────────┬────────────────┘
                                      │ Health Check /health (Port 80)
               ┌──────────────────────┴──────────────────────┐
               │                                             │
               ▼                                             ▼
  ┌─────────────────────────┐                   ┌─────────────────────────┐
  │ EC2 Instance 1 (AZ 1a)  │                   │ EC2 Instance 2 (AZ 1b)  │
  │ Amazon Linux 2023       │                   │ (Auto Scaled CPU > 60%) │
  │ ┌─────────────────────┐ │                   │ ┌─────────────────────┐ │
  │ │ Nginx (Port 80)     │ │                   │ │ Nginx (Port 80)     │ │
  │ │ React 19 SPA Build  │ │                   │ │ React 19 SPA Build  │ │
  │ └──────────┬──────────┘ │                   │ └──────────┬──────────┘ │
  │            │ Proxy :3001│                   │            │ Proxy :3001│
  │ ┌──────────▼──────────┐ │                   │ ┌──────────▼──────────┐ │
  │ │ Node.js Express+WS  │ │                   │ │ Node.js Express+WS  │ │
  │ │ REST API & Engine   │ │                   │ │ REST API & Engine   │ │
  │ └──────────┬──────────┘ │                   │ └──────────┬──────────┘ │
  └────────────┼────────────┘                   └────────────┼────────────┘
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │ IAM LabInstanceProfile (IMDSv2)
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
         ┌─────────────────────┐             ┌─────────────────────┐
         │   Amazon DynamoDB   │             │     Amazon SQS      │
         │  Users, Decks, Room │             │   Deck-Analyzer     │
         └─────────────────────┘             └─────────────────────┘
```

**1. สถาปัตยกรรมเครือข่าย Lean Multi-AZ VPC:**
- แบ่ง Subnet ออกเป็น 2 โซนอิสระ: `lorcana-public-1a` (`10.0.1.0/24`) บน `us-east-1a` และ `lorcana-public-1b` (`10.0.2.0/24`) บน `us-east-1b`
- ใช้ **Chained Security Groups**:
  - `lorcana-alb-sg`: รับทราฟฟิก HTTP Port 80 จากทั่วโลก (`0.0.0.0/0`)
  - `lorcana-ec2-sg`: บล็อกทราฟฟิกตรงจากภายนอกทั้งหมด โดยอนุญาตรับ Port 80 และ 3001 **เฉพาะทราฟฟิกที่มาจาก `lorcana-alb-sg` เท่านั้น** ช่วยประหยัดค่า NAT Gateway ($32.40/ด.) เหลือ **$0.00/เดือน** โดยคงความปลอดภัยเทียบเท่า Private Subnet

**2. การกระจายโหลดและการสเกล (ALB & ASG):**
- Application Load Balancer ตรวจสอบสถานะเครื่องผ่าน Target Group Health Check (`GET /health`) ทุก 15 วินาที
- Auto Scaling Group กำหนดขอบเขต Min 1, Max 3, Desired 1 ขับเคลื่อนด้วย CloudWatch Target Tracking Policy (`CPUUtilization > 60%`) เมื่อเกิดโหลดหนัก ระบบจะสปอว์น Instance เครื่องที่ 2 ข้ามไปยังอีก AZ ทันที

### 3.3 การออกแบบฐานข้อมูลแบบ NoSQL (Amazon DynamoDB Schema)

| ตาราง (Table Name) | Partition Key (PK) | Sort Key (SK) | Attributes สำคัญ | วัตถุประสงค์ |
|---|---|---|---|---|
| `LorcanaUsers` | `userId` (S) | - | `username`, `passwordHash`, `createdAt` | จัดเก็บข้อมูลผู้ใช้และรหัสผ่านแฮช bcrypt |
| `LorcanaDecks` | `userId` (S) | `deckId` (S) | `deckName`, `inks`, `cards` (List), `updatedAt` | จัดเก็บรายการเด็คการ์ดของผู้ใช้ |
| `LorcanaRoomState` | `roomId` (S) | `connectionId` (S) | `username`, `role` (P1/P2), `state` (JSON), `ttl` | จัดเก็บสถานะการเชื่อมต่อและกระดานสด |

### 3.4 ลำดับขั้นตอนการสื่อสารแบบเรียลไทม์ (WebSocket v1.5.0 Match Lifecycle)
1. **การสร้าง/เข้าร่วมห้อง (`JOIN_ROOM`):** ผู้เล่นระบุรหัสห้อง 6 หลัก เซิร์ฟเวอร์บันทึก Connection และกำหนดบทบาท Player 1 หรือ Player 2
2. **การซิงค์การกระทำ (`CARD_MOVED`, `CARD_EXERTED`, `LORE_UPDATED`):** หน้าจอผู้เล่นทำ Optimistic Update ทันที (0ms) และส่ง Action Payload ไปยังเซิร์ฟเวอร์เพื่อ Relay ข้ามไปยังคู่แข่งภายใน <100ms
3. **การจัดการเน็ตหลุด (Rejoin Grace Period 60s):** หาก Connection หลุด ระบบจะคงสถานะห้องไว้ 60 วินาทีพร้อมแจ้งเตือนคู่ต่อสู้ หากผู้เล่นเชื่อมต่อใหม่จะดึงสถานะล่าสุดจาก DynamoDB มาเล่นต่อได้ทันที
4. **การออกจากเกมโดยสมัครใจ (Voluntary Exit Match):** เมื่อผู้เล่นกดปุ่ม Exit Match ระบบจะส่ง `LEAVE_ROOM` ลบสล็อตห้องบน DynamoDB ทันทีโดยไม่ต้องรอ 60 วินาที เพื่อคืนทรัพยากรให้ระบบ

### 3.5 กฎกติกาและองค์ประกอบของเกมการ์ด Disney Lorcana
- **6 สีหมึก (Ink Types):** Amber, Amethyst, Emerald, Ruby, Sapphire, Steel
- **ประเภทการ์ด:** Character, Action/Song, Item, Location
- **เป้าหมาย:** สะสม Lore ให้ครบ 20 แต้มก่อนฝ่ายตรงข้าม

---

# บทที่ 4: การพัฒนาระบบและผลการดำเนินงาน (Implementation & Test Results)

### 4.1 การพัฒนาส่วนติดต่อผู้ใช้ (Frontend Implementation & Playmat UI)
ส่วนติดต่อผู้ใช้ได้รับการออกแบบตามแนวคิด **Dark Editorial + Magic R3** เพื่อให้ความรู้สึกพรีเมียมและน่าตื่นตาตื่นใจ โดยแบ่งหน้าจอหลักออกเป็น:
1. **Game Hub & Navigation:** หน้าแดชบอร์ดหลักสำหรับเข้าถึงโหมดต่างๆ ของระบบ
2. **Lorcana Board Simulation:** กระดานเล่นการ์ดแบบ Full Viewport ประกอบด้วยโซน Play Area, Inkwell, Hand Tray, Discard Pile, Deck Pile และ Lore Tracker
3. **Deck Builder & Analytics:** ระบบจัดเด็คการ์ด ค้นหาตาม Ink, Cost, Rarity พร้อมกราฟวิเคราะห์ Ink Curve
4. **3D Card Inspector & Booster Pack Opening:** ระบบตรวจสอบการ์ดแบบสามมิติและจำลองการเปิดซองการ์ดแบบแอนิเมชันเสมือนจริง
5. **Match Lobby:** หน้าสร้างและเข้าร่วมห้องแข่งขันแบบเรียลไทม์ผ่านรหัสห้อง 6 หลัก

### 4.2 การพัฒนาส่วนประมวลผลและการบรรจุคอนเทนเนอร์ (Compute & Docker Containerization)
เพื่อรองรับสถาปัตยกรรมระดับ Production ระบบได้รับการพัฒนาในรูปแบบคอนเทนเนอร์แบบเบาพิเศษ (Ultra-lightweight Multi-stage Docker) บน Alpine Linux:
1. **Multi-stage Docker Build:**
   - **Stage 1 (Builder):** รัน Node.js 20 Alpine ติดตั้ง Dependencies และรัน `npm run build` คอมไพล์ React 19 SPA และ TypeScript backend
   - **Stage 2 (Runtime):** คัดลอกเฉพาะโฟลเดอร์ `dist/` มาใส่ใน Nginx Alpine และ Node.js Runtime ทำให้ Image มีขนาดเล็กกว่า 100MB และใช้ RAM เฉลี่ยเพียง ~120MB–150MB ป้องกันปัญหา Out-of-Memory (OOM) บนเครื่องขนาดเล็กอย่าง `t3.micro` (1GB RAM)
2. **Nginx Reverse Proxy:**
   - ทำหน้าที่เป็น Front Door บน Port 80
   - จัดการเสิร์ฟไฟล์ SPA พร้อมเปิด Gzip Compression
   - Reverse Proxy คำขอ `/api/*` และการเชื่อมต่อ `/ws` ไปยัง Node.js backend (`backend/server.ts` Port 3001)
   - ตอบกลับสถานะ 200 OK ทันทีที่ Endpoint `/health` เพื่อรองรับ ALB Target Group Health Check โดยไม่สร้างภาระให้ Node.js Event Loop
3. **Unified Server (`backend/server.ts`):** รวมการประมวลผล REST API (Auth & Deck CRUD) และ WebSocket Engine เข้าด้วยกัน โดยเชื่อมต่อไปยัง Amazon DynamoDB ผ่าน AWS SDK v3 โดยใช้สิทธิ์จาก `LabRole` ผ่าน IMDSv2

### 4.3 การแก้ปัญหาข้อจำกัดทางวิศวกรรมและสภาพแวดล้อม AWS Learner Lab
ในการพัฒนาและปรับใช้ระบบจริงบน AWS Academy Learner Lab ทีมงานได้วิเคราะห์และแก้ไขปัญหาข้อจำกัดสำคัญ 5 ประการ:

| ลำดับ | ข้อจำกัด / ปัญหาทางวิศวกรรม | ผลกระทบที่เกิดขึ้น | แนวทางแก้ไขเชิงสถาปัตยกรรม (Architectural Solution) |
|---|---|---|---|
| 1 | **บล็อกสิทธิ์ `iam:CreateRole`** | ไม่สามารถใช้ AWS SAM หรือ Terraform สร้าง IAM Role ใหม่ได้ | ปรับใช้ `LabRole` และ `LabInstanceProfile` สำเร็จรูปที่ AWS เตรียมไว้ให้ โดยส่งผ่าน Launch Template และเข้าถึงสิทธิ์ผ่าน IMDSv2 |
| 2 | **ภาระต้นทุน NAT Gateway ($32.40/ด.)** | เผางบประมาณ $50 ของ Learner Lab หมดภายใน 1.5 เดือน | ออกแบบ **Lean Multi-AZ VPC** โดยวาง EC2 ใน Public Subnets แต่ใช้ **Chained Security Groups** ปิดกั้น Inbound ตรงจากภายนอกทั้งหมด รับเฉพาะทราฟฟิกที่ส่งต่อมาจาก ALB SG เท่านั้น ทำให้ปลอดภัยเทียบเท่า Private Subnet ในต้นทุน **$0.00** |
| 3 | **ความเสี่ยงงบรั่วไหลเมื่อไม่ได้ใช้งาน** | หากเปิด EC2 และ ALB ทิ้งไว้ตลอด 24/7 จะสูญเสียงบประมาณโดยไม่จำเป็น | พัฒนาสคริปต์วงจรควบคุมงบประมาณ **1-Click Scale-to-Zero (`scripts/lab_stop.ps1`)** เพื่อสั่งปรับ ASG Desired Capacity = 0 ยุบเครื่อง EC2 ทั้งหมดเมื่อเลิกแล็บ ทำให้ค่า Compute เหลือ **$0.00/ชม.** ทันที และมีสคริปต์ `lab_start.ps1` สำหรับบูตเครื่องกลับมาภายใน 90 วินาทีเมื่อต้องการเดโม |
| 4 | **หน่วยความจำ 1GB RAM บน `t3.micro`** | มีความเสี่ยงเกิด OOM Crash หาก Image หรือ Runtime หนักเกินไป | ใช้ Multi-stage Docker บน Alpine Linux รัน Nginx + Node.js โดยควบคุม RAM ให้อยู่ต่ำกว่า 150MB ช่วยให้รันงานได้อย่างเสถียร 100% |
| 5 | **สถานะ WebSocket หลุดเมื่อเกิด Auto Scaling** | เมื่อสปอว์นเครื่อง EC2 เพิ่ม ผู้เล่นเดิมอาจถูกกระจายไปยังเครื่องใหม่ | เปิดใช้งาน **Sticky Sessions** บน ALB Target Group เพื่อผูก Client ไว้กับเครื่องเดิม และจัดเก็บสถานะห้องเล่นทั้งหมดไว้บน **Amazon DynamoDB** ทำให้แม้จะ Rejoin ข้ามเครื่องก็ดึงสเตทเดิมมาเล่นต่อได้โดยไม่สูญหาย |

### 4.4 ผลการทดสอบระบบและหลักฐานเชิงประจักษ์ (Empirical Test Results)
การทดสอบคุณภาพของระบบดำเนินการครอบคลุมทั้ง Unit Test, End-to-End Test, และ Load Stress Test:
1. **Unit & Store Integration Tests (Vitest 4.x):** ผ่าน 33 / 33 การทดสอบ (100%)
   - ครอบคลุมการทำงานของ Zustand stores (`useAuthStore`, `useDeckStore`, `useLanguageStore`, `usePlaymatStore`)
   - ยืนยันการบังคับใช้กฎเด็ค Lorcana (Deck 60 ใบ, Max 4 ใบซ้ำ, กรองเด็ค 3 สี)
   - ยืนยันความปลอดภัยของการแฮชรหัสผ่าน bcrypt (Cost 10) และการเซ็น/ถอดรหัส JWT Token
2. **End-to-End Browser Tests (Playwright):** ผ่าน 49 / 50 การทดสอบ (98%) บน Chromium จำลองการเปิดซองการ์ด 3D, การลากการ์ดลงสนาม, และการนำทาง
3. **Load Stress Test บน ALB จริง (`scripts/stress_test.ps1`):**
   - ยิงโหลด 2,000 HTTP Requests แบบ Concurrency 20 ไปยัง URL: `http://lorcana-alb-687861613.us-east-1.elb.amazonaws.com`
   - ผลการทดสอบ: **HTTP 200 OK ครบ 2,000 คำขอ (Error Rate 0.00%)**
   - CloudWatch Alarm `cpu-target-tracking-60` เปลี่ยนสถานะเป็น **In alarm** และ ASG สปอว์น EC2 Instance เครื่องที่ 2 ขึ้นมาช่วยแบ่งเบาภาระงานได้จริงตามเงื่อนไข Elasticity

---

# บทที่ 5: การประเมินค่าใช้จ่ายบนคลาวด์และแผนงานขั้นต่อไป (Cost Assessment & Future Roadmap)

### 5.1 การประเมินค่าใช้จ่ายสถาปัตยกรรมคลาวด์ ($50 Budget Protection)
จากการคำนวณและประเมินค่าใช้จ่ายจริงบนสภาพแวดล้อม AWS Academy Learner Lab:

| ทรัพยากรคลาวด์ | สเปกและการตั้งค่า | ค่าใช้จ่ายปกติ / เดือน | ค่าใช้จ่ายหลังปรับแต่งในโครงการ | วิธีการควบคุมงบประมาณ |
|---|---|---|---|---|
| **VPC & Network** | Lean Multi-AZ VPC + IGW | $32.40 (NAT Gateway) | **$0.00** | ตัด NAT Gateway ใช้ Chained Security Groups |
| **Compute (EC2)** | `t3.micro` บน Amazon Linux 2023 | $8.40 (เปิด 24/7) | **~$0.50** | ใช้ Scale-to-Zero (`lab_stop.ps1`) เปิดเฉพาะตอนเดโม |
| **Load Balancer** | Application Load Balancer (ALB) | $16.20 (เปิด 24/7) | **~$0.60** | บริหารจัดการเปิด-ปิดตามช่วงเวลาการทำแล็บ |
| **Database** | Amazon DynamoDB (On-demand) | Free Tier ($0.00) | **$0.00** | ข้อมูล < 1GB อยู่ในเกณฑ์ Free Tier |
| **Storage** | S3 & Container Images | $0.10 | **$0.02** | Multi-stage Docker ขนาดเบา < 100MB |

**สรุปค่าใช้จ่ายรวมทั้งสิ้น:** คาดการณ์ค่าใช้จ่ายตลอดภาคการศึกษา **ไม่เกิน $3.00 - $5.00** จากงบประมาณจัดสรร $50.00 ทำให้เหลืองบประมาณปลอดภัยกว่า 90% ตลอดทั้งเทอม

### 5.2 แผนงานพัฒนาสำหรับ Sprint 4 และ Sprint 5
1. **Sprint 4 (Async Deck Analyzer via SQS):** นำ Amazon SQS มารับงานวิเคราะห์ความสมดุลเด็คแบบ Asynchronous พร้อมอัลกอริทึมแนะนำการ์ดที่เข้าขากันตามประเภท Ink และค่าร่าย
2. **Sprint 5 (Distributed Tracing & Observability):** ติดตั้ง AWS X-Ray ติดตาม Request Latency ข้าม Nginx, Node.js, และ DynamoDB พร้อมสร้าง CloudWatch Dashboard รวมสถิติ ALB
3. **Sprint 6–7 (Final Defense):** จัดทำรายงานเปรียบเทียบ Response Time และรวบรวมใบเสร็จการใช้งานจริงเพื่อส่งมอบ Stage 3

### 5.3 สรุปผลการดำเนินงานและบทเรียนที่ได้รับ (Sprint Retrospective)
การพัฒนาโครงงาน Disney Lorcana PlayLab Cloud ใน Sprint 1 ถึง 3 บรรลุผลสำเร็จ 100% ตามเป้าหมายของ Stage 2 บทเรียนทางวิศวกรรมที่สำคัญ ได้แก่:
1. **การออกแบบเพื่อควบคุมต้นทุน (Cost-Aware Engineering):** การเข้าใจการทำงานของ VPC และ Security Group ทำให้สามารถตัดต้นทุน NAT Gateway ลงได้โดยไม่สูญเสียความปลอดภัย
2. **การรีดสมรรถนะคอนเทนเนอร์:** การแยก Build Stage ออกจาก Runtime ใน Docker ช่วยให้สามารถรันทั้งเว็บเซิร์ฟเวอร์และแอปพลิเคชันบน VM ขนาดเล็ก (1GB RAM) ได้อย่างราบรื่น
3. **การจัดการสถานะระบบกระจาย (Distributed State Management):** การผสานระหว่าง Optimistic UI, Sticky Sessions บน ALB, และ DynamoDB Persistence ช่วยให้ระบบ Real-time WebSockets มีความเสถียรสูงและฟื้นตัวจากเน็ตหลุดได้รวดเร็ว

---

# เอกสารอ้างอิง (References)

1. Ravensburger & Disney. (2023). *Disney Lorcana Trading Card Game Official Rules and Card Database*. https://www.disneylorcana.com
2. Amazon Web Services. (2026). *Building Event-Driven Architectures with AWS Lambda and Amazon DynamoDB*. AWS Documentation. https://docs.aws.amazon.com/lambda/
3. Amazon Web Services. (2026). *About WebSocket APIs in API Gateway*. AWS Documentation. https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
4. React Working Group. (2026). *React 19 Documentation and Concurrent Features*. https://react.dev
5. Tailwind Labs. (2026). *Tailwind CSS v4.0 Alpha/Release Documentation*. https://tailwindcss.com
6. Framer. (2026). *Framer Motion: Production-ready animation library for React*. https://www.framer.com/motion/
