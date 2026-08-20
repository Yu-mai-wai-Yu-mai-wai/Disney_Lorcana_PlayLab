# รายงานโครงงานวิชา Cloud Technology (ภาคเรียนที่ 1/2569)
# กลุ่ม G21: DISNEY LORCANA PLAYLAB CLOUD
## ระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนคลาวด์ Serverless

**สถานะปัจจุบัน:** รายงานความก้าวหน้าโครงการ (เสร็จสิ้น Sprint ที่ 1 ถึง 3 พร้อมส่งมอบ Stage 2)  
**คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)**  
**วันที่จัดทำ:** สิงหาคม 2569  

---

## บทคัดย่อ (Abstract)

โครงงาน **Disney Lorcana PlayLab Cloud (กลุ่ม G21)** นำเสนอการพัฒนาระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนสถาปัตยกรรมคลาวด์แบบไร้เซิร์ฟเวอร์ (100% AWS Serverless Architecture) สำหรับเกมการ์ดสะสม Disney Lorcana Trading Card Game (TCG) โดยมุ่งเน้นการแก้ปัญหาความหน่วงในการเชื่อมต่อ (High Latency) และภาระต้นทุนค่าใช้จ่ายเซิร์ฟเวอร์แบบเดิม (Server Overhead) ผ่านการประยุกต์ใช้บริการประมวลผลตามเหตุการณ์ (Event-Driven Computing) ด้วย AWS Lambda, ฐานข้อมูล NoSQL แบบขยายขนาดอัตโนมัติด้วย Amazon DynamoDB, และช่องทางการสื่อสารแบบสองทิศทางความเร็วสูงผ่าน AWS API Gateway WebSockets ซึ่งสามารถทำความเร็วในการซิงค์ข้อมูลสถานะกระดานระหว่างผู้เล่นได้ต่ำกว่า 100 มิลลิวินาที (Sub-100ms Latency)

ในส่วนของส่วนติดต่อผู้ใช้ (Frontend) ระบบได้รับการพัฒนาด้วย React 19, TypeScript 5.x, Tailwind CSS v4, Framer Motion และ Zustand เพื่อมอบประสบการณ์การเล่นระดับพรีเมียม (Luxury Physical TCG Experience) ด้วยระบบฟิสิกส์ 3D การตรวจสอบการ์ดแบบสามมิติ การเปิดซองการ์ด Booster Pack เสมือนจริง และระบบจัดการเด็คการ์ดที่เชื่อมต่อกับฐานข้อมูลการ์ดอย่างเป็นทางการกว่า 408 ใบ (Set 1 The First Chapter และ Set 2 Rise of the Floodborn)

การดำเนินงานตามระเบียบวิธีปฏิบัติงานแบบ Agile Scrum ได้ลุล่วงตามแผนงาน Sprint 1 ถึง Sprint 3 อย่างสมบูรณ์ ครอบคลุมการสร้าง Core Gameplay UI, ระบบยืนยันตัวตนและจัดการเด็ค (Authentication & Deck Microservices) และระบบห้องเล่นแบบเรียลไทม์บนคลาวด์ พร้อมทั้งผ่านการทดสอบและปรับใช้จริงบนสภาพแวดล้อม AWS Learner Lab ภายใต้นโยบายควบคุมค่าใช้จ่าย AWS Free Tier ($0.00) ได้อย่างมีประสิทธิภาพ

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
| **Sprint 1** | 1–15 ส.ค. 2569 | Scaffold โปรเจกต์, UI กระดานเล่นการ์ด, Card Database 408 ใบ | เสร็จสิ้น (100%) |
| **Sprint 2** | 16–31 ส.ค. 2569 | Microservices: Auth (JWT/bcrypt) & Deck Management บน AWS Lambda + DynamoDB | เสร็จสิ้น (100%) |
| **Sprint 3** | 1–10 ก.ย. 2569 | Real-time Room Sync ผ่าน AWS API Gateway WebSockets + Room Router Lambda | เสร็จสิ้น (100%) |
| **Sprint 4** | 11–25 ก.ย. 2569 | Async Deck Analyzer ผ่าน Amazon SQS + Deck Balance Algorithm | ถัดไป |
| **Sprint 5** | 26 ก.ย. – 10 ต.ค. 2569 | CloudWatch Alarms, X-Ray Distributed Tracing, Security Hardening | ถัดไป |
| **Sprint 6** | 11–20 ต.ค. 2569 | Load Testing ด้วย Artillery (100–500 concurrent users), WebSocket Reconnection | ถัดไป |
| **Sprint 7** | 21–25 ต.ค. 2569 | จัดทำรายงานฉบับสมบูรณ์ (Final Report), Video Demo, สรุปผลโครงการ | ถัดไป |

