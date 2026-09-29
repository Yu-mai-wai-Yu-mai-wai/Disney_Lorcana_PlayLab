---
title: Stage 3 Experiment Results - Disney Lorcana PlayLab Cloud
date: 2026-09-27
region: us-east-1
evidence_dir: docs/01_Reports/stage3_evidence/
---

# ผลการทดลอง Stage 3: High Availability, Scalability และค่าใช้จ่าย

ทดลองวันที่ 27 ก.ย. 2569 บน AWS Academy Learner Lab (us-east-1) ไฟล์ดิบของทุกการทดลองอยู่ใน `docs/01_Reports/stage3_evidence/` เวลาทั้งหมดเป็น UTC

## 1. สถาปัตยกรรมที่ทดลอง

```
ผู้ใช้ ──HTTP:80──> ALB (us-east-1a, 1b) ──> ASG: EC2 t3.micro x2 (Min 2 / Max 4)
                                             nginx (SPA + /api proxy) -> Node.js cluster (1 worker ต่อ vCPU)
                                             secret อ่านจาก SSM Parameter Store ตอนบูต
ผู้ใช้ ──WSS──> API Gateway WebSocket ──> Lambda lorcana-room ──> DynamoDB (room state, matchmaking)
EC2 ──> DynamoDB (Users, Decks), SQS (deck analyzer)
CloudWatch: target tracking CPU 60%, alarm UnHealthyHostCount > 0
```

| ส่วน | ค่าที่ใช้ |
|---|---|
| Launch template | Amazon Linux 2023, t3.micro, IMDSv2 required, detailed monitoring |
| Target group health check | `GET /api/health` ผ่าน nginx ไปถึง Node, ทุก 15 วินาที, unhealthy 2 ครั้ง |
| ASG | Min 2, Desired 2, Max 4, health check type ELB, grace 120 วินาที |
| Scaling policy | Target tracking, ASGAverageCPUUtilization = 60% |
| Realtime | API Gateway WebSocket stage `prod` + Lambda `lorcana-room` state อยู่ใน DynamoDB ไม่ผูกกับ EC2 เครื่องใด |

## 2. การทดลองที่ 1: เล่นออนไลน์ข้ามเครื่อง

**คำถาม:** เมื่อมี EC2 2 เครื่อง ผู้เล่น 2 คนที่ ALB ส่งไปคนละเครื่องเล่นด้วยกันได้หรือไม่

**วิธี:** Playwright เปิด browser 2 context ผ่าน ALB, ผู้เล่น 1 สร้างห้อง, ผู้เล่น 2 เข้าด้วยรหัส 6 หลัก, ตรวจว่าผู้เล่น 1 เห็นชื่อผู้เล่น 2 ภายใน 10 วินาที (TC-E2E-15)

**ผล:** ผ่าน 5/5 รอบ ใช้เวลา 9.7-14.1 วินาทีต่อรอบ (รวม register, login, โหลดหน้า)

**เหตุผลที่ต้องเปลี่ยน:** เดิม WebSocket server บน EC2 เก็บ connection และ state ของห้องใน memory ของแต่ละเครื่อง ผู้เล่นที่อยู่คนละเครื่องจะไม่เห็นการเล่นของกัน และเครื่องดับ = ห้องหาย ย้าย realtime ไป API Gateway WebSocket + Lambda ที่ใช้ DynamoDB เก็บ state แทน

**ข้อจำกัดของหลักฐาน:** ไม่ได้รัน test เดียวกันกับ stack เดิมเพื่อยืนยันว่าเคยล้มเหลว ปัญหาเดิมยืนยันจากการอ่านโค้ด (`backend/server.ts` เก็บ `clients` และ `roomGameStates` ใน `Map` ของ process)

## 3. การทดลองที่ 2: ความปลอดภัยบนระบบจริง

