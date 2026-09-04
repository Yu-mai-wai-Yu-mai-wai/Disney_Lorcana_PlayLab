# 📚 Disney Lorcana PlayLab Cloud — Documentation Master Index
> **ศูนย์รวมเอกสารประกอบโครงงานวิชา Cloud Technology (05506013) ภาคเรียนที่ 1/2569**  
> **คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)**  
> **ทีมผู้พัฒนา:** Disney Lorcana Cloud Project Team (KMITL IT)

---

## 🗺️ แผนผังการจัดเก็บเอกสาร (Directory Map)

โครงสร้างโฟลเดอร์เอกสารได้รับการจัดระเบียบตามมาตรฐาน Johnny.Decimal และแบ่งแยกตาม **สถานะความสดใหม่ของสถาปัตยกรรม (Architecture Evolution)** อย่างชัดเจน:

```
docs/
├── 📄 README.md                                  # ดัชนีแผนผังเอกสารหลัก (ไฟล์นี้)
│
├── 📂 01_Reports/                                # 🟢 เอกสารรายงาน Stage 2 ล่าสุด (IaaS Multi-AZ VPC)
│   ├── G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.md # ⭐ เล่มรายงานฉบับสมบูรณ์ 5 บท (Source of Truth ปัจจุบัน)
│   ├── PROGRESS_REPORT_Sprint1-3.md              # ⭐ สรุปความก้าวหน้า Sprint 1-3 (พร้อมส่ง 10 ก.ย.)
│   ├── STAGE2_ARCHITECTURE_EVIDENCE.md           # หลักฐานการ Deploy จริงบน AWS (ALB DNS, VPC, ASG)
│   └── AWS_LearnerLab_Setup.md                   # คู่มือคุมงบ $50 และสคริปต์ 1-Click Scale-to-Zero
│
├── 📂 02_Slides/                                 # 🟢 สไลด์นำเสนอ Stage 2 (กันยายน 2569)
│   ├── stage2_presentation_slides.html           # ⭐ สไลด์นำเสนอหลักฉบับสมบูรณ์ (94 สไลด์)
│   ├── phase2_presentation_slides.html           # สไลด์นำเสนอแบบละเอียดเชิงลึก (98 สไลด์)
│   ├── DISNEY_LORCANA_PHASE2_SLIDES.html         # สไลด์นำเสนอเวอร์ชันกระชับ (50 สไลด์)
│   └── templates/                                # แม่แบบจัดหน้า Canva
│       ├── phase2_slides_canva_template.html     # เทมเพลตสไลด์ Canva (89 สไลด์)
│       └── phase2_slides_canva_prototype.html    # พิมพ์เขียวสไลด์ Canva (89 สไลด์)
│
├── 📂 03_QA_Testing/                             # 🟡 เอกสารแผนและผลการทดสอบระบบ
│   ├── QA_TEST_PLAN.md                           # แผนการทดสอบระบบและข้อกำหนด OWASP
│   ├── QA_TEST_REPORT.md                         # รายงานผลการทดสอบ QA (ผ่าน 49/50 Test Cases)
│   └── plans/                                    # แผนบันทึกการทำงานของ Agent ช่วงพัฒนา
│       ├── 2026-08-13-accessibility-ux-polish.md
│       ├── 2026-08-13-de-slop-redesign.md
│       └── 2026-08-22-qa-testing-web-uxui-aws-cloud.md
│
├── 📂 04_References/                             # 🔵 เอกสารอ้างอิงและสื่อประกอบ
│   ├── Doc_Ref/                                  # ประกาศเกณฑ์วิชา Cloud, คู่มือ, Proposal Phase 1
│   ├── HowToPlay_Lorcana_Transcript.md           # สรุปกฎและวิธีเล่นการ์ด Disney Lorcana
│   └── images/                                   # ภาพประกอบหน้าจอ UI ระบบ
│
└── 📂 _ARCHIVE/                                  # 🔴 เอกสารเก่า/ฉบับย้อนหลัง (เก็บไว้อ้างอิง ไม่ลบ)
    ├── 2026-08-20_Early_Draft/                   # (เดิมคือ reports/) เล่มร่างแรกสุด (20 ส.ค. 2569)
    ├── 2026-08-24_Serverless_Report/             # เล่ม XeLaTeX 27 หน้าฉบับ Serverless เดิม (24 ส.ค. 2569)
    │   ├── compiled_optimized/                   # ไฟล์คอมไพล์รอบ Optimized (3.5 MB) พร้อมสคริปต์ build
    │   └── images/                               # ภาพประกอบเล่มรายงานรอบ 24 ส.ค.
    ├── Sprint_History/                           # บันทึก Sprint ย้อนหลัง (SPRINT_JOURNAL, WebSocket Note)
    └── build_artifacts/                          # ไฟล์ชั่วคราวจากการคอมไพล์ LaTeX และทดสอบฟอนต์
```

