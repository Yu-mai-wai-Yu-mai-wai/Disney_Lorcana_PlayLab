# 🎓 AWS Academy Learner Lab — คู่มือสถาปัตยกรรม & การควบคุมงบ $50

> **Disney Lorcana PlayLab Cloud** — คู่มือการ Deploy, การตั้งค่า Lean Multi-AZ VPC, EC2 Auto Scaling Group, และการควบคุมค่าใช้จ่ายให้ปลอดภัยตลอดเทอม
> รองรับ: **Stage 2 (Cloud Architecture & IaC)** และ **Stage 3 (High Availability & Scalability)**

---

## 🔑 Step 1 — เริ่มต้น Lab & รับ Session Credentials

1. เข้าสู่ **AWS Academy** (learn.awsacademy.com) → คอร์ส Cloud Computing → **Learner Lab**
2. กดปุ่ม **Start Lab** (สีเขียว) → รอสถานะเป็นวงกลมสีเขียว (Session ใช้งานได้ ~4 ชั่วโมง)
3. กดที่เมนู **AWS Details** (มุมบนซ้าย) → กด **Show**
4. **ตั้งค่า AWS Credentials บนเครื่อง (เลือกแบบใดแบบหนึ่ง):**
   - **วิธีที่ 1 (เร็วที่สุด — 1-Click Clipboard):** กดปุ่มคัดลอกทั้งบล็อก `[default] ...` จาก AWS Details แล้วรันคำสั่งเดียวใน PowerShell:
     ```powershell
     Set-Content -Path "$HOME\.aws\credentials" -Value (Get-Clipboard)
     ```
   - **วิธีที่ 2 (ตั้งค่าทีละตัวแปรผ่าน AWS CLI):**
     ```powershell
     aws configure set aws_access_key_id "<คัดลอกมาวาง>"
     aws configure set aws_secret_access_key "<คัดลอกมาวาง>"
     aws configure set aws_session_token "<คัดลอกมาวาง>"
     aws configure set region "us-east-1"
     aws configure set output "json"
     ```
5. ตรวจสอบการเชื่อมต่อ:
   ```powershell
   aws sts get-caller-identity
   ```
   > ⚠️ **ข้อควรระวัง:** หากเจอ Error `voc-cancel-cred` หรือ `AccessDenied` แสดงว่า Session 4 ชม. หมดอายุ หรือกด End Lab ไปแล้ว ให้กลับไปกด **Start Lab** ในเว็บ แล้วนำ Credentials ชุดใหม่มาวางซ้ำ

---

## 🚀 Step 2 — Deploy สถาปัตยกรรม IaaS (Lean VPC + ALB + ASG)

รันสคริปต์อัตโนมัติสร้าง Infrastructure ทั้งหมดในคำสั่งเดียว:

```powershell
cd D:\Tawanagent\TAWAN-OS\02_STUDY\2026-Semester\Cloud_Computing\Cloud_Project\DISNEY_LORCANA_PLAYLAB_CLOUD\scripts

# รัน Deployer
.\deploy_ec2_vpc_asg.ps1 -Region us-east-1 -InstanceType t3.micro
```

### สถาปัตยกรรมที่สคริปต์จะสร้างขึ้นอัตโนมัติ:
1. **Lean Multi-AZ VPC (`10.0.0.0/16`):** 2 Public Subnets บน `us-east-1a` และ `us-east-1b` + Internet Gateway (ไม่มี NAT Gateway ประหยัดราว $32.40/เดือน แต่ public IPv4 ยังคิด $0.005/ชม./address)
2. **Security Groups:**
   - `ALB SG`: เปิดรับ HTTP Port 80 จากทั่วโลก (`0.0.0.0/0`)
   - `EC2 SG`: เปิดรับ Port 80 **เฉพาะจาก ALB SG เท่านั้น**
3. **Application Load Balancer (ALB):** รับทราฟฟิกและส่งต่อเข้า Target Group พร้อมตั้ง Health Check ที่ `/api/health` (ผ่าน nginx ไปถึง Node ถ้า backend ล่ม เครื่องจะถูกมาร์ก unhealthy)
4. **Launch Template:** ระบบ Amazon Linux 2023 (`t3.micro`) แนบ IAM `LabInstanceProfile` พร้อม User Data Script ติดตั้ง Nginx, Node.js ดึงโค้ดจาก S3 และอ่าน secret จาก SSM Parameter Store (`/lorcana/*`) บังคับ IMDSv2 และเปิด detailed monitoring
5. **Auto Scaling Group (ASG):** Min 2, Desired 2 (AZ ละ 1 เครื่อง), Max 4 พร้อม CPU Target Tracking 60%
6. **CloudWatch alarm** `lorcana-unhealthy-hosts` (UnHealthyHostCount > 0) ใช้เป็นหลักฐาน HA
7. **Realtime:** ไม่ได้รันบน EC2 ใช้ API Gateway WebSocket + Lambda `lorcana-room` (state อยู่ใน DynamoDB)

หลัง deploy ครั้งแรกหรือเมื่อแก้โค้ด ให้รัน `.\scripts\lab.ps1 publish` (build, อัปโหลด S3, sync secret ให้ Lambda และเปลี่ยนเครื่องทีละเครื่อง)

---

## 🛡️ Step 3 — วงจรการควบคุมงบประมาณ $50 (1-Click Cost Lifecycle)