| Test | ผล |
|---|---|
| TC-AUTH-00a: backend รันใน production โดยไม่มี `JWT_SECRET`/`ADMIN_PASSCODE` | ก่อนแก้: รันต่อได้ด้วยค่า default (FAIL) / หลังแก้: exit code 1 (PASS) |
| TC-AUTH-00c: รหัส admin ที่เขียนไว้ในโค้ด (`admin123` ฯลฯ) | ก่อนแก้: `admin123` ผ่าน (FAIL) / หลังแก้: ถูกปฏิเสธ (PASS) |
| TC-E2E-16: ส่ง JWT ที่เซ็นด้วย secret default ไปที่ `GET /api/decks` ผ่าน ALB | ได้ 401 ทุกรอบ (10/10 รอบ รวม 2 รอบระหว่างที่เครื่องหนึ่งล่มจริง) |
| TC-E2E-16: security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` มีทุกรอบ |
| Launch template | `HttpTokens: required`, ไม่มีค่า secret ใน user data (decode แล้วตรวจ) |

Unit/integration test ทั้งหมด 36/36 ผ่าน (`npm test`)

## 4. การทดลองที่ 3: Failover เมื่อ backend บนเครื่องหนึ่งล่ม

**วิธี:** `scripts/test_asg_recovery.ps1 -FailureMode app` สั่ง `systemctl stop lorcana-backend` บนเครื่องหนึ่งผ่าน SSM Run Command (nginx ยังตอบ แต่ `/api/health` ได้ 502) แล้ว poll ทุก 10 วินาที

| เหตุการณ์ | รอบ 1 (08:32:50) | รอบ 2 (11:22:57) |
|---|---|---|
| ASG สั่งเปลี่ยนเครื่อง (launch replacement) | T+146 วินาที | T+90 วินาที |
| เครื่องใหม่ healthy ใน target group | T+231 วินาที | T+166 วินาที |
| Alarm `UnHealthyHostCount` เป็น ALARM | T+243 วินาที | T+232 วินาที |
| Alarm กลับเป็น OK | T+428 วินาที | T+354 วินาที |

**บริการระหว่างล่ม (รอบ 2):** target group มาร์กเครื่องที่ล่มเป็น unhealthy เมื่อ 11:23:27 (T+30 วินาที) ระหว่าง 11:23:37-11:24:20 รัน TC-E2E-15 และ TC-E2E-16 อย่างละ 2 รอบ ผ่าน 4/4 เครื่องที่เหลือ (อีก AZ) รับโหลดแทน

**ข้อสังเกต:**
- ALB หยุดส่งทราฟฟิกไปเครื่องที่ล่มภายในราว 30 วินาที (health check 15 วินาที x 2 ครั้ง) ช่วง 30 วินาทีแรกนี้ request ที่ไปตกเครื่องนั้นอาจได้ 502
- Alarm ดังหลังจากเครื่องใหม่ healthy แล้ว เพราะ metric ของ ALB ใน CloudWatch มาถึงช้าราว 2-3 นาที Alarm จึงเป็นหลักฐานย้อนหลัง ส่วนการตรวจจับจริงคือ ALB health check + ASG
- เวลากู้คืน 2.8-3.9 นาที ส่วนใหญ่เป็นเวลาบูตเครื่องใหม่และ `yum update` ใน user data

**เหตุการณ์จริงที่ไม่ได้ตั้งใจ:** 10:38:35 และ 10:40:29 เครื่อง 2 เครื่องถูก stop จากภายนอก (ช่วงเดียวกับที่ session Learner Lab หมด) ASG สร้างเครื่องใหม่แทนเองทั้ง 2 เครื่องโดยไม่มีใครสั่ง (ดู ASG activity history)

## 5. การทดลองที่ 4: Auto Scaling

**โหลด:** `scripts/stress_test.ps1` ยิง `POST /api/auth/login` ที่ login สำเร็จ (bcrypt cost 10 ใช้ CPU จริง) 40 worker ต่อเนื่อง จากเครื่องผู้ทดลองผ่านอินเทอร์เน็ต เดิมสคริปต์ยิง `/health` ซึ่ง nginx ตอบเองโดยไม่ผ่าน Node จึงไม่ทำให้ CPU ขึ้น

| | รอบ 1 (08:40:20, Node process เดียว) | รอบ 2 (09:35:43, Node cluster 2 worker) |
|---|---|---|
| CPU เฉลี่ยของ ASG ช่วงโหลดเต็ม | 48.7-49.9% (ค้าง) | 99.8-99.97% |
| Alarm target tracking (> 60% 3 นาที) | ไม่ดัง | ALARM 09:40:19 |
| Scale-out | ไม่เกิด | 2 → 4 เครื่อง เมื่อ 09:40:24 (T+4:41) |
| Login สำเร็จ / ล้มเหลว | ไม่ได้บันทึก (session ถูกตัดก่อนจบ) | 9,653 / 0 (26.8 ครั้ง/วินาที ใน 360 วินาที) |

**ข้อค้นพบ:** t3.micro มี 2 vCPU แต่ Node.js รัน JavaScript บน thread เดียว CPU ของเครื่องจึงขึ้นได้สูงสุด 50% และเป้า 60% ไม่มีวันถึง แก้โดยให้ backend รันแบบ `cluster` 1 worker ต่อ vCPU (`backend/cluster.ts`) ไม่ได้ลด threshold ลงเพื่อให้ผ่าน

**สิ่งที่ไม่ได้ทดลอง:** scale-in (alarm low ต้องต่ำกว่า 42% 15 นาที) เพราะผู้ทดลองตั้ง desired กลับเป็น 2 เองเมื่อ 09:42:42 เพื่อทดลอง failover ต่อ

## 6. การทดลองที่ 5: Infrastructure as Code (deploy / destroy)

| ขั้น | ผล |
|---|---|
| `deploy_ec2_vpc_asg.ps1` | สร้าง VPC, subnet 2 AZ, IGW, SG, ALB, TG, LT, ASG, scaling policy, alarm สำเร็จ |
| รัน deploy ซ้ำขณะ stack ยังอยู่ | หยุดด้วย exit 1 จำนวน VPC ไม่เพิ่ม |
| SSM parameter หลัง deploy ซ้ำ | Version ยังเป็น 1 (ไม่ถูกเขียนทับ) |
| `lab.ps1 destroy` | เหลือแค่ default VPC ไม่มี SG, LT, ALB, TG, alarm ค้าง ถูกขัดจังหวะกลางทาง 2 ครั้ง รันซ้ำแล้วลบต่อจนครบ |
| `lab.ps1 publish` | build, upload S3, sync secret ให้ Lambda, เปลี่ยนเครื่องทีละเครื่อง สำเร็จ |

## 7. การทดลองที่ 6: Content Caching ของไฟล์ชุดการ์ด (T02)

**คำถาม:** การใส่ hash ในชื่อไฟล์ asset พร้อมตั้ง `Cache-Control: max-age=31536000, immutable` และเปิด gzip compression ช่วยลดขนาดการรับส่งและเวลาโหลดซ้ำของไฟล์ข้อมูลการ์ดขนาดใหญ่ได้เท่าใด

**วิธี:** วัดขนาดข้อมูลและ latency ผ่าน Playwright e2e (`TC-E2E-20..22`) บน ALB จริง โดยเปรียบเทียบการดาวน์โหลดครั้งแรก (cache miss) และครั้งที่สอง (browser cache hit) บันทึกผลลง `docs/01_Reports/stage3_evidence/caching_2026-09-29T13-06-23-683Z.json`

**ผลการทดลอง:**
- ไฟล์ชุดการ์ดขนาดเดิม (Uncompressed): 2,351,188 ไบต์ (2.35 MB)
- ขนาดการรับส่งหลังเข้ารหัส gzip (Encoded Body Size): 436,557 ไบต์ (426 KB) ลดลง 81.43%
- เวลาโหลดครั้งแรก (Network Transfer): 602 มิลลิวินาที
- เวลาโหลดครั้งที่สอง (Browser Cache Hit): 86 มิลลิวินาที
- ปริมาณข้อมูลรับส่งในการโหลดครั้งที่สอง: 0 ไบต์ (304 Not Modified / Memory Cache)

## 8. การทดลองที่ 7: Dead Letter Queue และ Retry Resiliency (T03)

**คำถาม:** เมื่อมีข้อความรูปแบบผิดปกติส่งเข้าคิว `lorcana-deck-analyzer` กลไก SQS Redrive Policy ร่วมกับ `ReportBatchItemFailures` ใน Lambda สามารถนำข้อความเสียเข้า Dead Letter Queue (DLQ) ได้จริงหรือไม่ โดยไม่ทำให้ข้อความปกติค้างหรือสูญหาย

**วิธี:** สคริปต์ `test_dlq.ps1` ส่งข้อความทดสอบที่มีรูปแบบ JSON เสียหาย (Message ID `e6e67b28-f7b4-458f-a80e-373663263f1f`) เข้า SQS และวนตรวจสอบคิวหลักและ DLQ ทุก 13-15 วินาที บันทึกผลลง `docs/01_Reports/stage3_evidence/dlq_20260929_131824.log`

**ผลการทดลอง:**
- Lambda analyzer ตรวจพบข้อผิดพลาดและส่งคืนเฉพาะรหัสข้อความที่ล้มเหลวผ่าน `batchItemFailures`
- ข้อความผ่านการพยายามซ้ำครบ 3 ครั้ง (`maxReceiveCount: 3`) และเข้าสู่ `lorcana-deck-analyzer-dlq` สำเร็จที่เวลา T+102 วินาที
- จำนวนข้อความค้างในคิวหลักหลังประมวลผลเสร็จสิ้น: 0 ข้อความ

## 9. การทดลองที่ 8: Decoupling และ Fan-out ผลการแข่งขัน (T04)

**คำถาม:** เมื่อเกมจบลง การส่ง event `match.finished` ผ่าน Amazon SNS ไปยัง SQS 2 คิวคู่ขนาน (`lorcana-match-history` และ `lorcana-player-stats`) สามารถแยกการบันทึกประวัติและคำนวณสถิติออกจากกันแบบ asynchronous ได้รวดเร็วและทนทานต่อการส่งซ้ำหรือไม่

**วิธี:** รัน Playwright e2e test `TC-E2E-23` บน ALB โดยผู้เล่นจำลองจบเกมและส่งผลผ่าน `POST /api/matches` ตรวจสอบความพร้อมของข้อมูลใน DynamoDB ตาราง `LorcanaMatchHistory` และ `LorcanaPlayerStats` บันทึกผลลง `docs/01_Reports/stage3_evidence/decoupling_match_events_20260929.log`

**ผลการทดลอง:**
- End-to-End Fan-out Latency: 4.9 วินาทีหลังจบเกม ผลการแข่งขันปรากฏในประวัติการเล่นของผู้เล่นทั้งสองคนและอัปเดตสถิติชนะ/แพ้ครบถ้วน
- การป้องกันการเข้าถึง (OWASP A01): ส่งผลการแข่งโดยไม่มี JWT ถูกปฏิเสธด้วย 401 Unauthorized และส่งผลของแมตช์ที่ตนเองไม่ได้ร่วมเล่นถูกปฏิเสธด้วย 403 Forbidden
- Idempotency & Deduplication: การส่งผลการแข่งขันซ้ำด้วย `matchId` เดิมไม่ทำให้ตัวเลขสถิติใน `LorcanaPlayerStats` เพิ่มขึ้นซ้ำซ้อน ด้วย conditional write รูปแบบ `DEDUPE#<matchId>`

