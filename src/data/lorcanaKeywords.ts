export interface LorcanaKeyword {
  id: string;
  name: string;
  thaiName: string;
  badgeColor: string;
  descriptionTh: string;
  descriptionEn: string;
  ruleExplanationTh: string;
}

export const LORCANA_KEYWORDS: Record<string, LorcanaKeyword> = {
  Bodyguard: {
    id: 'bodyguard',
    name: 'Bodyguard',
    thaiName: 'ผู้คุ้มกัน',
    badgeColor: 'bg-blue-600/30 text-blue-300 border-blue-500/40',
    descriptionTh: 'สามารถลงสู่สนามในสถานะ Exerted ได้ และศัตรูต้องเลือก Challenge ตัวละครที่มี Bodyguard ก่อน',
    descriptionEn: 'This character may enter play exerted. An opposing character who challenges one of your characters must choose one with Bodyguard if able.',
    ruleExplanationTh: 'การลงแบบ Exerted ช่วยป้องกันไม่ให้คู่ต่อสู้โจมตีตัวละครสำคัญตัวอื่นในเทิร์นนั้น',
  },
  Rush: {
    id: 'rush',
    name: 'Rush',
    thaiName: 'จู่โจมทันที',
    badgeColor: 'bg-rose-600/30 text-rose-300 border-rose-500/40',
    descriptionTh: 'ตัวละครนี้สามารถ Challenge ได้ในเทิร์นที่ลงสู่สนามทันที (ไม่ต้องรอหาย Dry)',
    descriptionEn: 'This character can challenge the turn they are played.',
    ruleExplanationTh: 'ตัวละครที่มี Rush สามารถโจมตีได้ทันทีในเทิร์นแรก แต่ยังไม่สามารถทำ Quest ได้ในเทิร์นที่ลง',
  },
  Ward: {
    id: 'ward',
    name: 'Ward',
    thaiName: 'ม่านคุ้มครอง',
    badgeColor: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40',
    descriptionTh: 'ฝ่ายตรงข้ามไม่สามารถเลือกตัวละครนี้เป็นเป้าหมายของการ์ดหรือ Ability ได้ ยกเว้นการ Challenge',
    descriptionEn: 'Opponents can\'t choose this character for actions or abilities except to challenge.',
    ruleExplanationTh: 'ป้องกันเวทมนตร์หรือเอฟเฟกต์ทำลายเจาะจงเป้าหมาย แต่ยังถูกโจมตีแบบต่อสู้ได้ตามปกติ',
  },
  Evasive: {
    id: 'evasive',
    name: 'Evasive',
    thaiName: 'หลบหลีกพริ้วไหว',
    badgeColor: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40',
    descriptionTh: 'เฉพาะตัวละครที่มีความสามารถ Evasive เท่านั้นที่สามารถ Challenge ตัวละครนี้ได้',
    descriptionEn: 'Only characters with Evasive can challenge this character.',
    ruleExplanationTh: 'หากฝ่ายตรงข้ามไม่มีตัวละครที่เป็น Evasive จะไม่สามารถสั่งโจมตีตัวละครนี้ได้เลย',
  },
  Shift: {
    id: 'shift',
    name: 'Shift',
    thaiName: 'แปลงร่างสืบทอด',
    badgeColor: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
    descriptionTh: 'สามารถจ่าย Ink ตามจำนวนที่ระบุเพื่อเล่นการ์ดนี้ทับตัวละครที่มีชื่อเดียวกันในสนามได้',
    descriptionEn: 'You may pay the Shift cost to play this on top of one of your characters named this.',
    ruleExplanationTh: 'การ Shift ทำให้ประหยัดค่าร่าย และตัวละครที่ลงทับสามารถใช้งานได้ทันทีหากตัวล่างหาย Dry แล้ว พร้อมทั้งคงความเสียหายเดิมไว้',
  },
  Singer: {
    id: 'singer',
    name: 'Singer',
    thaiName: 'นักร้องทรงพลัง',
    badgeColor: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
    descriptionTh: 'ตัวละครนี้นับเป็นค่าร่าย Cost ตามตัวเลขที่ระบุเมื่อใช้ร้องเพลง (Song Cards)',
    descriptionEn: 'This character counts as cost X to sing songs.',
    ruleExplanationTh: 'ช่วยให้คุณสามารถร้องเพลงที่มี Cost สูงได้โดยใช้ตัวละครตัวเล็กที่มีความสามารถ Singer',
  },
  Support: {
    id: 'support',
    name: 'Support',
    thaiName: 'สนับสนุนพลังรบ',
    badgeColor: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/40',
    descriptionTh: 'เมื่อตัวละครนี้ทำ Quest สามารถเลือกเพิ่ม Strength ให้ตัวละครอื่นได้เท่ากับค่า Strength ของตัวเองในเทิร์นนี้',
    descriptionEn: 'Whenever this character quests, you may add their Strength to another chosen character\'s Strength this turn.',
    ruleExplanationTh: 'ช่วยเพิ่มพลังโจมตีให้เพื่อนร่วมทีมเพื่อเตรียม Challenge ในเทิร์นเดียวกัน',
  },
  Challenger: {
    id: 'challenger',
    name: 'Challenger',
    thaiName: 'ผู้ท้าชิงบวกพลัง',
    badgeColor: 'bg-orange-600/30 text-orange-300 border-orange-500/40',
    descriptionTh: 'ได้รับค่า Strength เพิ่มเติมตามจำนวนที่ระบุ ขณะที่กำลังทำการ Challenge ฝ่ายตรงข้าม',
    descriptionEn: 'While challenging, this character gets +X Strength.',
    ruleExplanationTh: 'พลังจะเพิ่มเฉพาะตอนที่เป็นฝ่ายสั่งโจมตีเท่านั้น เมื่อถูกฝ่ายตรงข้ามโจมตีจะไม่ได้รับโบนัสนี้',
  },
  Resist: {
    id: 'resist',
    name: 'Resist',
    thaiName: 'ต้านทานความเสียหาย',
    badgeColor: 'bg-slate-500/30 text-slate-200 border-slate-400/40',
    descriptionTh: 'ความเสียหายทั้งหมดที่ตัวละครนี้จะได้รับ จะถูกลดทอนลงตามค่า Resist ที่ระบุเสมอ',
    descriptionEn: 'Damage dealt to this character is reduced by X.',
    ruleExplanationTh: 'ช่วยลดทอนดาเมจทั้งจากการต่อสู้และการโดนเวทมนตร์ยิง',
  },
  Reckless: {
    id: 'reckless',
    name: 'Reckless',
    thaiName: 'มุทะลุบุกโจมตี',
    badgeColor: 'bg-red-700/30 text-red-300 border-red-500/40',
    descriptionTh: 'ตัวละครนี้ไม่สามารถทำ Quest ได้ และต้องทำการ Challenge ในแต่ละเทิร์นหากสามารถทำได้',
    descriptionEn: 'This character can\'t quest and must challenge each turn if able.',
    ruleExplanationTh: 'เหมาะสำหรับตัวละครสายบวกที่เน้นกำจัดศัตรูในสนามอย่างรวดเร็ว',
  },
  Banish: {
    id: 'banish',
    name: 'Banish',
    thaiName: 'กำจัดลงสุสาน',
    badgeColor: 'bg-zinc-700/40 text-zinc-300 border-zinc-500/40',
    descriptionTh: 'ทำลายหรือส่งการ์ดที่ถูกกำจัดออกจากสนามไปยัง Discard Pile (สุสานการ์ด)',
    descriptionEn: 'To send a card from play to its player\'s discard pile.',
    ruleExplanationTh: 'เกิดขึ้นเมื่อตัวละครได้รับความเสียหายเท่ากับหรือมากกว่า Willpower หรือโดนเอฟเฟกต์สั่ง Banish',
  },
  Exert: {
    id: 'exert',
    name: 'Exert / Exerted',
    thaiName: 'แตะหมุนการ์ดใช้งาน',
    badgeColor: 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40',
    descriptionTh: 'หมุนการ์ดแนวนอนเพื่อแสดงว่าถูกใช้งานแล้ว (ทำ Quest, Challenge, ร้องเพลง หรือใช้ Ability)',
    descriptionEn: 'Turn a card sideways to pay a cost, quest, challenge, or activate an ability.',
    ruleExplanationTh: 'การ์ดที่อยู่ในสถานะ Exerted สามารถตกเป็นเป้าหมายการ Challenge ของฝ่ายตรงข้ามได้',
  },
  Ready: {
    id: 'ready',
    name: 'Ready',
    thaiName: 'ฟื้นฟูพร้อมใช้งาน',
    badgeColor: 'bg-teal-600/30 text-teal-300 border-teal-500/40',
    descriptionTh: 'หมุนการ์ดกลับสู่แนวตั้งในช่วงต้นเทิร์น เพื่อเตรียมพร้อมสำหรับการใช้งานรอบใหม่',
    descriptionEn: 'Turn an exerted card upright so it is ready to act again in the new turn.',
    ruleExplanationTh: 'การ์ดในสถานะ Ready จะปลอดภัยจากการถูก Challenge โดยตรง',
  },
  Inkwell: {
    id: 'inkwell',
    name: 'Inkwell',
    thaiName: 'บ่อหมึกพลังงาน',
    badgeColor: 'bg-violet-600/30 text-violet-300 border-violet-500/40',
    descriptionTh: 'พื้นที่วางการ์ดแบบคว่ำหน้าเพื่อใช้เป็นพลังงาน (Ink) ในการจ่าย Cost เพื่อเล่นการ์ดใบอื่น',
    descriptionEn: 'The area where you put cards facedown to generate Ink resources to pay costs.',
    ruleExplanationTh: 'คุณสามารถนำการ์ดที่มีสัญลักษณ์ Inkwell ใส่ลงบ่อหมึกได้เทิร์นละ 1 ใบ',
  },
  Lore: {
    id: 'lore',
    name: 'Lore',
    thaiName: 'แต้มแห่งตำนาน (ชัยชนะ)',
    badgeColor: 'bg-amber-500/30 text-amber-300 border-amber-400/40',
    descriptionTh: 'แต้มคะแนนชัยชนะของเกม Lorcana ผู้เล่นที่สะสมครบ 20 Lore ได้ก่อนจะเป็นผู้ชนะ',
    descriptionEn: 'The victory points of Lorcana. The first player to reach 20 Lore wins the game.',
    ruleExplanationTh: 'ได้รับจากการส่งตัวละครไปทำ Quest หรือผลของเอฟเฟกต์การ์ดบางใบ',
  },
  Quest: {
    id: 'quest',
    name: 'Quest',
    thaiName: 'ทำเควสต์สะสม Lore',
    badgeColor: 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40',
    descriptionTh: 'สั่งตัวละครที่ Ready หมุนเป็น Exerted เพื่อรับคะแนน Lore ตามจำนวนสัญลักษณ์ Lore บนการ์ด',
    descriptionEn: 'Exert a ready character to gain Lore equal to their Lore value.',
    ruleExplanationTh: 'เป็นวิธีหลักในการทำคะแนนเพื่อนำไปสู่ชัยชนะ',
  },
  Challenge: {
    id: 'challenge',
    name: 'Challenge',
    thaiName: 'ท้าดวลประลองกำลัง',
    badgeColor: 'bg-rose-500/30 text-rose-200 border-rose-400/40',
    descriptionTh: 'สั่งตัวละครที่ Ready หมุนเป็น Exerted เพื่อเข้าโจมตีตัวละครฝ่ายตรงข้ามที่อยู่ในสถานะ Exerted',
    descriptionEn: 'Exert a ready character to attack an opposing exerted character.',
    ruleExplanationTh: 'ทั้งสองฝ่ายจะสร้าง Damage ใส่ Willpower ของกันและกันพร้อมกันตามค่า Strength',
  },
};

export const getKeywordInfo = (word: string): LorcanaKeyword | null => {
  const cleanWord = word.trim().replace(/[^a-zA-Z]/g, '');
  for (const key of Object.keys(LORCANA_KEYWORDS)) {
    if (key.toLowerCase() === cleanWord.toLowerCase()) {
      return LORCANA_KEYWORDS[key];
    }
  }
  return null;
};
