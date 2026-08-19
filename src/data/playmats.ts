export interface PlaymatSkin {
  id: string;
  name: string;
  nameTh: string;
  character: string;
  characterTh: string;
  series: string;
  inkColors: string[];
  previewImage: string;
  bgImage: string;
  accentColor: string;
  ambientGlow: string;
  tag: 'Official' | 'Exclusive' | 'Classic' | 'Special';
  description: string;
  descriptionTh: string;
}

export const PLAYMAT_SKINS: PlaymatSkin[] = [
  {
    id: 'illuminary-classic',
    name: 'The Great Illuminary',
    nameTh: 'หอสมุดเวทมนตร์แห่งอิลลูมินารี',
    character: 'Illumineer Lore Sanctuary',
    characterTh: 'วิหารบันทึกแห่งอิลลูมิเนียร์',
    series: 'Core Edition',
    inkColors: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'],
    previewImage: '/artworkdisey/landingPageBackground1.webp',
    bgImage: '/artworkdisey/landingPageBackground1.webp',
    accentColor: '#F59E0B',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.12) 0%, rgba(11, 15, 25, 0.85) 85%)',
    tag: 'Classic',
    description: 'The iconic sanctum of Lorcana where magical inks intertwine and create legendary story glimmers.',
    descriptionTh: 'วิหารใจกลางจักรวาล Lorcana ที่ซึ่งหมึกเวทมนตร์หล่อหลอมและให้กำเนิดเรื่องราวระดับตำนาน'
  },
  {
    id: 'stitch-rockstar',
    name: 'Stitch - Rock Star',
    nameTh: 'สติทช์ - ร็อกสตาร์',
    character: 'Stitch',
    characterTh: 'สติทช์ (ทดลอง 626)',
    series: 'The First Chapter',
    inkColors: ['Amber'],
    previewImage: '/artworkdisey/art4.webp',
    bgImage: '/artworkdisey/art4.webp',
    accentColor: '#F59E0B',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.18) 0%, rgba(20, 15, 30, 0.85) 85%)',
    tag: 'Official',
    description: 'Electrifying Hawaiian concert energy! Exert your low-cost characters to draw extra glimmers.',
    descriptionTh: 'เวทีคอนเสิร์ตฮาวายสุดเร้าใจ พลังเสียงร็อกขับกล่อมดึงตัวละครค่าร่ายต่ำสู่สนามประลอง'
  },
  {
    id: 'elsa-spirit-winter',
    name: 'Elsa - Spirit of Winter',
    nameTh: 'เอลซ่า - จิตวิญญาณแห่งเหมันต์',
    character: 'Elsa',
    characterTh: 'เอลซ่า ราชินีหิมะ',
    series: 'The First Chapter',
    inkColors: ['Amethyst'],
    previewImage: '/artworkdisey/art6.webp',
    bgImage: '/artworkdisey/art6.webp',
    accentColor: '#A855F7',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.18) 0%, rgba(10, 20, 40, 0.85) 85%)',
    tag: 'Official',
    description: 'Majestic crystalline frost that freezes opposing characters and commands the flow of magical ink.',
    descriptionTh: 'เวทมนตร์ผลึกน้ำแข็งบริสุทธิ์ ตรึงการเคลื่อนไหวของการ์ดฝ่ายตรงข้ามด้วยพลังเหมันต์'
  },
  {
    id: 'maleficent-dragon',
    name: 'Maleficent - Monstrous Dragon',
    nameTh: 'มาเลฟิเซนต์ - มังกรปีศาจ',
    character: 'Maleficent',
    characterTh: 'มาเลฟิเซนต์',
    series: 'The First Chapter',
    inkColors: ['Ruby'],
    previewImage: '/artworkdisey/art7.jpg',
    bgImage: '/artworkdisey/art7.jpg',
    accentColor: '#EF4444',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(25, 10, 20, 0.88) 85%)',
    tag: 'Official',
    description: 'Raging hellfire and dragon sorcery capable of instantly banishing any chosen opponent character.',
    descriptionTh: 'เพลิงมังกรบรรลัยกัลป์ เผาผลาญและส่งการ์ดของฝ่ายตรงข้ามลงสู่สุสานในพริบตา'
  },
  {
    id: 'tinkerbell-giant-fairy',
    name: 'Tinker Bell - Giant Fairy',
    nameTh: 'ทิงเกอร์เบลล์ - นางฟ้าไซส์ยักษ์',
    character: 'Tinker Bell',
    characterTh: 'ทิงเกอร์เบลล์',
    series: 'The First Chapter',
    inkColors: ['Steel'],
    previewImage: '/artworkdisey/art5.webp',
    bgImage: '/artworkdisey/art5.webp',
    accentColor: '#94A3B8',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(148, 163, 184, 0.18) 0%, rgba(15, 23, 42, 0.88) 85%)',
    tag: 'Official',
    description: 'Pixie dust whirlwind dealing sweeping damage to all opposing characters upon entering play.',
    descriptionTh: 'ละอองเวทมนตร์พายุหมุน สร้างความเสียหายกระจายทั่วสนามฝ่ายตรงข้ามเมื่อลงสู่สนาม'
  },
  {
    id: 'maui-demigod',
    name: 'Maui - Demigod of the Wind',
    nameTh: 'มาวอิ - กึ่งเทพแห่งสายลมและท้องทะเล',
    character: 'Maui',
    characterTh: 'มาวอิ',
    series: 'The First Chapter',
    inkColors: ['Ruby'],
    previewImage: '/artworkdisey/art8.jpg',
    bgImage: '/artworkdisey/art8.jpg',
    accentColor: '#F97316',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(249, 115, 22, 0.18) 0%, rgba(30, 15, 10, 0.88) 85%)',
    tag: 'Official',
    description: 'Legendary hook warrior with Rush and Reckless, charging fearless into any challenge.',
    descriptionTh: 'นักรบพลังตะขอเทพ มีความสามารถ Rush บุกทะลวงเข้า Challenge ศัตรูได้ทันทีในเทิร์นที่ลง'
  },
  {
    id: 'floodborn-ink-vortex',
    name: 'Rise of the Floodborn - Ink Vortex',
    nameTh: 'วังวนน้ำหมึกฟลัดบอร์น',
    character: 'Floodborn Glade',
    characterTh: 'หุบเขาน้ำหมึกลึกลับ',
    series: 'Set 2',
    inkColors: ['Emerald', 'Amethyst'],
    previewImage: '/artworkdisey/art10.webp',
    bgImage: '/artworkdisey/art10.webp',
    accentColor: '#10B981',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.18) 0%, rgba(10, 30, 25, 0.88) 85%)',
    tag: 'Special',
    description: 'Deep mystical ink flood transforming characters into extraordinary Shifted forms.',
    descriptionTh: 'กระแสน้ำหมึกลึกลับที่แปรสภาพตัวละครสู่ร่างกลายพันธุ์ Shift อันทรงพลัง'
  },
  {
    id: 'inklands-expedition',
    name: 'Into the Inklands - Exploration Map',
    nameTh: 'แผนที่สำรวจดินแดนอินก์แลนด์ส',
    character: 'Cartographer Sanctuary',
    characterTh: 'วิหารนักสำรวจ',
    series: 'Set 3',
    inkColors: ['Sapphire', 'Emerald'],
    previewImage: '/artworkdisey/art11.webp',
    bgImage: '/artworkdisey/art11.webp',
    accentColor: '#06B6D4',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.18) 0%, rgba(10, 25, 35, 0.88) 85%)',
    tag: 'Special',
    description: 'Uncharted ancient landscapes and magical location glimmers waiting for discovery.',
    descriptionTh: 'แผนที่โบราณนำทางสู่สถานที่เวทมนตร์ (Location) ที่มอบ Lore และความลับแห่งการผจญภัย'
  },
  {
    id: 'mickey-brave-tailor',
    name: 'Mickey Mouse - Brave Little Tailor',
    nameTh: 'มิกกี้ เมาส์ - ช่างตัดเสื้อผู้กล้าหาญ',
    character: 'Mickey Mouse',
    characterTh: 'มิกกี้ เมาส์',
    series: 'The First Chapter',
    inkColors: ['Ruby'],
    previewImage: '/artworkdisey/ark9.webp',
    bgImage: '/artworkdisey/ark9.webp',
    accentColor: '#EC4899',
    ambientGlow: 'radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.18) 0%, rgba(30, 15, 25, 0.88) 85%)',
    tag: 'Exclusive',
    description: 'The pinnacle of Disney heroics questing for a massive 4 Lore per turn!',
    descriptionTh: 'สุดยอดการ์ดสาย Quest ของจักรวาล Disney ที่เก็บเกี่ยว Lore ได้สูงถึง 4 แต้มต่อหนึ่งเทิร์น'
  }
];