## 10. การทดลองที่ 9: In-Memory Database Caching สำหรับ Leaderboard (T05)

**คำถาม:** การใช้ ElastiCache (Valkey) ด้วยรูปแบบ Cache-Aside (Lazy Loading) ช่วยลด latency ในการเรียกดูหน้า Leaderboard ได้เท่าใด และระบบทำงานต่อเนื่องได้หรือไม่หากเซิร์ฟเวอร์แคชไม่พร้อมใช้งาน

**วิธี:** รันชุดทดสอบ `backend/__tests__/leaderboard.test.ts` และ e2e `TC-E2E-24` บน ALB ตรวจสอบค่า Header `X-Cache` และวัดระยะเวลาการตอบสนอง

**ผลการทดลอง:**
- Request ครั้งแรก (Cache Miss): ดึงข้อมูลจาก DynamoDB และเขียนลง Valkey (TTL 60 วินาที) ได้รับ `X-Cache: MISS` ใช้เวลา 41 มิลลิวินาที
- Request ครั้งถัดไปภายใน 60 วินาที (Cache Hit): อ่านตรงจาก Valkey sorted set ได้รับ `X-Cache: HIT` ใช้เวลา 1 มิลลิวินาที (ลด latency ลง 97.56%)
- ความทนทานเมื่อแคชขัดข้อง (Graceful Degradation): เมื่อจำลองการเชื่อมต่อ Redis ล้มเหลว (`Connection refused`) ฟังก์ชันอ่านข้อมูลตรงจาก DynamoDB และตอบกลับด้วย HTTP 200 โดยไม่เกิด unhandled exception (`TC-LEAD-04`)

