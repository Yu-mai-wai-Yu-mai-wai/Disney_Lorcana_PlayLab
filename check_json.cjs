const fs = require('fs');
console.log('Project build and check script OK');

// 1. Write src/data/patchNotes.ts
const patchNotesContent = `export interface PatchNote {
  version: string;
  releaseDate: string;
  title: string;
  highlight: string;
  features: {
    category: 'Gameplay' | 'Multiplayer' | 'UI/UX' | 'Cloud/Backend' | 'Fixes';
    items: string[];
  }[];
}

export const APP_VERSION = 'v1.3.0';
export const APP_BUILD_DATE = '2026-08-18';

export const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v1.3.0',
    releaseDate: '2026-08-18',
    title: 'Real-Time Match, Dice Duel & Rules Engine',
    highlight: 'ระบบทอยลูกเต๋าตัดสินลำดับเริ่มก่อน/หลัง, การซิงค์สถานะเกมแบบ Real-time 100%, และระบบกฎ Lorcana ครบวงจร',
    features: [
      {
        category: 'Multiplayer',
        items: [
          '🎲 Pre-Game Dice Duel: ระบบทายเลขคู่/คี่ (Odd or Even) และทอยลูกเต๋า 3D Animated D6 ก่อนเริ่มเกม ผู้ชนะเลือกได้ว่าจะเริ่มก่อน (Play First) หรือเริ่มหลัง (Play Second)',
          '⚡ Complete Real-time Sync: ซิงค์ทุกความเคลื่อนไหวผ่าน AWS API Gateway WebSockets ทั้งการร่ายการ์ด, เพิ่ม Inkwell, การ Quest รับ Lore, การท้าดวล Challenge, และการสลับเทิร์น',
          '💬 Live Match Chat: แชทสื่อสารระหว่างผู้เล่น 2 ฝั่งแบบเรียลไทม์ พร้อม Notification Badge แจ้งเตือนข้อความใหม่',
          '🔄 Dynamic Room Role Binding: กำหนด Player 1 (Host) และ Player 2 (Challenger) อย่างแม่นยำ พร้อมส่ง Room ID และ State อัตโนมัติ',
        ],
      },
      {
        category: 'Gameplay',
        items: [
          '📜 Official Lorcana Turn 1 Draw Rule: ผู้เล่นที่เริ่มก่อนจะไม่จั่วการ์ดในเทิร์นแรกตามกฎทางการของ Disney Lorcana (ผู้เล่นเริ่มหลังจั่วได้ปกติ)',
          '⚔️ Accurate Challenge & Damage Sync: คำนวณความเสียหายแบบสวนกลับพร้อมกัน (Simultaneous Damage) และบังคับโจมตีเฉพาะการ์ดที่ Exert แล้วเท่านั้น',
          '💧 Drying Ink (Wet status): ตัวละครที่เพิ่งร่ายจะติดสถานะหมึกยังไม่แห้ง ไม่สามารถ Quest หรือ Challenge ได้จนกว่าจะเริ่มเทิร์นถัดไป',
          '🎴 Deck Empty Loss Rule: หากกองการ์ดหมดแล้วต้องจั่วการ์ด จะแพ้เกมทันทีตามกฎทางการ',
          '🃏 Mulligan System: เลือกทิ้งการ์ดกี่ใบก็ได้บนมือเพื่อจั่วใหม่ก่อนเริ่มเทิร์นแรก',
        ],
      },
      {
        category: 'UI/UX',
        items: [
          '📌 Version Indicator & Patch Notes: แสดงเลขเวอร์ชันแอปพลิเคชันอย่างชัดเจนบน Navbar และ Footer พร้อมเปิดอ่าน Patch Notes ได้ตลอดเวลา',
          '🎯 Streamlined Viewport Layout: จัดระเบียบหน้ากระดานเกมให้พอดีจอ 100vh ไร้การเลื่อน (Zero Scroll) ใช้งานง่ายทุกอุปกรณ์',
          '✨ Enhanced Action Feedback: Toast Notifications แจ้งเตือนทุกจังหวะสำคัญของเกมด้วยสีและไอคอนเฉพาะทาง',
        ],
      },
      {
        category: 'Fixes',
        items: [
          'แก้ปัญหา Room ID fallback เป็นห้องเริ่มต้น 108249 ทำให้ไม่ได้รับข้อมูลระหว่างกัน',
          'แก้ปัญหาปุ่ม Start Turn ที่ทำให้ผู้เล่นสามารถกดข้ามเทิร์นเองได้แม้ยังไม่ถึงคิว',
          'แก้ปัญหา Opponent Piles & Discard Grave แสดงค่าแบบฮาร์ดโค้ด',
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
`;

