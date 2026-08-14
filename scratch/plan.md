# Plan: Real-Time Match Lobby (WebSocket Multiplayer) — Sprint 3 Completion

> Spec ก่อนแก้โค้ด (Zero-Shot Ban) · สถานะ: **รออนุมัติ**
> Backend พร้อมแล้ว: `lorcana-room` Lambda (JOIN_ROOM/CARD_MOVED/etc relay) + WS API + DynamoDB

---

## 🎯 เป้าหมาย
หน้า **Real-Time Match** (แยกจาก Playmat Sandbox) สำหรับแข่งกับเพื่อนแบบเรียลไทม์:
1. **เลือกเด็ค** — menu แสดงเด็คที่เซฟไว้ + รายการการ์ดในเด็คนั้น
2. **สร้างห้อง (Lobby)** — กดสร้าง → ได้ **code 6 หลัก** → แชร์ให้เพื่อน
3. **Join ด้วย code** — ใส่ code ห้องเพื่อน → เข้าห้อง
4. **Matchmaking (จับคู่)** — กด "หาคู่" → รอ lobby → ถ้ามีคนกดหาคู่ด้วย เจอกันอัตโนมัติ
5. **เข้า Board ต่อสู้** — เมื่อครบ 2 คน → โหลดบอร์ด + ซิงก์เรียลไทม์ (มีอยู่แล้ว)

---

## 🗂️ ไฟล์ที่จะสร้าง/แก้

| # | ไฟล์ | การแก้ |
|---|------|--------|
| 1 | `src/pages/MatchLobby.tsx` | **สร้าง** — หน้า lobby: deck select + create/join + matchmaking queue UI |
| 2 | `src/components/MatchDeckSelect.tsx` | **สร้าง** — menu เลือกเด็ค (โหลด GET /decks) + แสดงการ์ดในเด็ค (grid/ชื่อ/จำนวน) |
| 3 | `src/services/websocket.ts` | เพิ่ม actions: `CREATE_ROOM`, `MATCHMAKING_JOIN`, `MATCHMAKING_LEAVE`, `DECK_SELECTED`, `MATCH_FOUND`, `ROOM_CREATED` |
| 4 | `backend/room/handler.ts` | เพิ่ม routes: `CREATE_ROOM` (สร้าง roomId 6 หลัก → DynamoDB), `MATCHMAKING_JOIN` (หาคู่ใน queue table หรือ room ที่รอ), `DECK_SELECTED` (บันทึก deck ลง room) |
| 5 | `src/App.tsx` | เพิ่มแท็บ "Real-Time Match" (แยกจาก Playmat Sandbox) |
| 6 | `src/types/lorcana.ts` | เพิ่ม WS action types ใหม่ |

---

## 🔧 รายละเอียดระบบ

### Matchmaking Flow (จับคู่อัตโนมัติ)
1. ผู้เล่นกด "Find Match" → WS send `MATCHMAKING_JOIN` {deckId}
2. Lambda: ตรวจ DynamoDB table `MatchmakingQueue` (GSI บน status=waiting)
   - ถ้ามีคนรออยู่ → จับคู่: สร้าง room, ตอบทั้งคู่ `MATCH_FOUND` {roomId, opponent}
   - ไม่มี → เขียน record ตัวเอง + รอ (ตอบ `WAITING` + เริ่ม heartbeat)
3. ผู้เล่นกด cancel → `MATCHMAKING_LEAVE` → ลบ record

### Lobby Flow (ห้อง + code)
1. กด "Create Room" → `CREATE_ROOM` {deckId} → Lambda สร้าง roomId 6 หลัก (unique) → ตอบ `ROOM_CREATED` {roomId}
2. เพื่อนใส่ code → `JOIN_ROOM` {roomId, deckId} → ครบ 2 → broadcast `GAME_START` → ทั้งคู่ไป Board
3. แสดงสถานะ: รอผู้เล่น 1/2, opponent deck preview

### Deck Select
- โหลด `GET /decks` (มีอยู่) → การ์ดโชว์ชื่อ + cost + จำนวน (จาก cards[].count)
- เลือก 1 เด็คก่อนเข้า lobby (บังคับ)

---

## ✅ Verification
- `npm run build` + `npx tsc --noEmit` ผ่าน
- ทดสอบ WS: สร้างห้อง → ได้ code → join ด้วย code → GAME_START
- ทดสอบ matchmaking: เปิด 2 session → กดหาคู่พร้อมกัน → MATCH_FOUND
- ตรวจ DynamoDB: room ถูกสร้าง, queue ว่างหลังจับคู่

**พิมพ์ "Proceed" เพื่อเริ่ม** 🚀
