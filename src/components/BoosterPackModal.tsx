import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Plus, Eye, Gift, Scissors, ChevronRight } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';
import { useLanguageStore } from '../store/useLanguageStore';
import { translateCardType, translateRarity, translateInkColor } from '../utils/cardTranslator';

interface BoosterPackModalProps {
  isOpen: boolean;
  cardsDatabase: LorcanaCard[];
  onClose: () => void;
  onAddCardsToDeck: (cards: LorcanaCard[]) => void;
}

const FALLBACK_DATABASE: LorcanaCard[] = [
  { id: '1', name: 'Mickey Mouse', title: 'Wayward Sorcerer', cost: 4, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 4, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg' },
  { id: '2', name: 'Elsa', title: 'Spirit of Winter', cost: 8, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Legendary', strength: 4, willpower: 6, lore: 3, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/40_01dc5bb928054aa2b228f2a1f97910208b36b42b.jpg' },
  { id: '3', name: 'Stitch', title: 'Rock Star', cost: 6, inkwell: true, ink: 'Amber', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg' },
  { id: '4', name: 'Dragon Fire', title: 'Banish Chosen Character', cost: 5, inkwell: false, ink: 'Ruby', type: 'Action', rarity: 'Uncommon', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/130_decfce2e256561e57abe8d2d5e378a3781c2ee6d.jpg' },
  { id: '5', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, inkwell: false, ink: 'Ruby', type: 'Character', rarity: 'Legendary', strength: 7, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg' },
  { id: '6', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, inkwell: true, ink: 'Ruby', type: 'Character', rarity: 'Super Rare', strength: 5, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg' },
  { id: '7', name: 'Tinker Bell', title: 'Giant Fairy', cost: 6, inkwell: true, ink: 'Steel', type: 'Character', rarity: 'Super Rare', strength: 4, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/58_e13723fd1214327ef6f4ac4954201558bd90caa6.jpg' },
  { id: '8', name: 'A Whole New World', title: 'Each player discards hand', cost: 5, inkwell: true, ink: 'Steel', type: 'Action', rarity: 'Super Rare', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/195_94542b1a94127cea3923cf9975650520a9a08151.jpg' },
];

export const BoosterPackModal: React.FC<BoosterPackModalProps> = ({
  isOpen,
  cardsDatabase,
  onClose,
  onAddCardsToDeck,
}) => {
  const { t, language } = useLanguageStore();
  const [packState, setPackState] = useState<'sealed' | 'tearing' | 'opened'>('sealed');
  const [packCards, setPackCards] = useState<LorcanaCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // 360 Degree Smooth 3D Pack Rotation State
  const [packRotX, setPackRotX] = useState(0);
  const [packRotY, setPackRotY] = useState(0);
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  // 3D Card Tilt / Peek state
  const [cardRotX, setCardRotX] = useState(0);
  const [cardRotY, setCardRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Failsafe Fisher-Yates Booster Pack Generator (Guarantees 12 Cards Always)
  const generatePack = () => {
    const db = Array.isArray(cardsDatabase) && cardsDatabase.length > 0 ? cardsDatabase : FALLBACK_DATABASE;

    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const commons = shuffle(db.filter((c) => !c.rarity || c.rarity === 'Common'));
    const uncommons = shuffle(db.filter((c) => c.rarity === 'Uncommon'));
    const rares = shuffle(db.filter((c) => c.rarity === 'Rare' || c.rarity === 'Super Rare'));
    const epics = shuffle(db.filter((c) => c.rarity === 'Epic' || c.rarity === 'Special'));
    const ultraRares = shuffle(db.filter((c) => c.rarity === 'Legendary' || c.rarity === 'Enchanted' || c.rarity === 'Iconic'));

    const newPack: LorcanaCard[] = [];

    commons.slice(0, 6).forEach((c) => newPack.push(c));
    uncommons.slice(0, 3).forEach((c) => newPack.push(c));
    (epics.length > 0 ? epics : rares).slice(0, 2).forEach((c) => newPack.push(c));

    if (ultraRares.length > 0 && Math.random() < 0.45) {
      newPack.push(ultraRares[0]);
    } else if (rares.length > 2) {
      newPack.push(rares[2]);
    }

    while (newPack.length < 12) {
      const randomCard = db[Math.floor(Math.random() * db.length)];
      newPack.push(randomCard);
    }

    setPackCards(newPack);
    setFlippedCards({});
    setCurrentCardIndex(0);
    setPackState('sealed');
    setPackRotX(0);
    setPackRotY(0);
  };

  useEffect(() => {
    if (isOpen) {
      generatePack();
    }
  }, [isOpen, cardsDatabase]);

  const handleStartTearPack = () => {
    if (packCards.length === 0) {
      generatePack();
    }
    setPackState('tearing');
    setTimeout(() => {
      setPackState('opened');
    }, 1250);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDown.current = true;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    const deltaX = e.clientX - lastPointerPos.current.x;
    const deltaY = e.clientY - lastPointerPos.current.y;

    setPackRotY((prev) => prev + deltaX * 0.7);
    setPackRotX((prev) => Math.max(-60, Math.min(60, prev - deltaY * 0.7)));

    lastPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDown.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotX = ((y - centerY) / centerY) * -25;
    const rotY = ((x - centerX) / centerX) * 25;
    
    setCardRotX(rotX);
    setCardRotY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.6,
    });
  };

  const handleCardMouseLeave = () => {
    setCardRotX(0);
    setCardRotY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  const handleCardClick = () => {
    const isFlipped = flippedCards[currentCardIndex];
    if (!isFlipped) {
      setFlippedCards((prev) => ({ ...prev, [currentCardIndex]: true }));
    } else {
      if (currentCardIndex < packCards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setCardRotX(0);
        setCardRotY(0);
      }
    }
  };

  const currentCard = packCards[currentCardIndex] || FALLBACK_DATABASE[0];
  const isCurrentFlipped = flippedCards[currentCardIndex] || false;

  const getRarityGlow = (rarity?: string) => {
    switch (rarity) {
      case 'Iconic':
      case 'Enchanted':
      case 'Legendary':
        return 'border-2 border-[#F59E0B] shadow-xl';
      case 'Epic':
      case 'Super Rare':
        return 'border-2 border-purple-400 shadow-lg';
      case 'Rare':
      case 'Uncommon':
        return 'border border-amber-400/70 shadow';
      default:
        return 'border border-[#30363d] shadow';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Booster Pack" overlayClassName="bg-[#0B0F19]/90 font-outfit select-none overflow-y-auto">
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center justify-center min-h-[600px] pointer-events-auto bg-[#0d1420] border border-[#30363d] rounded-xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white rounded-lg bg-[#141a26] border border-[#30363d] transition-colors cursor-pointer z-50 shadow"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: PURE 3D BOOSTER PACK */}
        {packState === 'sealed' && (
          <div className="flex flex-col items-center justify-center flex-1 my-auto w-full">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-[300px] h-[450px] md:w-[330px] md:h-[490px] flex items-center justify-center cursor-grab active:cursor-grabbing preserve-3d touch-none group"
            >
              <div
                className="relative w-[290px] h-[440px] md:w-[320px] md:h-[480px] preserve-3d shadow-xl transition-transform duration-75"
                style={{
                  transform: `perspective(1000px) rotateX(${packRotX}deg) rotateY(${packRotY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-xl bg-[#0B0F19]"
                  style={{ transform: 'translateZ(6px)', backfaceVisibility: 'hidden' }}
                >
                  <img
                    src="/CardGachaDisney.png"
                    alt="Disney Lorcana Booster Pack Front"
                    className="w-full h-full object-cover rounded-xl"
                  />

                  {/* DASHED TEAR LINE & SLICING DRAG CONTROL */}
                  <div
                    className="absolute top-14 left-5 right-5 z-30 flex items-center"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="w-full h-0 border-t-2 border-dashed border-[#F59E0B] relative">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0B0F19] text-[#F59E0B] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#30363d] pointer-events-none">
                        Drag to Slice Open
                      </span>
                    </div>

                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 210 }}
                      dragElastic={0.1}
                      onPointerDown={(e) => e.stopPropagation()}
                      onDragEnd={(_, info) => {
                        if (info.offset.x > 140) {
                          handleStartTearPack();
                        }
                      }}
                      className="absolute left-0 -top-4 w-9 h-9 bg-[#F59E0B] rounded-full border-2 border-black flex items-center justify-center cursor-grab active:cursor-grabbing shadow z-40"
                    >
                      <Scissors className="w-4 h-4 text-black" />
                    </motion.div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleStartTearPack}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStartTearPack();
                      }
                    }}
                    className="absolute bottom-3 left-6 right-6 text-center font-cinzel text-[10px] font-bold text-[#F59E0B] bg-[#0B0F19]/90 py-1.5 rounded border border-[#30363d] cursor-pointer z-20"
                  >
                    Click or Slice to Open
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 rounded-xl bg-[#0B0F19] border-2 border-[#F59E0B] p-6 flex flex-col justify-between items-center overflow-hidden shadow-xl"
                  style={{ transform: 'rotateY(180deg) translateZ(6px)', backfaceVisibility: 'hidden' }}
                >
                  <div className="font-cinzel text-sm font-bold text-[#F59E0B] z-10 text-center">
                    DISNEY LORCANA<br />TRADING CARD GAME
                  </div>

                  <div className="bg-[#141a26] p-2 rounded text-[#F1F5F9] font-mono text-[9px] font-bold z-10 text-center border border-[#30363d]">
                    BARCODE: 4005556110902
                  </div>

                  <div className="text-[9px] text-[#94A3B8] font-mono z-10 text-center">
                    Official 3D Foil Pack
                  </div>
                </div>

                {/* LEFT THICKNESS SIDE */}
                <div
                  className="absolute top-0 bottom-0 left-0 w-3 bg-[#F59E0B]/80"
                  style={{ transform: 'rotateY(-90deg) translateZ(6px)', backfaceVisibility: 'hidden' }}
                />

                {/* RIGHT THICKNESS SIDE */}
                <div
                  className="absolute top-0 bottom-0 right-0 w-3 bg-[#F59E0B]/80"
                  style={{ transform: 'rotateY(90deg) translateZ(294px)', backfaceVisibility: 'hidden' }}
                />
              </div>
            </div>

            <button
              onClick={handleStartTearPack}
              className="mt-6 px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg shadow flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Gift className="w-4 h-4 text-black" />
              {language === 'th' ? 'ฉีกซองการ์ด' : 'Open Pack'}
            </button>
          </div>
        )}

        {/* STEP 2: 3D TEARING ANIMATION */}
        {packState === 'tearing' && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6 py-16">
            <div className="relative w-[280px] h-[430px] preserve-3d flex flex-col justify-center items-center">
              <motion.div
                animate={{ y: -90, rotateX: -70, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="w-full h-20 rounded-t-xl border-2 border-b-0 border-[#F59E0B] overflow-hidden relative shadow z-20 bg-[#0B0F19]"
              >
                <img src="/CardGachaDisney.png" alt="Pack Top" className="w-full h-[430px] object-cover" />
              </motion.div>

              <motion.div
                animate={{ y: 50, rotateX: 40 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="w-full h-[360px] rounded-b-xl border-2 border-t-0 border-[#F59E0B] overflow-hidden relative shadow z-10 bg-[#0B0F19]"
              >
                <img src="/CardGachaDisney.png" alt="Pack Bottom" className="w-full h-[430px] object-cover -mt-20" />
              </motion.div>

              <motion.div
                initial={{ scale: 0.4, y: 120, opacity: 0 }}
                animate={{ scale: 1.1, y: -30, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute z-30 flex items-center justify-center"
              >
                <div className="w-[210px] h-[300px] rounded-xl border border-[#F59E0B] shadow overflow-hidden bg-[#0B0F19]">
                  <img src="/Lorcana_Card_Back.png" alt="Revealing Cards Stack" className="w-full h-full object-cover" />
                </div>
              </motion.div>

              <div className="absolute font-cinzel font-bold text-xl text-[#F59E0B] z-40 top-1/2 -translate-y-1/2 bg-[#0B0F19] px-6 py-2.5 rounded-lg border border-[#30363d]">
                {language === 'th' ? 'กำลังเปิดซองฟอยล์...' : 'OPENING FOIL PACK...'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: 3D CARD REVEAL */}
        {packState === 'opened' && (
          <div className="w-full flex flex-col items-center space-y-6 py-2">
            <div className="flex justify-between items-center w-full pb-3 border-b border-[#30363d] font-mono text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-[#F59E0B] text-sm">{language === 'th' ? 'การ์ดในซอง' : 'Booster Reveal'}</span>
                <span className="bg-[#141a26] border border-[#30363d] px-3 py-1 rounded-lg text-[#F59E0B] font-bold">
                  {language === 'th' ? `ใบที่ ${currentCardIndex + 1} / 12` : `Card ${currentCardIndex + 1} / 12`}
                </span>
              </div>

              <div className="text-[#F59E0B] font-bold flex items-center gap-1">
                <Eye className="w-4 h-4 text-[#F59E0B]" />
                {language === 'th'
                  ? (!isCurrentFlipped ? 'คลิกการ์ดเพื่อเปิดดู' : 'คลิกอีกครั้งเพื่อดูใบถัดไป')
                  : (!isCurrentFlipped ? 'Click card to Flip' : 'Click card again for Next Card')}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center my-2">
              <div
                ref={cardRef}
                role="button"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className={`w-[290px] h-[410px] md:w-[320px] md:h-[450px] rounded-xl relative cursor-pointer transition-transform duration-100 ease-out preserve-3d ${
                  isCurrentFlipped ? getRarityGlow(currentCard?.rarity) : 'border border-[#30363d]'
                }`}
                style={{
                  transform: `perspective(1000px) rotateX(${cardRotX}deg) rotateY(${cardRotY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className="w-full h-full relative transition-transform duration-500 ease-out preserve-3d"
                  style={{
                    transform: isCurrentFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* CARD BACK */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-[#0B0F19]"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <img
                      src="/Lorcana_Card_Back.png"
                      alt="Lorcana Card Back"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center font-cinzel text-xs font-bold text-[#F59E0B] bg-[#0B0F19]/90 py-1.5 border-t border-[#30363d]">
                      {language === 'th' ? 'คลิกการ์ดเพื่อเปิดดู' : 'Click Card to Flip'}
                    </div>
                  </div>

                  {/* CARD FRONT */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-[#0B0F19]"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-[#141a26] border border-[#30363d] rounded-xl flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                        <span className="font-cinzel text-sm font-bold text-[#F59E0B] line-clamp-2">{currentCard.name}</span>
                        <span className="text-[9px] text-[#94A3B8] font-mono mt-1">Image unavailable</span>
                      </div>
                      <img
                        src={currentCard.imageUrl}
                        alt={currentCard.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover rounded-xl relative z-10"
                      />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center font-cinzel text-xs font-bold text-[#F59E0B] bg-[#0B0F19]/90 py-1.5 border-t border-[#30363d] flex items-center justify-center gap-1 z-30">
                      {language === 'th' ? `ดูใบถัดไป (${currentCardIndex + 1}/12)` : `Click to Next Card (${currentCardIndex + 1}/12)`} <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {isCurrentFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center space-y-1"
                >
                  <div className="font-cinzel font-bold text-xl text-[#F59E0B]">{currentCard.name}</div>
                  <div className="text-xs font-mono text-[#94A3B8] font-bold uppercase flex items-center justify-center gap-1.5">
                    <span>{translateRarity(currentCard.rarity || 'Common', language)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><InkSymbol ink={currentCard.ink} size={14} /> {translateInkColor(currentCard.ink, language)}</span>
                    <span>•</span>
                    <span>{translateCardType(currentCard.type, language)}</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
              <button
                onClick={() => generatePack()}
                className="px-6 py-2.5 bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] text-[#F1F5F9] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> {t.openAnotherPack}
              </button>

              <button
                onClick={() => {
                  onAddCardsToDeck(packCards);
                  onClose();
                }}
                className="px-8 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-black" /> {t.addAllToDeck}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
