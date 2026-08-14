# Revised Sprint Plan (Stage 2 & Stage 3)
**Project:** Disney Lorcana PlayLab Cloud
**Updated:** 14 Aug 2026

## การประเมิน Sprint 1-3 ปัจจุบัน
* **จุดแข็ง:** โครงสร้างพื้นฐาน Cloud (Serverless) ถูกวางไว้อย่างดีเยี่ยม, ระบบ WebSocket ทำงานได้จริง, และแก้ปัญหาข้อจำกัด Learner Lab ได้ (ใช้ `deploy_manual.sh`)
* **จุดเสี่ยง:** ระบบยังขาด Automated Testing, CI/CD Pipeline ยังเป็น Manual Deploy, และยังไม่ได้นำ SQS มาใช้งานจริงตามแผนสถาปัตยกรรม Microservices เต็มรูปแบบ
* **ข้อควรปรับปรุง:** ควรเพิ่มการจัดการ Error Handling ใน Lambda, เพิ่ม CloudWatch Alarms เพื่อติดตาม Error 

---

## แผน Sprint ที่ปรับใหม่ (Sprint 4-7)
ปรับลดระยะเวลาให้กระชับ เพื่อสอดคล้องกับกำหนดการส่งมอบงานจริง (10 ก.ย. และ 10 ต.ค.)

### Sprint 4: Deck Analyzer & Frontend Integration (16-30 ส.ค.)
* **เป้าหมาย:** ทำระบบประมวลผลพื้นหลัง และเชื่อมต่อหน้าเว็บ 100%
* **งานย่อย (Checklist):**
  - [ ] พัฒนา Lambda `DeckAnalyzer` เพื่อวิเคราะห์ Synergy และ Cost ของเด็ค
  - [ ] ตั้งค่า Amazon SQS เพื่อรับคิวการวิเคราะห์เด็ค
  - [ ] ปรับ UI Deck Builder ให้เรียกใช้งาน HTTP API Gateway ตัวจริง
  - [ ] ตรวจสอบและตั้งค่า CORS (API Gateway)
  - [ ] เพิ่ม JWT Expiry Check (Security Best Practice)
* **Cloud Services:** SQS, Lambda, API Gateway
* **Free Tier Cost:** $0 (อยู่ใน Free Tier SQS/Lambda)

### Sprint 5: Stage 2 Preparation & Polish (1-10 ก.ย.)
* **เป้าหมาย:** ให้ระบบสมบูรณ์ที่สุดก่อนส่งรายงานความก้าวหน้า
* **งานย่อย (Checklist):**
  - [ ] เขียน Unit/Integration Testing (Jest) เบื้องต้น
  - [ ] รวม Cloud Architecture Diagram ฉบับล่าสุดลงเอกสาร
  - [ ] เขียนคู่มือการใช้งานและสรุปผลพัฒนาเบื้องต้น
  - [ ] ทดสอบ End-to-end Flow (Login -> Build Deck -> Play)
* **สิ่งที่ต้องส่ง (10 ก.ย.):** **รายงานความก้าวหน้า Stage 2 (12 คะแนน)**
* **Best Practice:** เริ่มตั้งค่า CloudWatch Logs Dashboard เพื่อโชว์อาจารย์

---

### Sprint 6: Real-time Resilience (11-26 ก.ย.)
* **เป้าหมาย:** เพิ่มความเสถียรให้ระบบ WebSocket และนำเสนอ Stage 2
* **งานย่อย (Checklist):**
  - [ ] นำเสนอความก้าวหน้า (22-26 ก.ย.)
  - [ ] เพิ่มระบบ Auto-reconnect และ Heartbeat ใน Frontend WebSocket
  - [ ] ปรับปรุง RoomStateTable ให้อัปเดตสถานะแบบ Eventual Consistency ที่ดีขึ้น
  - [ ] ตั้งค่า CloudWatch Alarms ถ้า WebSocket Error Rate สูง (Error Handling & Monitoring Best Practice)
* **Cloud Services:** CloudWatch, WebSocket API Gateway

### Sprint 7: Cloud Testing & Stage 3 Finalization (27 ก.ย.-10 ต.ค.)
* **เป้าหมาย:** ทดลองประสิทธิภาพ, สรุปบิล, และจัดทำรายงาน Stage 3
* **งานย่อย (Checklist):**
  - [ ] ทดลองโหลดบอทเข้าสู่ระบบ WebSocket เพื่อเก็บสถิติ Latency
  - [ ] ตั้งค่า CI/CD พื้นฐานโดยใช้ GitHub Actions (ถ้าใช้ SAM ไม่ได้ ให้ใช้ GitHub Actions รัน `deploy_manual.sh` อัตโนมัติผ่าน Access Key ของบัญชีปกติ หรือจำลองให้เห็น Flow)
  - [ ] จัดทำ Cost Analysis วิเคราะห์ราคาเทียบกับการจำลองการใช้งานจริง 100,000 requests/เดือน
  - [ ] จัดทำรายงานผลการทดลองฉบับเต็ม
* **สิ่งที่ต้องส่ง (10 ต.ค.):** **ผลการทดลอง Stage 3 (10 คะแนน)**
* **นำเสนอ (20-25 ต.ค.):** **นำเสนอ Stage 3 (5 คะแนน)**

## Cloud Best Practices ที่บังคับใช้
1. **Security:** JWT Token Authentication, Least Privilege (LabRole), CORS.
2. **Resilience & Asynchronous:** ใช้ SQS ในการ decouple การทำงานที่ใช้เวลานาน (Deck Analyzer).
3. **Monitoring & Ops:** ใช้ Amazon CloudWatch รวบรวม Logs จาก Lambda ทั้งหมด พร้อมตั้งค่า Alarms.
4. **CI/CD:** ผลักดันให้มี Automated Pipeline สำหรับการ Deploy และ Testing.
