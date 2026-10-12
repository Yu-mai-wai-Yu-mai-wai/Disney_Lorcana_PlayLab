# บทสนทนาปรึกษาอาจารย์: สถาปัตยกรรมคลาวด์ Disney Lorcana PlayLab Cloud

**วิชา:** Cloud Computing (KMITL IT)
**นัด:** วันนี้ 16:30 เป็นการปรึกษาเรื่องระบบ ไม่ใช่การนำเสนอ Final
**สถานะข้อมูล:** ตรวจกับ AWS จริงและ repo เมื่อ 2026-10-12 (us-east-1) ตัวเลขที่ไม่ได้วัดใหม่วันนี้ระบุที่มาไว้ในหัวข้อ 7

เอกสารนี้แทนร่างอีเมลเดิม ใช้เป็นสคริปต์พูด ไม่ต้องอ่านตามคำต่อคำ ข้อความหลัง "ตะวัน:" คือแนวที่จะพูด ข้อความหลัง "อาจารย์ (คาด):" คือคำตอบที่คาดว่าจะได้ยิน

---

## 0. เตรียมก่อนเข้าห้อง (ทำก่อน 16:00)

1. สถานะตอนนี้: ASG ถูกตั้งเป็น 0 เครื่องด้วย `lab.ps1 stop` ถ้าจะโชว์ระบบจริง ให้รัน `.\scripts\lab.ps1 start` ก่อน ใช้เวลาราว 2-3 นาทีจนผ่าน health check แล้วเปิด `http://<ALB DNS>/api/health` ยืนยัน
2. ALB กับ ElastiCache ยังเปิดอยู่และคิดเงินต่อเนื่อง ยังไม่ต้องรัน `destroy` จนกว่าจะคุยเสร็จ
3. เปิดไฟล์ไว้ 3 อย่าง: `aws_architecture_lorcana_playlab.drawio` (หรือ PNG), `docs/01_Reports/stage3_evidence/` และหน้า AWS Console (ASG Activity, Target Group)
4. Learner Lab หมด session ทุก 4 ชั่วโมง ตรวจเวลาที่เหลือก่อนเริ่ม ถ้าเหลือน้อยให้โชว์จากภาพหลักฐานแทน
5. อย่าเปิด `.env`, ค่า SSM หรือ credentials บนจอที่แชร์

---

## 1. เปิดบทสนทนา (2 นาที)

ตะวัน: "สวัสดีครับอาจารย์ วันนี้ผมไม่ได้มานำเสนอ Final แต่ขอปรึกษาเรื่องสถาปัตยกรรมก่อนปิดงานครับ ผมจะเล่าระบบสั้นๆ ตามแผนภาพ แล้วถามอาจารย์ 5 เรื่อง เรื่องที่ผมอยากได้คำตอบมากที่สุดคือเรื่องที่ 1 กับ 2 ครับ"

ตะวัน: "ระบบคือเว็บเกมการ์ด Disney Lorcana ให้ผู้เล่น 2 คนแข่งกันแบบเรียลไทม์ มีจัดเด็ค วิเคราะห์เด็ค บันทึกผลแข่ง และตารางอันดับ ทั้งหมดรันบน AWS Academy Learner Lab ที่ us-east-1 ภายใต้งบ 50 ดอลลาร์ และไม่มี NAT Gateway ครับ"

ตะวัน: "ระบบเป็นแบบผสม ส่วน Web/API ใช้ EC2 ใน Auto Scaling Group หลัง Load Balancer ส่วนเรียลไทม์กับงานเบื้องหลังใช้ serverless ผมเลือกแบบนี้เพื่อให้วิชาเห็นทั้งสองแนวทางในระบบเดียว ซึ่งเป็นหนึ่งในคำถามที่จะขออาจารย์ช่วยตัดสินครับ"

---

## 2. อธิบาย Workflow ตามแผนภาพ

ชี้ตามลำดับ ซ้ายไปขวา บนลงล่าง แต่ละ flow ใช้ 30-60 วินาที

### Flow A: เปิดเว็บและเรียก API

ตะวัน: "ผู้เล่นเปิดเบราว์เซอร์ ส่งคำขอ HTTP ไปที่ Application Load Balancer พอร์ต 80 ALB กระจายไป EC2 t3.micro 2 เครื่องที่อยู่คนละ Availability Zone (1a กับ 1b) บนเครื่องมี Nginx ทำหน้าที่เสิร์ฟหน้าเว็บ และส่งต่อคำขอ `/api/` ไปที่ Node.js"