## 11. การทดลองที่ 10: Ability Coverage และ Card Mechanics (T11)

**คำถาม:** การวิเคราะห์ข้อมูลการ์ดทั้งหมด 3,242 ใบ (Set 1 ถึง Set 13) สามารถรองรับกฎและ ability ของเกมได้ในระดับใด

**วิธี:** ประมวลผลไฟล์ `src/assets/lorcana_cards.json` ด้วยสคริปต์ `scripts/measure_ability_coverage.ts` เพื่อวัดสัดส่วนการรองรับแบบ Full Support, Partial Support และ Manual Resolve บันทึกผลลง `docs/01_Reports/stage3_evidence/ability_coverage.json`

**ผลการทดลอง:**
- จำนวนการ์ดทั้งหมด: 3,242 ใบ
- จำนวนการ์ดที่มี Ability: 2,659 ใบ (82.02%)
- จำนวน Ability ทั้งหมด: 3,768 ข้อ
- ระดับการรองรับ:
  - Full Support (ระบบคำนวณและมีระบบเลือกเป้าหมายอัตโนมัติ): 609 ข้อ (16.16%)
  - Partial Support (ตรวจจับจังหวะ trigger ได้แต่ต้องการการระบุเพิ่มเติม): 203 ข้อ (5.39%)
  - Manual Resolve (ระบบแสดงป้ายให้ผู้เล่นจัดการเองพร้อมเครื่องมือช่วยเหลือ): 2,956 ข้อ (78.45%)

