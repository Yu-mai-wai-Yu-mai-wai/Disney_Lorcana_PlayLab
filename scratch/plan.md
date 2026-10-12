# Spec: Stage 3 — Game Engine Correctness, Real Analytics, Caching + Decoupling, Report

Status: Stage 3 สร้างและพิสูจน์บน AWS จริงแล้ว (2026-10-12) | สเปกใหม่ "pause/resume" รอตะวันตอบ "Proceed" | Updated: 2026-10-12
Deadlines: ผลทดลอง Stage 3 วันที่ 10 ต.ค. 2569 (ส่งแล้ว), นำเสนอ Final วันที่ 26 ต.ค. 2569
Audit ที่เป็นที่มาของสเปกนี้: ดูหัวข้อ "Audit Evidence" ท้ายไฟล์

## สถานะปัจจุบัน (อัปเดต 2026-10-12) อ่านหัวข้อนี้ก่อนทำงานต่อ

ผู้เขียน: Claude Code ตามคำสั่งตะวันผ่าน Hermes (Discord) รายละเอียดคำสั่งและเหตุผลอยู่ใน `docs/specs/2026-10-11_post-pr2_learner_lab_runbook.md`

### ข้อเท็จจริงของระบบ ณ 2026-10-12

| เรื่อง | สถานะ | ที่มา |
|---|---|---|
| โค้ดบน `main` | PR #2 (d49d2b2: แก้บั๊ก ความปลอดภัย CI), PR #4 (544c399: `ensure_pipeline.ps1` เปิด event source mapping ที่ Disabled, หลักฐานรายงาน), `e1c65e9` (แก้ `docs/CODEBASE_ANALYSIS_TH.md`) | `git log origin/main` |
| Vitest | 135 ผ่าน 22 ไฟล์ | รันเองวันที่ 12 |
| E2E บน ALB จริง | 54 ผ่าน, TC-E2E-23 ล้มครั้งแรกเพราะ mapping Disabled แล้วผ่านหลังเปิด mapping | `docs/01_Reports/stage3_evidence/e2e_after_pr2_2026-10-12.txt` |
| Auto Scaling | 2→3 เวลา 04:22:05Z, 3→4 เวลา 04:28:05Z, ลดกลับเหลือ 2 ที่ 04:44:41Z และ 04:46:34Z, login 18,270 ครั้ง ล้มเหลว 0 | `docs/01_Reports/stage3_evidence/stress_scaling_2026-10-12.txt` |
| AWS ตอนนี้ | ASG `lorcana-asg` Min 0 / Desired 0 / Max 4 (หลัง `lab.ps1 stop`), ALB `lorcana-alb` active, ElastiCache `lorcana-cache` (engine redis) available | ตรวจ read-only 2026-10-12 |
| งบ Learner Lab | ใช้ไป 14.8 จาก 50 ดอลลาร์ ณ 2026-10-12 (ตะวันรายงาน) ค่าที่ยังวิ่งหลัง stop คือ ALB กับ ElastiCache ราว 0.05 ดอลลาร์ต่อชั่วโมง (คำนวณจากราคาในเอกสาร ยังไม่เทียบ Cost Explorer) | ตะวัน |
| ปรึกษาอาจารย์ 2026-10-12 16:30 | อาจารย์ให้ปรับ diagram draw.io ให้ละเอียดอ่านง่าย อธิบาย process ของ Lambda, EC2, ElastiCache และเส้นทุกเส้น คำถามที่อาจารย์สงสัย: ElastiCache ใช้ทำอะไร, Lambda ทำอะไร, ออกอินเทอร์เน็ตอย่างไรเมื่อไม่มี NAT, ตรรกะเกมอยู่ที่ Lambda หรือ EC2 | ตะวันรายงาน |
| นำเสนอ Final | 2026-10-26 | ตะวัน |

### เอกสารที่ทำวันที่ 12 (บางไฟล์ยังไม่ commit ดู git status)

- `docs/architecture/aws_architecture_lorcana_playlab_detailed.drawio` 6 หน้า: ภาพรวม, EC2+ElastiCache, Lambda, ใครทำอะไร, เครือข่าย, ลำดับเหตุการณ์ (ใช้ไอคอน AWS) ยังไม่ได้เปิดตรวจภาพใน draw.io และยังไม่ export PNG
- `docs/architecture/PROFESSOR_CLOUD_ARCHITECTURE.md` (เดิมชื่อ `EMAIL_TO_PROFESSOR_CLOUD_ARCHITECTURE.md`) สคริปต์คุยอาจารย์ ยังไม่มีคำตอบ 4 ข้อที่อาจารย์ถามต่อท้าย
- `docs/architecture/aws_architecture_lorcana_playlab.drawio` แก้ป้าย React 19 และ `$disconnect` ส่วน PNG `Aws_disney_lorcana.drawio.png` ยังเป็นรุ่นเก่า
- `docs/CODEBASE_ANALYSIS_TH.md` บรรทัด 34 ยังเขียน "ไม่มี CI pipeline" และ 1,599 บรรทัด ซึ่งผิด (CI มีแล้ว, ไฟล์ 1,623 บรรทัด)

### ค้างอยู่ เรียงลำดับ (รายละเอียดอยู่ใน `scratch/tickets.md` หัวข้อ Ledger 2026-10-12)

1. commit และ push เอกสารที่ค้าง (ตะวันรันเอง เพราะ git commit/push ผ่านเครื่องมือของ Claude ถูกปฏิเสธ)
2. เปิด drawio ตรวจภาพ แก้เส้นที่ทับ แล้ว export PNG ใส่รายงาน
3. สเปก pause/resume (หัวข้อถัดไป) รอ "Proceed"
4. ความปลอดภัย WebSocket: `$connect` ไม่ตรวจ JWT, relay ไม่ตรวจว่าผู้ส่งเป็นสมาชิกห้อง, ไม่ตรวจ schema ของข้อความ, ผลแข่งมาจาก client (แผนแก้ยังไม่เขียน ตะวันยังไม่ตัดสินใจว่าจะทำ)
5. publish Lambda `lorcana-room` และ `lorcana-auth-register` ที่ยังเป็นโค้ดก่อน PR #2 และ JWT_SECRET ของ auth-register, analyzer, room ไม่ตรงกับค่าใน SSM
6. รันซ้ำบน stack ใหม่: ASG self-healing (`test_asg_recovery.ps1`), ทดสอบ DLQ, และรัน `ensure_pipeline.ps1` ที่แก้ (ตรวจแค่ syntax ยังไม่เคยรันจริง)
7. ลบบัญชีทดสอบ `stress_bot` และ `e2e_*` ใน UsersTable (ตะวันรันเอง)
8. compile รายงาน `.tex` หลังเพิ่มรูปบท 4 (ยังไม่ได้ compile)
9. ตัดสินใจ `destroy` กับปล่อยไว้ ตามงบ ดูหัวข้อด้านล่าง

