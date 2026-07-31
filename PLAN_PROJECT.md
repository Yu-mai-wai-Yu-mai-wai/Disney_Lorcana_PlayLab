# 🗺️ Disney Lorcana PlayLab Cloud - Master Project Plan & Execution Roadmap

> **ระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนคลาวด์ Serverless**  
> *โครงงานวิชา Cloud Technology (ภาคเรียนที่ 1 ปีการศึกษา 2569) คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง*

---

## 📌 1. ภาพรวมโครงการและสถาปัตยกรรม (System Overview & Architecture)

โครงงานนี้ได้รับการออกแบบตามสถาปัตยกรรม **100% AWS Serverless** ร่วมกับ **Modern Frontend Framework Stack** เพื่อความยืดหยุ่น ประสิทธิภาพความหน่วงต่ำ (<100ms) และทำงานภายใต้เงื่อนไข **AWS Free Tier (งบประมาณ $0.00)** 

### 🛠️ Modern Tech Stack Breakdown:
*   **Language:** TypeScript 5.x *(Strict typing สำหรับ 408 Card Data Schema, Drag & Drop State, WebSocket Payloads)*
*   **Frontend Framework:** React 19+ *(React Compiler Optimizations, Concurrent Rendering, Transition Hooks)*
*   **Build Tool & Dev Server:** Vite 6 *(Lightning-fast Hot Module Replacement & Instant ES Module bundling)*
*   **Styling Engine:** Tailwind CSS v4 *(CSS-first `@theme` configuration, zero-runtime overhead)*
*   **Animation Engine:** Framer Motion *(Micro-animations สำหรับ Card Dragging, Exert/Ready rotation, Flip & Lore counter)*
*   **State Management:** Zustand *(Ultra-lightweight, reactive global store สำหรับ Board State & WebSocket Event dispatching)*
*   **Real-time Protocol:** WebSockets *(HTML5 WebSocket Client ➔ AWS API Gateway WebSockets)*

```
DISNEY LORCANA PLAYLAB CLOUD/
├── 📄 PLAN_PROJECT.md                # แผนงานหลัก + รายการไฟล์ที่ Agent ต้องอ่าน + แผนพัฒนา MVP
├── 📄 TEAM_WORKFLOW.md               # แผนแบ่งหน้าที่ทีม 6 คน และคู่มือการใช้ Git Version Control
├── 📄 README.md                      # สรุปภาพรวม codebase และวิธีรันระบบ
├── 📁 public/                        # Static Assets & Card Dataset (Set 1 & 2 JSON)
├── 📁 src/                           # Frontend Client (React + Vite Single Page Application)
│   ├── components/                # UI Components (Lorcana Board, Deck Builder, Playmat)
│   ├── services/                  # API Clients & WebSockets Client
│   └── assets/                    # Styling Tokens & Theme Icons
├── 📁 backend/                       # AWS Serverless Lambda Functions Source Code
│   ├── auth/                      # Custom Auth (bcrypt Hashing & JWT Signing)
│   ├── deck/                      # REST API Deck Manager (DynamoDB Integration)
│   ├── room/                      # WebSockets Room Router (Real-time Match Sync)
│   └── analyzer/                  # Asynchronous SQS Deck Synergy Analyzer
├── 📁 docs/                          # Architecture Diagrams & OpenAPI Contracts
└── 📁 scripts/                       # Local build and AWS deployment automation
```

---

## 📖 2. รายการไฟล์ที่ AI Agent ต้องอ่านให้ครบถ้วนก่อนเริ่มทำงาน (Mandatory Agent Reading List)

ก่อนที่ AI Agent ตัวใดจะเริ่มเขียนโค้ด ปรับแต่งระบบ หรือแก้งานในโปรเจกต์นี้ **ต้องอ่านและทำความเข้าใจไฟล์อ้างอิงหลักเหล่านี้อย่างละเอียด** เพื่อป้องกันการทำงานสับสนหรือหลุดข้อกำหนด:

### 📑 2.1 เอกสารข้อเสนอโครงการและสเปกระบบหลัก
*   [Cloud_Project_Proposal_Lorcana.pdf](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/01_Proposal/Cloud_Project_Proposal_Lorcana.pdf) — เล่มข้อเสนอโครงงานฉบับสมบูรณ์ (PDF)
*   [Cloud_Project_Proposal_Lorcana.tex](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/01_Proposal/Cloud_Project_Proposal_Lorcana.tex) — ซอร์สโค้ด LaTeX ข้อเสนอโครงการ
*   [README.md (Disney_Lorcana)](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/README.md) — ดัชนีสรุป Use Cases ทั้ง 9 ข้อและแผนผัง Mermaid สถาปัตยกรรม

### 📊 2.2 สไลด์นำเสนอและคู่มืออ้างอิงเชิงเทคนิค
*   [Disney_Lorcana_SlideDeck_Magical_Disney.pdf](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/02_Presentations/Disney_Lorcana_SlideDeck_Magical_Disney.pdf) — สไลด์นำเสนอสถาปัตยกรรมคลาวด์และแนวทางตอบคำถามอาจารย์ (PDF)
*   [disney_slides.html](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/02_Presentations/disney_slides.html) — หน้าเว็บสไลด์นำเสนอแบบ Interactive HTML
*   [Disney_Lorcana_Report_NotebookLM.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/03_Reports/Disney_Lorcana_Report_NotebookLM.md) — รายงานสรุปเชิงวิชาการสำหรับประมวลผลใน NotebookLM
*   [Disney_Lorcana_Gemini_Canvas_Guide.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/03_Reports/Disney_Lorcana_Gemini_Canvas_Guide.md) — คู่มือสรุปข้อกำหนด UI/UX ผังกระดานซ้อมเล่น และตาราง Free Tier $0.00

### 🗓️ 2.3 กำหนดการและหลักเกณฑ์การให้คะแนนวิชา Cloud
*   [กำหนดการส่งงานโครงงานCloud69.pdf](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/%E0%B8%81%E0%B8%B3%E0%B8%AB%E0%B8%99%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%8B%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99Cloud69.pdf) — ประกาศกำหนดการและหลักเกณฑ์ให้คะแนนทางการ (30 คะแนนเต็ม)

---

## 🗓️ 3. ตารางกำหนดการส่งงานวิชา Cloud Technology (ภาคเรียนที่ 1/2569)

อ้างอิงตามเอกสารประกาศหลักเกณฑ์ [กำหนดการส่งงานโครงงานCloud69.pdf](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/%E0%B8%81%E0%B8%B3%E0%B8%AB%E0%B8%99%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B9%8B%E0%B8%87%E0%B8%87%E0%B8%B2%E0%B8%99Cloud69.pdf):

| ระยะการส่งงาน (Stage) | รายการงานที่ต้องส่ง | กำหนดส่ง | หลักเกณฑ์การพิจารณา | คะแนน | สถานะ |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **Stage 1** | ส่งหัวข้อโครงงาน | 22 ก.ค. 2569 | ความเป็นไปได้, ประโยชน์, ความคิดสร้างสรรค์ | 2 | ✅ เสร็จสิ้น |
| | นำเสนอหัวข้อ + รายงานบทที่ 1-3 | 27–31 ก.ค. 2569 | คุณภาพเนื้องาน, การออกแบบ, นำเสนอ 10 นาที | 3 | ✅ เสร็จสิ้น |
| **Stage 2** | **รายงานความก้าวหน้า (บทที่ 2-3)** | **10 ก.ย. 2569** | ทฤษฎี (2%), ความคิดสร้างสรรค์ (2%), อธิบายเชิงเทคนิค (3%), การออกแบบ Cloud & Software Engineering (5%) | 12 (10%) | ⏳ กำลังดำเนินการ |
| | **นำเสนอความก้าวหน้า Stage 2** | **22–26 ก.ย. 2569** | คุณภาพชิ้นงาน, การออกแบบ, นำเสนอ 10 นาที | 3 | ⏳ กำลังดำเนินการ |
| **Stage 3** | **รายงานความก้าวหน้า (ผลทดลอง & บิล)** | **10 ต.ค. 2569** | ออกแบบตามหลัก Cloud (5 คะแนน), ผลการทดลอง ข้อจำกัด และค่าใช้จ่าย (10 คะแนน) | 10 | ⏳ กำลังดำเนินการ |
| | **นำเสนอ + ส่งรายงานฉบับสมบูรณ์** | **20–25 ต.ค. 2569** | ความสมบูรณ์ชิ้นงาน (2 คะแนน), การสื่อสารกระชับ (1 คะแนน), เอกสารอ้างอิง Intext/Ref (1 คะแนน), ถามตอบ (1 คะแนน) | 5 | ⏳ กำลังดำเนินการ |
| **คะแนนรวม** | | | **30 คะแนนจริง (จาก 100 คะแนนวิชา)** | **30** | |

