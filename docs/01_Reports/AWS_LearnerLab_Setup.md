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
1. **Lean Multi-AZ VPC (`10.0.0.0/16`):** 2 Public Subnets บน `us-east-1a` และ `us-east-1b` + Internet Gateway (**ไม่มี NAT Gateway = ค่าบริการ $0.00**)
2. **Security Groups:**
   - `ALB SG`: เปิดรับ HTTP Port 80 จากทั่วโลก (`0.0.0.0/0`)
   - `EC2 SG`: เปิดรับ Port 80 และ 3001 **เฉพาะจาก ALB SG เท่านั้น**
3. **Application Load Balancer (ALB):** รับทราฟฟิกและส่งต่อเข้า Target Group พร้อมตั้ง Health Check ที่ `/health`
4. **Launch Template:** ระบบ Amazon Linux 2023 (`t3.micro`) แนบ IAM `LabInstanceProfile` พร้อม User Data Script ติดตั้ง Nginx, Node.js และดึงโค้ดมารันอัตโนมัติ
5. **Auto Scaling Group (ASG):** Min 1, Max 3, Desired 1 พร้อม **CPU Target Tracking Policy (Scale-out เมื่อ CPU > 60%)**

---

## 🛡️ Step 3 — วงจรการควบคุมงบประมาณ $50 (1-Click Cost Lifecycle)

เพื่อให้งบ $50 ใน Learner Lab ปลอดภัยและเหลือใช้ตลอดทั้งภาคการศึกษา:

### 1. เมื่อต้องการทำแล็บ หรือเปิดเดโมให้อาจารย์ดู
```powershell
.\scripts\lab.ps1 start   # หรือ .\scripts\lab_start.ps1
```
* สั่งปรับ `Desired Capacity = 1`
* EC2 Instance จะบูตขึ้นมาพร้อมรับทราฟฟิกภายใน 1–2 นาที

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
* EC2 Instances ทั้งหมดจะถูก Terminate ดับสนิท **ค่าใช้จ่าย Compute กลายเป็น $0.00/ชม. ทันที**

### 4. เมื่อส่งโปรเจกต์เสร็จสิ้น / ไม่ได้ใช้งานยาวนาน (Complete Teardown)
```powershell
.\scripts\lab.ps1 destroy # หรือ .\scripts\lab_destroy.ps1
```
* ลบ ALB, Target Group, ASG, Launch Template, Security Groups และ VPC ทิ้งทั้งหมด
* ค่าใช้จ่ายรายชั่วโมงจะกลายเป็น **$0.0000** 100%

---

## 📈 Step 4 — การทดสอบ Auto Scaling & เก็บหลักฐานส่งรายงาน Stage 2/3

รันสคริปต์ Stress Test เพื่อจำลองโหลดผู้เล่นจำนวนมาก:

```powershell
.\scripts\stress_test.ps1 -TotalRequests 2000 -Concurrency 20
```

### สิ่งที่ต้องแคปภาพหน้าจอใน AWS Console สำหรับทำรายงาน:
1. **VPC Console:** ภาพ Resource Map ของ VPC แสดง 2 Subnets Multi-AZ และ Route Table
2. **EC2 Console -> Load Balancers:** ภาพ Target Group แสดงสถานะ **Healthy 200 OK**
3. **EC2 Console -> Auto Scaling Groups -> Activity:** ภาพแสดงประวัติการสปอว์นเครื่อง EC2 เครื่องที่ 2 เมื่อ CPU พุ่งสูง
4. **CloudWatch Console -> Alarms:** ภาพกราฟ Target Tracking Alarm เปลี่ยนสถานะเป็น `In alarm` ระหว่างการยิงโหลด

---

## 🚨 ตารางสรุปการคุมงบประมาณ ($50 Budget Optimization)

| ชิ้นส่วนระบบ | สเปก / รูปแบบ | ค่าใช้จ่าย | วิธีการคุมงบ |
|---|---|---|---|
| **VPC & Subnets** | Lean Multi-AZ (No NAT) | **$0.00** | ไม่เปิด NAT Gateway (ประหยัด $32.40/เดือน) |
| **EC2 Instance** | `t3.micro` (1 vCPU, 1GB RAM) | $0.0104 / ชม. | รัน `.\scripts\lab.ps1 stop` เมื่อเลิกเรียน (Scale-to-0) |
| **Load Balancer (ALB)** | 1x Application Load Balancer | $0.0225 / ชม. | สั่ง `.\scripts\lab.ps1 destroy` หากไม่ได้ใช้นานเกิน 1 สัปดาห์ |
| **DynamoDB & SQS** | On-Demand Free Tier | **$0.00** | อยู่ในเกณฑ์ Free Tier ตลอดไป |
| **S3 Static Website** | Decommissioned | **$0.00** | รวมโฮสต์บน Nginx ภายใน EC2 ทั้งหมด ไม่เสียค่า S3 เพิ่ม |