### กฎงบและการปิดระบบ (ตัดสินแล้ว 2026-10-12)

- ปล่อย ALB กับ ElastiCache ไว้ ไม่ `destroy` ตอนนี้ งบเหลือ 35.2 ดอลลาร์ ประมาณการใช้ถึงวันที่ 26 ราว 21-22 ดอลลาร์ถ้าซ้อม 4 ชั่วโมงต่อวัน
- ใช้ `lab.ps1 stop` ทุกครั้งที่เลิกใช้ `start` เฉพาะตอนซ้อมหรือถ่ายภาพ
- ถ้ายอดใช้ไปแตะราว 35 ดอลลาร์ก่อนวันที่ 24 ให้ `destroy` แล้วสร้างใหม่ก่อนวันซ้อมสุดท้าย (ตะวันสั่งรันเอง ห้าม agent รัน `destroy` โดยไม่ได้รับอนุมัติ)
- AWS ไม่มีคำสั่งหยุด ALB หรือ ElastiCache ชั่วคราว มีแต่ลบกับสร้างใหม่ จึงมีสเปกด้านล่าง

---

## Spec: `lab.ps1 pause` และ `resume` (รอ "Proceed")

### Problem
`lab.ps1 stop` หยุดเฉพาะ EC2 (ASG เป็น 0) ALB กับ ElastiCache ยังคิดเงินราว 0.05 ดอลลาร์ต่อชั่วโมง ตะวันต้องการคำสั่งเดียวที่หยุดค่าใช้จ่ายรายชั่วโมงที่เหลือ โดยไม่ต้องสร้าง VPC ใหม่หมดเหมือน `destroy`

### ขอบเขต
ทำ: เพิ่ม action `pause` และ `resume` ใน `scripts/lab.ps1` ตัวเดียว และอัปเดต runbook กับ `AWS_LearnerLab_Setup.md`
ไม่ทำ: ไม่แก้ `deploy_ec2_vpc_asg.ps1`, `ensure_cache.ps1`, `destroy` (เรียกใช้ซ้ำเท่านั้น) ไม่แตะ DynamoDB, SQS, SNS, Lambda, S3, SSM นอกจาก parameter `/lorcana/cache-endpoint` ที่ `ensure_cache.ps1` เขียนอยู่แล้ว

### Interface (public)
```
.\scripts\lab.ps1 pause     # ASG เป็น 0 (เหมือน stop) แล้วลบ ALB กับ ElastiCache cluster
.\scripts\lab.ps1 resume    # สร้าง ALB + listener :80 → target group เดิม, เรียก ensure_cache.ps1, อัปเดต state, ASG กลับเป็น Min=Desired=2, รอ target healthy
```
ผลคือ `infrastructure_state.json` ต้องมี `AlbArn` และ `AlbDnsName` ใหม่หลัง `resume` และ `status` ต้องทำงานได้ทั้งตอน paused

### สิ่งที่ pause ลบ และสิ่งที่เก็บ
| ลบ | เก็บ |
|---|---|
| ALB `lorcana-alb` (listener ถูกลบพร้อมกัน) | VPC, subnet 1a/1b, IGW, route table |
| ElastiCache cluster `lorcana-cache` | Security Group ทั้งสาม, ElastiCache subnet group |
| (EC2 ถูก terminate โดย ASG เป็น 0) | Target group `lorcana-tg`, Launch Template, ASG, scaling policy, CloudWatch alarm, SSM, S3, DynamoDB, SQS/SNS, Lambda |

### Edge case และ worst case (Adversarial Pause)
1. ALB DNS เปลี่ยนหลัง `resume` ลิงก์ในเอกสารและรายงานต้องแก้ สคริปต์ต้องพิมพ์ URL ใหม่ชัดเจนและอัปเดต state
2. endpoint ของ ElastiCache เปลี่ยน EC2 อ่านจาก SSM ตอนบูต ดังนั้น `resume` ต้องรอ cache available และให้ `ensure_cache.ps1` เขียน `/lorcana/cache-endpoint` ก่อนเริ่ม ASG ถ้ากลับลำดับ เครื่องจะอ่านค่าเก่า ระบบไม่พังเพราะ leaderboard ถอยไปอ่าน DynamoDB แต่แคชจะไม่ทำงานจนกว่าจะเปลี่ยนเครื่อง
3. ลบ ALB ไม่ได้ถ้ายังมี deletion protection หรือ listener ผูกอยู่: ต้องตรวจสถานะก่อนและรายงาน ไม่ลบแบบเงียบ
4. `destroy` ที่รันหลัง `pause` ต้องผ่านโดยไม่ error เมื่อไม่มี ALB หรือ cache (ตรวจในโค้ดปัจจุบันว่าทุกขั้นเช็กการมีอยู่ก่อนลบ ถ้าไม่ครบต้องแก้)
5. Learner Lab บางครั้งปฏิเสธบางคำสั่งด้วย SCP และ session หมดทุก 4 ชั่วโมง: ทุกขั้นต้องหยุดและรายงานถ้า `aws sts get-caller-identity` ล้มเหลว ไม่ทำต่อครึ่งๆ
6. **Worst case:** `resume` สร้าง ALB ได้แต่ cache หรือ listener ไม่สำเร็จ ทำให้ระบบค้างกึ่งกลาง ผลคือเว็บไม่เปิดและยังจ่ายค่า ALB วิธีกู้: รัน `resume` ซ้ำ (ต้อง idempotent: ตรวจว่ามี ALB, listener, cache อยู่แล้วให้ข้าม) หรือ `destroy` แล้วสร้างใหม่ด้วย 3 สคริปต์ตาม runbook ข้อมูลใน DynamoDB/S3/SSM ไม่ได้รับผลกระทบ
7. ห้ามพิมพ์ค่า SSM, token หรือ credential ในผลลัพธ์