---

## 🚀 4. แผนการพัฒนา MVP (Minimum Viable Product Execution Roadmap)

เพื่อให้งานเสร็จสมบูรณ์ คุณภาพสูง และส่งทันตามกำหนดการของอาจารย์เป๊ะๆ ระบบจะแบ่งการพัฒนาออกเป็น 5 Sprint หลัก ดังนี้:

```mermaid
gantt
    title DISNEY LORCANA PLAYLAB CLOUD - MVP Execution Timeline
    dateFormat  YYYY-MM-DD
    section Stage 1
    Proposal & Setup Stage 1         :done, s1, 2026-07-22, 2026-07-31
    section Stage 2 (Goal: Sep 10 / Sep 22)
    Sprint 1: Scaffold & Board UI UI   :active, sp1, 2026-08-01, 2026-08-15
    Sprint 2: Auth & Deck Manager      :sp2, 2026-08-16, 2026-09-10
    Sprint 3: WebSockets Match Sync    :sp3, 2026-09-11, 2026-09-26
    section Stage 3 (Goal: Oct 10 / Oct 20)
    Sprint 4: Async Analyzer & Metrics :sp4, 2026-09-27, 2026-10-10
    Sprint 5: Final Defense & Polish  :sp5, 2026-10-11, 2026-10-25
```

### 🔹 Sprint 1: Scaffold & Play Area UI (1 สิงหาคม – 15 สิงหาคม 2569)
*   **เป้าหมาย:** สร้างโครงร่างโครงการ Frontend (React + Vite) และวางเลเอาต์กระดานซ้อมเล่น Lorcana Board
*   **รายละเอียดงาน:**
    *   [ ] ตั้งค่าโครงสร้างโครงการ `src/` ด้วย React + Vite และ Tailwind CSS
    *   [ ] ออกแบบเลเอาต์กระดานซ้อมเล่นตามผัง Lorcana Play Area (Play Area, Inkwell, Lore Tracker, Deck, Discard)
    *   [ ] นำเข้าไฟล์ JSON การ์ด 408 ใบ (Set 1 & Set 2) ไว้ใน `public/dataset/lorcana_set1_set2.json`
    *   [ ] พัฒนาระบบ Drag & Drop พื้นฐานด้วย HTML5 Drag and Drop API บนหน้าบ้าน

### 🔹 Sprint 2: Authentication & Deck Builder — *เป้าหมายส่งงาน Stage 2 (16 สิงหาคม – 10 กันยายน 2569)*
*   **เป้าหมาย:** ระบบลงทะเบียน เข้าสู่ระบบ และระบบสร้าง/จัดเก็บเด็คการ์ด (*ส่งรายงานความก้าวหน้า Stage 2 วันที่ 10 ก.ย. 2569*)
*   **รายละเอียดงาน:**
    *   [ ] พัฒนา AWS Lambda Function สแกนและลงทะเบียนผู้ใช้ด้วย `bcrypt` รหัสผ่าน
    *   [ ] พัฒนา AWS Lambda Function สำหรับ Login ตรวจสอบรหัสผ่านและสร้าง `JWT Token`
    *   [ ] ตั้งค่าตาราง **Amazon DynamoDB (`UsersTable` & `DecksTable`)**
    *   [ ] พัฒนา REST API (Lambda + API Gateway) สำหรับระบบจัดการเด็ค (Create, Read, Update, Delete Decks)
    *   [ ] สร้างหน้า UI Deck Builder ค้นหาการ์ด 408 ใบ จัดกองการ์ดหลัก 60 ใบ และเซฟลง DynamoDB

