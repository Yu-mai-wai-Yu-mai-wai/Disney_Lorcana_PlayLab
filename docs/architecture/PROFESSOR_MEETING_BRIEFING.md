# เอกสารสรุปสถาปัตยกรรมและคู่มือเตรียมประเด็นปรึกษาอาจารย์
**วิชา:** Cloud Computing  
**โครงงาน:** Disney Lorcana PlayLab Cloud  
**กลุ่มผู้จัดทำ:** นายตะวัน [รหัสนักศึกษา] และทีมโครงงาน  
**แผนภาพสถาปัตยกรรมอ้างอิง:** [aws_architecture_lorcana_playlab.drawio](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/docs/architecture/aws_architecture_lorcana_playlab.drawio) | [Aws_disney_lorcana.drawio.png](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/docs/architecture/Aws_disney_lorcana.drawio.png)

> **สถานะจริง ณ 2026-10-12 (ตรวจกับ AWS Learner Lab, Account 953899323223, us-east-1):** เอกสารนี้อธิบายสถาปัตยกรรมเป้าหมายของ Stage 3 ที่เคย deploy และทดสอบแล้ว แต่ตอนนี้ VPC, ALB, ASG, EC2 และ ElastiCache ไม่มีอยู่ (stack ถูกรื้อ) ตาราง `LorcanaMatchHistory`, `LorcanaPlayerStats`, SNS `lorcana-match-events` และ Lambda `lorcana-match-history`, `lorcana-player-stats` ก็ยังไม่มี สิ่งที่ยังอยู่คือ Lambda 5 ตัว (auth-login, auth-register, deck, analyzer, room), WebSocket API, DynamoDB 4 ตาราง (`UsersTable`, `DecksTable`, `LorcanaRoomStateV2`, `LorcanaMatchmaking`), SQS `lorcana-deck-analyzer` พร้อม DLQ, S3 2 bucket และ SSM 3 พารามิเตอร์ ก่อนนำเสนออาจารย์ว่า "รันบน AWS จริง" ต้องสร้าง stack ใหม่ตาม `docs/specs/2026-10-11_post-pr2_learner_lab_runbook.md` ก่อน รายละเอียดอยู่ในตารางสถานะของ runbook ฉบับนั้น

---

## 1. ข้อมูลสังเขปของโครงงาน (Executive Project Summary)

Disney Lorcana PlayLab Cloud เป็นเว็บแอปพลิเคชันสำหรับเล่นการ์ดเกมสะสม Disney Lorcana แบบออนไลน์ผ่านเบราว์เซอร์ พร้อมระบบวิเคราะห์ประสิทธิภาพเด็ค การแข่งขันแบบเรียลไทม์ และระบบตารางผู้นำ

### คุณลักษณะหลักของระบบ
1. **ระบบคลังการ์ดและจัดเด็ค (Deck Builder & Card Database):** รวบรวมข้อมูลการ์ดทางการจำนวน 3,242 ใบ (Set 1 ถึง Set 13) พร้อมระบบแคชบนเบราว์เซอร์
2. **ระบบวิเคราะห์เด็คอัตโนมัติ (Async Deck Analyzer):** คำนวณกราฟค่าร่าย สัดส่วนหมึก และคะแนนความเข้ากันได้ของการ์ดผ่านการประมวลผลเบื้องหลัง
3. **ระบบแข่งขันเรียลไทม์ 2 ผู้เล่น (Real-time Multiplayer Match):** เชื่อมต่อผู้เล่นผ่านรหัสห้อง 6 หลักด้วยช่องทางสื่อสารสองทาง
4. **ตัวขับเคลื่อนกฎกติกา (Core Game Engine):** ทำงานตาม Comprehensive Rules v2.2 บังคับใช้คีย์เวิร์ดทางการ 14 ชนิดและลำดับเทิร์นอย่างสมบูรณ์
5. **ระบบสรุปผลการแข่งขันและตารางผู้นำ (Match History & Leaderboard):** บันทึกประวัติแมตช์และจัดอันดับผู้เล่นด้วยระบบแคชความเร็วสูง