### ข้อเท็จจริงจากโค้ดที่ออกแบบอิงอยู่
- `lab.ps1` มี action `start|stop|status|publish|lambdas|destroy` และอ่าน state จาก `scripts/infrastructure_state.json` (key: AlbArn, AlbDnsName, TargetGroupArn, VpcId, Subnet1Id, Subnet2Id, AlbSecurityGroupId, Ec2SecurityGroupId, AutoScalingGroupName ฯลฯ)
- `deploy_ec2_vpc_asg.ps1` สร้างด้วย `aws elbv2 create-load-balancer` และ `create-listener` ในบรรทัด 128 และ 140 (resume ต้องทำเทียบเท่าโดยใช้ target group และ SG เดิม)
- `ensure_cache.ps1` เป็น idempotent: สร้าง SG, subnet group, cluster ถ้ายังไม่มี รอจน available แล้วเขียน SSM endpoint
- `lab.ps1 destroy` ลบ ElastiCache พร้อม subnet group และ SG ก่อนลบ VPC (บรรทัด 202-222)

### Definition of Done (ตรวจแบบ binary)
- [ ] D1 Red test ก่อน: ชุดทดสอบ PowerShell (Pester ถ้ามี หรือสคริปต์ตรวจ) ล้มเพราะยังไม่มี action `pause`/`resume` และ `ValidateSet` ไม่รับค่า
- [ ] D2 `lab.ps1 pause` แล้ว `aws elbv2 describe-load-balancers --names lorcana-alb` ไม่พบ และ `aws elasticache describe-cache-clusters --cache-cluster-id lorcana-cache` ไม่พบ ASG Desired = 0
- [ ] D3 `lab.ps1 pause` รันซ้ำเมื่อ paused แล้วไม่ error (idempotent)
- [ ] D4 `lab.ps1 resume` ทำให้ `GET http://<ALB ใหม่>/api/health` ตอบ 200 ภายใน 15 นาที และ target ทั้ง 2 healthy
- [ ] D5 หลัง resume `GET /api/leaderboard` คืน header `X-Cache` เปลี่ยน MISS แล้ว HIT (แคชใหม่ทำงาน)
- [ ] D6 Playwright smoke อย่างน้อย login และ health ผ่านบน ALB ใหม่ (ใช้ `E2E_BASE_URL`)
- [ ] D7 `lab.ps1 resume` รันซ้ำเมื่อระบบขึ้นอยู่แล้วไม่สร้างซ้ำ ไม่ error
- [ ] D8 `lab.ps1 destroy` หลัง `pause` ผ่านและ exit 0
- [ ] D9 `lab.ps1 status` ทำงานทั้งตอน paused และตอนปกติ
- [ ] D10 อัปเดต `docs/specs/2026-10-11_post-pr2_learner_lab_runbook.md` และ `docs/01_Reports/AWS_LearnerLab_Setup.md` (ตารางงบ: หลัง `pause` ค่าใช้จ่ายรายชั่วโมงเหลือ ≈ 0) พร้อมบันทึกค่าใช้จ่ายจริงที่เห็นใน Cost Explorer
- [ ] D11 ไม่มีความลับในผลลัพธ์ของสคริปต์ และรายงานผลทดสอบจริงลง `docs/01_Reports/stage3_evidence/`

### Security test (OWASP)
A05 Security Misconfiguration: หลัง `resume` Security Group ต้องเหมือนเดิม (ALB SG รับ 80 จาก 0.0.0.0/0, EC2 SG รับ 80 จาก ALB SG เท่านั้น, cache SG รับ 6379 จาก EC2 SG เท่านั้น ไม่เปิด 22) ตรวจด้วย `describe-security-groups`
A09 Logging: สคริปต์พิมพ์ทุกขั้นที่ลบหรือสร้าง และหยุดเมื่อล้มเหลว

### ลำดับลงมือหลังได้ Proceed
Red test (D1) → pause (D2, D3) → resume (D4-D7) → destroy-compat (D8) → status (D9) → เอกสาร (D10, D11) ทดสอบกับ stack จริงทีละขั้น ก่อนรัน `pause` ครั้งแรกให้ตะวันยืนยันอีกครั้งเพราะลบ ALB กับ cache จริง

---

## ความคืบหน้า (อัปเดต 30 ก.ย. 2569) และงานที่จะทำต่อ (เก็บเป็นประวัติ ข้อมูลบางส่วนล้าสมัยแล้ว ดูหัวข้อ "สถานะปัจจุบัน" ด้านบน)

รายละเอียดราย ticket อยู่ท้ายไฟล์ `scratch/tickets.md` (หัวข้อ Progress ledger) unit test 128/128, e2e 05+06 = 12/12 บน AWS จริง

**เสร็จแล้ว**
- Sprint 6: T01 Analytics ใช้ข้อมูลจริง, T02 caching (ไฟล์การ์ด -81%), T03 DLQ, T04 SNS fan-out, T05 leaderboard + ElastiCache (มีการแก้บั๊ก cache เชื่อมต่อช้า), T14 ลบโค้ดหลอกผู้ใช้ (รวมรหัส admin ที่โชว์ในหน้าล็อก)
- Sprint 7 (Antigravity): T09-T13 engine `src/game/`, keyword 14 ตัว, ability พร้อมเลือกเป้าหมาย, Shift/Location/Song/Item, UX บนกระดาน
- รายงาน Stage 3 เป็น PDF + DOCX (`docs/01_Reports/G21_..._Phase3_Report.*`, สร้างด้วย `python scripts/build_stage3_report.py`) และ `docs/HOW_IT_WORKS.md`
- แก้จากที่ตะวันทดสอบ: ตัวนับถอยหลังตอนคู่แข่งหลุดเดินตามเวลาจริง

**ค้างอยู่ (เรียงลำดับที่จะทำ)**
1. เขียน `e2e/07-three-turn-game.spec.ts` ใหม่: ต้องจัดการหน้า Dice Duel และ mulligan แล้วเล่น quest, challenge ที่มี keyword และ ability ที่เลือกเป้าหมายจริง (ตอนนี้ล้ม และตอนท้ายเป็น `expect(true)`) DoD ของ T15: ผ่าน 3 รอบติด
2. ลด `LorcanaBoard.tsx` จาก 1,599 เหลือต่ำกว่า 1,500 บรรทัด (T15)
3. สไลด์และสคริปต์เดโม 10 นาที มีช่วง failover สดด้วย `test_asg_recovery.ps1` (T15) ซ้อม 1 รอบ
4. ตะวันตรวจเอง: ราคาในตารางค่าใช้จ่ายกับหน้า AWS Pricing + ใส่วันที่เข้าถึง, แคปภาพ AWS console ตามข้อ 9 ของ `STAGE3_EXPERIMENT_RESULTS.md` (ต้องเปิด stack ก่อนถึงจะแคปได้ครบ), ให้คนนอกทีม 1 คนอ่าน `HOW_IT_WORKS.md`, ลองเล่น Exit Match / rejoin ด้วยมืออีกรอบ
5. ลบไฟล์ขยะ (ต้องได้รับอนุญาต): `src/components/LorcanaBoard.tsx.bak`, `scripts/refactor_board.py`, ไฟล์ชื่อ `-` ที่ root โปรเจกต์
6. ให้ Antigravity ตรวจการแก้ที่ยังไม่ commit ใน `src/types/lorcana.ts`
7. ตัดสินใจ: จะทำหน้า billing ให้อ่านตัวเลขจริงจาก AWS (Cost Explorer + describe) หรือคงเป็น snapshot ที่ติดป้ายไว้