เพื่อให้งบ $50 ใน Learner Lab ปลอดภัยและเหลือใช้ตลอดทั้งภาคการศึกษา:

### 1. เมื่อต้องการทำแล็บ หรือเปิดเดโมให้อาจารย์ดู
```powershell
.\scripts\lab.ps1 start   # หรือ .\scripts\lab_start.ps1
```
* สั่งปรับ `Min = Desired = 2`
* EC2 2 เครื่อง (us-east-1a และ 1b) บูตและผ่าน health check ภายในราว 2-3 นาที

### 2. ตรวจสอบสถานะเครื่อง & สุขภาพ ALB
```powershell
.\scripts\lab.ps1 status
```
* แสดงตาราง Instance ใน ASG และยิง Health Check ทดสอบการตอบสนอง

### 3. เมื่อเลิกใช้งานประจำวัน (Scale-to-Zero)
```powershell
.\scripts\lab.ps1 stop    # หรือ .\scripts\lab_stop.ps1
```
* สั่งปรับ `Desired Capacity = 0` และ `Min Size = 0`
* EC2 ทั้งหมดถูก terminate ค่า EC2 หยุดทันที แต่ ALB และ public IPv4 ของ ALB ยังคิดราว $0.0325/ชม. (≈ $23.7/เดือน) ถ้าหยุดนานให้ใช้ destroy

### 4. เมื่อส่งโปรเจกต์เสร็จสิ้น / ไม่ได้ใช้งานยาวนาน (Complete Teardown)
```powershell
.\scripts\lab.ps1 destroy # หรือ .\scripts\lab_destroy.ps1
```
* ลบ ALB, Target Group, ASG, Launch Template, Security Groups และ VPC ทิ้งทั้งหมด
* ค่าใช้จ่ายรายชั่วโมงของ VPC/ALB/EC2 เป็น $0 (ยังเหลือ S3, DynamoDB, SSM ตามข้อมูลที่เก็บ ซึ่งต่ำมาก)
* ถ้าลบไม่ครบ สคริปต์จะ exit 1 และเก็บ `infrastructure_state.json` ไว้ ให้รันซ้ำได้

---

## 📈 Step 4 — การทดสอบ Auto Scaling & เก็บหลักฐานส่งรายงาน Stage 2/3

รันสคริปต์ Stress Test เพื่อจำลองโหลดผู้เล่นจำนวนมาก:

```powershell
.\scripts\stress_test.ps1 -DurationSeconds 360 -Concurrency 40 -StressUser stress_bot_<วันที่>

# ทดสอบ failover: หยุด Node บนเครื่องหนึ่งผ่าน SSM แล้วพิมพ์ timeline การกู้คืน
.\scripts\test_asg_recovery.ps1 -FailureMode app
```

### สิ่งที่ต้องแคปภาพหน้าจอใน AWS Console สำหรับทำรายงาน:
1. **VPC Console:** ภาพ Resource Map ของ VPC แสดง 2 Subnets Multi-AZ และ Route Table
2. **EC2 Console -> Load Balancers:** ภาพ Target Group แสดงสถานะ **Healthy 200 OK**
3. **EC2 Console -> Auto Scaling Groups -> Activity:** ภาพประวัติที่ alarm สั่งเพิ่มเครื่อง 2 → 4 และการเปลี่ยนเครื่องที่ unhealthy
4. **CloudWatch Console -> Alarms:** ภาพกราฟ Target Tracking Alarm เปลี่ยนสถานะเป็น `In alarm` ระหว่างการยิงโหลด

---

## 🚨 ตารางสรุปการคุมงบประมาณ ($50 Budget Optimization)

| ชิ้นส่วนระบบ | สเปก / รูปแบบ | ค่าใช้จ่าย | วิธีการคุมงบ |
|---|---|---|---|
| **VPC & Subnets** | Lean Multi-AZ (No NAT) | $0 (ไม่มี NAT) | ประหยัดค่า NAT Gateway ราว $32.40/เดือน |
| **EC2 Instance** | `t3.micro` (2 vCPU, 1 GB RAM) x2 | $0.0104/ชม./เครื่อง | `lab.ps1 stop` เมื่อเลิกใช้ |
| **EBS root** | gp3 8 GiB x2 | ≈ $0.0009/ชม./เครื่อง | ลบไปพร้อม EC2 |
| **Public IPv4** | EC2 2 + ALB 2 | $0.005/ชม./address | `lab.ps1 destroy` เมื่อไม่ใช้นาน |
| **Load Balancer (ALB)** | 1x ALB | $0.0225/ชม. + LCU | `lab.ps1 destroy` เมื่อไม่ใช้นาน |
| **Detailed monitoring** | 2 เครื่อง | $2.10/เครื่อง-เดือน | จำเป็นสำหรับ scaling 1 นาที |
| **DynamoDB, SQS, Lambda, API GW WebSocket** | On-demand | ≈ $0 ที่ระดับห้องเรียน | - |
| **S3** | static + assets (EC2 ดึงไฟล์ตอนบูต) | ≈ $0 (ไม่กี่ MB) | - |

รวมเมื่อเปิด 2 เครื่อง ≈ $0.079/ชม. (≈ $58/เดือนถ้าเปิด 24 ชม. เกินงบ $50, ≈ $9.5/เดือนถ้าเปิด 4 ชม./วัน) รายละเอียดและข้อควรตรวจราคา: `docs/01_Reports/STAGE3_EXPERIMENT_RESULTS.md` ข้อ 8