ตะวัน: "ไฟล์ข้อมูลการ์ดใหญ่ 2.35 MB ผมให้ Nginx บีบ gzip เหลือ 436 KB และตั้ง `Cache-Control: immutable` อายุ 1 ปี ดังนั้นเบราว์เซอร์โหลดครั้งแรกครั้งเดียว"

ตะวัน: "ALB เช็กสุขภาพเครื่องที่ `/api/health` ถ้าเครื่องไหนไม่ผ่านจะถูกถอดออกจากการกระจายโหลด และ ASG สร้างเครื่องใหม่แทน"

### Flow B: สมัคร เข้าสู่ระบบ และจัดเด็ค

ตะวัน: "Node.js ตรวจรหัสผ่านด้วย bcrypt แล้วออก JWT เก็บผู้ใช้ใน DynamoDB ตาราง `UsersTable` และเด็คใน `DecksTable` ความลับอย่าง JWT secret อยู่ใน SSM Parameter Store ที่ path `/lorcana/*` เครื่อง EC2 อ่านตอนบูตผ่าน IAM role ไม่ฝังในโค้ด"

### Flow C: วิเคราะห์เด็คแบบ asynchronous

ตะวัน: "ตอนบันทึกเด็ค API ส่งงานเข้า SQS คิว `lorcana-deck-analyzer` แล้วตอบผู้ใช้ทันที Lambda `lorcana-analyzer` ดึงงานไปคำนวณกราฟค่าร่ายกับสัดส่วนการ์ด inkable แล้วเขียนผลกลับ `DecksTable` ถ้าข้อความเสียหรือประมวลผลล้มเหลวครบ 3 ครั้ง จะย้ายเข้า Dead Letter Queue ไม่ให้งานเดียวทำให้คิวติด"

### Flow D: เล่นแบบเรียลไทม์

ตะวัน: "ผมแยกส่วนเรียลไทม์ออกจาก EC2 ผู้เล่นเชื่อม WebSocket ไปที่ API Gateway WebSocket API ซึ่งเรียก Lambda `lorcana-room` เพื่อจับคู่และส่งต่อข้อความ สถานะห้องอยู่ใน DynamoDB (`LorcanaRoomStateV2`, `LorcanaMatchmaking`) เหตุผลคือถ้าเก็บ connection ไว้ในหน่วยความจำของ EC2 เครื่องที่ถูก scale-in จะตัดผู้เล่นทิ้ง แต่เมื่อสถานะอยู่ใน DynamoDB เครื่องไหนก็ให้บริการได้"

### Flow E: จบเกมและกระจายผล (Fan-Out)

ตะวัน: "เมื่อเกมจบ API ส่ง event `match.finished` ไปที่ SNS Topic แล้ว SNS กระจายไป SQS 2 คิว คิวหนึ่งให้ Lambda บันทึกประวัติแมตช์ลง `LorcanaMatchHistory` อีกคิวให้ Lambda คำนวณสถิติลง `LorcanaPlayerStats` ทั้งสอง worker ออกแบบเป็น idempotent คือรับข้อความซ้ำแล้วผลไม่เพี้ยน และมี DLQ ของตัวเอง"

### Flow F: ตารางอันดับและแคช

ตะวัน: "`GET /api/leaderboard` ดูใน ElastiCache ก่อน ถ้าไม่มีให้อ่านจาก DynamoDB แล้วเขียนกลับแคช อายุ 60 วินาที รูปแบบนี้เรียก cache-aside ถ้าแคชล่ม ระบบอ่าน DynamoDB ตรงและยังตอบ HTTP 200 ได้ ผมทดสอบกรณี connection refused แล้วในรอบ Stage 3"

### Flow G: ขยายและลดเครื่องอัตโนมัติ

ตะวัน: "ASG ตั้งต่ำสุด 2 สูงสุด 4 ใช้ target tracking ที่ CPU 60% วันนี้ผมสร้างระบบใหม่แล้วยิง login ต่อเนื่อง 10 นาที ได้ 18,270 ครั้ง ไม่มีครั้งที่ล้มเหลว เครื่องเพิ่มจาก 2 เป็น 3 เวลา 11:22 และเป็น 4 เวลา 11:28 (เวลาท้องถิ่น) หลังหยุดยิง ระบบลดกลับเหลือ 2 ใช้เวลาราว 15 นาที มีภาพหลักฐานจาก AWS Console ในรายงานบทที่ 4"