**หลักปฏิบัติตอนกลับมาทำ**: เปิด stack ด้วย `deploy_ec2_vpc_asg.ps1` แล้ว `lab.ps1 publish` (credentials หมดอายุทุก ~4 ชม. ตรวจ `aws sts get-caller-identity` ก่อน) คำสั่ง AWS ที่นานให้รันเบื้องหลัง `destroy` ลบตาราง `LorcanaMatchHistory` / `LorcanaPlayerStats` ด้วย ประวัติและ leaderboard จะเริ่มใหม่หลังเปิดใหม่

---

## Problem Statement

ทีมจะส่งผลทดลองและนำเสนอ Stage 3 แต่ระบบยังมีปัญหาที่ผู้ประเมินหรือผู้เล่นเจอได้ทันที:

- ผู้เล่นลงการ์ดที่มี ability แล้วเห็นแค่ alert แต่ ability ไม่ทำงาน (2,124 ข้อ) หรือทำงานผิดจังหวะ (~300 ข้อ) keyword ตอน challenge ไม่ถูกบังคับใช้เลย และกฎบางข้อผิดจาก Comprehensive Rules (เช่นเรื่องแพ้เพราะเด็คหมด, ตัวที่ exert อยู่แล้วยัง challenge ได้, ไม่มี Shift/Location)
- หน้า "Deck performance & ink curve analytics" เป็นตัวเลขที่เขียนตายไว้ทั้งหน้า ไม่ได้อ่านเด็คของผู้ใช้
- สูตรวิเคราะห์เด็คถูกเขียนซ้ำ 2 ที่ (EC2 กับ Lambda) และ Lambda analyzer จับ error ทิ้งหมด คิวไม่มี DLQ
- ผลการแข่งขันไม่ถูกเก็บ ไม่มีประวัติหรือ leaderboard
- ไฟล์ข้อมูลการ์ด 2.35 MB ถูกโหลดใหม่ทุกครั้งเพราะไม่มี cache header
- กฎเกมอยู่รวมกับ UI และ network ในไฟล์เดียว 3,537 บรรทัด test ไม่ได้ แก้ตรงหนึ่งแล้วไปพังอีกตรง
- รูปเล่มรายงานยังเป็น Stage 2 และมีข้อความไม่ตรงความจริง ("Latency < 100 ms", "Docker Container บน EC2", "Scale-to-Zero $0.00") สร้างจากสคริปต์ที่เขียนเนื้อหาซ้ำ 2 ชุด
- คนนอกทีมไม่มีเอกสารที่อ่านเข้าใจได้ว่าระบบทำงานอย่างไร

## Solution

- **Game engine แยกเป็น module ล้วน** (state + action → state ใหม่) บังคับกฎและ keyword 14 ตัวจริง ability ทำงานตามจังหวะที่ถูกต้อง effect ที่เจอบ่อยให้ผู้เล่นเลือกเป้าหมายได้ ส่วนที่ยังไม่รองรับแสดงชัดว่า "ต้อง resolve เอง" พร้อมเครื่องมือช่วย และมีรายงาน coverage เป็นตัวเลข
- **หน้า Analytics ใช้ข้อมูลจริง** จากเด็คของผู้ใช้และผลของ pipeline SQS → Lambda โดยใช้สูตรเดียวกันทุกที่
- **Decoupling:** เมื่อเกมจบ EC2 ส่ง event `match.finished` เข้า SNS ซึ่ง fan-out ไป SQS 2 คิว (ประวัติการแข่ง, สถิติผู้เล่น) ให้ Lambda บันทึกลง DynamoDB ทุกคิวมี DLQ รวมถึงคิว analyzer เดิม
- **Caching 2 ระดับ:** content caching (ไฟล์ข้อมูลการ์ดมี hash ในชื่อ + cache 1 ปี) และ database caching แบบ cache-aside ด้วย ElastiCache (Valkey) ให้ leaderboard
- **รายงาน Stage 3** เขียนใหม่จาก Markdown ต้นฉบับเดียวแล้วใช้ pandoc สร้าง DOCX และ PDF เนื้อหาตรงกับระบบจริงและเกณฑ์ rubric
- **เอกสารอธิบายสำหรับคนนอกทีม** ภาษาไทยอ่านง่าย

## Settled Decisions (grill 2026-09-27)

| # | เรื่อง | ตัดสิน |
|---|---|---|
| D1 | ลำดับ | Cloud + analytics + รายงานก่อน (ภายใน 10 ต.ค.) แล้วค่อยทำ game engine/UX (ภายใน 25 ต.ค.) |
| D2 | Ability | keyword 14 ตัว + trigger ตามจังหวะ + effect ที่เจอบ่อยแบบเลือกเป้าได้ + panel "resolve เอง" + รายงาน coverage |
| D3 | ผู้ถือ state | คงแบบ P2P แต่ engine เป็น pure function ย้ายไปรันใน Lambda ได้ภายหลัง |
| D4 | Caching | content caching + ElastiCache (Valkey node) cache-aside ให้ leaderboard |
| D5 | Decoupling | SNS fan-out → SQS 2 คิว (history, stats) + DLQ ทุกคิว ยังไม่มีคิวแจ้งเตือน |
| D6 | Inkwell | เอาทางลัด "ใส่การ์ดที่ไม่มีสัญลักษณ์ ink ได้" ออก |
| D7 | CloudFront | ใช้ไม่ได้ (Learner Lab ปฏิเสธสิทธิ์) เขียนเป็นข้อจำกัดในรายงาน |
| D8 | ElastiCache Serverless | ใช้ไม่ได้ (explicit deny) ใช้แบบ node `cache.t3.micro` |

