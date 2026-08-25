# Plan: Responsive Design — LorcanaBoard (Real-time Match + Sandbox)

## Goal
เล่นได้สมบูรณ์บนมือถือเล็ก (360–430px, portrait/landscape) และ iPad portrait (768px)
โดยไม่ต้อง scroll แนวนอน ปุ่ม Quest/Challenge กดได้จริงด้วยนิ้ว

## Root Causes (จากการสแกนโค้ด)
1. การ์ด battlefield/hand ใช้ fixed size: `w-36 h-50`, `w-40 h-56`, `w-36 h-52`
2. ระยะห่างการ์ด fixed: `gap-12` (48px) → บนจอ 360px ใส่การ์ดได้แค่ ~2 ใบ
3. Battlefield ใช้ `flex justify-center` ไม่มี flex-wrap → การ์ดเยอะล้นขอบ
4. Top status bar (Lore, Ink, Room input, ปุ่มต่างๆ) เรียงแถวเดียวไม่ wrap
5. Log sidebar กว้าง fixed (~350px) กินพื้นที่จอมือถือ

## Changes (ไฟล์เดียว: src/components/LorcanaBoard.tsx)

### C1. Responsive Card Scale (Tailwind breakpoints)
- Opponent field cards: `w-36 h-50` → `w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 xl:w-36 xl:h-50`
- Player field cards: `w-40 h-56` → `w-24 h-32 sm:w-32 sm:h-44 md:w-36 md:h-52 xl:w-40 xl:h-56`
- Hand cards: `w-36 h-52` → `w-24 h-36 sm:w-28 sm:h-40 md:w-36 md:h-52`
- ปรับ font-size badge/damage ให้สเกลตาม (text-[9px]→text-[8px] บนจอเล็ก)

### C2. Flexible Battlefield Layout
- `gap-12` → `gap-2 sm:gap-5 md:gap-8 xl:gap-12`
- เพิ่ม `flex-wrap` + `overflow-y-auto` ให้ battlefield zone
- `max-h-56 / max-h-64` → `max-h-32 sm:max-h-44 md:max-h-52 xl:max-h-64`

### C3. Hand Dock (Bottom Tray)
- Tray padding `px-8 pb-6` → `px-3 sm:px-8 pb-4 sm:pb-6`
- Card stack: `-space-x-3` → `-space-x-6 md:-space-x-3` (ซ้อนแน่นขึ้นบนมือถือ)
- เพิ่ม `max-w-[100vw]` + drag constraints responsive (left/right ±300 → คำนวณจาก window.innerWidth)

### C4. Top Status Bar Wrap
- เพิ่ม `flex-wrap gap-y-1.5` ให้ header bar
- Room join form: ซ่อน label "Room:" บน <sm, ย่อ input
- Lore/Ink badges: `px-3 py-1.5` → `px-2 py-1 sm:px-3 sm:py-1.5`

### C5. Log Sidebar → Overlay บนจอเล็ก
- <lg: sidebar เป็น absolute overlay (fixed right, z-index สูง, กว้าง min(85vw, 350px))
- ≥lg: คง layout inline เดิม

### C6. Touch Targets
- ปุ่ม Quest ⚡ / Challenge ⚔️: `p-1.5` → `p-2` บน touch device (`min 36px hit area`)
- Hover-only hand tab: คง click-to-toggle เดิม (รองร้อม touch อยู่แล้ว)

## Non-Goals (ไม่แตะ)
- Game logic, WebSocket, state management ทั้งหมด
- Modals (ผ่าน responsive check แล้ว มี p-4 + max-w ครบ)

## Verification
1. `npm run build` ผ่าน
2. Playwright responsive test 8 viewports (เพิ่ม mobile 360 landscape + iPad portrait บนหน้า board)
3. ตรวจ hOverflow = 0px ทุก viewport ที่หน้า Board
