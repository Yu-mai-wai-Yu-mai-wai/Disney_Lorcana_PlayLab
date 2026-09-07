export interface PatchNote {
  version: string;
  releaseDate: string;
  title: string;
  highlight: string;
  features: {
    category: 'Gameplay' | 'Multiplayer' | 'UI/UX' | 'Cloud/Backend' | 'Fixes';
    items: string[];
  }[];
}

export const APP_VERSION = 'v1.5.1';
export const APP_BUILD_DATE = '2026-08-25';

export const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v1.5.1',
    releaseDate: '2026-08-25',
    title: 'Full Responsive Overhaul & Chromium Performance Optimization',
    highlight: 'เล่นได้ครบทุกอุปกรณ์ — มือถือ 360px, iPad แนวตั้ง/แนวนอน, Desktop: Navbar + Quick Auth Card, Board/Sandbox การ์ดสเกลอัตโนมัติ, Hand Tray เลื่อนดูได้, Touch Support (แตะดูรายละเอียดการ์ด), และแก้ Brave/Chromium Lag ด้วย GPU Layer Optimization + Adaptive WebGL FPS',
    features: [
      {
        category: 'UI/UX' as const,
        items: [
          '📱 Full Responsive Design: ผ่านการทดสอบ Playwright 14 viewport (360–1920px, portrait+landscape) — Horizontal Overflow = 0px ทุกหน้าจอ',
          '🧭 Navbar Responsive Fix: iPad ทุกรุ่น (768–1194px) แสดงปุ่มเข้าสู่ระบบสีทอง + Hamburger Menu พร้อม Quick Auth Card (Login / My Decks / Sign Out) ไม่ล้นจออีกต่อไป',
          '🎮 Board & Sandbox Mobile Mode: การ์ดสนาม/ในมือสเกลอัตโนมัติตามขนาดจอ (w-20 → w-40), battlefield flex-wrap ไม่ล้น, Hand Tray เลื่อนซ้าย-ขวาได้บนมือถือ, Compact Piles Bar แสดง Inkwell/Deck/Discard/Lore บนจอเล็ก',
          '👆 Touch Support: แตะการ์ดทุกตำแหน่ง (สนาม/มือ/Inkwell) เพื่อเปิด Quick Glance รายละเอียดการ์ดแทน Hover, ปุ่ม Quest ⚡ ขยาย Hit Area สำหรับนิ้ว',
          '📋 Log Sidebar บนจอ < lg กลายเป็น Floating Overlay ทับสนาม ไม่บีบพื้นที่เล่น',
        ],
      },
      {
        category: 'Fixes' as const,
        items: [
          '⚡ Brave/Chromium Performance Fix: WebGL GoldInkShader ลด FBM Octave 4→3, Clamp DPR=1.0, Adaptive FPS (auto 60→30fps เมื่อเครื่องช้า), Pause เมื่อ Tab ไม่ Active',
          '🪟 Backdrop-filter Optimization: ปิด blur ซ้อนบนจอ ≤1024px/touch device (Chromium re-blur bottleneck), Pause Shimmer animation บน touch device',
          '🖼️ Hand Tray Overflow Fix: การ์ดในมือ 7 ใบไม่ล้นจอมือถือแล้ว (w-full + overflow-x-auto)',
          '🎯 Drag Constraint ปรับตามความกว้างหน้าจอจริง (window.innerWidth)',
        ],
      },
    ],
  },
  {
    version: 'v1.5.0',
    releaseDate: '2026-08-25',
    title: 'Exit Match System Overhaul, Full QA Campaign & Security Hardening',
    highlight: 'ยกระดับระบบ Exit/Rejoin ให้แยกความตั้งใจออกจากการหลุดเน็ต (LEAVE_ROOM + Grace Period 60 วินาที), เพิ่มปุ่ม Exit Match ที่คืน slot ห้องทันที, Security Fix ปิดช่องโหว่ OWASP A01 บน Deck API, และผ่าน Full QA Campaign 49/50 test cases (UX/UI + Backend + AWS Cloud) พร้อม Real-Time Test Dashboard',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🚪 Exit Match Button (ออกจากห้องแบบตั้งใจ): กด Exit แล้วส่ง `LEAVE_ROOM` ไปยัง WebSocket Lambda — ลบ record ออกจาก DynamoDB ทันที (Hard Delete), คู่แข่งเห็น notification "X left the match" และหยุด countdown ทันที, slot ห้องว่างให้คนใหม่เข้าได้เลยไม่ต้องรอ',
          '⏱️ Grace Period 60s แยกจาก Exit: หลุดเน็ต ($disconnect) = จองที่นั่งไว้ 60 วินาทีเพื่อ Rejoin / กด Exit เอง = เคลียร์ทันที — ระบบ JOIN_ROOM/MATCHMAKING นับเฉพาะผู้เล่นที่ active หรืออยู่ใน grace window (`getOccupyingMembers`)',
          '🧹 Auto-Purge Expired Sessions: record ที่ disconnected เกิน 60 วินาทีถูกลบอัตโนมัติเมื่อมีคนพยายาม JOIN เข้าห้อง ป้องกัน "ห้องเต็มปลอม" จาก session ค้าง',
          '🗑️ Clear Stale Session Banner: กด Exit แล้วลบ `lorcana_active_session` ออกจาก localStorage ทันที — ไม่มี Rejoin banner หลอนขึ้นใน Lobby หลังออกจากเกมเอง',
        ],
      },
      {
        category: 'Cloud/Backend',
        items: [
          '🔐 Security Hardening (OWASP A01 Fix): Deck API (`lorcana-deck`) ปฏิเสธ token ปลอม/หมดอายุด้วย 401 Unauthorized ทันที — ปิดช่องโหว่ anonymous fallback ที่ยอมให้ดู/บันทึกเด็คโดยไม่ยืนยันตัวตน (พบจาก Full QA Campaign TC-AWS-006/007)',
          '⚙️ API Gateway Throttling: ตั้ง Default Route Settings Burst=100 / Rate=50 req/s บน stage prod ป้องกัน abuse และคุมงบ Free Tier',
          '💾 DynamoDB TTL Auto-Cleanup: ทุก write บน Room/Matchmaking table แนบ `ttl = now + 7200` (2 ชม.) เซสชันค้างถูก AWS ลบเองโดยไม่เสีย WCU',
          '☁️ S3 Website Hosting: Production build อัปโหลดขึ้น S3 Bucket พร้อม public-read policy — เว็บใช้งานได้จาก URL จริง ไม่ต้องรัน dev server',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไข Exit Match แล้วฝั่งคู่แข่งค้างหน้า Disconnected ต้องรอ Rejoin ตลอดไป (backend ไม่มี LEAVE_ROOM route — เพิ่ม route ใหม่พร้อม broadcast OPPONENT_LEFT)',
          'แก้ไข JOIN_ROOM นับ session ค้างของคนที่ออกไปแล้ว ทำให้ห้อง "เต็มปลอม" คนใหม่เข้าไม่ได้',
          'แก้ไข auto-reconnect พยายามเชื่อมต่อซ้ำหลังกด Exit ตั้งใจ (nullify onclose handler ก่อน close)',
        ],
      },
    ],
  },
];