## Sprint 4-7 และ Definition of Done

วันที่ในแผนเดิม (`scratch/SPRINT_PLAN_REVISED.md`) ผ่านไปแล้ว จึงวางใหม่ให้ Sprint 4-5 เป็นการสรุปของที่ทำเสร็จแล้ว ส่วน Sprint 6-7 เป็นงานที่เหลือ

**Sprint 4 — Deck Analyzer & Frontend Integration (สรุปย้อนหลัง)**
- [x] SQS + Lambda analyzer ทำงานบน AWS (TC-E2E-17: SQS sent=1, Lambda invoked=1)
- [x] Deck Builder เรียก API จริง, JWT หมดอายุ 7 วัน, token ปลอมได้ 401 (TC-E2E-16)
- [ ] หน้า Analytics ใช้ข้อมูลจริง → ยกไป Sprint 6

**Sprint 5 — Stage 2 Preparation (สรุปย้อนหลัง)**
- [x] ส่งรายงาน Stage 2, Unit test 40/40, e2e บน ALB 5/5

**Sprint 6 — Stage 3 Cloud, Analytics, Report (27 ก.ย. – 10 ต.ค.)** DoD:
- [ ] `lab.ps1 deploy/destroy` สร้างและลบ SNS topic, SQS 2 คิว + DLQ 3 ตัว, Lambda 2 ตัว, DynamoDB 2 ตาราง, ElastiCache 1 node ได้ครบ และ destroy ไม่ทิ้งของค้าง
- [ ] เกมจบ → ภายใน 10 วินาที ผลปรากฏในหน้าประวัติของผู้เล่นทั้งสองคน และ leaderboard (e2e บน ALB)
- [ ] ส่งผลซ้ำด้วย matchId เดิมแล้วสถิติไม่นับซ้ำ (test)
- [ ] ข้อความเสียเข้าคิวแล้วไปอยู่ใน DLQ หลังพยายามครบ 3 ครั้ง ทั้งคิวใหม่และคิว analyzer (ทดลองจริง บันทึกผลลงรายงาน)
- [ ] `GET /api/leaderboard` ตอบ header `X-Cache: MISS` ครั้งแรก และ `HIT` ภายใน 60 วินาทีต่อมา มีตัวเลข latency ของ hit กับ miss ลงรายงาน
- [ ] ไฟล์ข้อมูลการ์ดถูกเสิร์ฟจาก `/assets/` ด้วยชื่อที่มี hash และ `Cache-Control: max-age=31536000, immutable` เปิดครั้งที่สองแล้วไม่ดาวน์โหลดซ้ำ (e2e ตรวจ header)
- [ ] หน้า Analytics แสดงค่าจากเด็คที่เลือกจริง ไม่มีตัวเลขที่เขียนตายเหลือในไฟล์ และตัวเลขตรงกับผลของสูตรใน unit test
- [ ] สูตรวิเคราะห์เด็คเหลือที่เดียว ใช้ร่วมกันทั้ง EC2, Lambda analyzer และหน้าเว็บ
- [ ] รายงาน Stage 3 (DOCX + PDF) สร้างจาก Markdown ไฟล์เดียวด้วยคำสั่งเดียว ไม่มีข้อความจากหัวข้อ "ข้อความที่ต้องแก้" หลงเหลือ ทุกตัวเลขมีที่มาใน `docs/01_Reports/stage3_evidence/`
- [ ] เอกสารอธิบายสำหรับคนนอกทีมเสร็จ และมีคนนอกทีม 1 คนอ่านแล้วอธิบายกลับได้ว่าเกมเริ่มแล้วข้อมูลไหลไปที่ไหนบ้าง (ตะวันเป็นคนเช็ก)

**Sprint 7 — Game Engine, UX, Defense (11 – 25 ต.ค.)** DoD:
- [ ] กฎเกมทั้งหมดอยู่ใน `src/game/` ไม่ import React, network หรือ browser API มี unit test ครอบกฎทุกข้อในตาราง Rules ของสเปกนี้
- [ ] keyword ทั้ง 14 ตัวมี test อย่างน้อยตัวละ 1 เคสที่ fail ถ้าไม่บังคับใช้
- [ ] ability ถูกจัดจังหวะ (on play / on quest / on banish / start-end of turn / activated / static) ด้วยตัว parser ที่มี test และไม่มี ability ไหนยิงผลตอนลงการ์ด ถ้าไม่ได้เป็นแบบ on play หรือเป็น Action
- [ ] effect ที่รองรับให้ผู้เล่นเลือกเป้าหมายเองทุกครั้งที่การ์ดเขียนว่า "chosen"
- [ ] สคริปต์ coverage แสดงจำนวน ability ที่รองรับเต็ม / รองรับบางส่วน / resolve เอง แยกตาม set และตัวเลขนี้อยู่ในรายงาน
- [ ] `LorcanaBoard.tsx` เหลือแค่ render + ส่ง action ต่ำกว่า 1,500 บรรทัด
- [ ] e2e เกม 2 คนผ่าน ALB เล่นครบ 3 เทิร์นโดยมี quest, challenge (มี keyword) และ ability แบบเลือกเป้าหมาย
- [ ] สไลด์นำเสนอและเดโมสคริปต์พร้อม

## User Stories