---

## 3. แผนภาพครบถ้วนไหม

คำตอบสั้น: ครบเส้นทางข้อมูลหลัก ขาดบางชิ้นที่ควรรู้ไว้เผื่ออาจารย์ถาม

**ที่แผนภาพมีและตรงกับของจริง**
- VPC 10.0.0.0/16, public subnet 2 ชุด, ไม่มี NAT, Internet Gateway
- ALB, ASG (2-4), EC2 สองเครื่องคนละ AZ
- ElastiCache (ระบุ Redis ตรงกับ cluster ที่สร้างใหม่), SSM Parameter Store
- API Gateway WebSocket, Lambda `lorcana-room`, ตาราง DynamoDB ทั้ง 6
- SQS, DLQ, SNS, Lambda ทั้ง 3 ตัว และลูกศร flow ทั้งหมดข้างบน

**ที่แผนภาพยังไม่แสดง (พูดปากเปล่าได้ถ้าอาจารย์ถาม)**
1. S3 สองบัคเก็ต (`lorcana-playlab-static-*`, `lorcana-playlab-assets-*`) เก็บหน้าเว็บที่ build แล้วกับ bundle ของ backend EC2 ดึงตอนบูต
2. CloudWatch alarm ของ target tracking (AlarmHigh/AlarmLow) และ `lorcana-unhealthy-hosts`
3. Security Group: EC2 รับพอร์ต 80 เฉพาะจาก ALB SG, ElastiCache รับ 6379 เฉพาะจาก EC2 SG, ไม่เปิดพอร์ต 22
4. Route `$disconnect` ของ WebSocket (ในแผนภาพเขียนแค่ `$connect` กับ `action`)
5. IAM: ทุกส่วนใช้ `LabRole` / `LabInstanceProfile` เพราะ Learner Lab สร้าง role เองไม่ได้
6. Lambda `lorcana-auth-register` กับ `lorcana-room` ที่ deploy อยู่ยังเป็นโค้ดก่อน PR #2 (จะปรับตอน publish ครั้งถัดไป)

**ที่ต้องแก้ในแผนภาพ**
- ป้าย "React 18 + Vite" ควรเป็น React 19 (`package.json` ระบุ ^19.0.0)
- ป้าย Routes ควรเพิ่ม `$disconnect`

แก้สองจุดนี้เป็นข้อความในไฟล์ `.drawio` ให้แล้ว (หัวข้อ 9) ต้อง export PNG ใหม่อีกรอบถ้าจะใช้ภาพ

---

## 4. ประเด็นที่จะถามอาจารย์

เรียงตามความสำคัญ แต่ละข้อมี บริบท จุดยืนของกลุ่ม คำถาม และสิ่งที่จะทำตามคำตอบ

### คำถามที่ 1: Public Subnet กับ Private Subnet + VPC Endpoint

**บริบท:** EC2 อยู่ใน public subnet เพราะ NAT Gateway คิดราว 32.4 ดอลลาร์ต่อเดือน เกินงบที่จะกันไว้ มี public IPv4 ซึ่งคิดเงินอยู่แล้วที่ 0.005 ดอลลาร์ต่อชั่วโมงต่อ address ความปลอดภัยพึ่ง Security Group: EC2 รับเฉพาะพอร์ต 80 จาก ALB และไม่เปิดพอร์ต 22 การเรียก DynamoDB, SQS, SNS จาก EC2 ออกอินเทอร์เน็ตผ่าน TLS

**จุดยืนกลุ่ม:** คงแบบเดิม และเขียน trade-off ในรายงาน

ตะวัน: "ถ้ามองเป็น production จริง อาจารย์คิดว่าควรย้าย EC2 ไป private subnet แล้วใช้ Gateway Endpoint สำหรับ DynamoDB (ฟรี) กับ Interface Endpoint สำหรับ SQS และ SNS ไหมครับ หรือคงแบบเดิมแล้วบันทึกเหตุผลเรื่องงบพอสำหรับวิชานี้ครับ"