### เป้าหมายการออกแบบบน AWS Cloud
- รองรับความพร้อมใช้งานสูง (High Availability) ข้าม Availability Zone
- ปรับขนาดทรัพยากรตามปริมาณงานอัตโนมัติ (Elasticity & Auto Scaling)
- แยกส่วนประกอบระบบออกจากกัน (Loose Coupling & Decoupling) เพื่อไม่ให้ความล้มเหลวในจุดใดจุดหนึ่งลุกลาม
- บริหารจัดการต้นทุนให้อยู่ภายใต้กรอบงบประมาณของ AWS Academy Learner Lab ($100 ต่อบัญชี)

---

## 2. เจาะลึกสถาปัตยกรรมระบบคลาวด์ 5 ระดับ (Cloud Architecture Deep Dive)

ระบบทำงานบน AWS Region `us-east-1` โดยแบ่งโครงสร้างออกเป็น 5 ระดับหลัก:

### ระดับที่ 1: เครือข่ายและความปลอดภัย (Network & Security Layer)
- **VPC:** `lorcana-lean-vpc` (CIDR: `10.0.0.0/16`)
- **Subnets:** แบ่งเป็น 2 Public Subnet ข้าม 2 ศูนย์ข้อมูลเพื่อกระจายความเสี่ยง:
  - `lorcana-public-1a` (CIDR: `10.0.1.0/24`, `us-east-1a`)
  - `lorcana-public-1b` (CIDR: `10.0.2.0/24`, `us-east-1b`)
- **Internet Gateway:** `lorcana-igw` เชื่อมต่อ VPC สู่เครือข่ายอินเทอร์เน็ต
- **Lean VPC (Zero NAT Gateway):** ออกแบบโดยไม่ใช้ NAT Gateway เพื่อประหยัดค่าบริการ $32 ต่อเดือน ป้องกันไม่ให้เกินโควตางบประมาณ $100 ของ Learner Lab
- **Security Groups (การป้องกันแบบแบ่งชั้น):**
  - `lorcana-alb-sg`: เปิดรับเฉพาะ HTTP พอร์ต 80 จากภายนอก (`0.0.0.0/0`)
  - `lorcana-ec2-sg`: รับเฉพาะทราฟฟิกพอร์ต 80 ที่ส่งต่อมาจาก `lorcana-alb-sg` ไม่เปิดพอร์ต 22 (ไม่ใช้ SSH เข้าเครื่องผ่าน SSM; `scripts/deploy_ec2_vpc_asg.ps1` ไม่มีกฎพอร์ต 22)
  - `lorcana-cache-sg`: รับเฉพาะทราฟฟิก TCP พอร์ต 6379 จาก `lorcana-ec2-sg` เท่านั้น ไม่อนุญาตให้ภายนอกเข้าถึงโดยเด็ดขาด

### ระดับที่ 2: เว็บและแอปพลิเคชันเซิร์ฟเวอร์ (Web & Compute Tier)
- **Application Load Balancer (ALB):** `lorcana-alb` ทำงานแบบ Internet-facing บนพอร์ต 80 เชื่อมโยงข้ามทั้ง 2 Subnet
  - การตรวจสอบความสมบูรณ์ (`/api/health`): ตรวจสอบสถานะหน่วยความจำและวงรอบการทำงานของ Node.js โดยตั้งใจไม่ให้เชื่อมต่อไปคิวรีฐานข้อมูล เพื่อป้องกันปัญหาความล้มเหลวแบบลูกโซ่ (Cascading Failure) หากฐานข้อมูลหน่วงชั่วคราว
- **Auto Scaling Group (ASG):** `lorcana-asg` (Min: 2, Desired: 2, Max: 4) ควบคุมจำนวน Instance ให้กระจายตัวข้าม 2 Availability Zone
- **EC2 Instance:** `t3.micro` บนระบบปฏิบัติการ Amazon Linux 2023
  - **Nginx:** ทำหน้าที่ Reverse Proxy, บีบอัด Gzip และตั้งค่า Cache-Control สำหรับไฟล์ Static Asset ให้มีอายุ 1 ปีแบบ Immutable
  - **Node.js Express App:** ให้บริการ REST API ยืนยันตัวตนด้วย JWT (รหัสผ่านแฮชด้วย Scrypt) และประมวลผลคำขอต่างๆ
- **AWS Systems Manager (SSM) Parameter Store:** จัดเก็บค่าคอนฟิกและคีย์ความลับ (`/lorcana/jwt-secret`, `/lorcana/cache-endpoint`, `/lorcana/sqs-url`)