**ผู้เล่น — กฎและ ability**
1. As a ผู้เล่น, I want ability ที่เขียนว่า "When you play this" ทำงานตอนลงการ์ด, so that การ์ดทำงานเหมือนเล่นจริง
2. As a ผู้เล่น, I want ability "Whenever this character quests" ทำงานตอน quest ไม่ใช่ตอนลง, so that ไม่ได้ผลก่อนเวลา
3. As a ผู้เล่น, I want ability ที่ต้อง exert (⟳) กดใช้เองเมื่อพร้อม, so that เลือกจังหวะใช้ได้
4. As a ผู้เล่น, I want คลิกเลือกเป้าหมายเองเมื่อการ์ดเขียนว่า "chosen", so that ระบบไม่เลือกให้แบบสุ่ม
5. As a ผู้เล่น, I want เห็นเงื่อนไขเป้าหมาย (เช่น "¤ 2 or less") กรองเป้าที่เลือกได้ให้, so that ไม่เลือกผิดกฎ
6. As a ผู้เล่น, I want ability ที่ระบบยังไม่รองรับแสดงป้าย "resolve เอง" พร้อมปุ่มจั่ว, ใส่ damage, ย้ายการ์ด, so that เล่นต่อได้โดยไม่ถูกหลอกว่า ability ทำงานแล้ว
7. As a ผู้เล่น, I want Evasive กันไม่ให้ตัวที่ไม่มี Evasive/Alert challenge, so that keyword มีความหมาย
8. As a ผู้เล่น, I want ถูกบังคับให้ challenge ตัวที่มี Bodyguard ก่อนถ้ามี, so that ตรงกฎ
9. As a ผู้เล่น, I want Resist ลด damage และ Challenger เพิ่ม strength เฉพาะตอนเป็นฝ่าย challenge, so that ผลการต่อสู้ถูกต้อง
10. As a ผู้เล่น, I want ตัวละครที่มี Rush challenge ได้ในเทิร์นที่ลง แต่ยัง quest ไม่ได้, so that ตรงกฎ
11. As a ผู้เล่น, I want ตัวละคร Reckless quest ไม่ได้ และจบเทิร์นไม่ได้ถ้ายังมีเป้าที่ challenge ได้, so that ตรงกฎ
12. As a ผู้เล่น, I want Ward กันไม่ให้คู่แข่งเลือกตัวละครนั้นด้วย effect, so that ตรงกฎ
13. As a ผู้เล่น, I want Support เพิ่ม strength ให้ตัวละครอื่นที่เลือกเมื่อ quest, so that ตรงกฎ
14. As a ผู้เล่น, I want Singer N และ Sing Together ใช้ร้องเพลงได้ และเลือกนักร้องเอง, so that ร้องเพลงถูกกฎ
15. As a ผู้เล่น, I want ลงการ์ดด้วย Shift ทับตัวชื่อเดียวกันได้ โดยตัวใหม่รับสถานะ (แห้ง/exert/damage) ของตัวเดิม, so that ใช้ Shift ได้
16. As a ผู้เล่น, I want ย้ายตัวละครไป Location และได้ lore จาก Location ตอนเริ่มเทิร์น, so that การ์ด Location มีประโยชน์
17. As a ผู้เล่น, I want Item ใช้ความสามารถได้ทันทีในเทิร์นที่ลง, so that ตรงกฎ
18. As a ผู้เล่น, I want ตัวที่ exert อยู่แล้ว challenge ไม่ได้, so that ตรงกฎ
19. As a ผู้เล่น, I want ใส่ inkwell ได้เฉพาะการ์ดที่มีสัญลักษณ์ ink, so that ตรงกฎ
20. As a ผู้เล่น, I want แพ้เมื่อจบเทิร์นของตัวเองขณะที่เด็คว่าง และเกมจบจริง, so that ตรงกฎ
21. As a ผู้เล่น, I want ชนะทันทีเมื่อได้ 20 lore แม้จะเป็นตอนเทิร์นคู่แข่ง, so that ตรงกฎ

**ผู้เล่น — UX**
22. As a ผู้เล่น, I want การ์ดที่ quest/challenge/ใช้ ability ได้ตอนนี้มีกรอบเรืองแสง, so that รู้ว่าทำอะไรได้
23. As a ผู้เล่น, I want เห็นเหตุผลเมื่อทำ action ไม่ได้ (เช่น "ยังไม่แห้ง", "เป้าหมายมี Evasive"), so that เข้าใจกฎ
24. As a ผู้เล่น, I want เห็น phase ของเทิร์น (Ready → Set → Draw → Main → End) ชัดเจน, so that ไม่หลง
25. As a ผู้เล่นที่ใช้ keyboard, I want เลือกการ์ดและเป้าหมายด้วย Tab/Enter ได้, so that เล่นได้โดยไม่ใช้เมาส์

**ผู้เล่น — Analytics, ประวัติ, leaderboard**
26. As a ผู้เล่น, I want เลือกเด็คของตัวเองในหน้า Analytics แล้วเห็น cost curve ตาม cost จริง (0-10+), so that ปรับเด็คได้
27. As a ผู้เล่น, I want เห็นสัดส่วน inkable, สัดส่วนประเภทการ์ด, ค่าเฉลี่ย cost, สี ink, lore รวม และ synergy score จากเด็คจริง, so that วิเคราะห์ได้
28. As a ผู้เล่น, I want เห็นว่าผลวิเคราะห์มาจาก pipeline เมื่อไร (analyzedAt), so that รู้ว่าข้อมูลใหม่หรือเก่า
29. As a ผู้เล่นที่ยังไม่มีเด็ค, I want เห็นข้อความแนะนำให้ไปสร้างเด็ค แทนกราฟปลอม, so that ไม่เข้าใจผิด
30. As a ผู้เล่น, I want เห็นประวัติการแข่ง (คู่แข่ง, ผล, lore, จำนวนเทิร์น, เวลา), so that ย้อนดูได้
31. As a ผู้เล่น, I want เห็น leaderboard ผู้ชนะมากที่สุด, so that มีเป้าหมายในการเล่น
32. As a ผู้เล่น, I want ผลการแข่งไม่ถูกนับซ้ำแม้ทั้งสองฝั่งส่งผลมา, so that สถิติถูกต้อง

**ทีม / ผู้ดูแลระบบ**
33. As a ผู้ดูแลระบบ, I want ข้อความที่ประมวลผลไม่ได้ไปอยู่ใน DLQ, so that ไม่ retry ไม่รู้จบและตามแก้ได้
34. As a ผู้ดูแลระบบ, I want Lambda consumer ประมวลผลซ้ำได้โดยไม่เกิดผลซ้ำ (idempotent), so that SQS ส่งซ้ำ (at-least-once) แล้วไม่พัง
35. As a ผู้ดูแลระบบ, I want ElastiCache เข้าถึงได้เฉพาะจาก EC2 SG พอร์ต 6379, so that ไม่เปิดออก internet
36. As a ผู้ดูแลระบบ, I want ถ้า ElastiCache ล่ม leaderboard ยังตอบได้จาก DynamoDB, so that cache ไม่เป็นจุดล่มเดียว
37. As a สมาชิกทีม, I want deploy/destroy สร้างและลบทรัพยากรใหม่ทั้งหมดในคำสั่งเดิม, so that ไม่ต้องจำขั้นตอนเพิ่ม
38. As a สมาชิกทีม, I want แก้กฎเกมแล้วรัน unit test รู้ผลภายในไม่กี่วินาที, so that อัปเดตแล้วของเก่าไม่พัง
39. As a สมาชิกทีม, I want สร้างรายงาน DOCX + PDF ด้วยคำสั่งเดียวจาก Markdown ไฟล์เดียว, so that แก้เนื้อหาที่เดียว
40. As a ผู้ประเมิน, I want รายงานมีการออกแบบตามหลัก Cloud, ผลทดลองครบ (การทำงาน, ข้อจำกัด, ค่าใช้จ่าย) และอ้างอิงแบบ in-text + reference, so that ให้คะแนนตาม rubric ได้
41. As a ผู้ประเมิน, I want ทุกตัวเลขในรายงานมีหลักฐานดิบ, so that ตรวจสอบได้
42. As a คนนอกทีม, I want อ่านเอกสารสั้นๆ แล้วเข้าใจว่าเว็บทำอะไร ใช้ AWS อะไร และข้อมูลไหลอย่างไร, so that ไม่ต้องอ่านโค้ด