**ถ้าตอบว่าควรย้าย:** ทำ Gateway Endpoint ของ DynamoDB ก่อน เพราะฟรีและเห็นผล Interface Endpoint คิดชั่วโมงละประมาณ 0.01 ดอลลาร์ต่อ AZ ต่อ endpoint ต้องคำนวณก่อน
**ถ้าตอบว่าคงเดิม:** เพิ่มหัวข้อ trade-off ในรายงาน พร้อมตัวเลขต้นทุน

### คำถามที่ 2: EC2 ASG ผสม Serverless เหมาะกับขอบเขตวิชาไหม

**บริบท:** Web/API อยู่บน EC2 + ALB + ASG เพื่อแสดงการจัดการเครื่อง Load Balancer และ auto scaling ส่วน WebSocket, deck analysis และ match event เป็น Lambda + SQS + SNS

**จุดยืนกลุ่ม:** ผสมแล้วครอบคลุมทั้งสองแนวทางอยู่แล้ว ไม่ย้ายเป็น ECS Fargate หรือ serverless ทั้งระบบ เพราะเวลาที่เหลือไม่พอและ Learner Lab จำกัดบริการบางตัว

ตะวัน: "ระบบของผมมีทั้ง EC2 ASG และ serverless อยู่ด้วยกัน ผมอยากทราบว่าอาจารย์มองว่าครอบคลุมขอบเขตวิชาแล้ว หรือคาดหวังให้ย้าย Web Tier ไป ECS Fargate หรือ serverless ล้วนครับ"

**ถ้าตอบว่าพอแล้ว:** เขียนเหตุผลของการแบ่งส่วนลงรายงาน
**ถ้าตอบว่าควรย้าย:** ถามต่อว่าย้ายเฉพาะ Web Tier ได้ไหม และมีเกณฑ์คะแนนอะไรผูกอยู่ จะได้ประเมินว่าทันก่อนส่งหรือไม่

### คำถามที่ 3: ElastiCache จำเป็นสำหรับข้อมูลระดับนี้ไหม

**บริบท:** รอบวัด Stage 3 ได้ cache miss 41 ms และ cache hit 1 ms (ลด 97.56%) จากตารางอันดับขนาดเล็ก (ผลวัดครั้งเดียว ตอนนั้นใช้ Valkey) cluster ที่สร้างใหม่วันนี้เป็นเอนจิน Redis โหนดเดียว `cache.t3.micro` ยืนยันได้ว่า header `X-Cache` เปลี่ยน MISS เป็น HIT และระบบยังตอบได้เมื่อแคชล่ม ต้นทุนราว 0.017 ดอลลาร์ต่อชั่วโมง

**จุดยืนกลุ่ม:** คงไว้ เพราะแสดง caching layer และ graceful degradation ได้ แต่ยอมรับว่าข้อมูลจริงเล็กจนไม่จำเป็นในเชิงประสิทธิภาพ

ตะวัน: "แคชช่วยลดเวลาตอบจาก 41 เหลือ 1 มิลลิวินาที แต่ข้อมูลผู้เล่นของเรามีไม่กี่ร้อยแถว DynamoDB แบบ on-demand ก็เร็วพอ อาจารย์มองว่า ElastiCache เป็นจุดที่แสดงความเข้าใจ caching ได้ดี หรือเป็นต้นทุนและความซับซ้อนที่เกินจำเป็นครับ"

**หมายเหตุ:** โหนดเดียวไม่มี replica ถ้าอาจารย์ถามเรื่อง high availability ของแคช ให้ตอบตรงๆ ว่ายังไม่มี และระบบรอดได้ด้วย fallback ไป DynamoDB

### คำถามที่ 4: SNS Fan-Out หรือ EventBridge

**บริบท:** ตอนนี้ event เดียว (`match.finished`) กระจายไป 2 คิวด้วย SNS ซึ่งเรียบง่ายและตรงงาน EventBridge รองรับกฎกรองซับซ้อนกว่า แต่เพิ่มบริการที่ต้องตั้งค่า

**จุดยืนกลุ่ม:** คง SNS เพราะมี event ชนิดเดียวและ subscriber สองตัว ยังไม่มีเงื่อนไขกรอง

ตะวัน: "ตอนนี้มี event ชนิดเดียวกับ consumer สองตัว ผมเลยใช้ SNS Fan-Out ถ้าอนาคตมี event หลายชนิดที่ต้องกรองตามเนื้อหา อาจารย์คิดว่าควรเริ่มศึกษา EventBridge หรือ SNS filter policy ก็พอครับ"