### 2.2 สรุปผลความก้าวหน้า Sprint 1 ถึง Sprint 3
- **Sprint 1 (Board UI):** พัฒนา Frontend สำเร็จด้วย React 19, TypeScript และ Tailwind CSS v4 มีไฟล์หลัก `LorcanaBoard.tsx` (1,164 บรรทัด) รองรับ Drag-and-Drop, Inkwell, Lore Counter (0-20), ระบบหมุนการ์ด Ready/Exert และชุดข้อมูลการ์ด 408 ใบ
- **Sprint 2 (Auth + Deck Microservices):** พัฒนา REST API ด้วย AWS Lambda (Node.js 20.x) และ Amazon DynamoDB รองรับระบบสมัครสมาชิก เข้าสู่ระบบด้วย bcrypt/JWT และการจัดการเด็ค (CRUD) พร้อม Deploy บน AWS Learner Lab ผ่าน HTTP API Gateway
- **Sprint 3 (Real-Time WebSocket Room):** พัฒนาระบบห้องเล่นแบบเรียลไทม์ด้วย AWS API Gateway WebSocket API และ Lambda Room Router (`backend/room/handler.ts`) เชื่อมต่อกับ DynamoDB `RoomStateTable` รองรับการ Broadcast Event ระหว่างผู้เล่น เช่น `JOIN_ROOM`, `CARD_MOVED`, `CARD_EXERTED`, `INK_PLAYED`, `LORE_UPDATED`, `TURN_PASSED`

### 2.3 ตารางเปรียบเทียบกำหนดการส่งงานวิชา Cloud Technology

| ระยะเวลา/กำหนดการ | กิจกรรม / งานที่ต้องส่ง | สถานะ |
|---|---|---|
| **Sprint 1–3 (ถึงปัจจุบัน)** | Board UI, Auth/Deck Lambda, WebSocket API, Deploy บน AWS | **เสร็จสิ้น (100%)** |
| **Sprint 4–5 (ถึง 10 ก.ย.)** | Deck Analyzer, SQS Integration, เตรียมรูปเล่มรายงาน Stage 2 | กำลังดำเนินการ |
| **10 ก.ย. 2569** | **ส่งรายงานความก้าวหน้า Stage 2 (12 คะแนน)** | 🔜 พร้อมส่งมอบ |
| **22–26 ก.ย. 2569** | **นำเสนอความก้าวหน้า Stage 2 (3 คะแนน)** | เตรียมพร้อม |
| **Sprint 6–7 (ถึง 10 ต.ค.)** | Load Testing, Auto-reconnect, สรุปผลและบทเรียน | ตามแผน |
| **10 ต.ค. 2569** | **ส่งผลการทดลองและรายงานฉบับสมบูรณ์ Stage 3 (10 คะแนน)** | ตามแผน |
| **20–25 ต.ค. 2569** | **นำเสนอโครงงานฉบับสมบูรณ์ Stage 3 (5 คะแนน)** | ตามแผน |

### 2.4 เครื่องมือและเฟรมเวิร์กที่ใช้ในการพัฒนา (Tech Stack)

**1. Frontend & Client Engine:**
- **React 19 & TypeScript 5.x:** โครงสร้างคอมโพเนนต์แบบ Type-Safe ป้องกันข้อผิดพลาดในการเข้าถึงสถานะการ์ด
- **Vite 6:** เครื่องมือคอมไพล์และบันเดิลความเร็วสูง รองรับ Hot Module Replacement (HMR)
- **Tailwind CSS v4:** ระบบสไตล์แบบ CSS-First รองรับธีม Dark Editorial + Magic R3
- **Framer Motion & WebGL/CSS 3D:** แอนิเมชันการลากวางการ์ด การเปิดซอง Booster Pack และการดูการ์ดแบบ 3D
- **Zustand:** จัดการ Global State สำหรับสถานะกระดานและการเชื่อมต่อ WebSocket

