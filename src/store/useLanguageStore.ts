import { create } from 'zustand';

export type Language = 'th' | 'en';

export interface Translations {
  // Navigation
  navHome: string;
  navMatch: string;
  navSandbox: string;
  navDeckBuilder: string;
  navAnalytics: string;
  navHowToPlay: string;
  navServerOnline: string;
  navAccountLogin: string;
  navMyDecks: string;
  navSignOut: string;
  navPatchNotes: string;
  navSubtitle: string;

  // Common UI
  language: string;
  searchPlaceholder: string;
  filterByInk: string;
  filterByType: string;
  filterByRarity: string;
  allInks: string;
  allTypes: string;
  allRarities: string;
  clearFilters: string;
  cost: string;
  inkable: string;
  strength: string;
  willpower: string;
  lore: string;
  strengthWill: string;
  loreValue: string;
  yes: string;
  no: string;
  removeOne: string;
  addOneToDeck: string;
  inCurrentDeck: string;
  cardLimitReached: string;
  cardsCount: string;
  specialAbilities: string;
  cardInformation: string;
  set: string;
  cardId: string;
  hoverToRotate3D: string;
  keywordsGlossary: string;
  translateAbilities: string;
  originalText: string;
  thaiTranslation: string;

  // GameHub Landing
  hubHeroBadge: string;
  hubHeroTitle1: string;
  hubHeroTitle2: string;
  hubHeroDesc: string;
  hubStartSandbox: string;
  hubCreateDeck: string;
  hubFeatureMatchTitle: string;
  hubFeatureMatchDesc: string;
  hubFeatureAnalyticsTitle: string;
  hubFeatureAnalyticsDesc: string;
  hubFeatureDatabaseTitle: string;
  hubFeatureDatabaseDesc: string;
  hubFeatureRulesTitle: string;
  hubFeatureRulesDesc: string;

  // Analytics
  analyticsTitle: string;
  analyticsSubtitle: string;
  analyticsEfficiencyScore: string;
  analyticsAvgCost: string;
  analyticsInkableRatio: string;
  analyticsLorePotential: string;
  analyticsCurveDist: string;
  analyticsTypeBreakdown: string;
  analyticsCharacters: string;
  analyticsActions: string;
  analyticsItems: string;
  analyticsLocations: string;
  analyticsOptimizationTitle: string;
  analyticsOptimal: string;
  analyticsFasterThanMeta: string;

  // Deck Builder
  deckTitle: string;
  newDeck: string;
  saveDeck: string;
  deleteDeck: string;
  exportDeck: string;
  importDeck: string;
  deckStats: string;
  totalCards: string;
  inkCurve: string;
  cardPool: string;
  currentDeck: string;
  emptyDeckPrompt: string;
  recommendedDecks: string;
  loadRecommended: string;
  openBoosterPack: string;
  inspect3dCard: string;
  showingCards: string;
  ofCards: string;
  cardsFound: string;
  page: string;
  prevPage: string;
  nextPage: string;
  savedDecks: string;
  saveSuccess: string;
  saveFailed: string;
  analyzingDeck: string;
  analyzeDeck: string;
  confirmClear: string;
  clearDeck: string;

  // User Dashboard
  accountTitle: string;
  accountSubtitle: string;
  signIn: string;
  register: string;
  username: string;
  email: string;
  password: string;
  welcomeBack: string;
  mySavedDecks: string;
  createNewDeck: string;
  noDecksYet: string;
  lastUpdated: string;
  cardsInDeck: string;
  playSandbox: string;
  editDeck: string;
  deleteDeckConfirm: string;

  // Match Lobby
  lobbyTitle: string;
  lobbySubtitle: string;
  createRoom: string;
  joinRoom: string;
  enterRoomCode: string;
  selectYourDeck: string;
  waitingForOpponent: string;
  matchFound: string;
  shareRoomCode: string;
  copyCode: string;
  codeCopied: string;

  // Sandbox & Match
  turn: string;
  yourTurn: string;
  opponentTurn: string;
  passTurn: string;
  quest: string;
  challenge: string;
  exert: string;
  ready: string;
  putToInkwell: string;
  discardPile: string;
  drawCard: string;
  loreScore: string;
  availableInk: string;
  diceDuel: string;
  firstPlayer: string;
  beginningPhase: string;
  mainPhase: string;
  endPhase: string;
  mulliganTitle: string;
  mulliganDesc: string;
  keepHand: string;
  mulliganAction: string;
  victory: string;
  defeat: string;
  damage: string;
  exerted: string;
  readyStatus: string;
  drying: string;
  actionLog: string;
  exitMatch: string;

