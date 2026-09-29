import { parseCardKeywords } from '../../game';
import { webSocketService } from '../../services/websocket';
import type { LorcanaCard } from '../LorcanaBoard';

export interface ResolveAbilitiesContext {
  triggerAbilityAlert: (
    card: LorcanaCard,
    abilityName: string,
    abilityText: string,
    source: 'player' | 'opponent',
    category: 'auto_resolved' | 'keyword' | 'complex_effect' | 'trigger',
    actionHint?: string
  ) => void;
  handleDrawCard: () => void;
  setLogMessages: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerLore: React.Dispatch<React.SetStateAction<number>>;
  roomId?: string;
  playerRole?: 'player1' | 'player2';
  showNotice: (msg: string, type: 'success' | 'warning' | 'error') => void;
  handleTriggerGameOver: (
    winner: 'me' | 'opponent',
    explicitData?: { winnerName?: string; loserName?: string; winnerLore?: number; loserLore?: number }
  ) => void;
  opponentLore: number;
  setOpponentFieldCards: React.Dispatch<React.SetStateAction<LorcanaCard[]>>;
  setDamage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setOpponentExerted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  opponentFieldCards: LorcanaCard[];
}

export function resolveCardAbilities(card: LorcanaCard, ctx: ResolveAbilitiesContext) {
  const {
    triggerAbilityAlert,
    handleDrawCard,
    setLogMessages,
    setPlayerLore,
    roomId,
    playerRole,
    showNotice,
    handleTriggerGameOver,
    opponentLore,
    setOpponentFieldCards,
    setDamage,
    setOpponentExerted,
    opponentFieldCards,
  } = ctx;

  const kw = parseCardKeywords(card);

  // 1. KEYWORD NOTIFICATIONS
  if (kw.rush && !card.abilities?.some((a) => a.name.toLowerCase().includes('rush'))) {
    triggerAbilityAlert(
      card,
      'Rush (จู่โจมทันที)',
      "This character can challenge the turn they're played.",
      'player',
      'keyword',
      '💡 สามารถสั่ง Challenge โจมตีตัวละครฝ่ายตรงข้ามที่ Exerted ได้ทันทีในเทิร์นนี้'
    );
  }
  if (kw.bodyguard && !card.abilities?.some((a) => a.name.toLowerCase().includes('bodyguard'))) {
    triggerAbilityAlert(
      card,
      'Bodyguard (ผู้คุ้มกัน)',
      'An opposing character who challenges must choose a character with Bodyguard if able.',
      'player',
      'keyword',
      '💡 คู่แข่งถูกบังคับให้ต้องเลือกโจมตีตัวละครที่มี Bodyguard ก่อนตัวอื่น'
    );
  }
  if (kw.ward && !card.abilities?.some((a) => a.name.toLowerCase().includes('ward'))) {
    triggerAbilityAlert(
      card,
      'Ward (ม่านคุ้มครอง)',
      "Opponents can't choose this character except to challenge.",
      'player',
      'keyword',
      '💡 คู่แข่งไม่สามารถเลือกการ์ดนี้เป็นเป้าหมายของเวทมนตร์หรือความสามารถได้'
    );
  }
  if (kw.evasive && !card.abilities?.some((a) => a.name.toLowerCase().includes('evasive'))) {
    triggerAbilityAlert(
      card,
      'Evasive (หลบหลีก)',
      'Only characters with Evasive can challenge this character.',
      'player',
      'keyword',
      '💡 เฉพาะตัวละครที่มี Evasive เท่านั้นที่จะ Challenge ตัวนี้ได้'
    );
  }
  if (kw.singer) {
    triggerAbilityAlert(
      card,
      `Singer ${kw.singer} (นักร้องระดับสูง)`,
      `This character counts as cost ${kw.singer} to sing songs.`,
      'player',
      'keyword',
      `💡 ตัวละครนี้นับเป็น Cost ${kw.singer} สำหรับการร้องเพลง Song ได้ฟรี`
    );
  }
  if (kw.shift) {
    triggerAbilityAlert(
      card,
      `Shift ${kw.shift.cost} (วิวัฒนาการร่าง)`,
      `You may pay ${kw.shift.cost} Ink to play this on top of one of your characters named ${card.name}.`,
      'player',
      'keyword',
      `💡 สามารถจ่าย ${kw.shift.cost} Ink เพื่อลงทับตัวละครชื่อเดียวกันในสนาม`
    );
  }

  if (!card.abilities || !Array.isArray(card.abilities)) return;

  card.abilities.forEach((ability) => {
    const text = (ability.text || '').toLowerCase();
    let isAutoResolved = false;
    let hint: string | undefined = undefined;

    // Draw card ability
    const drawMatch = text.match(/draw (\d+) cards/);
    if (drawMatch) {
      const count = parseInt(drawMatch[1]);
      for (let i = 0; i < count; i++) {
        handleDrawCard();
      }
      setLogMessages((logs) => [`[Ability: ${ability.name}] Drew ${count} cards!`, ...logs]);
      isAutoResolved = true;
      hint = `จั่วการ์ด ${count} ใบเข้ามือเรียบร้อยแล้ว`;
    } else if (/draw a card/.test(text)) {
      handleDrawCard();
      setLogMessages((logs) => [`[Ability: ${ability.name}] Drew 1 card!`, ...logs]);
      isAutoResolved = true;
      hint = 'จั่วการ์ด 1 ใบเข้ามือเรียบร้อยแล้ว';
    }

    // Gain lore
    const loreMatch = text.match(/gain (\d+) lore/);
    if (loreMatch) {
      const gain = parseInt(loreMatch[1]);
      setPlayerLore((prev) => {
        const next = Math.min(20, prev + gain);
        webSocketService.sendAction('LORE_UPDATED', {
          roomId: roomId || undefined,
          role: playerRole,
          loreScore: next,
        });
        if (next >= 20) {
          showNotice(`VICTORY! You reached 20 Lore and won the Illumineer match!`, 'success');
          handleTriggerGameOver('me', { winnerLore: next, loserLore: opponentLore });
        }
        return next;
      });
      setLogMessages((logs) => [`[Ability: ${ability.name}] Gained ${gain} Lore!`, ...logs]);
      isAutoResolved = true;
      hint = `เพิ่มคะแนน Lore +${gain} แต้มทันที`;
    }

    // Banish chosen character
    if (/banish chosen (opposing )?character/.test(text)) {
      setOpponentFieldCards((prev) => {
        if (prev.length > 0) {
          setLogMessages((logs) => [`[Ability: ${ability.name}] Banished opponent's ${prev[0].name}!`, ...logs]);
          return prev.slice(1);
        }
        return prev;
      });
      isAutoResolved = true;
      hint = 'ทำลายตัวละครฝ่ายตรงข้ามลงสุสานทันที';
    }

    // Damage to each opposing character
    const dmgMatch = text.match(/deal (\d+) damage to each opposing character/);
    if (dmgMatch) {
      const dmg = parseInt(dmgMatch[1]);
      setOpponentFieldCards((prev) => {
        const next: LorcanaCard[] = [];
        setDamage((d) => {
          const nd = { ...d };
          prev.forEach((op) => {
            nd[op.id] = (nd[op.id] || 0) + dmg;
            if (nd[op.id] >= (op.willpower || 0)) {
              setLogMessages((logs) => [`Opponent's ${op.name} was banished by ${ability.name}!`, ...logs]);
            } else {
              next.push(op);
            }
          });
          return nd;
        });
        return next;
      });
      isAutoResolved = true;
      hint = `สร้างความเสียหายหมู่ ${dmg} Damage ให้ตัวละครฝ่ายตรงข้ามทุกคน`;
    }

    // Exert characters
    const exertMatch = text.match(/exert up to (\d+) chosen characters/);
    if (exertMatch) {
      const count = parseInt(exertMatch[1]);
      setOpponentExerted((prev) => {
        const next = { ...prev };
        opponentFieldCards.slice(0, count).forEach((op) => {
          next[op.id] = true;
        });
        return next;
      });
      setLogMessages((logs) => [`[Ability: ${ability.name}] Exerted ${count} opposing characters!`, ...logs]);
      isAutoResolved = true;
      hint = `หมุน Exert ตัวละครฝ่ายตรงข้าม ${count} ตัวเรียบร้อยแล้ว`;
    }

    // Complex Effects / Actionable Prompts
    let category: 'auto_resolved' | 'keyword' | 'complex_effect' | 'trigger' = isAutoResolved
      ? 'auto_resolved'
      : 'trigger';
    if (!isAutoResolved) {
      if (/look at the top (\d+) cards/i.test(text) || /look at the top card/i.test(text)) {
        category = 'complex_effect';
        hint = '💡 ความสามารถเปิดดูการ์ดบนสุดของกอง: คุณสามารถคลิกดูเด็คเพื่อหยิบการ์ดขึ้นมือตามเงื่อนไข';
      } else if (
        /return (chosen|another) character (to your hand|to their player's hand)/i.test(text) ||
        /bounce/i.test(text)
      ) {
        category = 'complex_effect';
        hint = '💡 ความสามารถ Bounce: เลือกนำตัวละครกลับขึ้นมือเพื่อรับผลคอมโบ';
      } else if (/banish chosen item/i.test(text) || /banish an item/i.test(text)) {
        category = 'complex_effect';
        hint = '💡 ความสามารถ Item Sacrifice: เลือก Banish ไอเทมเพื่อจั่วการ์ดหรือสร้างเอฟเฟกต์';
      } else if (/sing together/i.test(text)) {
        category = 'complex_effect';
        hint = '💡 Sing Together: คุณสามารถเลือก Exert ตัวละครหลายตัวรวมกันเพื่อร้องเพลงนี้ได้ฟรี';
      }
    }

    triggerAbilityAlert(card, ability.name, ability.text, 'player', category, hint);
  });
}