## Implementation Decisions

**Game engine (`src/game/`)**
- Interface เดียว: `applyAction(state, action) → { state, events, prompts }` เป็น pure function ไม่มี side effect ส่วน `LorcanaBoard` แค่ render state, แสดง prompt (เลือกเป้าหมาย) และส่ง action ส่วน network ส่ง action/event เดิม
- State แยกตามผู้เล่น: deck, hand, play (character/item/location พร้อม damage, exerted, drying, atLocation, stack ของ Shift), inkwell, discard, lore, turn/phase และ flag เช่น inkedThisTurn
- Keyword อ่านจากข้อมูลการ์ดด้วย regex แบบ word boundary (`\bward\b`) ไม่จับคำย่อย รวม +N ที่ stack กันได้
- Ability parser จัดจังหวะเป็น on_play / on_quest / on_banish / on_challenge / turn_start / turn_end / activated / static / replacement จากรูปประโยคในกฎ (หัวข้อ "Abilities & the bag") ส่วนที่จับไม่ได้ติดป้าย `manual`
- Effect ที่รองรับรอบแรก (เรียงตามความถี่): draw, +¤ this turn, gain lore, lose lore, banish chosen (มีเงื่อนไข), ready chosen, remove damage, deal damage chosen, exert chosen, return to hand ถ้า effect ไหนต้องเลือกเป้าหมาย engine จะคืน `prompt` ให้ UI แสดงให้เลือก แล้วค่อย resolve เมื่อได้คำตอบ
- Trigger หลายตัวพร้อมกัน resolve ตามลำดับที่พิมพ์บนการ์ด (ยังไม่ทำ bag แบบให้เลือกลำดับ)
- Network ยังคงเป็น P2P: ส่ง action ที่ผ่าน engine แล้ว ฝั่งรับ apply ผลที่เกี่ยวกับฝั่งตัวเอง (damage, banish) ด้วย engine ตัวเดียวกัน
- สคริปต์ coverage รันกับไฟล์ข้อมูลการ์ดจริงแล้วรายงานตัวเลขต่อ set

**Deck analytics**
- สูตรวิเคราะห์เป็น pure function ตัวเดียว ใช้ร่วม 3 ที่ (EC2 endpoint, Lambda analyzer, หน้าเว็บ)
- ผลลัพธ์เพิ่มจากเดิม: cost curve ราย cost (0-10+), inkable ratio, จำนวนตามประเภท, lore รวมของตัวละคร เก็บ field เดิมไว้ให้เข้ากันได้ (`costCurve` 4 ช่วง, `synergyScore`, `summaryText`)
- หน้า Analytics ดึงเด็คของผู้ใช้จาก `GET /api/decks` ใช้ `analysis` ที่ pipeline บันทึกไว้ถ้ามี ถ้ายังไม่มีคำนวณเองในเครื่องด้วยสูตรเดียวกันแล้วแสดงว่า "ยังไม่ผ่าน pipeline"

**Decoupling**
- SNS topic `lorcana-match-events`, SQS `lorcana-match-history` และ `lorcana-player-stats` แต่ละคิวมี DLQ ของตัวเอง (`maxReceiveCount` 3) และคิว analyzer เดิมได้ DLQ ด้วย
- Visibility timeout ≥ 6 เท่าของ Lambda timeout ตามแล็บ Class 12
- Lambda consumer คืน `batchItemFailures` ของ record ที่ล้ม ไม่จับ error ทิ้ง (แก้ analyzer เดิมด้วย)
- ผู้ส่ง event: `POST /api/matches` บน EC2 (ต้องมี JWT) body มี `matchId` (roomId + เวลาเริ่ม), ผู้ชนะ/ผู้แพ้, lore, จำนวนเทิร์น ตรวจว่าผู้เรียกเป็นผู้เล่นในแมตช์นั้น แล้ว publish SNS
- ตาราง `LorcanaMatchHistory` (PK `userId`, SK `finishedAt#matchId`) เขียน 2 item ต่อแมตช์
- ตาราง `LorcanaPlayerStats` (PK `userId`: wins, losses, games) นับครั้งเดียวต่อ matchId ด้วย conditional write กับ item กัน dedupe (`matchId` ที่มี TTL)
- สร้าง/ลบตาราง, topic, queue และ Lambda ใน deploy/destroy (source ของ Lambda อยู่ใน `backend/serverless/`)

**Caching**
- Content: ย้ายไฟล์ข้อมูลการ์ดเข้าไป build ของ Vite ให้ได้ชื่อไฟล์มี hash ใต้ `/assets/` ซึ่ง nginx ตั้ง cache 1 ปี + immutable ไว้แล้ว และเปลี่ยนชื่อไฟล์ให้ตรงเนื้อหา (มี Set 1-13 ไม่ใช่แค่ 1-2)
- Database: ElastiCache Valkey `cache.t3.micro` 1 node ใน VPC เดิม, SG รับ 6379 จาก EC2 SG เท่านั้น, endpoint ส่งให้ EC2 ผ่าน SSM parameter `/lorcana/cache-endpoint`
- `GET /api/leaderboard` ทำ cache-aside (lazy loading): ถ้า hit ใช้ sorted set ถ้า miss อ่าน `LorcanaPlayerStats` แล้วเขียนลง cache TTL 60 วินาที ใส่ header `X-Cache: HIT|MISS` ถ้าติดต่อ cache ไม่ได้ให้อ่าน DynamoDB ตรงและไม่ error
- เพิ่ม dependency ฝั่ง backend 1 ตัวเป็น client ของ Redis/Valkey (stdlib ของ Node ไม่มี)

