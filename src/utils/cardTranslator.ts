import { LORCANA_KEYWORDS, LorcanaKeyword } from '../data/lorcanaKeywords';

/**
 * Translates Lorcana ability text into Thai while retaining English keywords,
 * game terms, and numbers.
 */
export function translateCardAbilityText(text: string): string {
  if (!text) return '';

  let translated = text;

  // Replacement dictionary for common triggers, actions, and phrases
  const phraseMap: [RegExp, string][] = [
    // Triggers & Conditionals
    [/When you play this character and whenever they quest,/gi, 'เมื่อคุณเล่นตัวละครนี้ และทุกครั้งที่ทำ Quest,'],
    [/When you play this character and whenever this character quests,/gi, 'เมื่อคุณเล่นตัวละครนี้ และทุกครั้งที่ตัวละครนี้ทำ Quest,'],
    [/When you play this character, you may/gi, 'เมื่อคุณเล่นตัวละครนี้, คุณสามารถ'],
    [/When you play this character,/gi, 'เมื่อคุณเล่นตัวละครนี้,'],
    [/When you play this item, you may/gi, 'เมื่อคุณเล่นไอเทมนี้, คุณสามารถ'],
    [/When you play this item,/gi, 'เมื่อคุณเล่นไอเทมนี้,'],
    [/When you play this action, you may/gi, 'เมื่อคุณเล่นแอ็กชันนี้, คุณสามารถ'],
    [/When you play this action,/gi, 'เมื่อคุณเล่นแอ็กชันนี้,'],
    [/Whenever you play a song,/gi, 'ทุกครั้งที่คุณเล่นการ์ดเพลง (Song),'],
    [/Whenever you play an item,/gi, 'ทุกครั้งที่คุณเล่นการ์ดไอเทม (Item),'],
    [/Whenever you play a character,/gi, 'ทุกครั้งที่คุณเล่นการ์ดตัวละคร (Character),'],
    [/Whenever you play another character,/gi, 'ทุกครั้งที่คุณเล่นตัวละครตัวอื่น,'],
    [/Whenever this character quests, you may/gi, 'ทุกครั้งที่ตัวละครนี้ทำ Quest, คุณสามารถ'],
    [/Whenever this character quests,/gi, 'ทุกครั้งที่ตัวละครนี้ทำ Quest,'],
    [/Whenever this character challenges, you may/gi, 'ทุกครั้งที่ตัวละครนี้ทำ Challenge, คุณสามารถ'],
    [/Whenever this character challenges,/gi, 'ทุกครั้งที่ตัวละครนี้ทำ Challenge,'],
    [/Whenever this character is challenged,/gi, 'ทุกครั้งที่ตัวละครนี้ถูก Challenge,'],
    [/When this character is banished in a challenge,/gi, 'เมื่อตัวละครนี้ถูก Banish ในการ Challenge,'],
    [/When this character is banished, you may/gi, 'เมื่อตัวละครนี้ถูก Banish, คุณสามารถ'],
    [/When this character is banished,/gi, 'เมื่อตัวละครนี้ถูก Banish,'],
    [/Whenever one of your other characters is banished,/gi, 'ทุกครั้งที่ตัวละครตัวอื่นของคุณถูก Banish,'],
    [/Whenever one of your characters is banished,/gi, 'ทุกครั้งที่ตัวละครของคุณถูก Banish,'],
    [/At the start of your turn, you may/gi, 'เมื่อเริ่มต้นเทิร์นของคุณ, คุณสามารถ'],
    [/At the start of your turn,/gi, 'เมื่อเริ่มต้นเทิร์นของคุณ,'],
    [/At the end of your turn, you may/gi, 'เมื่อสิ้นสุดเทิร์นของคุณ, คุณสามารถ'],
    [/At the end of your turn,/gi, 'เมื่อสิ้นสุดเทิร์นของคุณ,'],
    [/During your turn,/gi, 'ในระหว่างเทิร์นของคุณ,'],
    [/During your opponent\'s turn,/gi, 'ในระหว่างเทิร์นของคู่แข่ง,'],
    [/While challenging,/gi, 'ขณะกำลังทำการ Challenge,'],
    [/While this character is exerted,/gi, 'ในขณะที่ตัวละครนี้อยู่ในสถานะ Exerted,'],
    [/While this character has damage,/gi, 'ในขณะที่ตัวละครนี้มี Damage,'],
    [/If you have a character named ([^,.]+),/gi, 'หากคุณมีตัวละครชื่อ $1 ในสนาม,'],
    [/If you have another character in play,/gi, 'หากคุณมีตัวละครตัวอื่นในสนาม,'],

    // Specific Keyword Expansions with Capture Groups
    [/Sing Together (\d+)/gi, 'Sing Together $1 (สามารถรวม Cost ตัวละครหลายตัวช่วยร้องเพลงนี้ได้)'],
    [/Shift (\d+)/gi, 'Shift $1 (จ่าย $1 ⬡ เพื่อเล่นทับตัวละครชื่อเดียวกัน)'],
    [/Singer (\d+)/gi, 'Singer $1 (นับเป็น Cost $1 สำหรับร้องเพลง)'],
    [/Support/gi, 'Support (เมื่อทำ Quest มอบ Strength ให้เพื่อนร่วมทีม)'],
    [/Bodyguard/gi, 'Bodyguard (ลงสู่สนามแบบ Exerted ได้, ศัตรูต้อง Challenge ตัวนี้ก่อน)'],
    [/Evasive/gi, 'Evasive (เฉพาะตัวละครที่มี Evasive เท่านั้นที่ Challenge ตัวนี้ได้)'],
    [/Rush/gi, 'Rush (สามารถ Challenge ได้ทันทีในเทิร์นที่ลงสู่สนาม)'],
    [/Ward/gi, 'Ward (คู่แข่งไม่สามารถเลือกตัวละครนี้เป็นเป้าหมายของความสามารถได้)'],
    [/Reckless/gi, 'Reckless (ไม่สามารถทำ Quest ได้ และต้อง Challenge หากทำได้)'],
    [/Resist (\+?\d+)/gi, 'Resist +$1 (ลดทอนดาเมจที่ได้รับลง $1)'],
    [/Challenger (\+?\d+)/gi, 'Challenger +$1 (พลังโจมตี Strength +$1 ขณะ Challenge)'],

    // Search, Look, Reveal, Deck manipulation
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

    // Common Actions & Mechanics
    [/deal (\d+) damage to chosen opposing character/gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/deal (\d+) damage to each opposing character/gi, 'สร้าง $1 Damage ให้กับตัวละครฝ่ายตรงข้ามทุกตัว'],
    [/deal (\d+) damage to chosen character/gi, 'สร้าง $1 Damage ให้กับตัวละครที่เลือก'],
    [/deal (\d+) damage to this character/gi, 'สร้าง $1 Damage ให้กับตัวละครนี้'],
    [/damage dealt to this character is reduced by (\d+)/gi, 'ดาเมจที่ได้รับจะถูกลดทอนลง $1'],
    [/remove up to (\d+) damage from chosen character/gi, 'ฟื้นฟูลบ Damage สูงสุด $1 หน่วยออกจากตัวละครที่เลือก'],
    [/remove all damage from chosen character/gi, 'ลบ Damage ทั้งหมดออกจากตัวละครที่เลือก'],
    [/remove (\d+) damage from chosen character/gi, 'ลบ $1 Damage ออกจากตัวละครที่เลือก'],
    
    [/Banish chosen opposing character\./gi, 'Banish ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/Banish chosen character\./gi, 'Banish ตัวละครที่เลือก'],
    [/Banish chosen damaged character\./gi, 'Banish ตัวละครที่มี Damage ที่เลือก'],
    [/Banish chosen item\./gi, 'Banish ไอเทมที่เลือก'],
    [/Banish chosen opposing item\./gi, 'Banish ไอเทมฝ่ายตรงข้ามที่เลือก'],
    [/Banish this character\./gi, 'Banish ตัวละครนี้'],
    [/Banish this item\./gi, 'Banish ไอเทมนี้'],

    [/draw a card/gi, 'จั่วการ์ด 1 ใบ'],
    [/draw (\d+) cards/gi, 'จั่วการ์ด $1 ใบ'],
    [/draw 2 cards/gi, 'จั่วการ์ด 2 ใบ'],
    [/draw 3 cards/gi, 'จั่วการ์ด 3 ใบ'],
    [/then choose and discard a card/gi, 'จากนั้นเลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/choose and discard a card/gi, 'เลือกทิ้งการ์ดบนมือ 1 ใบ'],
    [/each player draws a card/gi, 'ผู้เล่นทุกคนจั่วการ์ด 1 ใบ'],
    [/each opponent chooses and discards a card/gi, 'คู่แข่งทุกคนเลือกทิ้งการ์ดบนมือ 1 ใบ'],

    [/gain (\d+) lore/gi, 'ได้รับ $1 Lore'],
    [/gains (\d+) lore/gi, 'ได้รับ $1 Lore'],
    [/each opponent loses (\d+) lore/gi, 'คู่แข่งทุกคนเสีย $1 Lore'],
    [/chosen opponent loses (\d+) lore/gi, 'คู่แข่งที่เลือกเสีย $1 Lore'],

    [/ready this character/gi, 'Ready ตัวละครนี้'],
    [/ready chosen character/gi, 'Ready ตัวละครที่เลือก'],
    [/ready chosen item/gi, 'Ready ไอเทมที่เลือก'],
    [/exert chosen opposing character/gi, 'Exert ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/exert chosen character/gi, 'Exert ตัวละครที่เลือก'],
    [/they can\'t ready at the start of their next turn/gi, 'พวกเขาจะไม่สามารถ Ready ได้ในตอนเริ่มเทิร์นถัดไป'],
    [/can\'t challenge during their next turn/gi, 'ไม่สามารถ Challenge ได้ในเทิร์นถัดไป'],
    [/can challenge ready characters/gi, 'สามารถ Challenge ตัวละครที่อยู่ในสถานะ Ready ได้'],
    [/can\'t quest/gi, 'ไม่สามารถทำ Quest ได้'],
    [/can\'t challenge/gi, 'ไม่สามารถ Challenge ได้'],

    [/put into your inkwell facedown and exerted/gi, 'วางลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/put the top card of your deck into your inkwell facedown and exerted/gi, 'นำการ์ดใบบนสุดของกองการ์ดใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/you may put a card from your hand into your inkwell facedown and exerted/gi, 'คุณสามารถนำการ์ด 1 ใบจากบนมือใส่ลงใน Inkwell แบบคว่ำหน้าในสถานะ Exerted'],
    [/return chosen character to their player\'s hand/gi, 'นำตัวละครที่เลือกกลับขึ้นมือของผู้เล่น'],
    [/return chosen item to their player\'s hand/gi, 'นำไอเทมที่เลือกกลับขึ้นมือของผู้เล่น'],
    [/return a character card from your discard to your hand/gi, 'นำการ์ดตัวละคร 1 ใบจากสุสาน (Discard Pile) กลับขึ้นมือ'],

    [/gets \+(\d+) \{S\}/gi, 'ได้รับ +$1 Strength'],
    [/gets \+(\d+) strength/gi, 'ได้รับ +$1 Strength'],
    [/gets \+(\d+) \{W\}/gi, 'ได้รับ +$1 Willpower'],
    [/gets \+(\d+) willpower/gi, 'ได้รับ +$1 Willpower'],
    [/gets \-(\d+) \{S\}/gi, 'พลังโจมตีลดลง -$1 Strength'],
    [/gets \-(\d+) strength/gi, 'พลังโจมตีลดลง -$1 Strength'],
    [/gets \-(\d+) \{W\}/gi, 'พลังชีวิตลดลง -$1 Willpower'],
    [/gets \-(\d+) willpower/gi, 'พลังชีวิตลดลง -$1 Willpower'],
    [/gains Evasive this turn/gi, 'ได้รับความสามารถ Evasive ในเทิร์นนี้'],
    [/gains Rush this turn/gi, 'ได้รับความสามารถ Rush ในเทิร์นนี้'],
    [/gains Ward this turn/gi, 'ได้รับความสามารถ Ward ในเทิร์นนี้'],
    [/gains Bodyguard this turn/gi, 'ได้รับความสามารถ Bodyguard ในเทิร์นนี้'],
    [/gains Support this turn/gi, 'ได้รับความสามารถ Support ในเทิร์นนี้'],
    [/gains Challenger \+(\d+) this turn/gi, 'ได้รับความสามารถ Challenger +$1 ในเทิร์นนี้'],
    [/gains Resist \+(\d+) this turn/gi, 'ได้รับความสามารถ Resist +$1 ในเทิร์นนี้'],

    // Terms
    [/opposing character/gi, 'ตัวละครฝ่ายตรงข้าม'],
    [/opposing characters/gi, 'ตัวละครฝ่ายตรงข้ามทั้งหมด'],
    [/chosen character/gi, 'ตัวละครที่เลือก'],
    [/chosen opposing character/gi, 'ตัวละครฝ่ายตรงข้ามที่เลือก'],
    [/your other characters/gi, 'ตัวละครตัวอื่นของคุณ'],
    [/this turn/gi, 'ในเทิร์นนี้'],
    [/next turn/gi, 'ในเทิร์นถัดไป'],
    [/for the rest of the turn/gi, 'จนจบเทิร์น'],
    [/you pay (\d+) ⬡ less/gi, 'คุณจ่ายค่าร่ายน้อยลง $1 ⬡'],
    [/you pay (\d+) less/gi, 'คุณจ่ายค่าร่ายน้อยลง $1'],
    [/to play/gi, 'ในการเล่น'],
    [/for each/gi, 'สำหรับแต่ละ'],
    [/in play/gi, 'ในสนาม'],
    [/enters play exerted/gi, 'ลงสู่สนามในสถานะ Exerted'],
    [/enters play dry/gi, 'ลงสู่สนามพร้อมใช้งาน'],
  ];

  for (const [pattern, replacement] of phraseMap) {
    translated = translated.replace(pattern, replacement);
  }

  return translated;
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