**2. Backend & Cloud Services (AWS Serverless):**
- **AWS Lambda:** ประมวลผลแบบ Event-Driven รองรับ Microservices ทั้ง REST และ WebSocket
- **AWS API Gateway:** รองรับทั้ง HTTP API (REST endpoints) และ WebSocket API (Real-time bidirectional)
- **Amazon DynamoDB:** ฐานข้อมูล NoSQL แบบ Fully Managed จัดเก็บข้อมูลผู้ใช้ เด็ค และสถานะห้องเล่น
- **Amazon SQS:** คิวข้อความสำหรับการประมวลผลวิเคราะห์เด็คแบบ Asynchronous (เตรียมพร้อมใน Sprint 4)
- **Amazon CloudWatch:** ระบบมอนิเตอร์ บันทึก Logs และตั้งค่าการแจ้งเตือนประสิทธิภาพ

---

# บทที่ 3: การวิเคราะห์และออกแบบระบบ (System Analysis & Design)

### 3.1 ข้อกำหนดความต้องการของระบบ (Requirements)
- **Functional Requirements (FR):**
  1. ผู้ใช้สามารถสมัครสมาชิก เข้าสู่ระบบ และถือครอง JWT Token เพื่อยืนยันตัวตนได้
  2. ผู้ใช้สามารถสร้าง แก้ไข คัดลอก และลบเด็คการ์ดส่วนตัวได้
  3. ผู้ใช้สามารถเปิดซองการ์ดสุ่ม (Booster Pack) 12 ใบตามเรตความหายากทางการได้
  4. ผู้ใช้สามารถตรวจสอบการ์ดแบบ 3 มิติ (3D Card Inspector) ดูเอฟเฟกต์ฟอยล์และรายละเอียดการ์ดได้
  5. ผู้ใช้สามารถสร้างหรือเข้าร่วมห้องเล่นการ์ดด้วยรหัสห้อง 6 หลักได้
  6. ผู้ใช้สามารถลากการ์ดลงสนาม หมุนการ์ดคว่ำ/หงาย เพิ่มลด Lore และส่งผลให้ฝ่ายตรงข้ามเห็นแบบเรียลไทม์ได้
  7. ระบบสามารถวิเคราะห์สถิติเด็คการ์ด เช่น ค่าร่ายเฉลี่ย (Ink Curve) และสัดส่วนการ์ดได้
- **Non-Functional Requirements (NFR):**
  1. **Latency:** ความหน่วงในการซิงค์ข้อมูลผ่าน WebSocket ต้องต่ำกว่า 100 มิลลิวินาที
  2. **Cost:** สถาปัตยกรรมต้องทำงานได้ภายใต้งบประมาณ $0.00 (AWS Free Tier)
  3. **Availability & Scalability:** ขยายขนาดรองรับผู้ใช้งานได้อัตโนมัติโดยไม่มี Downtime
  4. **Security:** รหัสผ่านต้องได้รับการแฮชด้วย bcrypt (Salt Rounds = 10) และส่งข้อมูลผ่าน HTTPS/WSS

### 3.2 การออกแบบสถาปัตยกรรมคลาวด์บน AWS (100% Serverless)
ระบบทำงานบนสถาปัตยกรรม Event-Driven Serverless โดยแบ่งเป็น 3 เลเยอร์หลัก:
1. **Presentation Layer:** เว็บแอปพลิเคชัน Single Page Application (SPA) ให้บริการผ่าน HTTPS
2. **API & Routing Layer:** 
   - **HTTP API Gateway:** สำหรับ REST Endpoints (`/auth/login`, `/auth/register`, `/decks`)
   - **WebSocket API Gateway:** สำหรับการเชื่อมต่อแบบ Persistent Bidirectional Connection (`$connect`, `$disconnect`, `$default`)
3. **Compute & Storage Layer:**
   - **AWS Lambda Microservices:** แยกฟังก์ชันอิสระ (Auth, Deck, Room Router)
   - **Amazon DynamoDB:** จัดเก็บข้อมูลแบบ Key-Value / Document Store

### 3.3 การออกแบบฐานข้อมูลแบบ NoSQL (Amazon DynamoDB Schema)

