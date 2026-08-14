# Plan: Rule-Complete Playmat + Card Images Fix + Sprint 3 AWS/WebSocket

> Spec ก่อนแก้โค้ด (Zero-Shot Ban) · สถานะ: **รออนุมัติ**
> อ้างอิง: `PLAN_PROJECT.md` (Sprint 1-5), `Disney_Lorcana/README.md` (9 Use Cases, AWS Arch), กฎ Lorcana ทางการ (Wargamer/QuickStart 2023+Locations 2026)

---

## 📋 งาน 3 ส่วน (ตามคำขอ User)

### PART A — แก้การ์ด Image ไม่โหลด (เร็วสุด)
**สาเหตุ:** `LorcanaBoard.tsx` ฮาร์ดโค้ด URL ภาพบางใบผิด → 404 (Magic Broom `35_...`, Friends On The Other Side `28_...`, Lilo `17_...` — เทสต์แล้ว 404)
**แก้:**
1. สร้าง `src/data/cardPool.ts` — import จาก `public/dataset/lorcana_set1_set2.json` (3,242 ใบ, มี `imageUrl` ถูกต้องจาก lorcana-api) แล้วกรองเอา 12-20 ใบที่เล่นสนุก (characters + actions + songs + items) เป็น draw pool
2. เปลี่ยน `drawPool` ใน LorcanaBoard ให้ใช้จาก cardPool แทน URL ฮาร์ดโค้ด
3. เพิ่ม `<img onError>` fallback → แสดงชื่อการ์ดแทน (มีแล้ว แต่ให้ครอบคลุมทุก img)

### PART B — ปรับ Playmat ให้เล่นตามกฎจริง (ทุกใบใช้ความสามารถได้)
**กฎ Lorcana ทางการ (Ready-Set-Draw + Main Phase):**
- **Beginning Phase:** Ready (การ์ด Exerted → Ready) → Set (trigger start-of-turn abilities) → Draw 1 (ผู้เล่นคนแรกข้ามเทิร์นแรก)
- **Main Phase:** ลง Ink ได้ 1 ครั้ง/เทิร์น (เฉพาะการ์ด `inkwell: true`) → Play cards (จ่าย Ink) → Quest (Exert → +Lore) → Challenge (Exert → แข่ง Strength/Willpower) → ใช้ Abilities
- **End Phase:** Pass Turn → Ready ใหม่เทิร์นถัดไป
- **ชนะ:** ได้ Lore ครบ 20
- **Locations (Set 4+, 2026):** ได้ Lore ตอน start of turn แบบ passive

**แก้ใน `LorcanaBoard.tsx`:**
1. [ ] **Challenge System:** เลือกการ์ดเรา (exert) → เลือกการ์ดศัตรู → เทียบ Strength vs Willpower → ฝ่ายแพ้ Banish (damage tracking `damage[cardId]`)
2. [ ] **Damage Tracking:** state `damage: Record<cardId, number>` — จะpower ลดตาม damage → 0 = banish
3. [ ] **Banish:** การ์ดที่ชนะถูก banished → ไป Discard
4. [ ] **Ability Engine อย่างง่าย:** แมปความสามารถที่เล่นได้จริง (subset ที่เข้าใจ):
   - `draw a card` → +1 จั่ว
   - `gain X Lore` → +Lore
   - `deal X damage` → damage การ์ดเป้า
   - `banish chosen character` → banish
   - `exert chosen character` → exert
   - `cost X less` → ลดค่าร่าย
   - Action/Song: เล่นแล้ว effect ทันที → ไป discard
5. [ ] **Quest:** มีแล้ว + บังคับ Exert ก่อน quest (ตามกฎ)
6. [ ] **Ink limit 1/เทิร์น:** มีแล้ว (`hasInkedThisTurn`) — คงไว้
7. [ ] **Draw rule:** ตอนเริ่มเทิร์นใหม่ จั่วอัตโนมัติ (กด Draw ยังได้ + เพิ่มปุ่ม "Start Turn" ที่ทำ Ready+Draw)

### PART C — Sprint 3 Plan: AWS + WebSocket (เอกสาร + โค้ดฐาน)
**มีอยู่แล้ว:** `backend/room/handler.ts` (Lambda $connect/$disconnect/sendmessage), `src/services/websocket.ts` (client + mock mode), `template.yaml` (SAM)
**ทำต่อ:**
1. [ ] **DynamoDB Table:** `LorcanaRoomState` (roomId PK, players, state JSON) — เพิ่ม AttributeDefinitions ใน template.yaml
2. [ ] **WebSocket Lambda ครบ:** handle `CARD_MOVED`, `CARD_EXERTED`, `INK_PLAYED`, `LORE_UPDATED`, `QUEST_DONE`, `CHALLENGE_DONE` → broadcast ผ่าน `PostToConnection` (มีโครงแล้ว)
3. [ ] **Frontend sync:** ใน websocket.ts เพิ่ม sendCardMoved/sendExert/sendLore + mock broadcast จำลอง opponent
4. [ ] **Deploy script:** `scripts/deploy_ws.sh` — sam build + sam deploy (Free Tier: API GW WS 1M msg, Lambda 1M calls, DynamoDB 25GB — $0)
5. [ ] **เอกสาร:** `docs/Sprint3_WebSocket_Arch.md` — Mermaid + payload schema + ขั้นตอน deploy

---

## 🗂️ ไฟล์ที่จะแก้/สร้าง
| # | ไฟล์ | การแก้ |
|---|------|--------|
| 1 | `src/data/cardPool.ts` | **สร้าง** — import dataset 3,242 ใบ, export draw pool 12-20 ใบ |
| 2 | `src/components/LorcanaBoard.tsx` | draw pool จาก cardPool + Challenge/Damage/Banish + Ability Engine + Start Turn |
| 3 | `src/services/websocket.ts` | เพิ่ม send* actions + mock broadcast |
| 4 | `backend/room/handler.ts` | เพิ่ม route CARD_MOVED/QUEST/CHALLENGE (ถ้ายังไม่ครบ) |
| 5 | `template.yaml` | เพิ่ม DynamoDB table definition |
| 6 | `scripts/deploy_ws.sh` | **สร้าง** — deploy script |
| 7 | `docs/Sprint3_WebSocket_Arch.md` | **สร้าง** — เอกสารสถาปัตยกรรม |

## ✅ Verification
- `npm run build` + `npx tsc --noEmit` ผ่าน
- ทดสอบ: จั่วการ์ด → ภาพโหลด (เทสต์ URL ทั้งหมด 200)
- ทดสอบ: Quest ต้อง Exert, Challenge ต้องจ่าย damage → banish
- ทดสอบ: Start Turn → Ready + Draw อัตโนมัติ

**พิมพ์ "Proceed" เพื่อเริ่ม** 🚀
