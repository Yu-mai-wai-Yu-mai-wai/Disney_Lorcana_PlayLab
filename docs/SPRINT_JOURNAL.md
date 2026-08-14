# 📓 Sprint Journal — ปัญหาและการพัฒนา Disney Lorcana PlayLab Cloud

> บันทึกการพัฒนา ปัญหา วิธีแก้ และบทเรียนแต่ละ Sprint (ใช้ประกอบรายงาน + ตอบคำถามอาจารย์)
> อัปเดตล่าสุด: 14 สิงหาคม 2026

---

## Sprint 1: Scaffold & Play Area UI (1–15 ส.ค.)

### 🟢 สิ่งที่ทำสำเร็จ
- ตั้งโปรเจกต์ React + Vite + Tailwind v4 + Framer Motion v12
- สร้าง `LorcanaBoard.tsx` (1,164 บรรทัด) — กระดานลากวางการ์ดแบบ full-screen
- ดึงข้อมูลการ์ด 3,242 ใบ (Set 1–13) ลง `public/dataset/`
- ระบบ Drag & Drop + Inkwell + Lore counter + Start Turn/Pass Turn

### 🔴 ปัญหาที่เจอ
| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| **สไตล์ไม่ตรงโจทย์** | `design.md` ล็อค "Dark Editorial" (ห้าม glow/gradient/emoji) แต่ต้องการ "Disney เวทมนต์" | User เลือก Option A: คง Dark Editorial + เพิ่ม Magic Enrichment เฉพาะ Landing (foil text, glow, parchment) — อัปเดต design.md เป็น "Dark Editorial + Magic R3" |
| **การ์ดภาพไม่โหลด (404)** | drawPool ฮาร์ดโค้ด URL ผิด 3 ใบ (Magic Broom `35_...`, Lilo `17_...`, Friends `28_...`) | สร้าง `src/data/cardPool.ts` ดึงจาก dataset 3,242 ใบ (imageUrl ถูกต้องทุกใบ — เทสต์ GET 200 ผ่าน) |
| **Space ด้านล่าง board** | การ์ดสนามเล็ก (96×136px) + layout ไม่เต็ม viewport | ไล่แก้ 5 รอบ: การ์ดใหญ่ขึ้น → sidebar w-72 → grid rows `[auto_1fr_auto]` → root `h-screen` + `min-h-0` → YOUR PILES ติดล่างถาวร |
| **Hand tab กะพริบเปิด-ปิด** | hover ระหว่าง tab กับ tray หลุด | Padding bridge + debounce timeout + exit delay |
| **Board ต้อง scroll** | layout เต็มจอไม่พอ | root `h-screen` (board tab) + main `min-h-0 overflow-hidden` — ได้ 624=624 พอดี |

### 📌 บทเรียน Sprint 1
- **Framer Motion** ใช้ `layout` + `AnimatePresence` สำหรับ card transition สวยกว่า CSS ล้วน
- **Flexbox overflow** เป็นวงจร: `h-full` ใน flex child ที่ไม่มี height แน่นอน = layout ระเบิด → ใช้ `min-h-0` + grid rows ชัดเจน
- dataset การ์ดมี imageUrl ครบ — **อย่าฮาร์ดโค้ด URL เอง** ใช้ dataset เป็น source of truth

---

## Sprint 2: Authentication & Deck Manager (16 ส.ค. – 10 ก.ย.)

### 🟢 สิ่งที่ทำสำเร็จ
- Lambda `lorcana-auth-login` / `lorcana-auth-register` (bcrypt + JWT)
- Lambda `lorcana-deck` (CRUD เด็คลง DynamoDB)
- Deploy ขึ้น AWS Learner Lab จริง + ทดสอบผ่าน URL

### 🔴 ปัญหาที่เจอ
| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| **SAM deploy ใช้ไม่ได้** | Learner Lab บล็อก `iam:CreateRole` (สิทธิ์จำกัด) | เขียน `scripts/deploy_manual.sh` ใช้ **LabRole** ที่มีอยู่แทนการสร้าง role ใหม่ |
| **Lambda handler เก่า** | ฟังก์ชันเดิมจาก console มี handler `index.handler` แต่โค้ดใหม่เป็น `auth/login.handler` | `update-function-configuration` ตั้ง handler ให้ตรง |
| **Integration mapping สลับ** | สร้าง integrations หลายตัวก่อน routes → ลำดับไม่ตรงกับ route | ตรวจ `get-integration` ทีละตัว + แก้ `IntegrationUri` ให้ชี้ Lambda ที่ถูก |
| **JWT secret ฮาร์ดโค้ด** | fallback `disney_lorcana_secret_key_2026` ในโค้ด | หมายเหตุไว้ปรับ Sprint 4 (ย้ายเป็น env/Secrets Manager) |

### 📌 บทเรียน Sprint 2
- **Learner Lab ≠ AWS ปกติ** — ตรวจสิทธิ์ (`iam:CreateRole`?) ก่อนวางแผน deploy; มี LabRole สำเร็จรูปใช้ได้
- **หลังสร้าง routes เสมอ** ต้องตรวจ integration mapping ทุกครั้ง (บทเรียนที่เจอซ้ำใน Sprint 4)

---

## Sprint 3: WebSockets Real-time Room Sync (11–26 ก.ย.)

### 🟢 สิ่งที่ทำสำเร็จ
- Lambda `lorcana-room` ($connect / $disconnect / sendAction relay)
- WebSocket API Gateway (`wss://a86238wqo4.../prod`)
- DynamoDB RoomStateTable เก็บ connection + สถานะห้อง
- Frontend `websocket.ts` (client + mock mode สำหรับ offline)