**หมายเหตุ:** SNS รองรับ subscription filter policy อยู่แล้ว ซึ่งตอบกรณีกรองง่ายๆ ได้โดยไม่ต้องเพิ่มบริการ

### คำถามที่ 5: ความปลอดภัยและความถูกต้องของข้อมูล (จุดอ่อนที่รู้อยู่แล้ว)

พูดเองก่อนอาจารย์ถาม สามเรื่อง

1. **WebSocket ไม่ยืนยันตัวตน:** ใครรู้ `roomId` ก็ส่งข้อความเข้าห้องได้ ทางแก้คือตรวจ JWT ที่ route `$connect` ผมยังไม่ได้ทำ
2. **ผลแข่งรายงานจากฝั่งผู้เล่น:** ผู้เล่นส่งผลชนะเองได้ ยังไม่มีเซิร์ฟเวอร์เป็นผู้ตัดสิน ทางแก้คือให้ฝั่งเซิร์ฟเวอร์บันทึกผลจากสถานะเกม
3. **HTTP พอร์ต 80 อย่างเดียว:** ยังไม่มี HTTPS เพราะต้องมี ACM certificate กับโดเมน ซึ่ง Learner Lab ตั้งได้จำกัด

ตะวัน: "ผมรู้ว่ามีสามจุดนี้ และไม่อยากซ่อน ผมอยากถามว่าในเกณฑ์ของวิชา อาจารย์ให้น้ำหนักเรื่องนี้แค่ไหน ถ้าแก้ได้เพียงข้อเดียวก่อนส่ง อาจารย์อยากให้แก้ข้อไหนครับ"

### คำถามที่ 6: เกณฑ์ประเมินและขอบเขตงานที่เหลือ

ตะวัน: "สัดส่วนคะแนนอยู่ที่หลักฐานการทดลอง (scaling, failover, cache) หรือที่ความสมบูรณ์ของระบบครับ และรายงานต้องใช้ IaC เช่น CloudFormation หรือ Terraform ไหม ตอนนี้ผมใช้สคริปต์ PowerShell กับ AWS CLI ที่รันซ้ำได้ครับ"

**ทำไมต้องถาม:** ผลของคำตอบนี้ตัดสินว่าเวลาที่เหลือควรใช้ทำ IaC, แก้ความปลอดภัย หรือขัดเกลารายงาน

### คำถามเสริม (ถามถ้าเวลาเหลือ)

- ElastiCache โหนดเดียวยอมรับได้ไหมสำหรับเดโม หรือควรเพิ่ม replica
- ตาราง matchmaking กับ leaderboard ใช้ Scan ซึ่งไม่ scale ควรเปลี่ยนเป็น Query กับ GSI ไหม หรือบันทึกเป็นข้อจำกัดของขนาดโครงงาน
- ควรมี backup (DynamoDB point-in-time recovery) และแผน recovery ในรายงานไหม
- Scale-in ใช้เวลาราว 15 นาทีหลังโหลดหยุด เกณฑ์ 60% CPU เหมาะสมหรือควรปรับ

---

## 5. คำถามที่อาจารย์น่าจะถามกลับ