---

## 📌 ตารางเปรียบเทียบ: เอกสารฉบับใหม่ vs. ฉบับเก่า

| หมวดหมู่ | 🟢 ฉบับใหม่ล่าสุด (Current / New) | 🔴 ฉบับเดิม (Legacy / Archived) | ความแตกต่างสำคัญ |
|---|---|---|---|
| **เล่มรายงาน Stage 2** | [`01_Reports/G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.md`](./01_Reports/G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.md) | `_ARCHIVE/2026-08-24_Serverless_Report/` & `_ARCHIVE/2026-08-20_Early_Draft/` | ฉบับใหม่อัปเกรดเป็น **Lean Multi-AZ VPC + ALB + Auto Scaling Group + Docker** ตรงตามเกณฑ์ IaaS |
| **รายงานความก้าวหน้า** | [`01_Reports/PROGRESS_REPORT_Sprint1-3.md`](./01_Reports/PROGRESS_REPORT_Sprint1-3.md) | `_ARCHIVE/2026-08-20_Early_Draft/PROGRESS_REPORT_Sprint1-3.pdf` | ฉบับใหม่อัปเดตผลงานครบ 100% Sprint 1-3 พร้อมนำเสนอ 22-26 ก.ย. |
| **สไลด์นำเสนอ** | [`02_Slides/stage2_presentation_slides.html`](./02_Slides/stage2_presentation_slides.html) | สไลด์เก่าใน Phase 1 | มีเนื้อหาครบ 94 สไลด์ ครอบคลุม Architecture Evolution, Cost, Well-Architected |
| **หลักฐานการ Deploy** | [`01_Reports/STAGE2_ARCHITECTURE_EVIDENCE.md`](./01_Reports/STAGE2_ARCHITECTURE_EVIDENCE.md) | - | บันทึก ALB DNS, Target Group, Security Groups และ Docker Compose |
| **การควบคุมงบประมาณ** | [`01_Reports/AWS_LearnerLab_Setup.md`](./01_Reports/AWS_LearnerLab_Setup.md) | - | วิธีรัน `lab_start.ps1` และ `lab_stop.ps1` คุมงบ $50 |

---

## 💡 แนวทางการใช้งานสำหรับทีมงานและอาจารย์ผู้ตรวจ

1. **สำหรับการตรวจรายงานความก้าวหน้า Stage 2 (10 ก.ย. 2569):**
   - เปิดอ่านสรุปผู้บริหาร: [`01_Reports/PROGRESS_REPORT_Sprint1-3.md`](./01_Reports/PROGRESS_REPORT_Sprint1-3.md)
   - เปิดอ่านเล่มรายงานฉบับสมบูรณ์ 5 บท: [`01_Reports/G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.md`](./01_Reports/G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.md)
   - ตรวจสอบหลักฐานบน AWS และ URL จริง: [`01_Reports/STAGE2_ARCHITECTURE_EVIDENCE.md`](./01_Reports/STAGE2_ARCHITECTURE_EVIDENCE.md)

2. **สำหรับการนำเสนอ Stage 2 (22–26 ก.ย. 2569):**
   - ดับเบิลคลิกเปิดไฟล์ [`02_Slides/stage2_presentation_slides.html`](./02_Slides/stage2_presentation_slides.html) บนเบราว์เซอร์เพื่อเริ่มนำเสนอได้ทันที (ใช้ลูกศรซ้าย/ขวาเปลี่ยนสไลด์)
   - หากต้องการจัดหน้าบน Canva ให้เปิดแม่แบบใน [`02_Slides/templates/`](./02_Slides/templates/)

3. **สำหรับการอ้างอิงประวัติสถาปัตยกรรม (Architecture Evolution):**
   - เอกสารสถาปัตยกรรม Serverless เดิมสามารถเปิดดูได้ใน [`_ARCHIVE/2026-08-24_Serverless_Report/`](./_ARCHIVE/2026-08-24_Serverless_Report/) เพื่อเปรียบเทียบข้อดี-ข้อเสีย (Trade-off Analysis) ระหว่าง Serverless กับ IaaS