### ระดับที่ 3: ระบบแข่งขันแบบเรียลไทม์ (Real-time Gaming Tier)
- **Amazon API Gateway (WebSocket API):** รองรับการเชื่อมต่อแบบสองทาง WSS จากเบราว์เซอร์ของผู้เล่นทั้งสองคน
  - Route ที่ตั้งไว้บน API จริง (ตรวจ 2026-10-12): `$connect`, `$disconnect`, `$default`, `sendAction` และ route ตามชนิด action ของเกม เช่น `CREATE_ROOM`, `JOIN_ROOM`, `MATCHMAKING_JOIN`, `MATCHMAKING_LEAVE`, `DECK_SELECTED`, `CARD_MOVED`, `TURN_PASSED`, `CHAT_MESSAGE` (ไม่มี route `syncState`)
- **AWS Lambda (`lorcana-room`):** ประมวลผลการจับคู่ห้องด้วยรหัส 6 หลัก และส่งต่อ Action การเล่นระหว่างผู้เล่น
- **Amazon DynamoDB (`LorcanaRoomStateV2`, `LorcanaMatchmaking`):** `LorcanaRoomStateV2` (PK `roomId`, SK `connectionId`, TTL attribute `ttl`) จัดเก็บ Connection ID ของผู้เล่นในแต่ละห้อง ส่วน `LorcanaMatchmaking` (PK `connectionId`, TTL attribute `ttl`) เก็บคิวจับคู่ ชื่อ `LorcanaConnections` ที่เคยเขียนไว้ใน diagram ไม่มีในโค้ดและไม่มีบน AWS (รูป `Aws_disney_lorcana.drawio.png` และไฟล์ `.drawio` ยังใช้ชื่อเก่า ต้อง export ใหม่)
- *เหตุผลในการแยกออกจาก EC2:* การรักษา Connection ค้างไว้บน WebSocket หากทำบน EC2 จะทำให้เกิดสถานะผูกมัดเครื่อง ส่งผลให้การทำ Auto Scaling ซับซ้อน การแยกไปไว้บน Serverless WebSocket ช่วยให้ฝั่ง Web Server ทำงานแบบ Stateless ได้อย่างสมบูรณ์

### ระดับที่ 4: การประมวลผลแบบอะซิงโครนัสและการกระจายเหตุการณ์ (Asynchronous & Event-Driven Tier)
ระบบแบ่งการทำงานแบบ Asynchronous ออกเป็น 2 สายงานเพื่อป้องกันภาระงานสะสม:
1. **สายงานวิเคราะห์เด็ค (Deck Analysis Pipeline):**
   - ผู้เล่นสั่งวิเคราะห์เด็ค -> EC2 ส่งข้อความเข้า Amazon SQS `lorcana-deck-analyzer`
   - คิวมี Dead Letter Queue (DLQ) ชื่อ `lorcana-deck-analyzer-dlq` (เงื่อนไข Retry สูงสุด 3 ครั้ง)
   - AWS Lambda `lorcana-analyzer` รับข้อความผ่าน Event Source Mapping พร้อมเปิด `ReportBatchItemFailures` เพื่อประมวลผลเฉพาะข้อความที่สำเร็จ และส่งคืนข้อความที่เสียกลับเข้าคิว
   - ผลการคำนวณถูกบันทึกกลับลงตาราง `DecksTable` ใน DynamoDB (ฟิลด์ `analysis`)
2. **สายงานกระจายผลการแข่งขัน (Match Event Decoupling & Fan-Out):**
   - เมื่อเกมจบ ผู้เล่นส่งคำขอ `POST /api/matches` -> EC2 ตรวจสอบ JWT และสิทธิ์ของผู้เล่น จากนั้นส่ง Event `match.finished` เข้า Amazon SNS Topic `lorcana-match-events`
   - Amazon SNS ทำหน้าที่กระจายข้อมูลแบบ Fan-Out เข้าสู่ SQS 2 คิวคู่ขนาน:
     - คิวที่ 1: SQS `lorcana-match-history` -> Lambda `lorcana-match-history` -> บันทึกลง DynamoDB `LorcanaMatchHistory` (Partition Key: `userId`, Sort Key: `finishedAt#matchId`)
     - คิวที่ 2: SQS `lorcana-player-stats` -> Lambda `lorcana-player-stats` -> บันทึกยอดชนะ/แพ้ลง DynamoDB `LorcanaPlayerStats` แบบ Idempotent
   - *ประโยชน์:* เซิร์ฟเวอร์หลักตอบกลับผู้เล่นได้ทันทีโดยไม่ต้องรอเขียนฐานข้อมูล 2 ตารางพร้อมกัน และหากระบบสถิติล้มเหลว ประวัติการแข่งยังคงได้รับการบันทึกตามปกติ