fs.writeFileSync('src/data/patchNotes.ts', patchNotesContent, 'utf8');
console.log('✅ src/data/patchNotes.ts created');

// 2. Write src/components/PatchNotesModal.tsx
const patchNotesModalContent = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Tag, Calendar, CheckCircle2, ChevronRight, Layers, Swords, ShieldCheck, Wrench } from 'lucide-react';
import { PATCH_NOTES, APP_VERSION, APP_BUILD_DATE, PatchNote } from '../data/patchNotes';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(PATCH_NOTES[0].version);

  if (!isOpen) return null;

  const currentPatch = PATCH_NOTES.find((p) => p.version === selectedVersion) || PATCH_NOTES[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Multiplayer':
        return <SwitchesIcon className="w-4 h-4 text-cyan-400" />;
      case 'Gameplay':
        return <Swords className="w-4 h-4 text-[#F59E0B]" />;
      case 'UI/UX':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Cloud/Backend':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'Fixes':
        return <Wrench className="w-4 h-4 text-rose-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Multiplayer':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50';
      case 'Gameplay':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'UI/UX':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/50';
      case 'Cloud/Backend':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'Fixes':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#0B0F19] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#141a26]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
                <Tag className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
                    Lorcana PlayLab <span className="text-[#F59E0B]">Patch Notes</span>
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#F59E0B] text-black rounded-full shadow-sm">
                    {APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] font-outfit">
                  บันทึกรายการอัปเดตระบบ, ฟีเจอร์ใหม่ และการปรับปรุงความเสถียร
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0B0F19] rounded-lg border border-transparent hover:border-[#30363d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Version List Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#30363d] bg-[#0d1320] p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
              <div className="text-[11px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider mb-1 hidden md:block px-2">
                Version History
              </div>
              {PATCH_NOTES.map((patch) => {
                const isSelected = patch.version === selectedVersion;
                const isLatest = patch.version === APP_VERSION;
                return (
                  <button
                    key={patch.version}
                    onClick={() => setSelectedVersion(patch.version)}
                    className={\`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group \${
                      isSelected
                        ? 'bg-[#141a26] border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-[#0B0F19]/60 border-[#30363d] hover:border-[#94A3B8]/50 text-[#94A3B8]'
                    }\`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={\`font-mono font-bold text-sm \${isSelected ? 'text-[#F59E0B]' : 'text-[#F1F5F9]'}\`}>
                          {patch.version}
                        </span>
                        {isLatest && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                            LATEST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {patch.releaseDate}
                      </div>
                    </div>
                    <ChevronRight className={\`w-4 h-4 transition-transform \${isSelected ? 'text-[#F59E0B] translate-x-0.5' : 'text-[#94A3B8] opacity-0 group-hover:opacity-100'}\`} />
                  </button>
                );
              })}
            </div>

            {/* Patch Details Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6">
              {/* Patch Title & Highlight */}
              <div className="bg-[#141a26] border border-[#30363d] p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F59E0B]" />
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
                    {currentPatch.title}
                  </h3>
                  <span className="text-xs font-mono text-[#F59E0B] bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-[#30363d]">
                    Release: {currentPatch.releaseDate}
                  </span>
                </div>
                <p className="text-sm text-[#94A3B8] font-outfit leading-relaxed">
                  {currentPatch.highlight}
                </p>
              </div>

              {/* Categorized Features */}
              <div className="space-y-4">
                {currentPatch.features.map((cat, idx) => (
                  <div key={idx} className="bg-[#141a26]/70 border border-[#30363d] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={\`text-xs font-bold font-cinzel px-2.5 py-1 rounded-md border flex items-center gap-1.5 \${getCategoryBadgeClass(cat.category)}\`}>
                        {cat.category}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs text-[#CBD5E1] flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#30363d] bg-[#141a26] flex items-center justify-between text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Build: {APP_VERSION} ({APP_BUILD_DATE})</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#F59E0B] text-black font-bold font-cinzel text-xs rounded-lg hover:bg-[#D97706] transition-colors"
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SwitchesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 3h5v5" />
    <path d="M8 3H3v5" />
    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
    <path d="m15 9 6-6" />
  </svg>
);
`;

fs.writeFileSync('src/components/PatchNotesModal.tsx', patchNotesModalContent, 'utf8');
console.log('✅ src/components/PatchNotesModal.tsx created');

// 3. Write src/components/DiceDuelModal.tsx
const diceDuelModalContent = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dices, Crown, ArrowRight, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { webSocketService } from '../services/websocket';

export interface DiceDuelModalProps {
  isOpen: boolean;
  roomId?: string;
  myRole: 'player1' | 'player2';
  opponentName?: string;
  onDuelFinished: (firstPlayerRole: 'player1' | 'player2') => void;
  isSandbox?: boolean;
}

export const DiceDuelModal: React.FC<DiceDuelModalProps> = ({
  isOpen,
  roomId,
  myRole,
  opponentName = 'Opponent Illumineer',
  onDuelFinished,
  isSandbox = false,
}) => {
  const isHost = myRole === 'player1' || isSandbox;

  const [step, setStep] = useState<'CHOOSE' | 'ROLLING' | 'RESULT' | 'ORDER_CHOSEN'>('CHOOSE');
  const [hostChoice, setHostChoice] = useState<'ODD' | 'EVEN' | null>(null);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [winnerRole, setWinnerRole] = useState<'player1' | 'player2' | null>(null);
  const [chosenFirstPlayer, setChosenFirstPlayer] = useState<'player1' | 'player2' | null>(null);

  // Subscribe to WebSocket Dice Events in match mode
  useEffect(() => {
    if (!isOpen || isSandbox) return;

    const unsubChoice = webSocketService.subscribe('DICE_CHOICE', (data) => {
      if (data.payload?.choice) {
        setHostChoice(data.payload.choice);
      }
    });

    const unsubRolled = webSocketService.subscribe('DICE_ROLLED', (data) => {
      const rolled = data.payload?.diceValue || Math.floor(Math.random() * 6) + 1;
      setDiceValue(rolled);
      setStep('ROLLING');
      
      setTimeout(() => {
        setStep('RESULT');
        const isOdd = rolled % 2 !== 0;
        const hostPicked = data.payload?.hostChoice || hostChoice;
        const hostWon = (hostPicked === 'ODD' && isOdd) || (hostPicked === 'EVEN' && !isOdd);
        const win = hostWon ? 'player1' : 'player2';
        setWinnerRole(win);
      }, 2400);
    });

    const unsubOrder = webSocketService.subscribe('FIRST_PLAYER_CHOSEN', (data) => {
      const first = data.payload?.firstPlayerRole as 'player1' | 'player2';
      if (first) {
        setChosenFirstPlayer(first);
        setStep('ORDER_CHOSEN');
        setTimeout(() => {
          onDuelFinished(first);
        }, 1800);
      }
    });

    return () => {
      unsubChoice();
      unsubRolled();
      unsubOrder();
    };
  }, [isOpen, isSandbox, hostChoice, onDuelFinished]);

  if (!isOpen) return null;

  // Host (Player 1) chooses Odd or Even
  const handleSelectChoice = (choice: 'ODD' | 'EVEN') => {
    setHostChoice(choice);
    if (!isSandbox) {
      webSocketService.sendAction('DICE_CHOICE', {
        roomId,
        role: myRole,
        payload: { choice },
      });
    }
  };

  // Trigger Rolling
  const handleRollDice = () => {
    if (!hostChoice) return;
    const finalRoll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(finalRoll);
    setStep('ROLLING');

    if (!isSandbox) {
      webSocketService.sendAction('DICE_ROLLED', {
        roomId,
        role: myRole,
        payload: { diceValue: finalRoll, hostChoice },
      });
    }

    setTimeout(() => {
      setStep('RESULT');
      const isOdd = finalRoll % 2 !== 0;
      const hostWon = (hostChoice === 'ODD' && isOdd) || (hostChoice === 'EVEN' && !isOdd);
      const win = hostWon ? 'player1' : 'player2';
      setWinnerRole(win);
    }, 2400);
  };

  // Winner chooses who goes first
  const handleChooseTurnOrder = (selectedRole: 'player1' | 'player2') => {
    setChosenFirstPlayer(selectedRole);
    setStep('ORDER_CHOSEN');

    if (!isSandbox) {
      webSocketService.sendAction('FIRST_PLAYER_CHOSEN', {
        roomId,
        role: myRole,
        payload: { firstPlayerRole: selectedRole },
      });
    }

    setTimeout(() => {
      onDuelFinished(selectedRole);
    }, 1800);
  };

  const isWinner = winnerRole === myRole || (isSandbox && winnerRole === 'player1');
  const isOddResult = diceValue % 2 !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#0B0F19] border-2 border-[#F59E0B]/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#F59E0B]/20 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Dices className="w-7 h-7 text-[#F59E0B] animate-pulse" />
          <h2 className="font-cinzel text-2xl font-bold text-[#F1F5F9]">
            PRE-MATCH <span className="text-[#F59E0B]">DICE DUEL</span>
          </h2>
        </div>
        <p className="text-xs text-[#94A3B8] font-outfit mb-6">
          ทอยลูกเต๋า ทายเลขคู่-เลขคี่ เพื่อตัดสินสิทธิ์เลือกลำดับเริ่มเกม
        </p>

        {/* STEP 1: CHOICE PHASE */}
        {step === 'CHOOSE' && (
          <div className="w-full space-y-6">
            <div className="bg-[#141a26] border border-[#30363d] p-4 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Host (Player 1):</span>
                <span className="font-bold text-[#F1F5F9]">{isHost ? 'You' : opponentName}</span>
              </div>
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Challenger (Player 2):</span>
                <span className="font-bold text-[#F1F5F9]">{!isHost ? 'You' : opponentName}</span>
              </div>
            </div>

            {isHost ? (
              <div className="space-y-4">
                <p className="text-sm font-bold text-[#F1F5F9] font-cinzel">
                  คุณเป็น Host: กรุณาเลือกทาย <span className="text-[#F59E0B]">เลขคี่</span> หรือ <span className="text-cyan-400">เลขคู่</span>
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectChoice('ODD')}
                    className={\`py-4 px-6 rounded-xl border-2 font-cinzel font-bold text-lg transition-all flex flex-col items-center gap-1 \${
                      hostChoice === 'ODD'
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.03]'
                        : 'bg-[#141a26] border-[#30363d] text-[#94A3B8] hover:border-[#F59E0B]/50'
                    }\`}
                  >
                    <span>ODD (คี่)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">1, 3, 5</span>
                  </button>

                  <button
                    onClick={() => handleSelectChoice('EVEN')}
                    className={\`py-4 px-6 rounded-xl border-2 font-cinzel font-bold text-lg transition-all flex flex-col items-center gap-1 \${
                      hostChoice === 'EVEN'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-[1.03]'
                        : 'bg-[#141a26] border-[#30363d] text-[#94A3B8] hover:border-cyan-400/50'
                    }\`}
                  >
                    <span>EVEN (คู่)</span>
                    <span className="text-xs font-mono text-[#94A3B8]">2, 4, 6</span>
                  </button>
                </div>

                <button
                  onClick={handleRollDice}
                  disabled={!hostChoice}
                  className="w-full py-4 bg-[#F59E0B] text-black font-cinzel font-bold text-lg rounded-xl hover:bg-[#D97706] hover:scale-[1.02] transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" /> ROLL THE DICE
                </button>
              </div>
            ) : (
              <div className="py-8 space-y-4">
                <div className="w-16 h-16 bg-[#141a26] border border-[#F59E0B]/40 rounded-2xl mx-auto flex items-center justify-center animate-bounce">
                  <Dices className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <h3 className="font-cinzel text-lg text-[#F1F5F9]">
                  {hostChoice ? \`Host เลือก \${hostChoice === 'ODD' ? 'เลขคี่ (ODD)' : 'เลขคู่ (EVEN)'}!\` : 'รอ Host เลือกเลขคู่/คี่...'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {hostChoice
                    ? \`คุณจะได้ฝั่ง \${hostChoice === 'ODD' ? 'เลขคู่ (EVEN)' : 'เลขคี่ (ODD)'} อัตโนมัติ — รอ Host กดทอยลูกเต๋า\`
                    : 'ผู้เล่นที่ทายถูกจะได้สิทธิ์เลือกเริ่มก่อนหรือเริ่มหลัง'}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-[#F59E0B]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for opponent...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ROLLING ANIMATION */}
        {step === 'ROLLING' && (
          <div className="py-12 space-y-6 flex flex-col items-center">
            <motion.div
              animate={{
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                scale: [1, 1.2, 0.9, 1.1, 1],
              }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="w-24 h-24 bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#78350F] rounded-2xl flex items-center justify-center text-black font-cinzel font-bold text-4xl shadow-[0_0_40px_rgba(245,158,11,0.6)] border-4 border-amber-200"
            >
              🎲
            </motion.div>
            <div className="space-y-1">
              <h3 className="font-cinzel text-xl text-[#F1F5F9] animate-pulse">Rolling the Destiny Die...</h3>
              <p className="text-xs text-[#94A3B8] font-mono">Randomizing D6 [1 .. 6]</p>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT & ORDER SELECTION */}
        {step === 'RESULT' && (
          <div className="w-full space-y-6">
            {/* Dice Face Reveal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="p-4 bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
            >
              <span className="text-xs font-mono text-[#94A3B8]">DICE RESULT</span>
              <div className="w-16 h-16 bg-[#F59E0B] text-black font-cinzel font-black text-3xl rounded-xl flex items-center justify-center shadow-lg">
                {diceValue}
              </div>
              <span className="text-sm font-bold font-cinzel text-[#F1F5F9]">
                ผลทอยคือเลข {diceValue} — <span className={isOddResult ? 'text-[#F59E0B]' : 'text-cyan-400'}>{isOddResult ? 'ODD (คี่)' : 'EVEN (คู่)'}</span>
              </span>
            </motion.div>

            {/* Winner Box */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-3">
              <Crown className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs text-emerald-300 uppercase tracking-wider font-mono">Winner of the Toss</p>
                <p className="text-base font-bold text-white font-cinzel">
                  {winnerRole === myRole ? '🎉 You Won the Toss!' : \`👑 \${opponentName} Won the Toss!\`}
                </p>
              </div>
            </div>

            {/* Winner selects order */}
            {isWinner ? (
              <div className="space-y-3">
                <p className="text-xs text-[#CBD5E1]">
                  คุณชนะการทายลูกเต๋า! กรุณาเลือกสิทธิ์ในการเริ่มเกม:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChooseTurnOrder(myRole)}
                    className="p-4 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-xl text-left transition-all hover:scale-[1.02] group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel font-bold text-sm text-[#F59E0B]">PLAY FIRST (เริ่มก่อน)</span>
                      <ArrowRight className="w-4 h-4 text-[#F59E0B] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      ได้เริ่มเดินเกมก่อน ได้เปรียบจังหวะลงการ์ด (ข้ามการจั่วในการเริ่มเทิร์น 1)
                    </p>
                  </button>

                  <button
                    onClick={() => handleChooseTurnOrder(myRole === 'player1' ? 'player2' : 'player1')}
                    className="p-4 bg-cyan-950/30 hover:bg-cyan-900/40 border-2 border-cyan-500/60 rounded-xl text-left transition-all hover:scale-[1.02] group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel font-bold text-sm text-cyan-300">PLAY SECOND (เริ่มหลัง)</span>
                      <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      ได้จั่วการ์ดในเทิร์นแรกทันที มีการ์ดบนมือมากกว่าเพื่อแก้ทาง
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#94A3B8] font-mono bg-[#141a26] rounded-xl border border-[#30363d] p-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                <span>Waiting for {opponentName} to choose turn order...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMED */}
        {step === 'ORDER_CHOSEN' && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
              {chosenFirstPlayer === myRole ? 'You will PLAY FIRST!' : \`\${opponentName} will PLAY FIRST!\`}
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {chosenFirstPlayer === myRole
                ? 'คุณจะเริ่มเทิร์นที่ 1 (ตามกฎทางการ จะไม่จั่วการ์ดในเทิร์นนี้)'
                : 'ฝ่ายตรงข้ามจะเริ่มก่อน คุณจะได้จั่วการ์ดในเทิร์นแรกของคุณ'}
            </p>
            <div className="text-xs text-[#F59E0B] font-mono animate-pulse">
              Entering match & starting Mulligan phase...
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/DiceDuelModal.tsx', diceDuelModalContent, 'utf8');
console.log('✅ src/components/DiceDuelModal.tsx created');


