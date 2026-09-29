# Spec: Stage 3 — Game Engine Correctness, Real Analytics, Caching + Decoupling, Report

Status: SPEC READY — รอยืนยัน seams แล้วจะแตก ticket | Updated: 2026-09-27
Deadlines: ผลทดลอง Stage 3 วันที่ 10 ต.ค. 2569, รายงานฉบับสมบูรณ์ + นำเสนอ 20-25 ต.ค. 2569
Audit ที่เป็นที่มาของสเปกนี้: ดูหัวข้อ "Audit Evidence" ท้ายไฟล์

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