### ระดับที่ 5: ระบบแคชและฐานข้อมูลหลัก (Caching & Storage Tier)
- **Amazon ElastiCache Valkey (`lorcana-cache`):**
  - โหนด `cache.t3.micro` เครื่องเดี่ยว วางอยู่ใน VPC ผ่าน Subnet Group ข้าม 2 AZ
  - ทำงานภายใต้รูปแบบ Cache-Aside ร่วมกับโครงสร้างข้อมูลแบบ Sorted Set สำหรับตารางผู้นำ (Leaderboard)
  - ประสิทธิภาพ: Latency เมื่อ Cache Hit อยู่ที่ 1 มิลลิวินาที (เทียบกับตอน Cache Miss ที่ต้องอ่านจาก DynamoDB อยู่ที่ 41 มิลลิวินาที) พร้อมกำหนดอายุข้อมูล TTL 60 วินาที
  - ความยืดหยุ่น: หากโหนดแคชไม่พร้อมทำงาน ระบบจะสลับไปอ่านจาก DynamoDB โดยตรงทันทีโดยที่ผู้ใช้งานไม่พบข้อผิดพลาด
- **Amazon DynamoDB (Pay-Per-Request):**
  - ตาราง `UsersTable`: จัดเก็บข้อมูลบัญชีผู้ใช้
  - ตาราง `DecksTable`: จัดเก็บรายการการ์ดและผลวิเคราะห์เด็ค (key `deckId` + `userId` ยังไม่มี GSI `userId-index` โค้ดจึง query แบบ Scan เมื่อดึงเด็คของผู้ใช้)
  - ตาราง `LorcanaMatchHistory`: จัดเก็บประวัติการแข่งขันย้อนหลัง
  - ตาราง `LorcanaPlayerStats`: จัดเก็บสถิติรวมของผู้เล่น

---

## 3. หลักฐานการทดสอบเชิงประจักษ์ (Empirical Evidence & Verifications)

ระบบเคยผ่านการทดสอบจริงบนโครงสร้างพื้นฐาน AWS ด้วยชุดทดสอบอัตโนมัติ ผลด้านล่างเป็นหลักฐานย้อนหลังจากตอนที่ stack ยังรันอยู่ (Lambda ถูก deploy ล่าสุด 2026-10-05) ตอนนี้ stack ไม่มี จึงยังไม่มีผลทดสอบบน AWS ที่ยืนยันซ้ำได้วันนี้ ต้องรัน Phase 3 และ 4 ของ runbook ใหม่ก่อนอ้างผลชุดนี้ตอนนำเสนอ:
- **Unit Tests:** 119/119 รายการ ณ ตอนทดสอบเดิม หลัง PR #2 ชุดทดสอบเป็น 135 ข้อ (ตัวเลข 135 มาจาก runbook ยังไม่ได้รันซ้ำในเครื่องนี้) (ครอบคลุม Logic กฎการเล่น 14 คีย์เวิร์ด, Pure Function วิเคราะห์เด็ค, และแคช)
- **End-to-End Tests บน ALB:** ผ่าน 12/12 รายการ (ครอบคลุม Auth, Deck CRUD, WebSocket Gameplay, SNS Fan-Out, และ Leaderboard Cache-Aside)
- **การทดสอบความทนทานของ ASG (Self-Healing):** ทดสอบยุติการทำงานของ EC2 1 เครื่องใน AZ หนึ่ง ระบบ ALB ยังคงให้บริการต่อเนื่องผ่านอีก AZ หนึ่ง และ ASG ทำการสร้างเครื่องทดแทนใหม่อัตโนมัติ
- **การทดสอบ Dead Letter Queue (Poison Pill):** ทดสอบส่งข้อความที่โครงสร้างผิดพลาดเข้าคิว ระบบทดลองซ้ำครบ 3 ครั้งแล้วแยกข้อความเข้าสู่ DLQ ได้ถูกต้องโดยไม่ทำให้คิวหลักติดขัด