| คำถามที่คาด | แนวตอบ |
|---|---|
| ทำไม t3.micro | งบ Learner Lab 50 ดอลลาร์ ต้นทุนราว 0.0104 ดอลลาร์ต่อชั่วโมงต่อเครื่อง และ CPU ถึง 60% ได้เร็ว ทำให้ทดสอบ scaling ได้จริง |
| พิสูจน์ได้ไหมว่า HA ทำงาน | Stage 3 ทดสอบ self-healing และ DLQ บน stack เดิม วันนี้ยังไม่ได้รันซ้ำบน stack ใหม่ บอกตรงๆ และเสนอรันให้ดูถ้ามีเวลา |
| ทำไม Lambda ไม่อยู่ใน VPC | Lambda ที่ใช้ SQS/SNS/DynamoDB เรียกผ่าน public endpoint ได้ ไม่ต้องมี NAT ส่วน ElastiCache ที่ต้องอยู่ใน VPC เข้าถึงจาก EC2 เท่านั้น |
| Idempotent ทำอย่างไร | match-history เขียนด้วย key `userId` + `finishedAt#matchId` ข้อความซ้ำจึงทับรายการเดิม ส่วน player-stats เขียน marker `DEDUPE#<matchId>` แบบ conditional (`attribute_not_exists`, เก็บ 7 วัน) ก่อน ถ้ามีอยู่แล้วจะข้าม แล้วจึงนับ wins/games ด้วย `ADD` แบบ atomic (โค้ดอยู่ที่ `backend/serverless/player-stats/handler.ts`) |
| คิวค้างกลายเป็นปัญหาอะไร | วันนี้เจอจริง: event source mapping ของ Lambda ถูกตั้งเป็น Disabled ทำให้ข้อความไม่ถูกประมวลผล ผมแก้ `ensure_pipeline.ps1` ให้เปิดกลับอัตโนมัติ (PR #4) |
| ต้นทุนรวมเท่าไร | เปิด 2 เครื่องราว 0.079 ดอลลาร์ต่อชั่วโมง ALB ราว 0.0325 ดอลลาร์ต่อชั่วโมงแม้ปิด EC2 และ ElastiCache 0.017 ดอลลาร์ต่อชั่วโมง ใช้ `lab.ps1 stop` ลด EC2 และ `destroy` เมื่อไม่ใช้ |
| ทดสอบอะไรไปแล้ว | Vitest 135 case ผ่านทั้งหมด, CI ใน GitHub Actions, Playwright E2E บน ALB จริง 54 ผ่าน และ TC-E2E-23 ผ่านหลังแก้ mapping |
| ทำไมไม่ใช้ ECS | ดูคำถามที่ 2 ผมอยากให้ผู้เรียนเห็นการจัดการ VM กับ Load Balancer โดยตรง และ Learner Lab มีข้อจำกัดเรื่อง role |

---

## 6. จุดที่ต้องบอกตรงๆ ว่ายังไม่ได้ทำหรือยังไม่ได้ยืนยัน

1. ทดสอบ ASG self-healing และ DLQ บน stack ใหม่ยังไม่ได้รันซ้ำ ผลที่มีเป็นของ Stage 3 บน stack เดิม
2. `ensure_pipeline.ps1` ที่แก้ใหม่ตรวจ syntax แล้ว แต่ยังไม่ได้รันจริงเพื่อพิสูจน์การเปิด mapping อัตโนมัติ
3. Lambda `lorcana-auth-register` กับ `lorcana-room` ยังเป็นโค้ดก่อน PR #2 และ JWT_SECRET ของ auth-register, analyzer, room ไม่ตรงกับค่าใน SSM ต้อง publish ซ้ำ
4. ตัวเลข 41 ms เทียบ 1 ms มาจากการวัดครั้งเดียวบน Valkey ใน Stage 3 ไม่ใช่ benchmark ซ้ำหลายรอบ
5. รายงาน `.tex` ยังไม่ได้ compile หลังเพิ่มรูปบทที่ 4
6. `LorcanaBoard.tsx` ยาว 1,623 บรรทัด เป้าหมาย 1,500 บรรทัดถูกยกเลิกโดยตั้งใจ

---

## 7. ตัวเลขสำหรับอ้างอิง (ที่มา)

| ตัวเลข | ค่า | ที่มา |
|---|---|---|
| ขนาดไฟล์การ์ด | 2.35 MB เหลือ 436 KB (ลด 81.43%) | `docs/01_Reports/STAGE3_EXPERIMENT_RESULTS.md` |
| Leaderboard miss / hit | 41 ms / 1 ms (ลด 97.56%) | เอกสารเดียวกัน วัดครั้งเดียวบน Valkey |
| Scale-out วันนี้ | 2 เป็น 3 เวลา 04:22:05Z, 3 เป็น 4 เวลา 04:28:05Z | `docs/01_Reports/stage3_evidence/stress_scaling_2026-10-12.txt` |
| Scale-in วันนี้ | 4 เป็น 3 เวลา 04:44:41Z, 3 เป็น 2 เวลา 04:46:34Z | เอกสารเดียวกัน |
| โหลดทดสอบ | 18,270 login สำเร็จ ล้มเหลว 0 ความเร็ว 30.4 ต่อวินาที | เอกสารเดียวกัน |
| E2E บน ALB จริง | 54 ผ่าน และ TC-E2E-23 ผ่านรอบรันซ้ำ | `docs/01_Reports/stage3_evidence/e2e_after_pr2_2026-10-12.txt` |
| Vitest | 135 ผ่านใน 22 ไฟล์ | รันเองเมื่อ 2026-10-12 |
| ต้นทุนต่อชั่วโมง | EC2 2 เครื่อง ราว 0.079 ดอลลาร์รวมส่วนประกอบ, ALB 0.0325, ElastiCache 0.017 | `docs/01_Reports/AWS_LearnerLab_Setup.md` และ STAGE3 |

---

## 8. ปิดบทสนทนา (1 นาที)

ตะวัน: "สรุปที่ผมจะนำไปทำต่อ: หนึ่ง บันทึก trade-off เรื่อง public subnet ในรายงาน สอง ตัดสินใจเรื่อง Web Tier ตามที่อาจารย์แนะนำ สาม ปรับเรื่องแคชตามคำตอบ สี่ ทำเรื่องความปลอดภัยของ WebSocket หรือผลแข่งตามลำดับที่อาจารย์ให้ ขอบคุณครับ"

**จดคำตอบระหว่างคุย:**

| ข้อ | คำตอบของอาจารย์ | สิ่งที่ต้องทำต่อ | ทำเสร็จ |
|---|---|---|---|
| 1 Subnet / Endpoint | | | |
| 2 EC2 + Serverless | | | |
| 3 ElastiCache | | | |
| 4 SNS / EventBridge | | | |
| 5 ความปลอดภัย | | | |
| 6 เกณฑ์ / IaC | | | |

---

## 9. บันทึกการแก้ไขเอกสารนี้ (2026-10-12)

- แทนร่างอีเมลเดิมด้วยสคริปต์สนทนา
- แก้ "ElastiCache Valkey" เป็น Redis สำหรับ cluster ปัจจุบัน และระบุว่าตัวเลข 41/1 ms วัดตอนใช้ Valkey
- แก้ "React 18" เป็น "React 19" และเพิ่ม `$disconnect` ในป้าย Routes ของ `aws_architecture_lorcana_playlab.drawio` แล้ว PNG (`Aws_disney_lorcana.drawio.png`) ยังเป็นรุ่นเก่า ต้อง export ใหม่ก่อนใช้

---

## 10. สรุปผลการเข้าพบอาจารย์และคำตอบ 4 ข้อ (2026-10-12)

หลังการปรึกษาเมื่อ 16:30 อาจารย์ได้ให้ข้อเสนอแนะให้ปรับแผนภาพ draw.io ให้ละเอียด อ่านง่าย และอธิบาย process ของแต่ละบริการอย่างชัดเจน พร้อมมีประเด็นคำถาม 4 ข้อหลัก ซึ่งสรุปคำตอบตามสถาปัตยกรรมจริงของระบบได้ดังนี้:

### 1. ElastiCache ใช้ทำอะไร
- **จุดประสงค์:** ใช้ทำ Database Caching แบบ Cache-Aside ให้กับ Leaderboard API (`GET /api/leaderboard`) เพื่อลดภาระการ Query/Scan บน DynamoDB (`LorcanaPlayerStats`)
- **การทำงาน:** เก็บข้อมูลอันดับผู้เล่นใน Redis ด้วย TTL 60 วินาที เมื่อมีคำขอเข้ามา API จะตรวจสอบที่ ElastiCache ก่อน หากพบ (Cache HIT) จะส่งข้อมูลกลับทันที หากไม่พบ (Cache MISS) จะไปอ่านข้อมูลจาก DynamoDB แล้วนำมาเขียนลงแคช
- **ผลทดสอบเชิงประจักษ์:** ลด Latency จาก 41 ms (MISS) เหลือ 1 ms (HIT) (ลดลง 97.56%)
- **Graceful Degradation:** หาก ElastiCache มีปัญหาหรือล่ม ระบบจะ Fallback กลับไปอ่านจาก DynamoDB โดยตรงและยังตอบผลลัพธ์ HTTP 200 ได้ตามปกติ

### 2. Lambda ทำหน้าที่อะไรบ้าง
ระบบใช้ Lambda ในรูปแบบ Event-Driven และ Serverless Decoupling แยกตามฟังก์ชันงาน:
1. **`lorcana-room` (Real-time Relay):** ทำงานร่วมกับ API Gateway WebSocket เพื่อจัดการการเชื่อมต่อห้องเกม, จับคู่ผู้เล่น (Matchmaking), และส่งต่อ Action ต่างๆ ระหว่างผู้เล่น 2 คน โดยบันทึกสถานะห้องลง DynamoDB (`LorcanaRoomStateV2`)
2. **`lorcana-analyzer` (Async Deck Analysis):** ถูก Trigger โดย SQS คิว `lorcana-deck-analyzer` ดึงข้อมูลเด็คมาวิเคราะห์กราฟค่าร่าย (Cost Curve), สัดส่วน Inkable, และ Synergy Score แล้วเขียนผลลัพธ์กลับลง `DecksTable` (มี Dead Letter Queue รองรับเมื่อประมวลผลล้มเหลว 3 ครั้ง)
3. **`lorcana-match-history` (Match History Consumer):** รับ Event `match.finished` จาก SNS Fan-out ผ่าน SQS คิว `lorcana-match-history` เพื่อบันทึกประวัติการแข่งขันของผู้เล่นทั้งสองคนลง DynamoDB `LorcanaMatchHistory`
4. **`lorcana-player-stats` (Player Stats Consumer):** รับ Event เดียวกันผ่าน SQS คิว `lorcana-player-stats` เพื่อคำนวณและอัปเดตสถิติชนะ/แพ้/จำนวนเกมลง DynamoDB `LorcanaPlayerStats` (ใช้ Conditional Write ตรวจสอบ Marker เพื่อป้องกันการบันทึกซ้ำแบบ Idempotent)

### 3. ออกอินเทอร์เน็ตอย่างไรเมื่อไม่มี NAT Gateway (Egress without NAT Gateway)
- **สถาปัตยกรรมเครือข่าย:** EC2 Instances ถูกวางไว้ใน Public Subnet ที่มี Public IPv4 และมี Route Table ชี้ `0.0.0.0/0` ออกสู่อินเทอร์เน็ตผ่าน Internet Gateway (IGW) โดยตรง
- **การเชื่อมต่อบริการ AWS:** EC2 ใช้เส้นทางผ่าน Internet Gateway เพื่อเรียกใช้งาน AWS Public API Endpoints (ได้แก่ DynamoDB, SQS, SNS, SSM, S3) ภายใต้การเข้ารหัส TLS
- **ความปลอดภัย:** ชดเชยการไม่มี Private Subnet ด้วย Security Group ที่รัดกุม โดย EC2 Security Group เปิดรับทราฟฟิกขาเข้า (Inbound) พอร์ต 80 จาก ALB Security Group เท่านั้น และปิดพอร์ต 22 อย่างสมบูรณ์ ทำให้อินเทอร์เน็ตภายนอกไม่สามารถเข้าถึง EC2 ได้โดยตรง
- **เหตุผลความคุ้มค่า:** เพื่อหลีกเลี่ยงต้นทุนของ NAT Gateway ซึ่งคิดค่าบริการคงที่ประมาณ $32.40 ต่อเดือน (~$0.045/ชม.) ซึ่งจะกระทบต่องบประมาณ AWS Learner Lab ($50)

### 4. ตรรกะเกม (Game Logic) อยู่ที่ Lambda หรือ EC2
- **ความจริงของระบบ:** ตรรกะเกมส่วนใหญ่ (State Management, Ability Resolver, Phase Transition, Keyword Validation) ทำงานที่ **Client-Side (เบราว์เซอร์ของผู้เล่น)** ใน `src/components/LorcanaBoard.tsx` และ `src/game/engine.ts`
- **บทบาทของฝั่ง Server:**
  - **Lambda (`lorcana-room`):** ทำหน้าที่เป็น Message Relay ส่งต่อ Action ผ่าน WebSocket และเก็บ Room State ชั่วคราว แต่ไม่ได้เป็น Authoritative Server ที่ตรวจสอบกฎเกมบน Server
  - **EC2 (`backend/server.ts`):** ให้บริการ REST API สำหรับ Auth, จัดการ Deck, และรับผลสรุปการแข่งขัน (`POST /api/matches`) เพื่อส่งต่อเข้า Event Pipeline
- **ข้อจำกัดที่ระบุอย่างตรงไปตรงมา:** เนื่องจากเป็นการออกแบบต้นแบบสำหรับวิชา Cloud Computing สถาปัตยกรรมจึงเน้นการพิสูจน์ระบบ Cloud Infrastructure, Scaling, Caching, และ Event Decoupling โดยยอมรับข้อจำกัดว่าผลการแข่งขันถูกรายงานจากฝั่ง Client และ WebSocket ยังไม่มีการตรวจสอบ JWT ที่ Route `$connect`

