# 🧪 Disney Lorcana PlayLab Cloud — QA Master Test Plan & Verification Matrix

> **ระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนคลาวด์ Serverless**  
> *เอกสารแผนการทดสอบคุณภาพระบบ (Quality Assurance Test Plan) ด้าน UX/UI และ AWS Cloud*  
> *อ้างอิง: [PLAN_PROJECT.md](file:///d:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/PLAN_PROJECT.md) และ [CASE_STUDY.md](file:///d:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/CASE_STUDY.md)*

---

## 📌 1. ภาพรวมและวัตถุประสงค์ (Overview & Objectives)

เอกสารฉบับนี้กำหนดมาตรฐาน ขั้นตอน และตารางเมทริกซ์การทดสอบคุณภาพระบบ (QA Test Matrix) ของโปรเจกต์ **Disney Lorcana PlayLab Cloud** ครอบคลุม 2 แกนหลัก:
1. **UX/UI & Usability Testing:** ความถูกต้องและความลื่นไหลของระบบจำลองการเล่นการ์ด (Lorcana Board Mechanics), ระบบจัดเด็คและค้นหาการ์ด 408 ใบ (Deck Builder), กราฟสถิติ (Analytics Dashboard), การแสดงผลแบบ Responsive Design บน Desktop, Laptop, Tablet, Mobile และเอฟเฟกต์ WebGL Gold Ink Shader Canvas
2. **AWS Serverless Cloud Verification:** การทำงานของระบบ Custom Auth (bcrypt + JWT), REST API จัดการเด็คบน Amazon DynamoDB, การสื่อสารแบบสองทิศทางเรียลไทม์ผ่าน AWS API Gateway WebSockets (<100ms), และระบบ Asynchronous SQS Analyzer ภายใต้งบประมาณ **AWS Free Tier ($0.00)**

---

## 🎯 2. สภาพแวดล้อมและเครื่องมือที่ใช้ทดสอบ (Testing Environment & Tooling)

| หมวดหมู่ | เทคโนโลยี / เครื่องมือ | วัตถุประสงค์ |
| :--- | :--- | :--- |
| **Unit & Store Testing** | **Vitest 3.x + JSDOM** | ทดสอบ Zustand Stores (`useAuthStore`, `useDeckStore`, `useLanguageStore`, `usePlaymatStore`) |
| **Domain Logic Testing** | **Vitest + TypeScript** | ทดสอบกฎกติกาเด็ค Lorcana (60 ใบ, ไม่เกิน 2 สี, ห้ามซ้ำเกิน 4 ใบ, Inkable check) และ Cost Curve |
| **Cloud Lambda Testing** | **Vitest + AWS SDK v3 Mocks** | ทดสอบ Handler ฟังก์ชัน Lambda: `auth/register`, `auth/login`, `deck/handler`, `room/handler`, `analyzer/handler` |
| **End-to-End UI Testing** | **Playwright Test** | ทดสอบจำลองการใช้งานบนเบราว์เซอร์จริง (Chromium, WebKit, Mobile Viewports) |
| **Real-time Sync Testing** | **Playwright Multi-Context** | ทดสอบเปิด 2 Session พร้อมกัน (Player 1 vs Player 2) วัด Latency และการซิงค์พิกัดการ์ด |
| **Live Cloud Audit** | **Node.js TSX Runner** | ทดสอบยิง API จริงไปยัง AWS API Gateway REST & WebSocket Endpoints บน `us-east-1` |

---

## 📊 3. ตารางเมทริกซ์กรณีทดสอบ (Master Test Matrix)

### 🎨 หมวดที่ 1: UX/UI & Web Client Mechanics
| รหัส (ID) | ส่วนงาน (Feature) | เงื่อนไข / สิ่งที่ทดสอบ (Test Case Scenario) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| `TC-UI-01` | **Game Hub & Navigation** | โหลดหน้าแรก, ตรวจสอบ WebGL Gold Ink Shader, สลับแท็บ Hub -> Lobby -> Board -> Deck Builder -> Analytics -> Rules -> Dashboard | แสดงผลกราฟิกหรูหรา สลับแท็บได้ราบรื่น ไม่มี Console Error | ⏳ พร้อมรัน |
| `TC-UI-02` | **Deck Builder Search & Filter** | ค้นหาชื่อการ์ด ("Elsa", "Mickey", "Maleficent"), ฟิลเตอร์ตามสี Ink (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel), ฟิลเตอร์ Type และ Inkable | แสดงการ์ดถูกต้องจากชุด 408 ใบ ค้นหาและกรองได้ทันที | ⏳ พร้อมรัน |
| `TC-UI-03` | **Deck Validation Rules** | เพิ่มการ์ดเข้าเด็ค ตรวจสอบเงื่อนไข: เด็คต้องมีอย่างน้อย 60 ใบ, มีสี Ink ไม่เกิน 2 สี, แต่ละใบซ้ำได้ไม่เกิน 4 ใบ | ระบบแจ้งเตือนสถานะความถูกต้องของเด็ค (Valid/Invalid) ตามกฎ Lorcana เป๊ะ | ⏳ พร้อมรัน |
| `TC-UI-04` | **Board: Draw & Play** | ในกระดานซ้อมเล่น ลากการ์ดจากมือ (Hand) ไปยังสนาม (Play Area/Field) | การ์ดถูกวางบนสนาม แสดงเอฟเฟกต์แอนิเมชัน และอัปเดตจำนวนการ์ดในมือ | ⏳ พร้อมรัน |
| `TC-UI-05` | **Board: Exert / Ready** | คลิกปุ่ม Exert หรือหมุนการ์ดบนสนาม 90 องศา และกด Ready เพื่อคืนสภาพ | การ์ดหมุนเอียง 90 องศา แสดงสถานะ Exert และคืนรูปแนวตั้งเมื่อ Ready | ⏳ พร้อมรัน |
| `TC-UI-06` | **Board: Inkwell System** | ลากหรือส่งการ์ดที่เป็น Inkable เข้า Inkwell | การ์ดคว่ำหน้าลง Inkwell และตัวนับ Ink Count เพิ่มขึ้น 1 | ⏳ พร้อมรัน |
| `TC-UI-07` | **Board: Lore Counter & Win Modal** | ปรับค่า Lore Counter เพิ่มขึ้นจนถึง 20 Lore | แสดง Victory / GameOver Modal พร้อมเอฟเฟกต์เฉลิมฉลอง | ⏳ พร้อมรัน |
| `TC-UI-08` | **Board: 3D Inspector & Dice Duel** | คลิกการ์ดเพื่อเปิด 3D Card Inspector หมุนดูการ์ด และเปิดใช้งาน Dice Duel Modal | โมดอล 3D แสดงรายละเอียดการ์ดคมชัด และระบบทอยลูกเต๋าทำงานถูกต้อง | ⏳ พร้อมรัน |
| `TC-UI-09` | **Responsive & Layout Audit** | ทดสอบบนความละเอียด Desktop (1920x1080, 1440x900), Tablet (iPad 768x1024), และ Mobile (iPhone 390x844) | เลเอาต์ไม่ล้น (No clipping), กระดาน Fit หน้าจอ, เมนูและปุ่มกดใช้งานได้ทุกขนาด | ⏳ พร้อมรัน |

---

### ⚡ หมวดที่ 2: Real-time Multi-Client Sync & WebSockets
| รหัส (ID) | ส่วนงาน (Feature) | เงื่อนไข / สิ่งที่ทดสอบ (Test Case Scenario) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| `TC-WS-01` | **Room Creation & Join** | Player 1 สร้างห้องใน Match Lobby, Player 2 กรอก Room ID เข้าร่วมห้องเดียวกัน | ทั้ง 2 ผู้เล่นเชื่อมต่อ WebSocket และเข้าสู่กระดานพร้อมสถานะพร้อมเล่น | ⏳ พร้อมรัน |
| `TC-WS-02` | **Real-time Card Action Sync** | Player 1 เล่นการ์ดลงสนาม | หน้าจอของ Player 2 แสดงการ์ดที่ฝั่งตรงข้ามเล่นทันทีด้วยความหน่วง < 100ms | ⏳ พร้อมรัน |
| `TC-WS-03` | **Real-time Lore Sync** | Player 1 เพิ่มคะแนน Lore | หน้าจอของ Player 2 อัปเดตตัวเลข Lore ของฝ่ายตรงข้ามทันที | ⏳ พร้อมรัน |
| `TC-WS-04` | **Auto-Reconnect & State Recovery** | จำลองสัญญาณเน็ตหลุด (Disconnect) แล้วเชื่อมต่อใหม่ภายใน 30 วินาที | ระบบทำการ Reconnect อัตโนมัติและกู้คืน Board State เดิมจาก DynamoDB/Cache ได้สมบูรณ์ | ⏳ พร้อมรัน |

---

### ☁️ หมวดที่ 3: AWS Serverless Cloud Architecture & APIs
| รหัส (ID) | ส่วนงาน (Feature) | เงื่อนไข / สิ่งที่ทดสอบ (Test Case Scenario) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ |
| :--- | :--- | :--- | :--- | :---: |
| `TC-AWS-01` | **Custom Lambda Auth (Register)** | ยิง `POST /auth/register` ด้วย username, email, password | รหัสผ่านถูกเข้ารหัสด้วย `bcrypt` (10 rounds) และบันทึกลง `LorcanaUsers` DynamoDB | ⏳ พร้อมรัน |
| `TC-AWS-02` | **Custom Lambda Auth (Login)** | ยิง `POST /auth/login` ด้วย credential ที่ถูกต้อง และทดสอบรหัสผ่านผิด | ส่งกลับ JWT Token เมื่อถูกต้อง และส่งกลับ 401 Unauthorized เมื่อรหัสผ่านผิด | ⏳ พร้อมรัน |
| `TC-AWS-03` | **Decks REST API (CRUD)** | ยิง `POST /decks`, `GET /decks`, `DELETE /decks/{id}` | บันทึก ดึงข้อมูล และลบเด็คใน `LorcanaDecks` DynamoDB ได้ถูกต้อง | ⏳ พร้อมรัน |
| `TC-AWS-04` | **SQS Deck Synergy Analyzer** | ส่งคำขอวิเคราะห์เด็คผ่าน SQS Trigger | ประมวลผล Cost Curve, Ink Breakdown และส่งคะแนน Synergy กลับมา | ⏳ พร้อมรัน |
| `TC-AWS-05` | **AWS Free Tier ($0.00) Compliance** | ตรวจสอบประเภท Resource: DynamoDB PAY_PER_REQUEST, Lambda on-demand, API Gateway | ไม่มีค่าใช้จ่ายแอบแฝง (No EC2, No RDS, No NAT Gateway) | ⏳ พร้อมรัน |

---

## 📈 4. เกณฑ์การประเมินความสำเร็จ (Acceptance Criteria)

1. **Automated Test Pass Rate:** 100% ของ Unit, Integration, และ E2E Test Cases ผ่านทั้งหมด (Zero Failures)
2. **Performance Benchmark:** WebSocket Action Sync Latency < 100ms
3. **Responsive Quality:** 0 Layout Overflows หรือ Visual Glitches บน Viewports มาตรฐาน
4. **Cloud Integrity:** ระบบ Auth และ REST API ทำงานปลอดภัยด้วย JWT และ bcrypt 100%
