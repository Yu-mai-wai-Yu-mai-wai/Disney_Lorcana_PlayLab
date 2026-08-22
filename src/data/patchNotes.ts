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

export const APP_VERSION = 'v1.4.0';
export const APP_BUILD_DATE = '2026-08-20';

export const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v1.4.0',
    releaseDate: '2026-08-20',
    title: 'Match Rejoin, Undo Voting, Meta Decks & Modern UI Overhaul',
    highlight: 'เพิ่มระบบกู้คืนแมตช์ (Rejoin) เมื่อเน็ตหลุด, ระบบขอย้อนการเล่น (Undo Vote) ผ่านการยอมรับจากคู่แข่ง, ชุด Meta Decks พร้อมตัวดูการ์ด, พื้นหลัง WebGL Shader, และยกระดับ UI/Style ให้โมเดิร์น (Glassmorphism + Spotlight + Shimmer) ครบทุกหน้า',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🔄 Match Rejoin (กู้คืนเมื่อเน็ตหลุด): ระบบ Grace Period กลางหลังหลุด, กดกลับเข้าห้องเดิมจากแบนเนอร์ Rejoin, Restore กระดานจาก localStorage + STATE_SYNC เพื่อเล่นต่อจากจุดเดิม 100%',
          '↩️ Return / Undo Voting: กดขอย้อนการเล่น (จำกัด 2 ครั้ง/แมตช์) ส่งคำขอถึงคู่แข่งผ่าน `UNDO_REQUESTED`, คู่แข่งกดยินยอม/ปฏิเสธภายใน 15 วินาที, เมื่อยอมรับกระดานทั้งสองฝั่ง Rollback พร้อมกัน',
          '🔌 SQS Deck Analyzer Flow เต็มวงจร: wire `POST /decks/{id}/analyze` + `GET /analysis` + package/deploy `lorcana-analyzer` + SQS event-source-mapping ใน deploy script เพื่อให้การวิเคราะห์เด็คไหลครบ Cloud',
        ],
      },
      {
        category: 'UI/UX',
        items: [
          '🎨 Modern UI Overhaul: Glassmorphism, Spotlight Cards, Ink Color Shimmer Badges, Ambient Glow ทั้ง 6 สีหมึกบน Navbar/Lobby/Deck Viewer',
          '🌌 WebGL Gold Ink Background Shader: พื้นหลัง Liquid Magic & Chromatic Lore เรืองแสงบนทุกหน้า, GPU-accelerated + Auto-throttle เมื่อซ่อนแท็บ',
          '🃏 Meta Decks Library: ชุดเด็ค Meta มาตรฐาน 8 archetypes พร้อมปุ่ม "ดูการ์ด" เปิด DeckViewerPopup ขนาดใหญ่กลางจอ, Search + Ink Filter',
          '📐 Responsive Fix: จัด Navbar แถวเดียว, Grid Lobby สมดุล, ปุ่ม/การ์ดขนาดพอดีจอที่ Zoom 100% (1920x1080 + laptop/tablet), ปรับ Card3DInspector ให้ฟิตจอ',
        ],
      },
      {
        category: 'Gameplay',
        items: [
          '⚡ Ability Notification HUD: แจ้งเตือนในเกมเมื่อเกิด Ability/Kewword (Auto-resolved, Keyword, Complex Effect) พร้อมคำแนะนำการเล่น, Card Stacking ไม่บังกระดาน',
          '📊 Ink/Vitals Real-time Sync: ซิงค์ availableInk, lore, exerted ของฝั่งคู่แข่งให้ตรงกันระหว่างเล่น (ACTION_PLAYED, INK_PLAYED, TURN_PASSED snapshot)',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไข Rejoin แล้วขึ้น Dice Duel/Reset กระดานเป็นใหม่ (guard isRejoin)',
          'แก้ไขอีกฝั่งยังขึ้น Disconnected Overlay หลังกลับเข้าเกม (auto-dismiss บนทุก Event)',
          'แก้ไข popup ดูการ์ดไม่ขึ้นกลางจอ (React Portal สู่ document.body + z-index สูง)',
        ],
      },
    ],
  },
  {
    version: 'v1.3.12',
    releaseDate: '2026-08-18',
    title: 'Opponent Card State Sync & Automatic Quest/Challenge Exertion',
    highlight: 'ซิงค์สถานะ Drying/Ready ของการ์ดทั้งสองฝั่งให้ตรงกัน 100%, ปรับระบบ Exhaust/Ready ให้ทำงานอัตโนมัติตามกฎ Lorcana (เมื่อเลือก Quest หรือ Challenge) และยกเลิกการกด Exert เองเพื่อป้องกันข้อผิดพลาด',
    features: [
      {
        category: 'Gameplay',
        items: [
          '⚡ Automatic Quest Exertion: เมื่อสั่งการ์ด Quest (⚡) ระบบจะทำการ Exert (Exhaust) การ์ดให้อัตโนมัติทันที พร้อมเพิ่ม Lore และส่ง Event ซิงค์สถานะไปยังคู่ต่อสู้',
          '⚔️ Automatic Challenge Exertion: เมื่อสั่งการ์ด Challenge (⚔️) ตัวละครที่เป็นฝ่ายโจมตีจะถูก Exert (Exhaust) อัตโนมัติทันทีหลังการต่อสู้เสร็จสิ้น',
          '🔄 Turn Start Automatic Ready: การ์ดทุกใบจะ Ready และหมึกที่เปียก (Wet) จะแห้ง (Dry) อัตโนมัติเมื่อเริ่มต้นรอบเทิร์นใหม่',
        ],
      },
      {
        category: 'Multiplayer',
        items: [
          '💧 100% Symmetrical Drying State Sync: ฝั่งคู่ต่อสู้จะเห็นสถานะ Drying... (หมึกยังไม่แห้ง) บนการ์ดที่เพิ่งร่ายอย่างถูกต้องตรงกันกับฝั่งผู้เล่น',
          '🎯 Accurate Opponent Target Status: การ์ดของคู่ต่อสู้จะแสดงสถานะ Drying, Exerted, Ready ตามสถานะจริง พร้อมล็อกไม่ให้ Challenge ตัวละครที่ยังไม่ Exerted ตามกฎทางการ',
        ],
      },
      {
        category: 'UI/UX',
        items: [
          '🛡️ Smart Card Interaction: ปรับปรุงการคลิกที่การ์ดให้เป็นการเลือกเป้าหมาย Challenge หรือแจ้งเตือนสถานะ โดยไม่ให้กดสลับ Exert/Ready เองอย่างอิสระตามคำขอ',
        ],
      },
    ],
  },
  {
    version: 'v1.3.10',
    releaseDate: '2026-08-18',
    title: 'Card Preview Positioning, Mulligan Hover & Official Ability Dataset Sync',
    highlight: 'เพิ่มระบบ Hover ดูข้อมูลการ์ดในหน้า Mulligan, ปรับตำแหน่ง Popup พรีวิวการ์ดให้ลอยสูงขึ้นไม่บังการ์ดบนมือ, แก้ไขการแสดงผล Inkable/Non-Inkable ให้ถูกต้อง 100% และซิงค์ความสามารถการ์ด (Special Abilities) จากฐานข้อมูลทางการ 3,242 ใบ',
    features: [
      {
        category: 'UI/UX',
        items: [
          '🔍 Mulligan Card Inspection: เพิ่มระบบ Hover ดูข้อมูลการ์ด สเตตัส และความสามารถขณะอยู่ในหน้าต่าง Mulligan Phase',
          '📐 Elevated Card Preview Popup: ปรับระดับความสูงของ Popup พรีวิวการ์ดให้อยู่เหนือ Hand Dock โดยสมบูรณ์ ไม่ทับซ้อนหรือบดบังการ์ดในมือของผู้เล่น',
          '✨ Special Abilities Box: แสดงกล่องข้อมูลความสามารถพิเศษของการ์ดทุกใบ (Abilities Name & Text) พร้อมแถบ Scroll รองรับการ์ดที่มีหลายความสามารถ',
        ],
      },
      {
        category: 'Gameplay',
        items: [
          '💧 Accurate Inkable Verification: แก้ไขการตรวจสอบสถานะ Inkable ของการ์ดทุกใบให้ตรงตามข้อมูลจริงจาก Official Dataset (3,242 ใบ) ปราศจากการแสดงผลผิดพลาด',
          '⚡ Automated Ability Triggers: ระบบเรียกใช้งานความสามารถของการ์ดที่ร่ายลงสนามอย่างสมบูรณ์ (จั่วการ์ด, เพิ่ม Lore, ทำลายการ์ด, สร้างความเสียหาย, สั่ง Exert)',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาหน้าต่าง Mulligan Phase ไม่มี Hover แสดงข้อมูลการ์ด',
          'แก้ไขปัญหา Popup แสดงข้อมูลการ์ดในมือทับซ้อนกับการ์ดบนมือ',
          'แก้ไขปัญหาการ์ด Inkable แสดงผลเป็น Non-Inkable',
          'แก้ไขปัญหา Popup ขาดข้อมูลความสามารถพิเศษของการ์ด',
        ],
      },
    ],
  },
  {
    version: 'v1.3.9',
    releaseDate: '2026-08-18',
    title: 'Strict Browser Session Isolation & Multi-Account Integrity',
    highlight: 'แยก Session การล็อกอินของแต่ละแท็บและหน้าต่างเบราว์เซอร์อย่างเด็ดขาด (Strict Session Storage) ป้องกันปัญหาบัญชีทับซ้อนและข้อมูลรั่วไหลข้ามหน้าต่าง',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🛡️ Absolute Tab Session Isolation: ระบบบันทึก Session และ Token แยกเด็ดขาดเฉพาะแท็บนั้นๆ (sessionStorage-only lifecycle) ไม่แชร์หรือเขียนทับไปยัง localStorage ข้ามแท็บ',
          '🔒 Zero Cross-Tab Leaks: บัญชีที่ล็อกอินในแต่ละแท็บจะมีความเป็นอิสระ 100% ต่อให้เปิดหลายแท็บบนเบราว์เซอร์เดียวกันก็ไม่มีการแย่งหรือสลับบัญชีกัน',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'ปิดช่องโหว่การเขียนทับบัญชีข้ามแท็บบนเบราว์เซอร์ปกติ',
        ],
      },
    ],
  },
  {
    version: 'v1.3.8',
    releaseDate: '2026-08-18',
    title: 'Automated Beginning Phase Draw & Turn-Locked Deck Interaction',
    highlight: 'บังคับใช้กฎ Official Lorcana Rule 3.2.3 ระบบจั่วการ์ดอัตโนมัติ 1 ใบเมื่อเริ่มเทิร์น (ยกเว้นผู้เล่นคนแรกในเทิร์น 1) และล็อกกองการ์ดป้องกันการกดจั่วการ์ดเกินจำกัด',
    features: [
      {
        category: 'Gameplay',
        items: [
          '🎴 Fully Automatic Draw Step (Rule 3.2.3): เมื่อเริ่มเทิร์นของผู้เล่น ระบบจะรัน Ready, Set และ Draw Step จั่วการ์ด 1 ใบเข้ามือโดยอัตโนมัติ 100% ปราศจาก Stale Closure',
          '⏱️ First Player Turn 1 Rule (Rule 3.2.3.1): ผู้เล่นที่เริ่มเล่นคนแรกจะข้าม Draw Step ในเทิร์นที่ 1 อัตโนมัติ ส่วนเทิร์นที่ 2 เป็นต้นไปและผู้เล่นคนที่สองจะจั่วตามปกติ',
          '🔒 Turn-Locked Deck Protection: ปิดการคลิกกองการ์ดเพื่อจั่วแบบไม่จำกัด โดยการ์ดจะถูกจั่วผ่านระบบเทิร์นอัตโนมัติหรือผลของสกิลการ์ดเท่านั้น',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาเริ่มเทิร์นแล้วระบบไม่จั่วการ์ดให้อัตโนมัติเนื่องจาก Stale State Closure ใน WebSocket callback',
          'แก้ไขปัญหากองการ์ดสามารถกดคลิกเพื่อจั่วการ์ดได้ไม่จำกัดจำนวนครั้ง',
        ],
      },
    ],
  },
  {
    version: 'v1.3.7',
    releaseDate: '2026-08-18',
    title: 'Per-Tab Session Isolation & Anti-Account Collision Engine',
    highlight: 'แยก Session การล็อกอินระดับ Tab (sessionStorage Prioritization) ป้องกันปัญหาชื่อบัญชีสลับกันเมื่อเปิดหลายหน้าต่าง และบล็อกการใช้บัญชีซ้ำในระบบจับคู่',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🔒 Isolated Tab Sessions (sessionStorage): แยก Auth Token และ User Profile ของแต่ละแท็บโดยเด็ดขาด ทำให้สามารถเปิด 2 แท็บบนเบราว์เซอร์เดียวกันด้วย 2 บัญชีที่ต่างกันได้โดยไม่ชนกันและไม่สลับชื่อหลังจบแมตช์',
          '🚫 Strict Same-Account Match Blocking: Backend ปฏิเสธการใช้ชื่อบัญชีเดียวกันทั้งใน Private Room (Join Room) และ Ranked Matchmaking',
          '🔄 Match Exit State Integrity: เมื่อออกจากแมตช์ ข้อมูลผู้ใช้ของแท็บนั้นๆ จะคงเดิม 100% ไม่ถูกดึงหรือเปลี่ยนเป็นของอีกแท็บ',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาเปิด 2 หน้าต่างแล้วบัญชีหนึ่งเขียนทับอีกบัญชีใน localStorage',
          'แก้ไขปัญหาหลังกดออกจาก Real-time Match แล้วชื่อบัญชีเปลี่ยนเป็นอีกบัญชีที่ล็อกอินอยู่',
        ],
      },
    ],
  },
  {
    version: 'v1.3.6',
    releaseDate: '2026-08-18',
    title: 'Pre-Match Dice Duel Modal Auto-Dismiss & AWS Cloud Verification',
    highlight: 'แก้ไขปัญหาหน้าต่าง Pre-Match Dice Duel ค้างไม่ปิดหลังผู้ชนะเลือกลำดับเริ่มเกม พร้อมตรวจสอบความพร้อมของ AWS Cloud Lambdas และ WebSockets ทั้งหมด',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🎲 Guaranteed Modal Auto-Dismiss: เพิ่ม isOpen Lifecycle Guard ให้ DiceDuelModal ปิดตัวลงทันทีที่เข้าสู่ Mulligan Phase',
          '🛡️ Duplicate Account Isolation: บล็อกการใช้บัญชีเดียวกัน Join ห้องตัวเองหรือจับคู่กันเอง',
          '☁️ Cloud Backend Verification: ยืนยัน Lambda Function (auth, deck, room) และ API Gateway WebSocket Routes เป็นเวอร์ชันล่าสุด 100%',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาหน้าต่างทอยลูกเต๋าค้างที่หน้าจอหลังผู้ชนะเลือกลำดับเริ่มเกมเสร็จสิ้น',
        ],
      },
    ],
  },
  {
    version: 'v1.3.5',
    releaseDate: '2026-08-18',
    title: 'Match Lobby Connection Lifecycle & Outbound Message Queueing',
    highlight: 'แก้ปัญหาการสร้างห้อง (Create Room) รหัส 6 หลักไม่ขึ้น และการค้นหาห้อง Rank Match ไม่ขึ้นสถานะรอ โดยเพิ่ม Message Queueing และ Eager Connection Lifecycle',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🔑 Guaranteed Room Creation & 6-Digit Code Generation: ปรับให้คำสั่ง CREATE_ROOM ส่งตรงถึง AWS API Gateway Route พร้อม Message Queueing ป้องกันข้อมูลหลุดช่วงกำลังเชื่อมต่อ',
          '⚔️ Instant Ranked Matchmaking Feedback: เมื่อกดค้นหาห้อง ระบบจะปรับสถานะเป็น WAITING (Searching...) ทันที พร้อมส่งคำสั่ง MATCHMAKING_JOIN เข้าสู่ DynamoDB Matchmaking Queue',
          '⚡ Resilient Outbound Message Queueing: หาก Socket อยู่ในสถานะ Connecting ข้อความจะถูกเก็บใน Queue และ Flush ออกทันทีที่ Socket Open สมบูรณ์ 100%',
          '🔌 Eager Lobby WebSocket Connection: เชื่อมต่อ WebSocket ทันทีที่เข้าสู่หน้า Match Lobby เพื่อลด Latency และป้องกัน Connection Reset ซ้ำซ้อน',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาการกด CREATE ROOM แล้วรหัสห้อง 6 หลักไม่ยอมแสดง',
          'แก้ไขปัญหาการกด FIND MATCH ใน Ranked Matchmaking แล้วหน้าจอไม่เปลี่ยนเป็นสถานะค้นหาคู่ต่อสู้',
          'แก้ไขปัญหา WebSocket Connection Reset ซ้ำซ้อนเมื่อกดปุ่มใน Lobby',
        ],
      },
    ],
  },
  {
    version: 'v1.3.4',
    releaseDate: '2026-08-18',
    title: 'AWS WebSocket Route Envelope & Dual-Action Dispatch Engine',
    highlight: 'แก้ปัญหา Root Cause ที่ AWS API Gateway ปฏิเสธ Route Action โดยการหุ้ม Envelope action: "sendAction" และ gameAction พร้อมเพิ่ม Default Route ให้ Relay ข้อมูลผ่าน 100%',
    features: [
      {
        category: 'Cloud/Backend',
        items: [
          '🌐 AWS API Gateway Route Envelope Matching: ปรับระบบส่งข้อมูล WebSocket ทุกประเภทให้หุ้มด้วย Route "sendAction" ที่ลงทะเบียนใน AWS API Gateway พร้อมแนบ payload และ gameAction จริง',
          '⚡ Dual-Action Dispatching: ตัวรับ WebSocket ตรวจสอบทั้ง gameAction, realAction, action, และ nested payload เพื่อกระจาย Event เข้า Listener อย่างแม่นยำ',
          '🛡️ Complete Route Table & $default Integration: เพิ่ม $default route และ Action routes ครบทุกประเภทใน backend handler และ deploy templates',
          '🎲 100% Real-Time Dice Duel Sync: รับประกันว่าการกดเลือก ODD/EVEN, การทอยลูกเต๋า D6, การตัดสินผู้ชนะ, และการเลือกลำดับเริ่มเกมจะซิงค์ถึงกันทันทีในระดับ Sub-100ms',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหา AWS API Gateway Drop ข้อความที่ไม่ตรงกับ Route Key ใน Route Selection Expression',
          'แก้ไขปัญหาหน้าจอคู่ต่อสู้ไม่เปลี่ยนสถานะเป็น Ready เมื่ออีกฝั่งเลือก Odd/Even',
        ],
      },
    ],
  },
  {
    version: 'v1.3.3',
    releaseDate: '2026-08-18',
    title: 'Pre-Match Dice Duel Synchronization Guarantee',
    highlight: 'แก้ปัญหาการซิงค์ตัวเลือกลูกเต๋า (Odd/Even Selection) ข้ามเครือข่าย AWS API Gateway WebSockets Relay ให้ทำงานตรงกัน 100%',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🎲 Guaranteed Pre-Match Dice Duel Synchronization: ปรับแต่งให้ตัวเลือก ODD/EVEN และการทอยเต๋า D6 เชื่อมโยงผ่าน WebSocket State Engine อย่างแน่นอน 100%',
          '🔄 Double-Buffered Opponent Choice State: อ่านข้อมูลทั้งจาก Root Data และ Nested Payload ของ AWS Lambda Relay พร้อมกัน',
          '⚡ Ref-Safe Roll Execution: ป้องกันการเกิด Stale Closure เมื่อทั้งสองฝ่ายล็อกตัวเลือกครบ และรับประกันการหมุน 3D D6 ที่ตรงกัน',
          '👑 Decisive Order Resolution: ผู้ชนะการทายลูกเต๋าสามารถเลือก Play First หรือ Play Second และส่งคำสั่งเริ่มเกมเข้าสู่ Mulligan Phase ทันที',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ไขปัญหาหน้าจอคู่ต่อสู้ไม่ขึ้นสถานะ Ready เมื่ออีกฝั่งกดเลือก',
          'แก้ไขปัญหาการทอยลูกเต๋าไม่เริ่มอัตโนมัติเมื่อทั้งสองฝ่ายเลือกครบ',
        ],
      },
    ],
  },
  {
    version: 'v1.3.1',
    releaseDate: '2026-08-18',
    title: 'Automatic Drawing & Official Deck Architecture',
    highlight: 'ระบบจั่วการ์ดอัตโนมัติเต็มรูปแบบ (Ready, Set, Draw), ปลดล็อกขีดจำกัดขนาดมือ (No Max Hand Limit), และจัดการกองการ์ด 60 ใบตาม Comprehensive Rules 2.2.0',
    features: [
      {
        category: 'Gameplay',
        items: [
          '🎴 Fully Automatic Turn-Start Draw: ทุกเทิร์นระบบจะเข้าสู่ Draw Step และสั่งจั่วการ์ด 1 ใบจากกอง Deck ลงมือผู้เล่นโดยอัตโนมัติ 100% (ยกเว้น Turn 1 ของผู้เล่นที่เริ่มคนแรกตามกฎทางการ 3.2.3.1)',
          '✋ No Maximum Hand Size: ยกเลิกการจำกัดจำนวนการ์ดบนมือ 7 ใบ เพื่อให้สอดคล้องกับกฎของ Disney Lorcana ที่ไม่มีการจำกัดจำนวนการ์ดบนมือ ผู้เล่นสามารถถือการ์ดและจั่วเพิ่มได้ตลอดทั้งเกม',
          '📚 60-Card Deck State Engine: ระบบสร้างและจัดการกองการ์ด 60 ใบจริง แยก Hand (7 ใบ) และ Deck (53 ใบ) อย่างถูกต้อง พร้อมสุ่มจั่วตามลำดับจริงในเด็ค',
          '🔄 True Mulligan Execution: เมื่อเลือก Mulligan การ์ดที่ทิ้งจะถูกนำกลับเข้าใต้กองเด็ค จั่วใบใหม่ขึ้นมาแทนที่เท่ากับจำนวนที่ทิ้ง และสับกองใหม่อัตโนมัติ (Rule 2.2.2)',
          '💀 Accurate Deck-out Loss Trigger: เมื่อการ์ดในกอง Deck หมด (0 ใบ) แล้วมีคำสั่งจั่วการ์ด ระบบจะตัดสินผลแพ้ทันที (Loss by Deck-out)',
        ],
      },
      {
        category: 'Multiplayer',
        items: [
          '⚡ Real-time Draw Count Sync (`CARD_DRAWN`): ซิงค์จำนวนการ์ดในกองของคู่ต่อสู้แบบเรียลไทม์ผ่าน WebSocket',
          '🎲 Pre-Game Dice Duel (Simultaneous Choice): ทายเลขคู่/คี่พร้อมกันทั้งสองฝ่าย ผู้ชนะเลือกเริ่มก่อน/เริ่มหลัง พร้อมระบบ Re-Roll เมื่อผลเสมอ',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ปัญหาการ์ดบนมือติดขีดจำกัด 7 ใบ ทำให้ไม่สามารถจั่วการ์ดเพิ่มหลังเริ่มเกมได้',
          'แก้ปัญหาการ์ดในกองไม่ได้เก็บ State จริงของเด็คที่เลือกมา',
          'แก้ปัญหาป้ายแสดงจำนวนการ์ดบนมือที่เดิมระบุเป็น "/7"',
        ],
      },
    ],
  },
  {
    version: 'v1.2.0',
    releaseDate: '2026-08-15',
    title: 'Serverless Cloud Infrastructure',
    highlight: 'เชื่อมต่อฐานข้อมูล AWS DynamoDB, REST Auth API Gateway และระบบความปลอดภัย JWT',
    features: [
      {
        category: 'Cloud/Backend',
        items: [
          'ระบบ Authenticated Login / Register เก็บข้อมูลผู้ใช้ใน AWS DynamoDB (LorcanaUsers)',
          'ระบบจัดเก็บและบันทึก Deck ขึ้นคลาวด์แบบ Serverless (LorcanaDecks)',
          'ระบบ Matchmaking Queue และ 6-digit Private Room Code ผ่าน AWS Lambda',
        ],
      },
      {
        category: 'UI/UX',
        items: [
          'โมดอล 3D Card Inspector ตรวจสอบรายละเอียดการ์ดและ Texture',
          'Shader จำลองประกายแสง Gold Ink บนหน้าเว็บ',
        ],
      },
    ],
  },
  {
    version: 'v1.1.0',
    releaseDate: '2026-08-10',
    title: 'Deck Builder & Analytics Dashboard',
    highlight: 'ระบบสร้างเด็คการ์ด Disney Lorcana พร้อมวิเคราะห์ Ink Curve และสถิติเด็ค',
    features: [
      {
        category: 'Gameplay',
        items: [
          'ระบบ Deck Builder กรองตามสี Ink, ประเภทการ์ด, และค่า Cost',
          'คำนวณ Ink Curve, Rarity Breakdown, และความสมดุลของ Inkable Cards',
          'Booster Pack Simulator สุ่มเปิดซองการ์ดชุด The First Chapter',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    releaseDate: '2026-08-01',
    title: 'Disney Lorcana PlayLab Genesis',
    highlight: 'เปิดตัว Digital Card Simulation Lab สำหรับเกมการ์ด Disney Lorcana',
    features: [
      {
        category: 'Gameplay',
        items: [
          'กระดานจำลอง Playmat Sandbox สำหรับทดสอบและฝึกเล่น',
          'ระบบ Card Database รวบรวมการ์ดชุดหลักพร้อมรูปภาพความละเอียดสูง',
          'คู่มือ How to Play กฎกติกาเบื้องต้น',
        ],
      },
    ],
  },
];