  // Booster & Modals
  boosterTitle: string;
  boosterTear: string;
  boosterNextCard: string;
  addAllToDeck: string;
  openAnotherPack: string;
  diceDuelTitle: string;
  rollDice: string;
  patchNotesTitle: string;
}

const translations: Record<Language, Translations> = {
  th: {
    // Navigation
    navHome: 'หน้าหลัก',
    navMatch: 'ดวลการ์ดออนไลน์',
    navSandbox: 'โต๊ะจำลอง Sandbox',
    navDeckBuilder: 'จัดเด็คการ์ด',
    navAnalytics: 'วิเคราะห์เด็ค',
    navHowToPlay: 'คู่มือและวิธีเล่น',
    navServerOnline: 'เซิร์ฟเวอร์ออนไลน์',
    navAccountLogin: 'เข้าสู่ระบบ',
    navMyDecks: 'เด็คของฉัน',
    navSignOut: 'ออกจากระบบ',
    navPatchNotes: 'บันทึกการอัปเดต',
    navSubtitle: 'ห้องทดลองจำลองการ์ดเกมดิจิทัล',

    // Common UI
    language: 'ภาษา',
    searchPlaceholder: 'ค้นหาชื่อการ์ด, ความสามารถ, คีย์เวิร์ด...',
    filterByInk: 'กรองตามสีหมึก',
    filterByType: 'กรองตามประเภทการ์ด',
    filterByRarity: 'กรองตามระดับความหายาก',
    allInks: 'สีหมึกทั้งหมด',
    allTypes: 'ประเภททั้งหมด',
    allRarities: 'ความหายากทั้งหมด',
    clearFilters: 'ล้างตัวกรอง',
    cost: 'ค่าร่าย',
    inkable: 'ใส่บ่อหมึกได้',
    strength: 'พลังโจมตี',
    willpower: 'พลังชีวิต',
    lore: 'แต้ม Lore',
    strengthWill: 'พลังโจมตี / พลังชีวิต',
    loreValue: 'ค่าแต้ม Lore',
    yes: 'ใช่',
    no: 'ไม่ใช่',
    removeOne: 'นำออก 1 ใบ',
    addOneToDeck: 'เพิ่มใส่เด็ค +1',
    inCurrentDeck: 'มีในเด็คปัจจุบัน:',
    cardLimitReached: 'ครบขีดจำกัด (สูงสุด 4 ใบ/แบบ)',
    cardsCount: 'ใบ',
    specialAbilities: 'ความสามารถพิเศษ',
    cardInformation: 'ข้อมูลและเรื่องราวการ์ด',
    set: 'ชุดการ์ด',
    cardId: 'รหัสการ์ด',
    hoverToRotate3D: 'เลื่อนเมาส์เพื่อหมุนการ์ด 3D Foil',
    keywordsGlossary: 'พจนานุกรมคีย์เวิร์ด',
    translateAbilities: 'แปลไทย',
    originalText: 'ข้อความต้นฉบับ',
    thaiTranslation: 'ฉบับแปลไทย',

    // GameHub Landing
    hubHeroBadge: 'Lorcana PlayLab Cloud Platform',
    hubHeroTitle1: 'ครองบัลลังก์แห่งหมึกเวทมนตร์',
    hubHeroTitle2: 'จำลองการเล่น จัดเด็ค และฝึกฝนกลยุทธ์ Lorcana',
    hubHeroDesc: 'จำลองการดวลการ์ดแบบ 2 ผู้เล่นแบบเรียลไทม์, จัดเด็ค 60 ใบตามกลยุทธ์ และวิเคราะห์ Ink Curve ของคุณพร้อมสถิติการ์ดแบบละเอียด',
    hubStartSandbox: 'เริ่มเล่นโต๊ะ Sandbox',
    hubCreateDeck: 'สร้างเด็คการ์ดส่วนตัว',
    hubFeatureMatchTitle: 'สนามดวลออนไลน์เรียลไทม์',
    hubFeatureMatchDesc: 'จำลองเทิร์นการเล่น หมุนการ์ด บริหารหมึก Inkwell และนับแต้ม Lore 0-20 สู่ชัยชนะ',
    hubFeatureAnalyticsTitle: 'วิเคราะห์เด็คอัจฉริยะ',
    hubFeatureAnalyticsDesc: 'คำนวณกราฟค่าร่าย อัตราส่วนตัวละคร และประเมินความสอดคล้องของเด็ค',
    hubFeatureDatabaseTitle: 'คลังการ์ดครบครัน',
    hubFeatureDatabaseDesc: 'ค้นหาการ์ดกว่า 3,200 ใบ พร้อมตัวกรองสีหมึกและภาพการ์ดความละเอียดสูง',
    hubFeatureRulesTitle: 'คู่มือและกติกาการเล่น',
    hubFeatureRulesDesc: 'เรียนรู้กฎ Lorcana ในไม่กี่นาทีด้วยภาพจำลองและคำอธิบายคีย์เวิร์ดแบบละเอียด',

    // Analytics
    analyticsTitle: 'สถิติและประสิทธิภาพของเด็ค',
    analyticsSubtitle: 'วิเคราะห์กราฟค่าร่าย Ink Curve และการทำงานประสานกันของเด็คแบบเรียลไทม์',
    analyticsEfficiencyScore: 'คะแนนประสิทธิภาพหมึก',
    analyticsAvgCost: 'ค่าร่ายหมึกเฉลี่ย',
    analyticsInkableRatio: 'อัตราส่วนการ์ดใส่ Inkwell ได้',
    analyticsLorePotential: 'ศักยภาพ Lore สูงสุด / เทิร์น',
    analyticsCurveDist: 'การกระจายตัวของค่าร่าย',
    analyticsTypeBreakdown: 'สัดส่วนประเภทการ์ด',
    analyticsCharacters: 'ตัวละคร',
    analyticsActions: 'แอ็กชัน & เพลง',
    analyticsItems: 'ไอเทม',
    analyticsLocations: 'สถานที่',
    analyticsOptimizationTitle: 'คำแนะนำการปรับปรุงเด็ค',
    analyticsOptimal: 'เหมาะสม',
    analyticsFasterThanMeta: 'เร็วกว่าค่าเฉลี่ยเมต้า',

    // Deck Builder
    deckTitle: 'ระบบจัดเด็คการ์ด',
    newDeck: 'สร้างเด็คใหม่',
    saveDeck: 'บันทึกเด็ค',
    deleteDeck: 'ลบเด็ค',
    exportDeck: 'ส่งออกเด็ค',
    importDeck: 'นำเข้าเด็ค',
    deckStats: 'สถิติเด็ค',
    totalCards: 'จำนวนการ์ดทั้งหมด',
    inkCurve: 'กราฟอัตราค่าร่าย',
    cardPool: 'คลังการ์ดทั้งหมด',
    currentDeck: 'การ์ดในเด็คปัจจุบัน',
    emptyDeckPrompt: 'เด็คของคุณยังว่างอยู่ เลือกการ์ดจากคลังเพื่อเริ่มจัดเด็ค',
    recommendedDecks: 'เด็คแนะนำจากโปรเมต้า',
    loadRecommended: 'โหลดเด็คแนะนำ',
    openBoosterPack: 'เปิดซองการ์ด',
    inspect3dCard: 'เปิดดูการ์ด 3D',
    showingCards: 'กำลังแสดง',
    ofCards: 'จากทั้งหมด',
    cardsFound: 'ใบที่ค้นพบ',
    page: 'หน้า',
    prevPage: 'หน้าก่อนหน้า',
    nextPage: 'หน้าถัดไป',
    savedDecks: 'เด็คที่บันทึกไว้ของคุณ',
    saveSuccess: 'บันทึกเด็คสำเร็จขึ้นคลัง Illuminary Cloud Vault!',
    saveFailed: 'เกิดข้อผิดพลาดในการบันทึกเด็ค',
    analyzingDeck: 'กำลังวิเคราะห์เด็ค...',
    analyzeDeck: 'วิเคราะห์ประสิทธิภาพเด็ค',
    confirmClear: 'ยืนยันการล้างเด็ค?',
    clearDeck: 'ล้างการ์ดในเด็ค',

    // User Dashboard
    accountTitle: 'บัญชี Illumineer',
    accountSubtitle: 'เข้าสู่ระบบเพื่อเข้าถึงเด็คที่บันทึกไว้บนคลาวด์',
    signIn: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    username: 'ชื่อผู้ใช้',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    welcomeBack: 'ยินดีต้อนรับกลับ',
    mySavedDecks: 'เด็คบนคลาวด์ของฉัน',
    createNewDeck: 'สร้างเด็คใหม่',
    noDecksYet: 'คุณยังไม่มีเด็คที่บันทึกไว้',
    lastUpdated: 'อัปเดตล่าสุด',
    cardsInDeck: 'ใบในเด็ค',
    playSandbox: 'ทดลองเล่นใน Sandbox',
    editDeck: 'แก้ไขเด็ค',
    deleteDeckConfirm: 'ยืนยันการลบ?',

    // Match Lobby
    lobbyTitle: 'ห้องดวลการ์ดออนไลน์',
    lobbySubtitle: 'สร้างห้องหรือเข้าร่วมห้องเพื่อดวลการ์ดแบบเรียลไทม์ผ่าน WebSocket',
    createRoom: 'สร้างห้องดวลใหม่',
    joinRoom: 'เข้าร่วมห้องดวล',
    enterRoomCode: 'ใส่รหัสห้อง',
    selectYourDeck: 'เลือกเด็คของคุณสำหรับการดวล',
    waitingForOpponent: 'กำลังรอผู้ท้าชิงเข้าร่วมห้อง...',
    matchFound: 'พบผู้เล่นแล้ว! กำลังเตรียมเริ่มเกม...',
    shareRoomCode: 'แชร์รหัสห้องนี้ให้เพื่อนของคุณ:',
    copyCode: 'คัดลอกรหัส',
    codeCopied: 'คัดลอกแล้ว!',

    // Sandbox & Match
    turn: 'เทิร์น',
    yourTurn: 'เทิร์นของคุณ',
    opponentTurn: 'เทิร์นของคู่แข่ง',
    passTurn: 'จบเทิร์น',
    quest: 'ทำเควสต์',
    challenge: 'โจมตีท้าดวล',
    exert: 'ใช้งาน',
    ready: 'ฟื้นฟู',
    putToInkwell: 'ใส่เป็นหมึก',
    discardPile: 'สุสานการ์ด',
    drawCard: 'จั่วการ์ด',
    loreScore: 'คะแนน Lore',
    availableInk: 'หมึกที่พร้อมใช้',
    diceDuel: 'ทอดลูกเต๋าตัดสิน',
    firstPlayer: 'ผู้เล่นคนแรก',
    beginningPhase: 'ช่วงเริ่มต้น',
    mainPhase: 'ช่วงเล่นหลัก',
    endPhase: 'ช่วงจบเทิร์น',
    mulliganTitle: 'ขั้นตอนสลับการ์ดเริ่มต้น',
    mulliganDesc: 'เลือกการ์ดที่ต้องการเปลี่ยนกลับเข้ากอง แล้วจั่วการ์ดใหม่ตามจำนวนที่เลือก',
    keepHand: 'เก็บมือนี้',
    mulliganAction: 'เปลี่ยนการ์ดที่เลือก',
    victory: '🏆 ยินดีด้วย! คุณได้รับชัยชนะ!',
    defeat: '💀 คุณพ่ายแพ้ในศึกนี้',
    damage: 'ดาเมจ',
    exerted: 'ใช้งานแล้ว',
    readyStatus: 'พร้อมใช้งาน',
    drying: 'เพิ่งลงสนาม',
    actionLog: 'บันทึกการเล่น',
    exitMatch: 'ออกจากห้องดวล',

    // Booster & Modals
    boosterTitle: 'เปิดซองการ์ด Booster Pack',
    boosterTear: 'ฉีกซองการ์ด',
    boosterNextCard: 'ดูใบถัดไป',
    addAllToDeck: 'เพิ่มการ์ดทั้งหมดลงเด็ค',
    openAnotherPack: 'เปิดซองใหม่อีกซอง',
    diceDuelTitle: 'ทอดลูกเต๋าตัดสินผู้เล่นคนแรก',
    rollDice: 'ทอดลูกเต๋า!',
    patchNotesTitle: 'บันทึกการอัปเดตระบบ',
  },
  en: {
    // Navigation
    navHome: 'Home',
    navMatch: 'Real-Time Match',
    navSandbox: 'Playmat Sandbox',
    navDeckBuilder: 'Deck Builder',
    navAnalytics: 'Deck Analytics',
    navHowToPlay: 'How to Play',
    navServerOnline: 'Server Online',
    navAccountLogin: 'Account Login',
    navMyDecks: 'My Decks',
    navSignOut: 'Sign Out',
    navPatchNotes: 'Patch Notes',
    navSubtitle: 'Digital Card Simulation Lab',

    // Common UI
    language: 'Language',
    searchPlaceholder: 'Search card name, ability, keyword...',
    filterByInk: 'Filter by Ink',
    filterByType: 'Filter by Type',
    filterByRarity: 'Filter by Rarity',
    allInks: 'All Inks',
    allTypes: 'All Types',
    allRarities: 'All Rarities',
    clearFilters: 'Clear Filters',
    cost: 'Cost',
    inkable: 'Inkable',
    strength: 'Strength',
    willpower: 'Willpower',
    lore: 'Lore Value',
    strengthWill: 'Strength / Will',
    loreValue: 'Lore Value',
    yes: 'Yes',
    no: 'No',
    removeOne: 'Remove 1',
    addOneToDeck: 'Add 1 To Deck',
    inCurrentDeck: 'In Current Deck:',
    cardLimitReached: 'Limit reached (Max 4 copies)',
    cardsCount: 'Cards',
    specialAbilities: 'Special Abilities',
    cardInformation: 'Card Information',
    set: 'Set',
    cardId: 'ID',
    hoverToRotate3D: 'Hover to rotate 3D Foil',
    keywordsGlossary: 'Keywords Glossary',
    translateAbilities: 'Thai Translation (English Keywords)',
    originalText: 'Original Text (EN)',
    thaiTranslation: 'Thai Translation',

    // GameHub Landing
    hubHeroBadge: 'Lorcana PlayLab Cloud Platform',
    hubHeroTitle1: 'Master the Inkwell.',
    hubHeroTitle2: 'Play, Build & Master Lorcana Decks.',
    hubHeroDesc: 'Simulate 2-player matches in real-time, craft custom 60-card decks, and analyze your inkwell curve with instant card statistics.',
    hubStartSandbox: 'Start Playing Sandbox',
    hubCreateDeck: 'Create Custom Deck',
    hubFeatureMatchTitle: 'Real-Time Match Arena',
    hubFeatureMatchDesc: 'Simulate match turns with card rotation, inkwell reserves, and 0–20 Lore tracking.',
    hubFeatureAnalyticsTitle: 'Smart Deck Analyzer',
    hubFeatureAnalyticsDesc: 'Calculate ink cost distributions, character ratios, and deck synergy ratings.',
    hubFeatureDatabaseTitle: 'Complete Card Database',
    hubFeatureDatabaseDesc: 'Search over 3,200 cards with ink color filters and high-resolution official artwork.',
    hubFeatureRulesTitle: 'Interactive Rulebook',
    hubFeatureRulesDesc: 'Learn Lorcana rules in minutes with interactive card anatomy tooltips and mechanics.',

    // Analytics
    analyticsTitle: 'Deck Performance & Ink Curve Analytics',
    analyticsSubtitle: 'Real-Time Inkwell Curve & Synergy Evaluation',
    analyticsEfficiencyScore: 'Ink Efficiency Score',
    analyticsAvgCost: 'Average Ink Cost',
    analyticsInkableRatio: 'Inkable Ratio',
    analyticsLorePotential: 'Quest Potential / Turn',
    analyticsCurveDist: 'Ink Curve Distribution',
    analyticsTypeBreakdown: 'Card Type Breakdown',
    analyticsCharacters: 'Characters',
    analyticsActions: 'Actions & Songs',
    analyticsItems: 'Items',
    analyticsLocations: 'Locations',
    analyticsOptimizationTitle: 'Deck Optimization Insights',
    analyticsOptimal: 'Optimal',
    analyticsFasterThanMeta: 'Faster than meta avg.',

    // Deck Builder
    deckTitle: 'Deck Builder Studio',
    newDeck: 'New Deck',
    saveDeck: 'Save Deck',
    deleteDeck: 'Delete Deck',
    exportDeck: 'Export Deck',
    importDeck: 'Import Deck',
    deckStats: 'Deck Statistics',
    totalCards: 'Total Cards',
    inkCurve: 'Ink Cost Curve',
    cardPool: 'Card Pool Collection',
    currentDeck: 'Current Deck List',
    emptyDeckPrompt: 'Your deck is empty. Select cards from the pool to get started.',
    recommendedDecks: 'Meta Recommended Decks',
    loadRecommended: 'Load Deck',
    openBoosterPack: 'Open Booster Pack',
    inspect3dCard: 'Inspect 3D Card',
    showingCards: 'Showing',
    ofCards: 'of',
    cardsFound: 'Cards Found',
    page: 'Page',
    prevPage: 'Previous Page',
    nextPage: 'Next Page',
    savedDecks: 'Your Saved Decks',
    saveSuccess: 'Saved successfully to Illuminary Cloud Vault!',
    saveFailed: 'Failed to save deck',
    analyzingDeck: 'Analyzing deck...',
    analyzeDeck: 'Analyze Deck Performance',
    confirmClear: 'Confirm Clear Deck?',
    clearDeck: 'Clear Deck',

    // User Dashboard
    accountTitle: 'Illumineer Account',
    accountSubtitle: 'Sign in to access your cloud saved decks',
    signIn: 'Sign In',
    register: 'Register',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    welcomeBack: 'Welcome Back',
    mySavedDecks: 'My Cloud Saved Decks',
    createNewDeck: 'Create New Deck',
    noDecksYet: "You don't have any saved decks yet.",
    lastUpdated: 'Last updated',
    cardsInDeck: 'cards in deck',
    playSandbox: 'Play in Sandbox',
    editDeck: 'Edit Deck',
    deleteDeckConfirm: 'Confirm Delete?',

    // Match Lobby
    lobbyTitle: 'Online Match Lobby',
    lobbySubtitle: 'Create or join a room to battle in real-time via WebSocket',
    createRoom: 'Create New Room',
    joinRoom: 'Join Room',
    enterRoomCode: 'Enter Room Code',
    selectYourDeck: 'Select Your Deck for Battle',
    waitingForOpponent: 'Waiting for opponent to join...',
    matchFound: 'Match found! Preparing match...',
    shareRoomCode: 'Share this room code with your friend:',
    copyCode: 'Copy Code',
    codeCopied: 'Copied!',

    // Sandbox & Match
    turn: 'Turn',
    yourTurn: 'Your Turn',
    opponentTurn: 'Opponent\'s Turn',
    passTurn: 'Pass Turn',
    quest: 'Quest',
    challenge: 'Challenge',
    exert: 'Exert',
    ready: 'Ready',
    putToInkwell: 'Put into Inkwell',
    discardPile: 'Discard Pile',
    drawCard: 'Draw Card',
    loreScore: 'Lore Score',
    availableInk: 'Available Ink',
    diceDuel: 'Dice Duel',
    firstPlayer: 'First Player',
    beginningPhase: 'Beginning Phase',
    mainPhase: 'Main Phase',
    endPhase: 'End Phase',
    mulliganTitle: 'Mulligan Phase',
    mulliganDesc: 'Select any number of cards to replace. Hover card to inspect details.',
    keepHand: 'Keep Hand',
    mulliganAction: 'Mulligan Selected Cards',
    victory: '🏆 Victory! You Won!',
    defeat: '💀 Defeat! Game Over',
    damage: 'Damage',
    exerted: 'Exerted',
    readyStatus: 'Ready',
    drying: 'Ink Drying',
    actionLog: 'Action Log',
    exitMatch: 'Exit Match',

    // Booster & Modals
    boosterTitle: 'Booster Pack Opening',
    boosterTear: 'Tear Pack Open',
    boosterNextCard: 'Next Card',
    addAllToDeck: 'Add All Cards to Deck',
    openAnotherPack: 'Open Another Pack',
    diceDuelTitle: 'Dice Duel - First Player',
    rollDice: 'Roll the Dice!',
    patchNotesTitle: 'Patch Notes & Updates',
  },
};

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lorcana_lang') as Language | null;
    if (saved === 'th' || saved === 'en') return saved;
  }
  return 'th';
};

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: getInitialLanguage(),
  t: translations[getInitialLanguage()],
  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorcana_lang', lang);
    }
    set({ language: lang, t: translations[lang] });
  },
  toggleLanguage: () => {
    const nextLang = get().language === 'th' ? 'en' : 'th';
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorcana_lang', nextLang);
    }
    set({ language: nextLang, t: translations[nextLang] });
  },
}));