| ตาราง (Table Name) | Partition Key (PK) | Sort Key (SK) | Attributes สำคัญ | วัตถุประสงค์ |
|---|---|---|---|---|
| `LorcanaUsers` | `userId` (S) | - | `username`, `passwordHash`, `createdAt` | จัดเก็บข้อมูลผู้ใช้และรหัสผ่านแฮช |
| `LorcanaDecks` | `userId` (S) | `deckId` (S) | `deckName`, `inks`, `cards` (List), `updatedAt` | จัดเก็บรายการเด็คการ์ดของผู้ใช้ |
| `LorcanaRoomState` | `roomId` (S) | `connectionId` (S) | `username`, `role` (P1/P2), `state` (JSON), `ttl` | จัดเก็บสถานะการเชื่อมต่อและกระดานสด |

### 3.4 ลำดับขั้นตอนการสื่อสารแบบเรียลไทม์ (WebSocket Sequence Flow)
1. **การสร้าง/เข้าร่วมห้อง (`JOIN_ROOM`):** ผู้เล่นเปิดหน้า Match Lobby และส่งคำขอ `JOIN_ROOM` พร้อมรหัสห้อง 6 หลัก API Gateway เรียก Lambda Room Router เพื่อลงทะเบียน Connection ID ลงใน `LorcanaRoomState`
2. **การอัปเดตสถานะกระดาน (`CARD_MOVED` / `CARD_EXERTED` / `LORE_UPDATED`):** เมื่อผู้เล่นลากการ์ดหรือเปลี่ยนสถานะ Client จะทำการ Optimistic Update ที่หน้าจอทันที และส่ง Action Payload ไปยัง WebSocket API Gateway
3. **การส่งต่อข้อมูล (Relay & Broadcast):** Lambda Room Router อ่าน Connection ID ของผู้เล่นฝ่ายตรงข้ามในห้องเดียวกันจาก DynamoDB และใช้ `@connections` API เพื่อ Broadcast ข้อความไปยังคู่แข่งภายในเวลา <100ms

### 3.5 กฎกติกาและองค์ประกอบของเกมการ์ด Disney Lorcana
เกม Disney Lorcana มีองค์ประกอบหลักที่ระบบจำลองขึ้นอย่างสมบูรณ์:
- **6 หมวดสีหมึก (Ink Types):** Amber (เหลือง), Amethyst (ม่วง), Emerald (เขียว), Ruby (แดง), Sapphire (น้ำเงิน), Steel (เทา)
- **ประเภทการ์ด (Card Types):** Character (ตัวละคร), Action/Song (เวทมนตร์/เพลง), Item (ไอเทม), Location (สถานที่)
- **สถานะการ์ด (Card States):** Ready (แนวตั้ง พร้อมใช้งาน) และ Exerted (แนวนอน พักการใช้งาน)
- **เป้าหมายของเกม:** รวบรวมแต้มความรู้ (Lore) ให้ครบ 20 แต้มก่อนฝ่ายตรงข้าม

---

# บทที่ 4: การพัฒนาระบบและผลการดำเนินงาน (Implementation & Test Results)

### 4.1 การพัฒนาส่วนติดต่อผู้ใช้ (Frontend Implementation & Playmat UI)
ส่วนติดต่อผู้ใช้ได้รับการออกแบบตามแนวคิด **Dark Editorial + Magic R3** เพื่อให้ความรู้สึกพรีเมียมและน่าตื่นตาตื่นใจ โดยแบ่งหน้าจอหลักออกเป็น:
1. **Game Hub & Navigation:** หน้าแดชบอร์ดหลักสำหรับเข้าถึงโหมดต่างๆ ของระบบ
2. **Lorcana Board Simulation:** กระดานเล่นการ์ดแบบ Full Viewport ประกอบด้วยโซน Play Area, Inkwell, Hand Tray, Discard Pile, Deck Pile และ Lore Tracker
3. **Deck Builder & Analytics:** ระบบจัดเด็คการ์ด ค้นหาตาม Ink, Cost, Rarity พร้อมกราฟวิเคราะห์ Ink Curve
4. **3D Card Inspector & Booster Pack Opening:** ระบบตรวจสอบการ์ดแบบสามมิติและจำลองการเปิดซองการ์ดแบบแอนิเมชันเสมือนจริง
5. **Match Lobby:** หน้าสร้างและเข้าร่วมห้องแข่งขันแบบเรียลไทม์ผ่านรหัสห้อง 6 หลัก