---

## 4. ประเด็นสำคัญที่ต้องพูดคุยและขอคำแนะนำจากอาจารย์ (Discussion Topics for Professor)

การเข้าพบอาจารย์ควรโฟกัสที่การนำเสนอเหตุผลเบื้องหลังการตัดสินใจเชิงวิศวกรรม (Engineering Rationale) และขอคำชี้แนะใน 5 ประเด็นสำคัญ:

### ประเด็นที่ 1: การออกแบบเครือข่ายและความปลอดภัย (Lean VPC vs Private Subnet & NAT Gateway)
- **บริบทปัจจุบัน:** วาง EC2 ไว้ใน Public Subnet โดยไม่มี NAT Gateway เนื่องจากข้อจำกัดงบประมาณ $100 ของ AWS Academy Learner Lab (NAT Gateway มีค่าใช้จ่าย ~$32/เดือน) แต่ใช้ Security Group ควบคุมไม่ให้รับทราฟฟิกตรงจากภายนอก ยกเว้นผ่าน ALB
- **สิ่งที่ควรนำเสนอต่ออาจารย์:** ชี้แจงให้อาจารย์เห็นว่าเรารู้จักข้อจำกัดด้านความปลอดภัยของวิธีนี้ และเลือกวิธีนี้เพราะเหตุผลด้านงบประมาณ
- **คำถามที่ต้องถามอาจารย์:**
  1. *ในมุมมองของอาจารย์ การระบุเหตุผลเรื่อง Trade-off ด้านต้นทุนของงบประมาณแล็บในรายงาน ถือว่าเพียงพอและเป็นที่ยอมรับในการให้คะแนนหรือไม่ครับ?*
  2. *หากต้องการปรับปรุงให้เป็นไปตามมาตรฐาน Production จริง อาจารย์แนะนำให้เปลี่ยนเป็น Private Subnet แล้วใช้ VPC Endpoints (Gateway Endpoint สำหรับ DynamoDB และ Interface Endpoints สำหรับ SQS/SNS) แทนการใช้ NAT Gateway หรือไม่ครับ?*

### ประเด็นที่ 2: ความเหมาะสมของสถาปัตยกรรมแบบผสมผสาน (Hybrid: EC2 ASG + Serverless)
- **บริบทปัจจุบัน:** เลือกรวมทั้ง EC2 Auto Scaling Group (Web Tier) และ Serverless (Lambda, SQS, SNS, API Gateway WebSocket) เข้าด้วยกัน
- **สิ่งที่ควรนำเสนอต่ออาจารย์:** แสดงให้เห็นว่าเราต้องการตอบโจทย์ขอบเขตรายวิชา Cloud Computing ทั้งด้านการบริหารจัดการ Virtual Machine/Scaling Policy และการประยุกต์ใช้บริการสมัยใหม่แบบ Event-Driven
- **คำถามที่ต้องถามอาจารย์:**
  1. *การออกแบบที่มีทั้ง EC2 ASG และ Serverless ทำงานร่วมกันเช่นนี้ ถือว่าตอบโจทย์เกณฑ์การประเมินด้านความหลากหลายและความซับซ้อนของโครงงานคลาวด์ได้ดีแล้วหรือไม่ครับ?*
  2. *ในมุมมองเชิงสถาปัตยกรรม มีส่วนไหนในฝั่ง EC2 ที่อาจารย์มองว่าควรยุบรวมหรือปรับไปเป็น Container (เช่น ECS Fargate) หรือ Serverless ล้วนเพื่อให้ระบบคลีนขึ้นหรือไม่ครับ?*

