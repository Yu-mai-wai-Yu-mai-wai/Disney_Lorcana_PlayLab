import { LORCANA_KEYWORDS, LorcanaKeyword } from '../data/lorcanaKeywords';

/**
 * Common Lorcana ability name translations and glosses
 */
const ABILITY_NAME_MAP: Record<string, string> = {
  // Core Keywords
  'bodyguard': 'Bodyguard (ผู้คุ้มกัน)',
  'rush': 'Rush (จู่โจมทันที)',
  'ward': 'Ward (ม่านคุ้มครอง)',
  'evasive': 'Evasive (หลบหลีกพริ้วไหว)',
  'support': 'Support (สนับสนุนพลัง)',
  'reckless': 'Reckless (มุทะลุ)',
  'singer': 'Singer (นักร้อง)',
  'sing together': 'Sing Together (รวมพลังร้องเพลง)',
  'shift': 'Shift (แปลงร่างสืบทอด)',
  'challenger': 'Challenger (ผู้ท้าชิง)',
  'resist': 'Resist (ต้านทานดาเมจ)',

  // Signature Set 1-7 Abilities
  'ohana': 'OHANA (ครอบครัวโอฮานา)',
  'loving heart': 'LOVING HEART (หัวใจเปี่ยมรัก)',
  'deep freeze': 'DEEP FREEZE (เยือกแข็งลึกซึ้ง)',
  'freeze': 'FREEZE (แช่แข็ง)',
  'adoring fans': 'ADORING FANS (แฟนคลับผู้คลั่งไคล้)',
  'rock the boat': 'ROCK THE BOAT (เขย่าเรือรบ)',
  'puny pirate!': 'PUNY PIRATE! (โจรสลัดกระจอก!)',
  'and two for tea!': 'AND TWO FOR TEA! (ชาสำหรับสองท่าน!)',
  'a wonderful dream': 'A WONDERFUL DREAM (ความฝันแสนวิเศษ)',
  'musical debut': 'MUSICAL DEBUT (เปิดตัวบทเพลง)',
  'sinister plot': 'SINISTER PLOT (แผนการชั่วร้าย)',
  'well of souls': 'WELL OF SOULS (บ่อกักวิญญาณ)',
  'loyal': 'LOYAL (ความภักดี)',
  'horse kick': 'HORSE KICK (ม้าดีดกะโหลก)',
  'we can fix it': 'WE CAN FIX IT (เราช่วยกันซ่อมได้)',
  'heroism': 'HEROISM (ความกล้าหาญแห่งวีรบุรุษ)',
  'gleam and glow': 'GLEAM AND GLOW (เปล่งประกายเรืองรอง)',
  'dragon fire': 'DRAGON FIRE (เพลิงมังกรผลาญ)',
  'dragon\'s fire': 'DRAGON\'S FIRE (ไฟมังกร)',
  'daring exploit': 'DARING EXPLOIT (วีรกรรมอาจหาญ)',
  'world reset': 'WORLD RESET (รีเซ็ตโลกใหม่)',
  'the sword that sings': 'THE SWORD THAT SINGS (ดาบขับขาน)',
  'student lore': 'STUDENT LORE (บทเรียนแห่งเวทมนตร์)',
  'just a harmless snake': 'JUST A HARMLESS SNAKE (แค่งูน้อยไร้พิษสง)',
  'power beyond measure': 'POWER BEYOND MEASURE (พลังไร้ขีดจำกัด)',
  'now i rule the ocean': 'NOW I RULE THE OCEAN (บัดนี้ข้าครองมหาสมุทร)',
  'i will find you': 'I WILL FIND YOU (ข้าจะตามหาเจ้าให้เจอ)',
  'be prepared': 'BE PREPARED (เตรียมพร้อมรับมือ)',
  'grab your sword': 'GRAB YOUR SWORD (ชักดาบขึ้นมา!)',
  'let it go': 'LET IT GO (ปล่อยมันไป)',
  'friends on the other side': 'FRIENDS ON THE OTHER SIDE (สหายจากโลกวิญญาณ)',
  'one jump ahead': 'ONE JUMP AHEAD (ก้าวล้ำหนึ่งก้าว)',
  'mother knows best': 'MOTHER KNOWS BEST (แม่รู้ดีที่สุด)',
  'part of your world': 'PART OF YOUR WORLD (ส่วนหนึ่งของโลกเธอ)',
  'stand together': 'STAND TOGETHER (ยืนหยัดเคียงข้าง)',
  'protect the realm': 'PROTECT THE REALM (ปกป้องอาณาจักร)',
  'healing touch': 'HEALING TOUCH (หัตถ์รักษา)',
  'tidal surge': 'TIDAL SURGE (คลื่นยักษ์โถมซัด)',
  'royal command': 'ROYAL COMMAND (บัญชาแห่งราชัน)',
  'smash': 'SMASH (ทุบทำลาย)',
  'fire the cannons!': 'FIRE THE CANNONS! (ยิงปืนใหญ่!)',
  'strength of a raging fire': 'STRENGTH OF A RAGING FIRE (ดั่งเพลิงเผาผลาญ)',
  'befuddle': 'BEFUDDLE (ทำให้สับสน)',
  'tangle': 'TANGLE (พันธนาการ)',
  'vicious betrayal': 'VICIOUS BETRAYAL (การทรยศอันโหดร้าย)',
  'stampede': 'STAMPEDE (ฝูงสัตว์แตกตื่น)',
  'cut to the chase': 'CUT TO THE CHASE (เข้าประเด็นทันที)',
  'fan the flames': 'FAN THE FLAMES (โหมกระพือไฟ)',
  'sudden chill': 'SUDDEN CHILL (เหน็บหนาวฉับพลัน)',
  'you have forgotten me': 'YOU HAVE FORGOTTEN ME (เจ้าลืมข้าไปแล้ว)',
  'develop your brain': 'DEVELOP YOUR BRAIN (พัฒนาสมอง)',
  'shield slam': 'SHIELD SLAM (กระแทกโล่)',
  'he\'s got a sword!': 'HE\'S GOT A SWORD! (เขามีดาว!)',
  'sorcerous recycling': 'SORCEROUS RECYCLING (เวทมนตร์รีไซเคิล)',
  'voiceless': 'VOICELESS (ไร้เสียงร้อง)',
  'so naughty': 'SO NAUGHTY (ซนเหลือร้าย)',
  'stealth mode': 'STEALTH MODE (โหมดลอบเร้น)',
  'tea party': 'TEA PARTY (งานเลี้ยงน้ำชา)',
  'steady gaze': 'STEADY GAZE (สายตาแน่วแน่)',
  'teamwork': 'TEAMWORK (การทำงานเป็นทีม)',
  'a lot to learn': 'A LOT TO LEARN (ยังมีสิ่งที่ต้องเรียนรู้อีกมาก)',
  'full quiver': 'FULL QUIVER (ซองธนูเต็มเปี่ยม)',
  'steady aim': 'STEADY AIM (เล็งเป้าแม่นยำ)',
  'stealing in': 'STEALING IN (ย่องเข้าประชิด)',
};