## 12. ข้อจำกัดของระบบ

1. **ไม่มี HTTPS:** Learner Lab ไม่มีโดเมนจึงขอ certificate จาก ACM ให้ ALB ไม่ได้ ข้อมูล login วิ่งเป็น HTTP
2. **WebSocket ไม่ตรวจ token:** Lambda `lorcana-room` เชื่อชื่อผู้ใช้ที่ client ส่งมา (เหมือนระบบเดิม)
3. **Rate limit ของ login อยู่ใน memory ของแต่ละ process:** เมื่อมีหลาย worker และหลายเครื่อง ผู้โจมตีลองรหัสได้ 5 ครั้งต่อ worker ต่อเครื่อง
4. **Secret ของ Lambda อยู่ใน environment variable แบบ plaintext** (EC2 อ่านจาก SSM SecureString)
5. **เวลากู้คืน 2.8-3.9 นาที** ขึ้นกับเวลาบูตและ `yum update` ใน user data
6. **Alarm มาช้ากว่าเหตุการณ์ 2-3 นาที** ตามข้อ 4
7. **ผลการแข่งขันรายงานจาก Client:** การส่งผลการแข่งขันผ่าน `POST /api/matches` มาจาก browser ของผู้เล่น แม้จะมีการตรวจสอบ JWT และตัวตนผู้เล่น แต่ยังไม่ได้ประมวลผล state บน authoritative game server
8. **ข้อจำกัดของ CloudFront ใน AWS Academy Learner Lab:** IAM Policy ของแล็บปฏิเสธสิทธิ์ `cloudfront:*` จึงไม่สามารถใช้ CloudFront เป็น CDN หน้า ALB ได้ ต้องพึ่งพา Nginx Content Caching บน EC2 แทน
9. **ข้อจำกัดของ ElastiCache Serverless ใน Learner Lab:** IAM Policy มี explicit deny สำหรับ Serverless จึงต้องใช้ ElastiCache แบบ Node เดี่ยวขนาด `cache.t3.micro` ใน VPC Private Subnet
10. **ข้อจำกัดของ Learner Lab ทั่วไป:** session 4 ชั่วโมงและเครื่องถูก stop เมื่อหมด session, SCP ปฏิเสธ `StartInstanceRefresh` และปฏิเสธ Pricing API
11. **ค่าใช้จ่ายเมื่อเปิด 24 ชั่วโมงเกินงบ $50** ดูข้อ 13

## 13. ประมาณการค่าใช้จ่าย

> ราคาต่อหน่วยด้านล่างเป็น on-demand list price ของ us-east-1 ที่ผู้เขียนตรวจสอบ ณ วันที่ 29 ก.ย. 2569 **ทีมต้องตรวจราคาต่อหน่วยกับหน้า AWS Pricing และใส่วันที่เข้าถึงก่อนส่งรายงาน**