### 4.2 การพัฒนาส่วนประมวลผลบนคลาวด์ (AWS Backend Microservices)
ฟังก์ชัน Lambda ได้รับการพัฒนาด้วย TypeScript และคอมไพล์เป็น Node.js 20.x:
- **`lorcana-auth-register` & `lorcana-auth-login`:** ตรวจสอบความถูกต้องของข้อมูล เข้ารหัสรหัสผ่านด้วย bcrypt และออก JWT Token
- **`lorcana-deck`:** จัดการ CRUD เด็คการ์ด โดยแยก Route ตาม HTTP Method (GET, POST, PUT, DELETE)
- **`lorcana-room-handler`:** จัดการการเชื่อมต่อ WebSocket, ถอดรหัส Action, บันทึก Session ลง DynamoDB และ Broadcast ข้อมูลผ่าน ApiGatewayManagementApi

### 4.3 การแก้ปัญหาข้อจำกัดบน AWS Learner Lab
ในการปรับใช้ระบบจริงบน AWS Learner Lab ทีมงานพบข้อจำกัดด้านความปลอดภัยที่บล็อกคำสั่ง `iam:CreateRole` ส่งผลให้ไม่สามารถรันคำสั่ง `sam deploy` แบบอัตโนมัติได้ ทีมงานจึงได้แก้ไขปัญหาอย่างเป็นระบบ:
1. **การใช้ LabRole สำเร็จรูป:** ปรับใช้ `LabRole` ที่ระบบจัดเตรียมไว้ให้แทนการสร้าง IAM Role ใหม่
2. **สคริปต์ Manual Deployment (`scripts/deploy_manual.sh`):** พัฒนาสคริปต์คอมไพล์โค้ด สร้างไฟล์ ZIP และอัปเดตโค้ดขึ้น Lambda โดยตรงผ่าน AWS CLI
3. **การแก้ไข API Gateway Payload Format Version:** เปลี่ยน Integration จาก v2.0 เป็น v1.0 เพื่อให้ตรงกับ `APIGatewayProxyEvent` ของ Lambda
4. **การจัดทำ Route Integration Mapping:** ตรวจสอบและแก้ไข Integration URI ให้ชี้ไปยัง Lambda Function ที่ถูกต้องอย่างแม่นยำ

### 4.4 ผลการทดสอบระบบแบบ End-to-End (End-to-End Testing)
ผลการทดสอบผ่าน Live AWS Endpoints จริงบนสภาพแวดล้อม Production:

| Endpoint / Action | Test Case / Payload | ผลลัพธ์ที่คาดหวัง | ผลการทดสอบจริง | สถานะ |
|---|---|---|---|---|
| `POST /auth/register` | `{ "username": "tawan", "password": "..." }` | HTTP 201 Created | HTTP 201 User registered successfully | ผ่าน |
| `POST /auth/login` | `{ "username": "tawan", "password": "..." }` | HTTP 200 + JWT Token | HTTP 200 ได้รับ JWT Token ถูกต้อง | ผ่าน |
| `POST /decks` | `{ "deckName": "Ruby Amethyst Control", ... }` | HTTP 201 บันทึกลง DynamoDB | HTTP 201 Deck saved successfully | ผ่าน |
| `GET /decks` | Authorization: Bearer `<token>` | HTTP 200 คืนรายการเด็ค | HTTP 200 รายการเด็คครบถ้วน | ผ่าน |
| `DELETE /decks/{id}` | Path Parameter `deckId` | HTTP 200 ลบเด็คสำเร็จ | HTTP 200 Deck deleted | ผ่าน |
| `WSS $connect` | `wss://a86238wqo4.../prod` | HTTP 101 Switching Protocols | เชื่อมต่อ Persistent Socket สำเร็จ | ผ่าน |
| `WSS JOIN_ROOM` | `{ "action": "JOIN_ROOM", "roomId": "882144" }` | บันทึก Connection ลง DynamoDB | HTTP 200 เข้าร่วมห้องสำเร็จ | ผ่าน |
| `WSS CARD_MOVED` | `{ "action": "CARD_MOVED", "cardId": "c1", ... }` | Relay ข้อมูลไปยังคู่แข่ง | ได้รับข้อความทางคู่แข่งใน <100ms | ผ่าน |

---

# บทที่ 5: การประเมินค่าใช้จ่ายบนคลาวด์และแผนงานขั้นต่อไป (Cost Assessment & Future Roadmap)