### 🔴 ปัญหาที่เจอ
| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| **401/405 ผ่าน HTTP API** | auth routes ใช้ payload 2.0 แต่ deck handler เขียน v1 (`event.httpMethod`) | ตอน Sprint 3: แก้ integration เป็น 1.0 + redeploy |
| **$connect ทดสอบยาก** | ไม่มี WS client ในเทสต์ | invoke Lambda ตรงๆ ด้วย event `{requestContext:{routeKey:'$connect'}}` — ได้ 200 Connected |

### 📌 บทเรียน Sprint 3
- **payload-format-version ต้องตรงกับ event ที่ Lambda คาดหวัง** (v1 มี `event.httpMethod`, v2 มี `event.requestContext.http.method`)
- SQS/DynamoDB เป็น backbone ของ room state — ทดสอบ direct invoke ก่อนเชื่อม API GW เสมอ

---

## Sprint 4: Deck Analyzer + SQS + Frontend Integration (16–30 ส.ค.)

### 🟢 สิ่งที่ทำสำเร็จ
- Lambda `lorcana-analyzer` (SQS-triggered) — costCurve, inkDistribution, characterRatio, synergyScore, summary ภาษาไทย
- SQS queue `lorcana-deck-analyzer` + event source mapping
- `POST /decks` auto-queue วิเคราะห์อัตโนมัติ + routes `POST /decks/{id}/analyze`, `GET /decks/{id}/analysis`
- DeckBuilder ต่อ API จริง (save/analyze/load) + Bearer token
- JWT expiresIn 2h

### 🔴 ปัญหาที่เจอ (หนักสุด — 405 สาหัส)
| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| **405 ทุก deck routes (หลายรอบ)** | ① integration payload 2.0 แต่โค้ด v1 → แก้เป็น 1.0 ② mapping integration สลับ ③ **event `path` = `/prod/decks` (มี stage prefix)** แต่โค้ดเช็ค `path === '/decks'` → ตก 405 | เพิ่ม `console.log(event)` → เห็น `resourcePath` จริงอยู่ใต้ `requestContext` → ใช้ `event.requestContext?.resourcePath` + รองรับ payload v1+v2 (dual-mode) |
| **synergyScore = 0** | test ส่งการ์ดแค่ `{id,count}` ไม่มี cost/ink/type | Analyzer รองรับ `{card:{...},count}` — frontend ส่งการ์ดเต็มข้อมูล → score 60 ✅ |
| **Route ลำดับมั่ว** | สร้าง routes/integrations แยกชุดกัน | คราวนี้สร้าง route+integration **ทีละคู่** ในลูปเดียวกัน → mapping ไม่สลับอีก |

### 📌 บทเรียน Sprint 4 (สำคัญที่สุด)
1. **405 ไม่ได้แปลว่า API GW เสมอไป** — ดู CloudWatch log (`console.log(event)`) ก่อน: event จริงมี `path:"/prod/decks"` (stage prefix) แต่ `requestContext.resourcePath` = `/decks` ที่ถูกต้อง
2. **dual-mode payload** (`event.httpMethod || event.requestContext?.http?.method`) ทำให้ Lambda ใช้ได้ทั้ง integration v1 และ v2
3. **สร้าง route+integration คู่กัน** ในลูปเดียว = ไม่มีทาง mapping สลับ
4. **Debug ลำดับถูกต้อง**: invoke Lambda ตรงๆ (แยกปัญหา Lambda vs API GW) → ดู event log → แก้โค้ด → redeploy

---

## Sprint 5 (วางแผน 1–10 ก.ย.): Stage 2 Preparation

### 📋 งานที่เหลือ
- [ ] Jest unit tests (backend handlers)
- [ ] Architecture diagram (Mermaid) ลงรายงาน
- [ ] คู่มือการใช้งาน
- [ ] E2E test (Login → Build Deck → Play)
- [ ] CloudWatch Logs Dashboard

### ⚠️ ความเสี่ยงที่รู้ไว้
- Lab หมดอายุทุก ~4 ชม. → credentials ตาย → deploy ต่อไม่ได้จนกว่า Start Lab ใหม่
- HTTP API integration ต้อง payload 1.0 (หรือ dual-mode Lambda) — ถ้าสร้างใหม่ อย่าลืม
- `GET /decks` รองรับ anonymous_guest — ควรบังคับ JWT สำหรับ production

---

## 🧠 สรุปบทเรียนรวม (ตอบอาจารย์ได้)

| หมวด | บทเรียน |
|---|---|
| **Cloud** | Learner Lab จำกัด IAM → ใช้ LabRole + manual deploy; ตรวจ Free Tier ทุก service ($0 ตลอด) |
| **API GW** | payload version ต้องตรงกับ handler; resourcePath ≠ path (stage prefix); ตรวจ mapping หลังสร้าง route |
| **Serverless** | SQS decouple งาน async (analyzer) — ไม่ block API response; auto-queue หลัง save |
| **Frontend** | dataset = source of truth อย่าฮาร์ดโค้ด; Framer Motion สำหรับ motion ที่สมจริง |
| **Debug** | console.log(event) ใน Lambda = ข้อมูลจริง 100%; invoke ตรงๆ แยกชั้นปัญหา |

---
*เอกสารนี้จะอัปเดตต่อทุก Sprint — ใช้ประกอบรายงาน Stage 2/3 และตอบ Q&A อาจารย์*