### 🔹 Sprint 3: WebSockets Real-time Room Sync — *เป้าหมายนำเสนอ Stage 2 (11 กันยายน – 26 กันยายน 2569)*
*   **เป้าหมาย:** บอร์ดจำลองห้องเล่นซิงค์พิกัดการ์ดเรียลไทม์ระหว่าง 2 ผู้เล่น (*นำเสนอ Stage 2 วันที่ 22-26 ก.ย. 2569*)
*   **รายละเอียดงาน:**
    *   [ ] ตั้งค่า **AWS API Gateway WebSockets** (`$connect`, `$disconnect`, `sendmessage`)
    *   [ ] พัฒนา Lambda Function **Room Router** ซิงค์สถานะห้องใน DynamoDB
    *   [ ] ซิงค์พิกัดการลากวางการ์ด, การหมุนเอียง Ready/Exert, การคว่ำการ์ดลง Inkwell และ Lore Counter ให้คู่เล่นฝั่งตรงข้ามเห็นทันที (<100ms)
    *   [ ] พัฒนาระบบ Auto-Reconnect ภายใน 30 วินาทีเมื่อสัญญาณเน็ตหลุด

### 🔹 Sprint 4: Asynchronous Deck Analyzer & CloudWatch — *เป้าหมายส่งงาน Stage 3 (27 กันยายน – 10 ตุลาคม 2569)*
*   **เป้าหมาย:** ระบบวิเคราะห์สถิติเด็คการ์ดเบื้องหลังและแดชบอร์ดติดตามคลาวด์ (*ส่งรายงาน Stage 3 วันที่ 10 ต.ค. 2569*)
*   **รายละเอียดงาน:**
    *   [ ] ตั้งค่า Amazon S3 Event Trigger ➔ **Amazon SQS Queue**
    *   [ ] พัฒนา Lambda Function **Deck Synergy Analyzer** ดึงคิวข้อความไปคำนวณ Ink Distribution และ Cost Curve
    *   [ ] พัฒนาการส่งผลลัพธ์ผ่าน WebSocket กลับไปวาดแผนภูมิกราฟสถิติจุดร่ายบนเบราว์เซอร์ด้วย Chart.js
    *   [ ] ตั้งค่า **AWS CloudWatch Metrics & Billing Alarms** ติดตาม Latency และสรุปบิล $0.00

### 🔹 Sprint 5: Final Polish, Report & Defense — *เป้าหมายวันสอบไฟนอล (11 ตุลาคม – 25 ตุลาคม 2569)*
*   **เป้าหมาย:** ทดสอบระบบฉบับสมบูรณ์ รวบรวมเอกสารอ้างอิง Intext/Reference และเตรียมสไลด์นำเสนอสอบไฟนอล (*นำเสนอไฟนอล วันที่ 20-25 ต.ค. 2569*)
*   **รายละเอียดงาน:**
    *   [ ] ทำ End-to-End System Testing และประสานไฟล์เอกสารรายงานฉบับสมบูรณ์
    *   [ ] ตรวจสอบความถูกต้องของการอ้างอิงเอกสาร (Intext Reference & Reference List) ตามคู่มือการเขียนโครงงาน
    *   [ ] จัดเตรียมสไลด์นำเสนอฉบับสอบไฟนอลและอัดวิดีโอตัวอย่างการใช้งานระบบ (Demo Video)

---

## 🎯 5. กฎเหล็กสำหรับการทำงานร่วมกับ AI Agent (Agent Rules of Engagement)

1.  **อ่านไฟล์ตาม List 2.1 - 2.3 ให้ครบก่อนเริ่มเขียนโค้ด:** ห้าม AI Agent มโนโครงสร้าง API หรือชื่อ Table เอาเองเด็ดขาด
2.  **ปฏิบัติตามหลัก 100% AWS Free Tier ($0.00):** ห้ามสร้าง Resource ใน AWS ที่มีค่าใช้จ่าย (เช่น EC2, RDS, NAT Gateway) ให้ใช้เฉพาะ Serverless เท่านั้น
3.  **รักษาความปลอดภัยด้วย Lambda Auth + JWT:** ห้ามถอยกลับไปใช้ Cognito หรือ Plaintext Password โดยเด็ดขาด
4.  **ห้ามลบหรือทำลายไฟล์เดิม:** ปฏิบัติตามกฎความปลอดภัย TAWAN-OS อย่างเคร่งครัด