### 5.1 การประเมินค่าใช้จ่ายสถาปัตยกรรมคลาวด์ (AWS Free Tier Optimization)
จากการคำนวณผ่าน AWS Pricing Calculator สำหรับปริมาณการใช้งานระดับ 10,000 ผู้เล่นต่อเดือน:
- **AWS Lambda:** 1,000,000 Requests ฟรีต่อเดือน (การใช้งานจริงประมาณ 250,000 Requests = $0.00)
- **Amazon DynamoDB:** ฟรี 25 GB Storage และ 25 WCU / 25 RCU (การใช้งานจริง < 1 GB = $0.00)
- **AWS API Gateway (HTTP & WebSocket):** 1,000,000 Messages ฟรีใน Free Tier ($0.00)
- **Amazon SQS:** 1,000,000 Requests ฟรีต่อเดือน ($0.00)
- **Amazon CloudWatch:** 5 GB Log Data Ingestion ฟรีต่อเดือน ($0.00)

**สรุปค่าใช้จ่ายรวมทั้งสิ้น:** **$0.00 ต่อเดือน** สอดคล้องกับเป้าหมายการควบคุมงบประมาณของโครงงาน

### 5.2 แผนงานพัฒนาสำหรับ Sprint 4 และ Sprint 5
1. **Sprint 4 (Deck Analyzer Microservice):** พัฒนาระบบประมวลผลวิเคราะห์สมดุลเด็คแบบ Asynchronous โดยใช้ Amazon SQS รับงานและทริกเกอร์ Lambda ในการคำนวณความเสี่ยง ค่าร่าย และความเข้ากันได้ของการ์ด
2. **Sprint 5 (Observability & Security Hardening):** ย้ายค่าความลับ (JWT Secret) ไปจัดเก็บใน AWS Secrets Manager และตั้งค่า CloudWatch Dashboard พร้อมระบบแจ้งเตือน Error Rate เกิน 1%
3. **Sprint 6 (Load Testing & Resilience):** ทดสอบประสิทธิภาพระบบด้วยเครื่องมือ Artillery ภายใต้โหลด 500 Concurrent Connections พร้อมระบบเชื่อมต่อใหม่อัตโนมัติ (WebSocket Auto-reconnect) เมื่อสัญญาณหลุด

### 5.3 สรุปผลการดำเนินงานและบทเรียนที่ได้รับ (Sprint Retrospective)
การพัฒนาโครงงาน Disney Lorcana PlayLab Cloud ใน Sprint 1 ถึง 3 บรรลุเป้าหมายตามเกณฑ์การประเมิน Stage 2 อย่างครบถ้วน บทเรียนสำคัญที่ได้รับจากการปฏิบัติงานจริง ได้แก่:
1. **ความสำคัญของ Spec และ Interface Design:** การกำหนด Schema ของ WebSocket Payload และ DynamoDB อย่างรอบคอบช่วยให้การทำงานร่วมกันระหว่าง Frontend และ Backend ราบรื่น
2. **การทำความเข้าใจข้อจำกัดของสภาพแวดล้อมคลาวด์:** การปรับใช้สคริปต์ Manual Deployment ช่วยให้ทีมสามารถเอาชนะข้อจำกัดสิทธิ์บน AWS Learner Lab ได้อย่างมีประสิทธิภาพ
3. **การตรวจสอบ Integration Mapping:** การจับคู่วิธีการส่งถ่ายข้อมูลระหว่าง API Gateway และ Lambda ต้องสอดคล้องกับเวอร์ชันของ Payload Format เพื่อป้องกันข้อผิดพลาด 405 Method Not Allowed

---

# เอกสารอ้างอิง (References)

1. Ravensburger & Disney. (2023). *Disney Lorcana Trading Card Game Official Rules and Card Database*. https://www.disneylorcana.com
2. Amazon Web Services. (2026). *Building Event-Driven Architectures with AWS Lambda and Amazon DynamoDB*. AWS Documentation. https://docs.aws.amazon.com/lambda/
3. Amazon Web Services. (2026). *About WebSocket APIs in API Gateway*. AWS Documentation. https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
4. React Working Group. (2026). *React 19 Documentation and Concurrent Features*. https://react.dev
5. Tailwind Labs. (2026). *Tailwind CSS v4.0 Alpha/Release Documentation*. https://tailwindcss.com
6. Framer. (2026). *Framer Motion: Production-ready animation library for React*. https://www.framer.com/motion/