/**
 * Resolves ability name and text, extracting real keyword names from generic 'ABILITY'
 * placeholders and stripping redundant leading titles from the text.
 */
export function resolveAbility(rawName?: string, rawText?: string): { name: string; text: string } {
  let name = (rawName || '').trim();
  let text = (rawText || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

  if (!name || /^ability$/i.test(name)) {
    const kwMatch = text.match(/^(Bodyguard|Rush|Ward|Evasive|Support|Reckless|Shift\s+\d+|Singer\s+\d+|Sing Together\s+\d+|Challenger\s+\+?\d+|Resist\s+\+?\d+)/i);
    if (kwMatch) {
      name = kwMatch[1];
    } else {
      const capsMatch = text.match(/^([A-Z0-9\s!'?,-]{2,30}?)(?=\s+[A-Z][a-z]|\s+⟳|\s+—|\s+\{E\}|$)/);
      if (capsMatch && !/^(THIS|WHEN|WHENEVER|DURING|AT|WHILE|IF|EACH|YOU|DRAW|BANISH)/i.test(capsMatch[1])) {
        name = capsMatch[1].trim();
      } else {
        name = 'ความสามารถพิเศษ';
      }
    }
  }

  // Strip duplicate name prefix from text so it doesn't render twice
  if (name && name !== 'ความสามารถพิเศษ') {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp('^' + esc + '[:\\s]*', 'i'), '');
  }

  return { name, text };
}

/**
 * Translates Lorcana ability name into Thai with contextual naming
 */
export function translateAbilityName(name: string, text?: string, lang: 'th' | 'en' = 'th'): string {
  const resolved = resolveAbility(name, text);
  if (lang === 'en') return resolved.name || name || '';
  const cleanKey = resolved.name.trim().toLowerCase();

  // Keyword check first (e.g. "Shift 5" -> "Shift 5 (แปลงร่างสืบทอด)")
  if (/^shift\s+\d+/i.test(cleanKey)) {
    return `${resolved.name} (แปลงร่างสืบทอด)`;
  }
  if (/^singer\s+\d+/i.test(cleanKey)) {
    return `${resolved.name} (นักร้อง)`;
  }
  if (/^sing together\s+\d+/i.test(cleanKey)) {
    return `${resolved.name} (รวมพลังร้องเพลง)`;
  }
  if (/^challenger\s+\+?\d+/i.test(cleanKey)) {
    return `${resolved.name} (ผู้ท้าชิงบวกพลัง)`;
  }
  if (/^resist\s+\+?\d+/i.test(cleanKey)) {
    return `${resolved.name} (ต้านทานดาเมจ)`;
  }

  if (ABILITY_NAME_MAP[cleanKey]) {
    return ABILITY_NAME_MAP[cleanKey];
  }

  return resolved.name;
}

/**
 * Translates Lorcana ability text into Thai while retaining English keywords,
 * game terms, symbols, and numbers.
 */
export function translateCardAbilityText(rawText: string, rawName?: string, lang: 'th' | 'en' = 'th'): string {
  if (!rawText) return '';

  const resolved = resolveAbility(rawName, rawText);
  if (lang === 'en') return resolved.text;

  let text = resolved.text;

  // 1. Exact Reminder Text & Keyword Full Parentheses (Must run first before word-level replacements)
  const reminderMap: [RegExp, string][] = [
    [/\(?This character may enter play exerted\. An opposing character who challenges one of your characters must choose one with Bodyguard if able\.\)?/gi, '(สามารถลงสู่สนามในสถานะ Exerted ได้ และตัวละครฝ่ายตรงข้ามที่ต้องการ Challenge ตัวละครของคุณจะต้องเลือกตัวละครที่มี Bodyguard ก่อนหากทำได้)'],
    [/\(?This character can challenge the turn they are played\.\)?/gi, '(สามารถทำการ Challenge ได้ทันทีในเทิร์นที่ลงสู่สนาม)'],
    [/\(?Opponents can't choose this character for actions or abilities except to challenge\.\)?/gi, '(คู่แข่งไม่สามารถเลือกตัวละครนี้เป็นเป้าหมายของ Action หรือ Ability ได้ ยกเว้นการ Challenge)'],
    [/\(?Only characters with Evasive can challenge this character\.\)?/gi, '(เฉพาะตัวละครที่มี Evasive เท่านั้นที่สามารถ Challenge ตัวละครนี้ได้)'],
    [/\(?Whenever this character quests, you may add their [¤{S}] to another chosen character's [¤{S}] this turn\.\)?/gi, '(เมื่อตัวละครนี้ทำ Quest สามารถนำ Strength ของตัวละครนี้ไปเพิ่มให้กับตัวละครอื่นที่เลือกในเทิร์นนี้)'],
    [/\(?Whenever this character quests, you may add their Strength to another chosen character's Strength this turn\.\)?/gi, '(เมื่อตัวละครนี้ทำ Quest สามารถนำ Strength ของตัวละครนี้ไปเพิ่มให้กับตัวละครอื่นที่เลือกในเทิร์นนี้)'],
    [/\(?You may pay (\d+) ⬡ to play this on top of one of your characters named ([^)]+)\.\)?/gi, '(คุณสามารถจ่าย $1 ⬡ เพื่อเล่นการ์ดนี้ทับตัวละครชื่อ $2 ของคุณ)'],
    [/\(?This character counts as cost (\d+) to sing songs\.\)?/gi, '(ตัวละครนี้นับเป็น Cost $1 สำหรับการร้องเพลง)'],
    [/\(?While challenging, this character gets \+(\d+) [¤{S}]\.\)?/gi, '(ขณะทำการ Challenge ตัวละครนี้จะได้รับ Strength +$1)'],
    [/\(?Damage dealt to this character is reduced by (\d+)\.\)?/gi, '(ความเสียหายทั้งหมดที่ตัวละครนี้จะได้รับจะถูกลดทอนลง $1 หน่วย)'],
    [/\(?This character can't quest and must challenge each turn if able\.\)?/gi, '(ตัวละครนี้ไม่สามารถทำ Quest ได้ และต้องทำการ Challenge ในแต่ละเทิร์นหากทำได้)'],
    [/\(?Any number of your or your teammates' characters with total cost (\d+) or more may ⟳ to sing this song for free\.\)?/gi, '(คุณหรือเพื่อนร่วมทีมสามารถรวม Cost ของตัวละครเท่ากับ $1 หรือมากกว่าเพื่อร้องเพลงนี้ฟรี)'],
    [/\(?Any number of your or your teammates' characters with total cost (\d+) or more may \{E\} to sing this song for free\.\)?/gi, '(คุณหรือเพื่อนร่วมทีมสามารถรวม Cost ของตัวละครเท่ากับ $1 หรือมากกว่าเพื่อร้องเพลงนี้ฟรี)'],
  ];

  for (const [pattern, rep] of reminderMap) {
    text = text.replace(pattern, rep);
  }

  // Ordered dictionary for patterns (specific complex clauses -> simple fragments)
  const phraseMap: [RegExp, string][] = [
    // -------------------------------------------------------------
    // 1. Compound Conditional Triggers & Subtype Specific Actions
    // -------------------------------------------------------------
    [/When you play this character, you may remove up to (\d+) damage from each of your ([A-Za-z]+) characters\./gi, 'เมื่อคุณเล่นตัวละครนี้ คุณสามารถลบ Damage สูงสุด $1 หน่วยออกจากตัวละคร $2 ของคุณทุกตัว'],
    [/When you play this character, you may remove up to (\d+) damage from each of your characters\./gi, 'เมื่อคุณเล่นตัวละครนี้ คุณสามารถลบ Damage สูงสุด $1 หน่วยออกจากตัวละครของคุณทุกตัว'],
    [/When you play this character, you may remove up to (\d+) damage from chosen character\./gi, 'เมื่อคุณเล่นตัวละครนี้ คุณสามารถลบ Damage สูงสุด $1 หน่วยออกจากตัวละครที่เลือก'],
    [/When you play this character, remove up to (\d+) damage from one of your characters\. Draw a card for each (\d+) damage removed this way\./gi, 'เมื่อคุณเล่นตัวละครนี้ ลบ Damage สูงสุด $1 หน่วยออกจากตัวละครของคุณ 1 ตัว และจั่วการ์ด 1 ใบสำหรับทุก $2 Damage ที่ลบออกไปด้วยวิธีนี้'],
    [/When you play this character, remove up to (\d+) damage from chosen character\./gi, 'เมื่อคุณเล่นตัวละครนี้ ลบ Damage สูงสุด $1 หน่วยออกจากตัวละครที่เลือก'],
    [/When you play this character, look at the top (\d+) cards of your deck\. You may reveal a ([A-Za-z]+) card and put it into your hand\. Put the rest on the bottom of your deck in any order\./gi, 'เมื่อคุณเล่นตัวละครนี้ ดูการ์ด $1 ใบบนสุดของกองการ์ด คุณสามารถเปิดเผยการ์ด $2 1 ใบแล้วนำขึ้นมือ ส่วนที่เหลือให้นำวางใต้กองการ์ดตามลำดับใดก็ได้'],
    [/When you play this character, return a character card from your discard to your hand\./gi, 'เมื่อคุณเล่นตัวละครนี้ นำการ์ดตัวละคร 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือของคุณ'],
    [/When you play this character, chosen character gets ([+-]\d+) [¤{S}] this turn\./gi, 'เมื่อคุณเล่นตัวละครนี้ ตัวละครที่เลือกได้รับ Strength $1 ในเทิร์นนี้'],
    [/When you play this character, chosen character gets ([+-]\d+) strength this turn\./gi, 'เมื่อคุณเล่นตัวละครนี้ ตัวละครที่เลือกได้รับ Strength $1 ในเทิร์นนี้'],
    [/When you play this character, each opponent puts the top card of their deck into their inkwell facedown and exerted\./gi, 'เมื่อคุณเล่นตัวละครนี้ คู่แข่งทุกคนนำการ์ดใบบนสุดของกองการ์ดใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/If you have a character named ([^,.]+) in play, you pay (\d+) ⬡ less to play this character\./gi, 'หากคุณมีตัวละครชื่อ $1 ในสนาม คุณจะจ่าย Cost น้อยลง $2 ⬡ ในการเล่นตัวละครนี้'],
    [/This character gets \+(\d+) [◊{L}] for each other ([A-Za-z]+) character you have in play\./gi, 'ตัวละครนี้ได้รับ +$1 Lore สำหรับตัวละคร $2 ตัวอื่นแต่ละตัวที่คุณมีในสนาม'],
    [/This character gets \+(\d+) [¤{S}] for each other ([A-Za-z]+) character you have in play\./gi, 'ตัวละครนี้ได้รับ +$1 Strength สำหรับตัวละคร $2 ตัวอื่นแต่ละตัวที่คุณมีในสนาม'],
    [/This character can't ⟳ to sing songs\./gi, 'ตัวละครนี้ไม่สามารถ Exert (⟳) เพื่อร้องเพลงได้'],
    [/This character can't \{E\} to sing songs\./gi, 'ตัวละครนี้ไม่สามารถ Exert เพื่อร้องเพลงได้'],
    [/Whenever this character quests, you may ready your other ([A-Za-z]+) characters\. They can't quest for the rest of this turn\./gi, 'ทุกครั้งที่ตัวละครนี้ทำ Quest คุณสามารถ Ready ตัวละคร $1 ตัวอื่นของคุณได้ (พวกเขาจะไม่สามารถทำ Quest ได้ตลอดช่วงที่เหลือของเทิร์นนี้)'],
    [/When this character challenges and is banished, you may banish the challenged character\./gi, 'เมื่อตัวละครนี้ทำการ Challenge แล้วถูก Banish คุณสามารถ Banish ตัวละครเป้าหมายที่ถูก Challenge ได้'],
    [/Whenever this character is challenged, you may draw a card\./gi, 'ทุกครั้งที่ตัวละครนี้ถูก Challenge คุณสามารถจั่วการ์ด 1 ใบ'],
    [/While you have no cards in your hand, characters with cost (\d+) or less can't challenge this character\./gi, 'ในขณะที่คุณไม่มีการ์ดบนมือ ตัวละครที่มี Cost ไม่เกิน $1 จะไม่สามารถ Challenge ตัวละครนี้ได้'],
    [/For each character you have here, you pay (\d+) ⬡ less for the first action you play each turn\./gi, 'สำหรับตัวละครแต่ละตัวของคุณที่อยู่ที่นี่ คุณจะจ่ายน้อยลง $1 ⬡ สำหรับการ์ด Action ใบแรกที่คุณเล่นในแต่ละเทิร์น'],
    [/Whenever you play a second action in a turn, gain (\d+) lore\./gi, 'ทุกครั้งที่คุณเล่นการ์ด Action ใบที่ 2 ในเทิร์นเดียวกัน ได้รับ $1 Lore'],
    [/Whenever one of your actions deals damage to an opposing character, deal (\d+) damage to that character\./gi, 'ทุกครั้งที่ Action ของคุณสร้าง Damage ให้กับตัวละครฝ่ายตรงข้าม สร้างเพิ่มอีก $1 Damage ให้กับตัวละครนั้น'],
    [/⟳ — Remove up to (\d+) damage from chosen ([A-Za-z]+) character\./gi, '⟳ (Exert) — ลบ Damage สูงสุด $1 หน่วยออกจากตัวละคร $2 ที่เลือก'],
    [/\{E\} — Remove up to (\d+) damage from chosen ([A-Za-z]+) character\./gi, 'หมุน Exert — ลบ Damage สูงสุด $1 หน่วยออกจากตัวละคร $2 ที่เลือก'],
    [/At the start of your turn, if this card is in your discard, you may choose and discard a card with ([^ ]+) to play this character for free and he enters play exerted\./gi, 'เมื่อเริ่มต้นเทิร์นของคุณ หากการ์ดใบนี้อยู่ในสุสาน (Discard Pile) คุณสามารถเลือกทิ้งการ์ดที่มี $1 เพื่อเล่นตัวละครนี้ฟรี โดยจะลงสู่สนามในสถานะ Exerted'],
    [/When you play this character, if you have a character with Evasive in play, you may return chosen character, item, or location with cost (\d+) or less to their player's hand\./gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครที่มี Evasive ในสนาม คุณสามารถนำตัวละคร, ไอเทม หรือสถานที่ที่เลือกที่มี Cost ไม่เกิน $1 กลับขึ้นมือของผู้เล่น'],
    [/When you play this character, you may return an action card named ([^.]+) from your discard to your hand\./gi, 'เมื่อคุณเล่นตัวละครนี้ คุณสามารถนำการ์ดแอ็กชันชื่อ $1 จากสุสาน (Discard Pile) กลับขึ้นมือ'],

    [/When you play this character and whenever they quest,/gi, 'เมื่อคุณเล่นตัวละครนี้ และทุกครั้งที่ทำ Quest,'],
    [/When you play this character and whenever this character quests,/gi, 'เมื่อคุณเล่นตัวละครนี้ และทุกครั้งที่ตัวละครนี้ทำ Quest,'],
    [/When you play this character, if you have 2 or more other characters in play, you may draw 2 cards\./gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครอื่นในสนามตั้งแต่ 2 ตัวขึ้นไป คุณสามารถจั่วการ์ด 2 ใบ'],
    [/When you play this character, if you have 2 or more other characters in play,/gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครอื่นในสนามตั้งแต่ 2 ตัวขึ้นไป,'],
    [/When you play this character, if you have another character in play,/gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครอื่นในสนาม,'],
    [/When you play this character, if you have an item in play,/gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีไอเทมในสนาม,'],
    [/When you play this character, if you have a character named ([^,.]+) in play,/gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครชื่อ $1 ในสนาม,'],
    [/When you play this character, if you have a character named ([^,.]+) in play/gi, 'เมื่อคุณเล่นตัวละครนี้ หากคุณมีตัวละครชื่อ $1 ในสนาม'],
    [/if you have a character named ([^,.]+) in play,/gi, 'หากคุณมีตัวละครชื่อ $1 ในสนาม,'],
    [/if you have a character named ([^,.]+) in play/gi, 'หากคุณมีตัวละครชื่อ $1 ในสนาม'],
    [/if you have a character named ([^,.]+),/gi, 'หากคุณมีตัวละครชื่อ $1,'],
    [/During your turn, whenever this character banishes another character in a challenge, you may/gi, 'ในระหว่างเทิร์นของคุณ ทุกครั้งที่ตัวละครนี้ Banish ตัวละครอื่นในการ Challenge คุณสามารถ'],
    [/During your turn, whenever this character banishes another character in a challenge,/gi, 'ในระหว่างเทิร์นของคุณ ทุกครั้งที่ตัวละครนี้ Banish ตัวละครอื่นในการ Challenge,'],
    [/During your turn, whenever this character banishes another character in challenge,/gi, 'ในระหว่างเทิร์นของคุณ ทุกครั้งที่ตัวละครนี้ Banish ตัวละครอื่นในการ Challenge,'],
    [/Whenever one of your characters is banished in a challenge, you may/gi, 'ทุกครั้งที่ตัวละครของคุณตัวใดตัวหนึ่งถูก Banish ในการ Challenge คุณสามารถ'],
    [/Whenever one of your characters is banished in a challenge,/gi, 'ทุกครั้งที่ตัวละครของคุณตัวใดตัวหนึ่งถูก Banish ในการ Challenge,'],
    [/Whenever one of your Broom characters is banished in challenge, you may return that card to your hand\./gi, 'ทุกครั้งที่ตัวละคร Broom ของคุณถูก Banish ในการ Challenge คุณสามารถนำการ์ดใบนั้นกลับขึ้นมือ'],
    [/Whenever one of your other characters is banished,/gi, 'ทุกครั้งที่ตัวละครตัวอื่นของคุณถูก Banish,'],
    [/Whenever one of your characters is banished,/gi, 'ทุกครั้งที่ตัวละครของคุณถูก Banish,'],
    [/Whenever an opposing character is banished in a challenge,/gi, 'ทุกครั้งที่ตัวละครฝ่ายตรงข้ามถูก Banish ในการ Challenge,'],
    [/Whenever an opposing character is banished,/gi, 'ทุกครั้งที่ตัวละครฝ่ายตรงข้ามถูก Banish,'],
    [/Whenever this character banishes another character in a challenge,/gi, 'ทุกครั้งที่ตัวละครนี้ Banish ตัวละครอื่นในการ Challenge,'],
    [/Whenever this character banishes another character in challenge,/gi, 'ทุกครั้งที่ตัวละครนี้ Banish ตัวละครอื่นในการ Challenge,'],
    [/Evasive/gi, 'Evasive (เฉพาะตัวละครที่มี Evasive เท่านั้นที่ Challenge ตัวละครนี้ได้)'],
    [/Rush/gi, 'Rush (สามารถ Challenge ได้ทันทีในเทิร์นที่ลงสู่สนาม)'],
    [/Ward/gi, 'Ward (คู่แข่งไม่สามารถเลือกตัวละครนี้เป็นเป้าหมายของ Action หรือ Ability ได้)'],
    [/Reckless/gi, 'Reckless (ไม่สามารถทำ Quest ได้ และต้อง Challenge หากทำได้)'],
    [/Resist (\+?\d+)/gi, 'Resist +$1 (ลดทอนความเสียหายทั้งหมดที่ได้รับลง $1 หน่วย)'],
    [/Challenger (\+?\d+)/gi, 'Challenger +$1 (ได้รับ Strength +$1 ขณะทำการ Challenge)'],

    // -------------------------------------------------------------
    // 4. Exert, Ready, Stun, Action Costs
    // -------------------------------------------------------------
    [/\{E\}, (\d+) ⬡ —/gi, 'หมุน Exert และจ่าย $1 ⬡ —'],
    [/\{E\} —/gi, 'หมุน Exert —'],
    [/\{E\}, Banish this item —/gi, 'หมุน Exert และ Banish ไอเทมนี้ —'],
    [/\{E\}, Banish this character —/gi, 'หมุน Exert และ Banish ตัวละครนี้ —'],
    [/exert up to (\d+) chosen characters\./gi, 'Exert ตัวละครที่เลือกสูงสุด $1 ตัว'],
    [/exert up to (\d+) chosen opposing characters\./gi, 'Exert ตัวละครฝ่ายตรงข้ามที่เลือกสูงสุด $1 ตัว'],
    [/exert up to (\d+) chosen characters/gi, 'Exert ตัวละครที่เลือกสูงสุด $1 ตัว'],
    [/exert chosen opposing character/gi, 'Exert ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/exert chosen character/gi, 'Exert ตัวละครที่เลือก'],
    [/exert chosen item/gi, 'Exert ไอเทมที่เลือก'],
    [/exert them to/gi, 'Exert ตัวละครนั้นเพื่อ'],
    [/They can\'t ready at the start of their next turn\./gi, 'พวกเขาจะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไป'],
    [/They can\'t ready at the start of their next turn/gi, 'พวกเขาจะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไป'],
    [/The chosen character doesn\'t ready at the start of their next turn\./gi, 'ตัวละครที่เลือกจะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไปของพวกเขา'],
    [/The chosen character doesn\'t ready at the start of their next turn/gi, 'ตัวละครที่เลือกจะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไปของพวกเขา'],
    [/this character doesn\'t ready at the start of your next turn/gi, 'ตัวละครนี้จะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไปของคุณ'],
    [/can\'t ready at the start of their next turn/gi, 'ไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไป'],
    [/ready this character/gi, 'Ready ตัวละครนี้'],
    [/ready chosen character/gi, 'Ready ตัวละครที่เลือก'],
    [/ready chosen item/gi, 'Ready ไอเทมที่เลือก'],
    [/ready all of your characters/gi, 'Ready ตัวละครของคุณทั้งหมด'],
    [/can challenge ready characters this turn/gi, 'สามารถ Challenge ตัวละครที่อยู่ในสถานะ Ready ได้ในเทิร์นนี้'],
    [/can challenge ready characters/gi, 'สามารถ Challenge ตัวละครที่อยู่ในสถานะ Ready ได้'],
    [/can\'t challenge during their next turn/gi, 'ไม่สามารถ Challenge ได้ในเทิร์นถัดไป'],
    [/can\'t challenge this turn/gi, 'ไม่สามารถ Challenge ได้ในเทิร์นนี้'],
    [/can\'t quest during their next turn/gi, 'ไม่สามารถทำ Quest ได้ในเทิร์นถัดไป'],
    [/can\'t quest this turn/gi, 'ไม่สามารถทำ Quest ได้ในเทิร์นนี้'],
    [/can\'t quest for the rest of this turn/gi, 'ไม่สามารถทำ Quest ได้ตลอดช่วงที่เหลือของเทิร์นนี้'],
    [/can\'t challenge for the rest of this turn/gi, 'ไม่สามารถ Challenge ได้ตลอดช่วงที่เหลือของเทิร์นนี้'],
    [/can\'t quest/gi, 'ไม่สามารถทำ Quest ได้'],
    [/can\'t challenge/gi, 'ไม่สามารถ Challenge ได้'],

    // -------------------------------------------------------------
    // 5. Search, Deck Manipulation, Inkwell
    // -------------------------------------------------------------
    [/look at the top (\d+) cards of your deck/gi, 'ดูการ์ด $1 ใบบนสุดของกองการ์ดของคุณ'],
    [/look at the top card of your deck/gi, 'ดูการ์ดใบบนสุดของกองการ์ดของคุณ'],
    [/put one into your hand/gi, 'นำ 1 ใบขึ้นมือ'],
    [/put one of them into your hand/gi, 'นำ 1 ใบในนั้นขึ้นมือ'],
    [/put the rest on the bottom of your deck in any order/gi, 'นำส่วนที่เหลือวางใต้กองการ์ดของคุณตามลำดับใดก็ได้'],
    [/put the rest on the bottom of your deck/gi, 'นำส่วนที่เหลือวางใต้กองการ์ดของคุณ'],
    [/reveal the top card of your deck/gi, 'เปิดเผยการ์ดใบบนสุดของกองการ์ด'],
    [/if it\'s a character card,/gi, 'หากเป็นการ์ดตัวละคร,'],
    [/if it\'s an item card,/gi, 'หากเป็นการ์ดไอเทม,'],
    [/if it\'s an action card,/gi, 'หากเป็นการ์ดแอ็กชัน,'],
    [/if it\'s a song card,/gi, 'หากเป็นการ์ดเพลง,'],
    [/put it into your hand/gi, 'นำขึ้นมือของคุณ'],
    [/otherwise, put it on top of your deck/gi, 'มิฉะนั้น ให้นำวางไว้บนสุดของกองการ์ด'],
    [/otherwise, put it on the bottom of your deck/gi, 'มิฉะนั้น ให้นำวางไว้ใต้สุดของกองการ์ด'],
    [/shuffle your deck/gi, 'สับกองการ์ดของคุณ'],
    [/shuffle your discard into your deck/gi, 'สับสุสานการ์ด (Discard Pile) กลับเข้ากองการ์ด'],
    [/put into your inkwell facedown and exerted/gi, 'วางลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/put the top card of your deck into your inkwell facedown and exerted/gi, 'นำการ์ดใบบนสุดของกองการ์ดใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/you may put a card from your hand into your inkwell facedown and exerted/gi, 'คุณสามารถนำการ์ด 1 ใบจากบนมือใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/put chosen card from your discard into your inkwell facedown and exerted/gi, 'นำการ์ดที่เลือกจากสุสาน (Discard) ใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],

    // -------------------------------------------------------------
    // 6. Banishing, Removal, Damage & Healing
    // -------------------------------------------------------------
    [/deal (\d+) damage to each opposing character\./gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามทุกตัว'],
    [/deal (\d+) damage to each opposing character/gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามทุกตัว'],
    [/deal (\d+) damage to chosen opposing character\./gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/deal (\d+) damage to chosen opposing character/gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/deal (\d+) damage to all opposing characters\./gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามทั้งหมด'],
    [/deal (\d+) damage to all characters\./gi, 'สร้าง $1 Damage ให้กับตัวละครทั้งหมดในสนาม'],
    [/deal (\d+) damage to chosen character\./gi, 'สร้าง $1 Damage ให้กับตัวละครที่เลือก'],
    [/deal (\d+) damage to chosen character/gi, 'สร้าง $1 Damage ให้กับตัวละครที่เลือก'],
    [/deal (\d+) damage to this character/gi, 'สร้าง $1 Damage ให้กับตัวละครนี้'],
    [/deal damage to chosen character equal to this character\'s Strength/gi, 'สร้าง Damage ให้กับตัวละครที่เลือกเท่ากับค่า Strength ของตัวละครนี้'],
    [/damage dealt to this character is reduced by (\d+)/gi, 'ความเสียหายที่ตัวละครนี้จะได้รับจะถูกลดทอนลง $1 หน่วย'],
    [/remove up to (\d+) damage from chosen character/gi, 'ลบ Damage สูงสุด $1 หน่วยออกจากตัวละครที่เลือก'],
    [/remove all damage from chosen character/gi, 'ลบ Damage ทั้งหมดออกจากตัวละครที่เลือก'],
    [/remove all damage from this character/gi, 'ลบ Damage ทั้งหมดออกจากตัวละครนี้'],
    [/remove (\d+) damage from chosen character/gi, 'ลบ $1 Damage ออกจากตัวละครที่เลือก'],
    [/remove (\d+) damage from each of your characters/gi, 'ลบ $1 Damage ออกจากตัวละครของคุณทุกตัว'],
    [/remove (\d+) damage from this character/gi, 'ลบ $1 Damage ออกจากตัวละครนี้'],

    [/Banish chosen opposing character with (\d+) \{S\} or more\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือกที่มีค่า Strength ตั้งแต่ $1 ขึ้นไป'],
    [/Banish chosen opposing character with (\d+) \{S\} or less\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือกที่มีค่า Strength ไม่เกิน $1'],
    [/Banish chosen opposing character with (\d+) strength or more\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือกที่มีค่า Strength ตั้งแต่ $1 ขึ้นไป'],
    [/Banish chosen opposing character with (\d+) strength or less\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือกที่มีค่า Strength ไม่เกิน $1'],
    [/Banish chosen damaged opposing character\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่มี Damage ที่เลือก'],
    [/Banish chosen damaged character\./gi, 'Banish ตัวละครที่มี Damage ที่เลือก'],
    [/Banish chosen opposing character\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/Banish chosen opposing character/gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/Banish chosen character\./gi, 'Banish ตัวละครที่เลือก'],
    [/Banish chosen character/gi, 'Banish ตัวละครที่เลือก'],
    [/Banish all opposing characters\./gi, 'Banish ตัวละครฝ่ายตรงข้ามทั้งหมด'],
    [/Banish all characters\./gi, 'Banish ตัวละครทั้งหมดในสนาม'],
    [/Banish chosen opposing item\./gi, 'Banish ไอเทมฝ่ายตรงข้ามที่เลือก'],
    [/Banish chosen item\./gi, 'Banish ไอเทมที่เลือก'],
    [/Banish all items\./gi, 'Banish ไอเทมทั้งหมดในสนาม'],
    [/Banish chosen location\./gi, 'Banish Location ที่เลือก'],
    [/Banish this character\./gi, 'Banish ตัวละครนี้'],
    [/Banish this item\./gi, 'Banish ไอเทมนี้'],

    // -------------------------------------------------------------
    // 7. Hand, Draw, Discard, Return
    // -------------------------------------------------------------
    [/Each player discards their hand and draws (\d+) cards\./gi, 'ผู้เล่นทุกคนทิ้งการ์ดทั้งหมดบนมือ และจั่วการ์ดใหม่ $1 ใบ'],
    [/Each player discards their hand and draws (\d+) cards/gi, 'ผู้เล่นทุกคนทิ้งการ์ดทั้งหมดบนมือ และจั่วการ์ดใหม่ $1 ใบ'],
    [/Each player discards their hand/gi, 'ผู้เล่นทุกคนทิ้งการ์ดทั้งหมดบนมือ'],
    [/return another character to your hand to gain (\d+) extra lore\./gi, 'นำตัวละครอื่นของคุณกลับขึ้นมือเพื่อรับเพิ่มอีก $1 Lore'],
    [/return another character to your hand/gi, 'นำตัวละครอื่นของคุณกลับขึ้นมือ'],
    [/return chosen character to their player\'s hand/gi, 'นำตัวละครที่เลือกกลับขึ้นมือของผู้เล่น'],
    [/return chosen item to their player\'s hand/gi, 'นำไอเทมที่เลือกกลับขึ้นมือของผู้เล่น'],
    [/return this card to your hand/gi, 'นำการ์ดนี้กลับขึ้นมือของคุณ'],
    [/return that card to your hand/gi, 'นำการ์ดใบนั้นกลับขึ้นมือของคุณ'],
    [/return this character to your hand/gi, 'นำตัวละครนี้กลับขึ้นมือของคุณ'],
    [/return a character card from your discard to your hand/gi, 'นำการ์ดตัวละคร 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือ'],
    [/return an item card from your discard to your hand/gi, 'นำการ์ดไอเทม 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือ'],
    [/return an action card from your discard to your hand/gi, 'นำการ์ดแอ็กชัน 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือ'],
    [/return a card from your discard to your hand/gi, 'นำการ์ด 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือ'],

    [/draw a card/gi, 'จั่วการ์ด 1 ใบ'],
    [/draw (\d+) cards/gi, 'จั่วการ์ด $1 ใบ'],
    [/draw 2 cards/gi, 'จั่วการ์ด 2 ใบ'],
    [/draw 3 cards/gi, 'จั่วการ์ด 3 ใบ'],
    [/then choose and discard a card/gi, 'จากนั้นเลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/choose and discard a card/gi, 'เลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/discard a card/gi, 'ทิ้งการ์ดบนมือ 1 ใบ'],
    [/discard (\d+) cards/gi, 'ทิ้งการ์ดบนมือ $1 ใบ'],
    [/each player draws a card/gi, 'ผู้เล่นทุกคนจั่วการ์ด 1 ใบ'],
    [/each player draws (\d+) cards/gi, 'ผู้เล่นทุกคนจั่วการ์ด $1 ใบ'],
    [/each opponent chooses and discards a card/gi, 'คู่แข่งทุกคนเลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/each opponent discards a card/gi, 'คู่แข่งทุกคนทิ้งการ์ดบนมือ 1 ใบ'],
    [/chosen opponent chooses and discards a card/gi, 'คู่แข่งที่เลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/chosen opponent discards a card/gi, 'คู่แข่งที่เลือกทิ้งการ์ดบนมือ 1 ใบ'],

    // -------------------------------------------------------------
    // 8. Lore, Stat Modifiers & Buffs
    // -------------------------------------------------------------
    [/gain (\d+) lore and each opponent loses (\d+) lore\./gi, 'ได้รับ $1 Lore และคู่แข่งทุกคนเสีย $2 Lore'],
    [/gain (\d+) lore and each opponent loses (\d+) lore/gi, 'ได้รับ $1 Lore และคู่แข่งทุกคนเสีย $2 Lore'],
    [/gain (\d+) lore/gi, 'ได้รับ $1 Lore'],
    [/gains (\d+) lore/gi, 'ได้รับ $1 Lore'],
    [/you gain (\d+) lore/gi, 'คุณได้รับ $1 Lore'],
    [/gain 2 extra lore/gi, 'ได้รับเพิ่มอีก 2 Lore'],
    [/gain (\d+) extra lore/gi, 'ได้รับเพิ่มอีก $1 Lore'],
    [/gain lore equal to the Lore value of chosen character/gi, 'ได้รับ Lore เท่ากับค่า Lore ของตัวละครที่เลือก'],
    [/gain lore equal to the damage on chosen character/gi, 'ได้รับ Lore เท่ากับค่า Damage บนตัวละครที่เลือก'],
    [/each opponent loses (\d+) lore/gi, 'คู่แข่งทุกคนเสีย $1 Lore'],
    [/chosen opponent loses (\d+) lore/gi, 'คู่แข่งที่เลือกเสีย $1 Lore'],

    [/gets \+(\d+) \{S\}/gi, 'ได้รับ +$1 Strength'],
    [/gets \+(\d+) strength/gi, 'ได้รับ +$1 Strength'],
    [/gets \+(\d+) \{W\}/gi, 'ได้รับ +$1 Willpower'],
    [/gets \+(\d+) willpower/gi, 'ได้รับ +$1 Willpower'],
    [/gets \+(\d+) \{L\}/gi, 'ได้รับ +$1 Lore'],
    [/gets \+(\d+) lore/gi, 'ได้รับ +$1 Lore'],
    [/gets \-(\d+) \{S\}/gi, 'Strength ลดลง -$1'],
    [/gets \-(\d+) strength/gi, 'Strength ลดลง -$1'],
    [/gets \-(\d+) \{W\}/gi, 'Willpower ลดลง -$1'],
    [/gets \-(\d+) willpower/gi, 'Willpower ลดลง -$1'],
    [/gets \-(\d+) \{L\}/gi, 'Lore ลดลง -$1'],
    [/gets \-(\d+) lore/gi, 'Lore ลดลง -$1'],

    [/gains Evasive this turn/gi, 'ได้รับความสามารถ Evasive ในเทิร์นนี้'],
    [/gains Rush this turn/gi, 'ได้รับความสามารถ Rush ในเทิร์นนี้'],
    [/gains Ward this turn/gi, 'ได้รับความสามารถ Ward ในเทิร์นนี้'],
    [/gains Bodyguard this turn/gi, 'ได้รับความสามารถ Bodyguard ในเทิร์นนี้'],
    [/gains Support this turn/gi, 'ได้รับความสามารถ Support ในเทิร์นนี้'],
    [/gains Challenger \+(\d+) this turn/gi, 'ได้รับความสามารถ Challenger +$1 ในเทิร์นนี้'],
    [/gains Resist \+(\d+) this turn/gi, 'ได้รับความสามารถ Resist +$1 ในเทิร์นนี้'],
    [/gains Reckless this turn/gi, 'ได้รับความสามารถ Reckless ในเทิร์นนี้'],
    [/gains Singer (\d+) this turn/gi, 'ได้รับความสามารถ Singer $1 ในเทิร์นนี้'],

    // -------------------------------------------------------------
    // 9. Cost Reductions & Locations
    // -------------------------------------------------------------
    [/you pay (\d+) ⬡ less/gi, 'คุณจ่ายค่าร่ายน้อยลง $1 ⬡'],
    [/you pay (\d+) less/gi, 'คุณจ่ายค่าร่ายน้อยลง $1'],
    [/costs (\d+) less to play/gi, 'มีค่าร่ายลดลง $1'],
    [/cost (\d+) less to play/gi, 'มีค่าร่ายลดลง $1'],
    [/costs 1 less to play/gi, 'มีค่าร่ายลดลง 1'],
    [/for each damaged character in play/gi, 'สำหรับตัวละครที่มี Damage แต่ละตัวในสนาม'],
    [/for each other character you have in play/gi, 'สำหรับตัวละครตัวอื่นของคุณแต่ละตัวในสนาม'],
    [/for each item you have in play/gi, 'สำหรับไอเทมแต่ละชิ้นของคุณในสนาม'],
    [/for each song in your discard/gi, 'สำหรับเพลงแต่ละใบในสุสานของคุณ'],
    [/for each card in your hand/gi, 'สำหรับแต่ละการ์ดบนมือของคุณ'],
    [/for each lore you have/gi, 'สำหรับแต่ละ Lore ที่คุณมี'],
    [/move chosen character to a location for free/gi, 'ย้ายตัวละครที่เลือกไปยัง Location ฟรี (ไม่ต้องจ่าย Move Cost)'],
    [/move this character to a location for free/gi, 'ย้ายตัวละครนี้ไปยัง Location ฟรี (ไม่ต้องจ่าย Move Cost)'],
    [/move chosen character to a location/gi, 'ย้ายตัวละครที่เลือกไปยัง Location'],
    [/move this character to a location/gi, 'ย้ายตัวละครนี้ไปยัง Location'],

    // -------------------------------------------------------------
    // 10. General Game Terminology
    // -------------------------------------------------------------
    [/opposing character/gi, 'ตัวละครฝ่ายตรงข้าม'],
    [/opposing characters/gi, 'ตัวละครฝ่ายตรงข้ามทั้งหมด'],
    [/choose an opposing character/gi, 'เลือกตัวละครฝ่ายตรงข้าม 1 ตัว'],
    [/chosen opposing character/gi, 'ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/chosen character/gi, 'ตัวละครที่เลือก'],
    [/your other characters/gi, 'ตัวละครตัวอื่นของคุณ'],
    [/this character/gi, 'ตัวละครนี้'],
    [/another character/gi, 'ตัวละครตัวอื่น'],
    [/this turn/gi, 'ในเทิร์นนี้'],
    [/next turn/gi, 'ในเทิร์นถัดไป'],
    [/for the rest of the turn/gi, 'จนจบเทิร์น'],
    [/for the rest of this turn/gi, 'ตลอดช่วงที่เหลือของเทิร์นนี้'],
    [/to play/gi, 'ในการเล่น'],
    [/in play/gi, 'ในสนาม'],
    [/enters play exerted/gi, 'ลงสู่สนามในสถานะ Exerted'],
    [/enters play dry/gi, 'ลงสู่สนามพร้อมใช้งานทันที'],
  ];

  for (const [pattern, replacement] of phraseMap) {
    text = text.replace(pattern, replacement);
  }

  // FINAL PASS: catch-all cleanup — translate any remaining common game words
  // so no significant English fragments are left (per product request).
  const catchAllMap: [RegExp, string][] = [
    [/whenever/gi, 'ทุกครั้งที่'],
    [/whenever this character quests/gi, 'ทุกครั้งที่ตัวละครนี้ทำ Quest'],
    [/when you play this character/gi, 'เมื่อคุณเล่นตัวละครนี้'],
    [/at the start of your turn/gi, 'เมื่อเริ่มต้นเทิร์นของคุณ'],
    [/at the end of your turn/gi, 'เมื่อจบเทิร์นของคุณ'],
    [/during your turn/gi, 'ในระหว่างเทิร์นของคุณ'],
    [/each turn/gi, 'ทุกเทิร์น'],
    [/your characters/gi, 'ตัวละครของคุณ'],
    [/your opponent('s)? characters/gi, 'ตัวละครของคู่แข่ง'],
    [/all opponents?/gi, 'คู่แข่งทุกคน'],
    [/each player/gi, 'ผู้เล่นทุกคน'],
    [/chosen player/gi, 'ผู้เล่นที่เลือก'],
    [/a challenge/gi, 'การ Challenge'],
    [/challenge/gi, 'Challenge'],
    [/challenges/gi, 'ทำการ Challenge'],
    [/quest/gi, 'Quest'],
    [/quests/gi, 'ทำ Quest'],
    [/play this character/gi, 'เล่นตัวละครนี้'],
    [/play this card/gi, 'เล่นการ์ดนี้'],
    [/characters with cost/gi, 'ตัวละครที่มี Cost'],
    [/character with cost/gi, 'ตัวละครที่มี Cost'],
    [/with total cost/gi, 'ที่มี Cost รวม'],
    [/of yours/gi, 'ของคุณ'],
    [/you may/gi, 'คุณสามารถ'],
    [/you must/gi, 'คุณต้อง'],
    [/if able/gi, 'หากทำได้'],
    [/instead/gi, 'แทน'],
    [/then/gi, 'จากนั้น'],
    [/up to/gi, 'สูงสุด'],
    [/or more/gi, 'หรือมากกว่า'],
    [/or less/gi, 'หรือน้อยกว่า'],
    [/from your hand/gi, 'จากบนมือของคุณ'],
    [/from your deck/gi, 'จากกองการ์ดของคุณ'],
    [/from your discard/gi, 'จากสุสานการ์ดของคุณ'],
    [/into your hand/gi, 'ขึ้นมือของคุณ'],
    [/on the top of your deck/gi, 'บนสุดของกองการ์ด'],
    [/to your inkwell/gi, 'ลง Inkwell ของคุณ'],
    [/in any order/gi, 'ตามลำดับใดก็ได้'],
    [/facedown/gi, 'แบบคว่ำหน้า'],
    [/faceup/gi, 'แบบเปิดหน้า'],
    [/for free/gi, 'ฟรี'],
    [/this way/gi, 'ด้วยวิธีนี้'],
    [/equal to/gi, 'เท่ากับ'],
    [/another chosen character/gi, 'ตัวละครอื่นที่เลือก'],
    [/each of your/gi, 'ของคุณทุกตัว'],
    [/one of your/gi, '1 ใน'],
    [/your hand/gi, 'มือของคุณ'],
    [/your deck/gi, 'กองการ์ดของคุณ'],
    [/your discard/gi, 'สุสานการ์ดของคุณ'],
    [/the chosen/gi, 'สิ่งที่เลือก'],
    [/chosen action/gi, 'Action ที่เลือก'],
    [/an opposing/gi, 'ฝ่ายตรงข้าม 1'],
    [/opposing/gi, 'ฝ่ายตรงข้าม'],
    [/player's/gi, 'ของผู้เล่น'],
    [/players/gi, 'ผู้เล่น'],
    [/turn/gi, 'เทิร์น'],
    [/damage/gi, 'Damage'],
    [/character/gi, 'ตัวละคร'],
    [/card/gi, 'การ์ด'],
    [/hand/gi, 'มือ'],
    [/deck/gi, 'กองการ์ด'],
    [/discard/gi, 'สุสานการ์ด'],
    [/draws?/gi, 'จั่ว'],
    [/banished/gi, 'ถูก Banish'],
    [/banish/gi, 'Banish'],
    [/exerted/gi, 'ในสถานะ Exerted'],
    [/exert/gi, 'Exert'],
    [/ready/gi, 'Ready'],
    [/song/gi, 'เพลง'],
    [/songs/gi, 'เพลง'],
    [/sing/gi, 'ร้องเพลง'],
    [/singing/gi, 'การร้องเพลง'],
    [/item/gi, 'ไอเทม'],
    [/location/gi, 'Location'],
    [/action/gi, 'Action'],
    [/ability/gi, 'Ability'],
    [/abilities/gi, 'Abilities'],
    [/cost/gi, 'Cost'],
    [/strength/gi, 'Strength'],
    [/willpower/gi, 'Willpower'],
    [/lore/gi, 'Lore'],
    [/ink/gi, 'Ink'],
    [/inkwell/gi, 'Inkwell'],
    [/while/gi, 'ในขณะที่'],
    [/wherever/gi, 'ทุกที่ที่'],
    [/whenever/gi, 'ทุกครั้งที่'],
    [/whenever one/gi, 'ทุกครั้งที่หนึ่ง'],
    [/whenever you/gi, 'ทุกครั้งที่คุณ'],
    [/whenever a/gi, 'ทุกครั้งที่'],
    [/whenever an/gi, 'ทุกครั้งที่'],
    [/whenever they/gi, 'ทุกครั้งที่เขา'],
    [/whenever it/gi, 'ทุกครั้งที่มัน'],
    [/whenever this/gi, 'ทุกครั้งที่สิ่งนี้'],
    [/whenever your/gi, 'ทุกครั้งที่ของคุณ'],
    [/whenever chosen/gi, 'ทุกครั้งที่ตัวที่เลือก'],
    [/whenever one of your/gi, 'ทุกครั้งที่ของคุณ'],
    [/whenever one of/gi, 'ทุกครั้งที่หนึ่งใน'],
  ];

  for (const [pattern, replacement] of catchAllMap) {
    text = text.replace(pattern, replacement);
  }

  // Tidy double spaces or trailing punctuation artifacts if any
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Translates card type name (e.g. Character -> ตัวละคร (Character))
 */
export function translateCardType(type: string, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'en') return type;
  switch (type?.toLowerCase()) {
    case 'character':
      return 'ตัวละคร (Character)';
    case 'action':
      return 'แอ็กชัน (Action)';
    case 'item':
      return 'ไอเทม (Item)';
    case 'location':
      return 'สถานที่ (Location)';
    default:
      return type;
  }
}

/**
 * Translates card rarity (e.g. Legendary -> ตำนาน (Legendary))
 */
export function translateRarity(rarity: string, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'en') return rarity;
  switch (rarity?.toLowerCase()) {
    case 'common':
      return 'ทั่วไป (Common)';
    case 'uncommon':
      return 'ไม่ธรรมดา (Uncommon)';
    case 'rare':
      return 'หายาก (Rare)';
    case 'super rare':
      return 'หายากพิเศษ (Super Rare)';
    case 'epic':
      return 'เอปิก (Epic)';
    case 'legendary':
      return 'ระดับตำนาน (Legendary)';
    case 'enchanted':
      return 'มนตรา (Enchanted)';
    case 'iconic':
      return 'ไอคอนิก (Iconic)';
    case 'special':
      return 'พิเศษ (Special)';
    default:
      return rarity;
  }
}

/**
 * Translates ink color name
 */
export function translateInkColor(ink: string, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'en') return ink;
  switch (ink?.toLowerCase()) {
    case 'amber':
      return 'อำพัน (Amber)';
    case 'amethyst':
      return 'อเมทิสต์ (Amethyst)';
    case 'emerald':
      return 'มรกต (Emerald)';
    case 'ruby':
      return 'ทับทิม (Ruby)';
    case 'sapphire':
      return 'ไพลิน (Sapphire)';
    case 'steel':
      return 'เหล็กกล้า (Steel)';
    default:
      return ink;
  }
}

/**
 * Extracts relevant Lorcana keywords found within text or card abilities
 */
export function extractKeywordsFromText(text: string): LorcanaKeyword[] {
  if (!text) return [];
  const found: LorcanaKeyword[] = [];
  const lowerText = text.toLowerCase();

  for (const [key, keywordObj] of Object.entries(LORCANA_KEYWORDS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lowerText)) {
      if (!found.some(k => k.id === keywordObj.id)) {
        found.push(keywordObj);
      }
    }
  }

  return found;
}

