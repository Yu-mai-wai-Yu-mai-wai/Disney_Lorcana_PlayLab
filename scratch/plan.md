# Plan: "Dark Editorial + Magic" — Disney Lorcana PlayLab Landing & Pages

> Spec ก่อนแก้โค้ด (Zero-Shot Ban — 3+ ไฟล์) · สถานะ: **รออนุมัติ**
> Direction (User เลือก A): คงกรอบ **Dark Editorial** (design.md ล็อค) แต่เพิ่ม **"เวทมนต์" แบบมีรสนิยม** — แสงทองจากอาร์ต, texture เวทมนตร์, foil เฉพาะจุด — ไม่หลุดเป็น AI slop

## เป้าหมาย
Landing page (GameHub) + Navbar + CSS tokens ให้มี **taste/สไตล์ "Disney เวทมนต์"** ภายใต้กฎ design.md:
- ยังใช้: Cinzel 700-900, gold accent `--color-accent`, solid panels, noise texture, motion เฉพาะจุดสำคัญ
- เพิ่มได้ (เฉพาะ Marketing/Landing): แสงทองสาดจากอาร์ตการ์ด, texture หนังสมุดเวทมนตร์, foil shimmer บน hero headline/CTA, divider เวทมนตร์
- ห้าม (ตาม design.md): glassmorphism blur, emoji ใน UI, glow กระจาย, gradient สุ่ม, spin/pulse วน, rounded-3xl

## ไฟล์ที่จะแก้ (5)
| # | ไฟล์ | การแก้ |
|---|------|--------|
| 1 | `design.md` | เพิ่ม section **"Magic Enrichment (Landing only)"** — อนุญาตแสงทอง/foil/texture เฉพาะ marketing pages + ตัวอย่างการใช้/ห้ามใช้ (ยังล็อคกรอบหลักเดิม) |
| 2 | `src/index.css` | เพิ่ม utility classes: `.magic-glow-gold` (แสงทองจากอาร์ต, blur จำกัด ≤60px, เฉพาะ hero zone), `.magic-parchment` (texture เวทมนตร์แบบ noise), `.foil-text` (gold gradient text เฉพาะ headline — 1 gradient ต่อ viewport ตามกฎเดิม), `.magic-divider` (เส้นทองละเอียด + sparkle) |
| 3 | `src/components/GameHub.tsx` | ปรับ hero: headline ใหญ่ขึ้น + foil-text, badge เวทมนตร์, CTA gold + hover foil, feature cards hover แบบ magical (border gold + light), เพิ่มแสงทองจากอาร์ตด้านหลัง hero (จางๆ) |
| 4 | `src/components/Navbar.tsx` | โลโก้/ชื่อ + gold accent เล็กน้อย (เวทมนตร์แบบ restrained), active state |
| 5 | `src/components/LorcanaBoard.tsx` | **UX polish + 2 feature ใหม่ (ตามคำขอ User):** <br>① **Scroll layout** — เปลี่ยนจาก `overflow-hidden` fixed-height เป็น scroll ได้ (เลื่อนขึ้น/ลงอ่านละเอียดได้ทั้งฝั่งตัวเอง + ฝั่งศัตรู) ② **Drag Choice Menu** — ลากการ์ดลง Field เหมือนเดิม แต่พอปล่อย (หรือกดค้าง) ให้โผล่เมนูเลือก **"Inkwell" / "Play to Field"** (แสดงเฉพาะ option ที่การ์ดทำได้ตาม type: การ์ด `isInkable: false` เช่น Action/Song จะไม่มีปุ่ม Ink — เลือกได้แค่ Field) + polish อื่น: Lore/phase ชัดขึ้น, การ์ด hover/exerted/ready อ่านง่าย, inkwell slots ชัด, spacing สม่ำเสมอ |

## ไม่งับไฟล์
- ไม่แก้: DeckBuilder/Analytics (App pages — ตาม design.md ห้าม enrichment)
- ไม่แก้: ArtworkCarousel (อาร์ต Disney เดิมดีอยู่แล้ว — แค่ให้ hero ใช้ประโยชน์)

## Verification
1. `npm run build` (tsc -b && vite build) — ต้องผ่าน 0 error
2. `npm run lint` (tsc --noEmit) — ต้องผ่าน
3. เปิด `npm run dev` + screenshot hero เพื่อตรวจ visual (foil ต้องไม่ล้น, แสงต้องไม่สว่างเกิน)

## Git checkpoint (ก่อนแก้)
- `git status` → commit checkpoint `chore: checkpoint before magic-enrichment pass` (rollback ได้ถ้าพลาด)

---
**รอคำว่า "Proceed" ถึงเริ่ม**