**Report + explainer**
- ต้นฉบับ Markdown ไฟล์เดียวของรายงาน Stage 3 ใช้ pandoc สร้าง DOCX (ด้วย reference.docx ที่ตั้งฟอนต์ไทยตามคู่มือ) และ PDF (xelatex) ด้วยคำสั่งเดียว เลิกใช้สคริปต์ 1,466 บรรทัดเดิม (ยังอยู่ใน git history)
- โครงรายงานตาม rubric Stage 3: การวิเคราะห์และออกแบบตามหลัก Cloud (5 คะแนน) และผลการทดลองครบทุกประเด็น ได้แก่ การทำงาน, ข้อจำกัด, ค่าใช้จ่าย (10 คะแนน) พร้อม in-text reference + รายการอ้างอิง
- ข้อความที่ต้องแก้จาก Stage 2: "Latency < 100 ms" (ไม่มีหลักฐาน), "Multi-stage Docker Container บน EC2" (deploy จริงใช้ systemd + esbuild bundle), "Scale-to-Zero $0.00" (ALB + IPv4 ยังคิดเงิน), "Hybrid: Secondary Serverless Stack" (ตอนนี้ realtime ใช้ API GW + Lambda เป็นหลัก)
- เอกสารอธิบายสำหรับคนนอกทีม `docs/HOW_IT_WORKS.md` ภาษาไทย: เว็บนี้ทำอะไร, แผนภาพ, เส้นทางข้อมูลตั้งแต่ login จนเกมจบ, AWS แต่ละตัวทำหน้าที่อะไร (เปรียบเทียบกับของในชีวิตจริง), วิธีเดโม, อภิธานศัพท์

**Ponytail cleanup**
- ลบ mock `demo.execute-api` ใน `websocket.ts`, ลบ `fallbackBilling` ข้อมูลปลอมใน `api.ts` (แสดง error จริงแทน), รวม payload `STATE_SYNC_RESPONSE` ให้เหลือที่เดียว, ลบ setState ที่อยู่ใน updater, แก้ README เรื่องจำนวน set

## Testing Decisions

- Test เฉพาะพฤติกรรมภายนอกของ seam ไม่ test ตัวแปรภายใน
- **Seam หลักของเกม: `applyAction(state, action)`** unit test ใน vitest ครอบกฎทุกข้อ, keyword 14 ตัว, จังหวะของ trigger และ effect ที่รองรับ เขียน test ให้ fail ก่อนทุกข้อ (prior art: `backend/__tests__/auth.test.ts` ที่ spawn ของจริง, `src/__tests__/store.test.ts`)
- **Seam ของ analytics:** unit test ของสูตรด้วยเด็คตัวอย่างที่รู้คำตอบ และ component test ว่าหน้า Analytics แสดงค่าจากเด็คที่ส่งเข้าไป
- **Seam ของ cloud:** e2e บน ALB (prior art: `e2e/05-match-realtime-sync.spec.ts`) — ส่งผลการแข่ง → เห็นในประวัติ/leaderboard, ส่งซ้ำไม่นับซ้ำ, header `X-Cache`, cache header ของไฟล์ข้อมูลการ์ด
- **DLQ:** ทดลองจริงบน AWS ด้วยข้อความเสีย บันทึกลง `stage3_evidence/`
- **OWASP:** `POST /api/matches` ไม่มี JWT → 401, ส่งผลของแมตช์ที่ตัวเองไม่ได้เล่น → 403 (A01), body ผิดรูปแบบ → 400, ElastiCache ไม่มี public route (A05)

## Out of Scope

- CloudFront, HTTPS/ACM, ElastiCache Serverless (Learner Lab ไม่อนุญาต)
- ย้าย state ของเกมไปให้ server เป็นผู้ถือ (ออกแบบเผื่อไว้แล้วใน D3)
- Bag แบบให้ผู้เล่นเลือกลำดับ trigger, replacement effect ที่ซับซ้อน, การ์ดที่ต้อง "look at top N and choose"
- ทำ ability ครบทั้ง 3,242 ใบ
- คิวแจ้งเตือน, อีเมล
- GitHub Actions CI/CD

## Further Notes

- ผลการแข่งมาจากฝั่ง client (P2P) จึงยังโกงได้ ตรวจแค่ว่าผู้ส่งเป็นผู้เล่นในแมตช์ บันทึกเป็นข้อจำกัดในรายงาน
- ElastiCache เพิ่มค่าใช้จ่ายราว $0.017/ชม. เฉพาะตอนเปิด stack (ต้องตรวจราคา) ถูกลบพร้อม destroy
- ทุกครั้งที่ deploy ให้เริ่ม Learner Lab ใหม่ก่อน เพราะ session หมดทุก 4 ชม. และเครื่องจะถูก stop

## Audit Evidence (27 ก.ย. 2569)

- Ability: การ์ด 3,242 ใบ มี ability 2,659 ใบ ขึ้นแค่ alert 2,124 ข้อ, regex ยิงผล 443 ข้อ ในนั้นผิดจังหวะ ~300 ข้อ, keyword จับผิดเพราะคำย่อย 12 ใบ (`resolveAbilities` `LorcanaBoard.tsx:1556`)
- Challenge ไม่เช็ก keyword ใดๆ และไม่เช็กว่าตัวที่ challenge exert อยู่แล้วหรือไม่ (`handleAttackTarget` `:1408`)
- Deck-out: แพ้ตอนจั่วไม่ได้ และไม่จบเกม (`handleDrawCard` `:1792`) ส่วน Location lore มีแค่ comment (`:1901`)
- Analytics: ค่าเขียนตายทั้งหน้า (`AnalyticsDashboard.tsx:47-120`)
- สูตรวิเคราะห์ซ้ำ `server.ts:347` กับ `serverless/analyzer/handler.ts:17-95` และ analyzer จับ error ทิ้ง (`:106`) คิว analyzer ไม่มี RedrivePolicy
- ไฟล์ข้อมูลการ์ด 2.35 MB อยู่ใต้ `/dataset/` ไม่มี cache header
- สิทธิ์ Learner Lab (IAM simulate): CloudFront implicitDeny, ElastiCache Serverless explicitDeny, ElastiCache cluster/SNS/WAF allowed
- ความถี่ของ effect ในข้อมูลการ์ด: discard 346, draw 254, +strength 233, gain lore 170, can't quest/challenge 114, cost reduction 108, put into inkwell 90, banish chosen 82, ready 60, look top N 59, remove damage 54, deal damage chosen 53, exert chosen 52, lose lore 39, return to hand 32