| บริการ | ราคาต่อหน่วย | จำนวน | ต่อชั่วโมง (USD) |
|---|---|---|---|
| EC2 t3.micro | $0.0104/ชม. | 2 | 0.0208 |
| EBS gp3 root 8 GiB | $0.08/GB-เดือน | 2 x 8 GiB | 0.0018 |
| Public IPv4 address | $0.005/ชม. | 4 (EC2 2 + ALB 2 AZ) | 0.0200 |
| Application Load Balancer | $0.0225/ชม. + $0.008/LCU-ชม. | 1 (สมมติ 1 LCU) | 0.0305 |
| ElastiCache Valkey cache.t3.micro | $0.0170/ชม. | 1 node | 0.0170 |
| EC2 detailed monitoring | $2.10/เครื่อง-เดือน | 2 | 0.0058 |
| CloudWatch alarm | $0.10/alarm-เดือน | 3 | 0.0004 |
| Amazon SNS topic & notifications | $0.50/ล้าน requests | < 10,000 ต่อเดือน | ~0.0000 |
| Amazon SQS queues & DLQs | $0.40/ล้าน requests | < 10,000 ต่อเดือน | ~0.0000 |
| AWS Lambda (analyzer, consumers) | $0.20/ล้าน requests | < 20,000 ต่อเดือน | ~0.0000 |
| DynamoDB on-demand | $0.25/ล้าน WCU, $1.25/GB | ระดับทดสอบ | ~0.0000 |
| **รวมสแต็กเต็ม (2 EC2 + 1 ElastiCache)** | | | **≈ 0.096** |

| รูปแบบการใช้งาน | ชั่วโมง/เดือน | ประมาณการ/เดือน |
|---|---|---|
| เปิดตลอด 24 ชั่วโมง | 730 | ≈ $70 (เกินงบ $50) |
| เปิดเฉพาะทำแล็บ/เดโม 4 ชม./วัน | 120 | ≈ $11.5 |
| `lab.ps1 stop` (ASG=0, ElastiCache ลบ/หยุด): ALB + IPv4 | 730 | ≈ $23.7 |
| `lab.ps1 destroy` | - | ≈ $0 (เหลือ S3, DynamoDB ตามข้อมูลที่เก็บ) |
| เครื่องที่เพิ่มตอน scale-out | ต่อเครื่อง | ≈ $0.019/ชม. (EC2 + EBS + IPv4 + monitoring) |

### ค่าใช้จ่ายจริงจาก AWS Billing (ภาพ `docs/Bill/2026-27-09.png`, `docs/Bill/2026-27-09_2.png` ถ่ายวันที่ 27 ก.ย. 2569)

| บริการ | ก.ย. 2569 (1-27 ก.ย.) | สัดส่วน |
|---|---|---|
| Elastic Load Balancing | $7.13 | 69% |
| Amazon VPC (public IPv4) | $1.96 | 19% |
| CloudWatch | $0.45 | 4% |
| EC2 Compute | $0.44 | 4% |
| EC2 Other (EBS) | $0.31 | 3% |
| **รวม month-to-date** | **$10.29** | |

- ALB เป็นค่าใช้จ่ายหลัก เพราะคิดรายชั่วโมงตลอดเวลาที่ยังไม่ destroy แม้ EC2 จะถูก scale เป็น 0 แล้ว
- ค่า VPC $1.96 คือค่า public IPv4 ที่ AWS เริ่มคิดตั้งแต่ ก.พ. 2567
- ข้อสรุปเชิงปฏิบัติ: หากหยุดการทดสอบเกิน 1 วัน ให้สั่ง `lab.ps1 destroy` เพื่อป้องกัน credit หมด

## 14. แหล่งอ้างอิงที่ใส่ในรายงาน

- AWS. *Target tracking scaling policies for Amazon EC2 Auto Scaling*. Amazon EC2 Auto Scaling User Guide.
- AWS. *Health checks for Application Load Balancer target groups*. Elastic Load Balancing User Guide.
- AWS. *Amazon ElastiCache for Valkey Pricing*. Amazon Web Services.
- AWS. *Amazon SNS and SQS Fanout Pattern*. AWS Architecture Center.
- AWS. *AWS Systems Manager Parameter Store*. AWS Systems Manager User Guide.
- AWS. *Amazon VPC pricing (public IPv4 charges)* และ *Elastic Load Balancing pricing*.
- OpenJS Foundation. *Cluster Module*. Node.js Documentation.
- Ravensburger. *Disney Lorcana Comprehensive Rules v1.3*. Disney Lorcana Official Resource.
- OWASP Foundation. *OWASP Top 10: 2021* (A01 Broken Access Control, A02 Cryptographic Failures, A05 Security Misconfiguration, A07 Identification and Authentication Failures).