### ประเด็นที่ 3: ความคุ้มค่าและความซับซ้อนของ ElastiCache Caching Tier
- **บริบทปัจจุบัน:** ติดตั้ง ElastiCache Valkey สำหรับแคชตารางผู้นำ วัดผล Latency ลดลงจาก 41 มิลลิวินาทีเหลือ 1 มิลลิวินาที แต่ระบบต้องแบกรับค่าบริการของโหนดแคชประมาณ $0.017 ต่อชั่วโมง
- **สิ่งที่ควรนำเสนอต่ออาจารย์:** แสดงกราฟและตัวเลขผลการทดลองที่วัดได้จริง (Hit 1ms vs Miss 41ms)
- **คำถามที่ต้องถามอาจารย์:**
  1. *สำหรับปริมาณข้อมูลผู้เล่นในระดับโครงงาน การมี ElastiCache เข้ามาเสริมถือเป็นจุดเด่นที่แสดงความเข้าใจเรื่อง In-memory Cache หรืออาจารย์มองว่าเป็นการเพิ่มความซับซ้อนเกินความจำเป็นที่ควรตัดออกเพื่อประหยัดต้นทุนครับ?*

### ประเด็นที่ 4: การกระจายข้อมูลแบบ Asynchronous (Amazon SNS Fan-Out เทียบกับ EventBridge)
- **บริบทปัจจุบัน:** ใช้ Amazon SNS ส่งต่อ Event ไปยัง SQS 2 คิวคู่ขนาน
- **คำถามที่ต้องถามอาจารย์:**
  1. *การใช้ SNS Fan-Out ไปยัง SQS แยกตามหน้าที่ (History และ Stats) เป็นรูปแบบที่เหมาะสมกับโจทย์นี้แล้ว หรืออาจารย์มองว่าควรศึกษาการนำ Amazon EventBridge มาใช้แทน เพื่อรองรับ Content-based Filtering ในอนาคตครับ?*

### ประเด็นที่ 5: ขอบเขตการสาธิตในวันสอบสัมมนา (Defense Scope & Demo Expectation)
- **สิ่งที่ควรนำเสนอต่ออาจารย์:** ทางกลุ่มเตรียมบทเดโมความยาว 10 นาทีไว้ ซึ่งรวมถึงการสาธิตการเล่นจริง 2 คนข้ามหน้าต่าง และการทดสอบยิงปิดเครื่อง EC2 สดๆ เพื่อแสดงการ Self-Healing ของระบบ
- **คำถามที่ต้องถามอาจารย์:**
  1. *ในการนำเสนอและให้คะแนน อาจารย์ให้ความสำคัญกับส่วนใดมากที่สุดระหว่าง: การทำงานของแอปพลิเคชันจริง, การทดสอบ Fault Tolerance สดๆ (ASG/Failover), หรือการวิเคราะห์ตัวเลขผลการทดลองและต้นทุนในรายงานครับ?*
  2. *มีจุดไหนที่อาจารย์แนะนำให้ตัดออกหรือลดขอบเขตลง เพื่อไม่ให้เวลาการนำเสนอเกินหรือไม่ครับ?*

---

## 5. ลำดับขั้นตอนการนำเสนอในการเข้าพบอาจารย์ (Meeting Flow Suggestion)

1. **ช่วงที่ 1 (2 นาที) - แนะนำโครงงานและเป้าหมาย:** สรุปว่าระบบคืออะไร และทำไมจึงต้องใช้ Cloud สถาปัตยกรรมนี้
2. **ช่วงที่ 2 (3 นาที) - กางแผนภาพสถาปัตยกรรม:** เปิดไฟล์ภาพ [Aws_disney_lorcana.drawio.png](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/docs/architecture/Aws_disney_lorcana.drawio.png) หรือไฟล์ Draw.io ไล่เรียงการไหลของข้อมูลตั้งแต่หน้าเว็บ เบราว์เซอร์ ALB EC2 ไปจนถึง SQS, SNS, Lambda และ ElastiCache
3. **ช่วงที่ 3 (2 นาที) - โชว์ผลการทดสอบจริง:** แสดงหลักฐานว่าทุกอย่างไม่ใช่แค่โมเดลบนกระดาษ แต่ผ่านการ Deploy และรัน Automated Test ผ่านบน AWS จริง (โชว์ตัวเลข Latency แคช 1ms vs 41ms และการทำงานของ DLQ)
4. **ช่วงที่ 4 (5-8 นาที) - เปิดประเด็นคำถาม 5 ข้อ:** ไล่ถามข้อสงสัยตามหมวดในหัวข้อที่ 4 และจดบันทึกคำแนะนำของอาจารย์กลับมาปรับใช้ในรายงานและสไลด์ฉบับจริง
