import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, RotateCcw, Plus, Star, Eye, Layers, Zap, Gift, Scissors, RotateCw, ChevronRight } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';

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

    // Fisher-Yates Shuffle Helper
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

    // Add up to 6 Commons
    commons.slice(0, 6).forEach((c) => newPack.push(c));
    // Add up to 3 Uncommons
    uncommons.slice(0, 3).forEach((c) => newPack.push(c));
    // Add up to 2 Rares / Epics
    (epics.length > 0 ? epics : rares).slice(0, 2).forEach((c) => newPack.push(c));

    // Wild Ultra Rare / Legendary / Iconic Slot
    if (ultraRares.length > 0 && Math.random() < 0.45) {
      newPack.push(ultraRares[0]);
    } else if (rares.length > 2) {
      newPack.push(rares[2]);
    }

    // Fill remaining up to 12 cards from pool
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

  // Generate fresh pack whenever modal opens or database changes
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

  // Pointer Event Handlers for 360° Pack Rotation
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

  // 3D Card Peek Handler for Revealed Card
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
      opacity: 0.85,
    });
  };

  const handleCardMouseLeave = () => {
    setCardRotX(0);
    setCardRotY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  // Direct Card Tap/Click Handler: Click 1 = Flip Card, Click 2 = Advance to Next Card!
  const handleCardClick = () => {
    const isFlipped = flippedCards[currentCardIndex];
    if (!isFlipped) {
      // First Click: Flip card to reveal front artwork!
      setFlippedCards((prev) => ({ ...prev, [currentCardIndex]: true }));
    } else {
      // Second Click: Advance smoothly to next card!
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
        return 'shadow-[0_0_80px_rgba(239,68,68,0.95)] border-2 border-rose-400 animate-pulse';
      case 'Enchanted':
        return 'shadow-[0_0_70px_rgba(236,72,153,0.9)] border-2 border-pink-400';
      case 'Epic':
        return 'shadow-[0_0_60px_rgba(249,115,22,0.9)] border-2 border-orange-400';
      case 'Special':
        return 'shadow-[0_0_50px_rgba(16,185,129,0.85)] border-2 border-emerald-400';
      case 'Legendary':
        return 'shadow-[0_0_60px_rgba(245,158,11,0.9)] border-2 border-amber-400';
      case 'Super Rare':
        return 'shadow-[0_0_50px_rgba(168,85,247,0.85)] border-2 border-purple-400';
      case 'Rare':
        return 'shadow-[0_0_40px_rgba(234,179,8,0.7)] border border-amber-400/80';
      case 'Uncommon':
        return 'shadow-[0_0_30px_rgba(148,163,184,0.6)] border border-slate-300/60';
      default:
        return 'shadow-[0_0_20px_rgba(100,116,139,0.4)] border border-slate-700';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Booster Pack" overlayClassName="bg-slate-950/90 backdrop-blur-2xl font-outfit select-none overflow-y-auto">
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center justify-center min-h-[640px] pointer-events-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="absolute top-0 right-4 p-2.5 text-slate-300 hover:text-white rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer z-50 shadow-2xl"
        >
          <X className="w-6 h-6" />
        </button>

          {/* STEP 1: PURE 3D BOOSTER PACK */}
          {packState === 'sealed' && (
            <div className="flex flex-col items-center justify-center flex-1 my-auto w-full">
              {/* 3D PACK CANVAS VIEWPORT */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-[300px] h-[450px] md:w-[330px] md:h-[490px] flex items-center justify-center cursor-grab active:cursor-grabbing preserve-3d touch-none group"
              >
                {/* 3D PHYSICAL FOIL PACK OBJECT */}
                <div
                  className="relative w-[290px] h-[440px] md:w-[320px] md:h-[480px] preserve-3d shadow-[0_0_90px_rgba(245,158,11,0.7)] transition-transform duration-75"
                  style={{
                    transform: `perspective(1000px) rotateX(${packRotX}deg) rotateY(${packRotY}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* FRONT FACE */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-slate-950"
                    style={{ transform: 'translateZ(6px)', backfaceVisibility: 'hidden' }}
                  >
                    <img
                      src="/CardGachaDisney.png"
                      alt="Disney Lorcana Booster Pack Front"
                      className="w-full h-full object-cover rounded-2xl"
                    />

                    {/* Plastic Foil Gloss Reflection */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/35 via-transparent to-white/20 mix-blend-overlay" />

                    {/* DASHED TEAR LINE & SLICING DRAG CONTROL */}
                    <div
                      className="absolute top-14 left-5 right-5 z-30 flex items-center"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="w-full h-0 border-t-2 border-dashed border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.9)] relative">
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-950/90 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/60 shadow pointer-events-none">
                          ✂️ Drag to Slice Open
                        </span>
                      </div>

                      {/* Scissors Handle */}
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
                        className="absolute left-0 -top-4 w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full border-2 border-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(245,158,11,0.9)] z-40"
                      >
                        <Scissors className="w-5 h-5 text-slate-950 stroke-[2.5]" />
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
                      className="absolute bottom-3 left-6 right-6 text-center font-cinzel text-[10px] font-bold text-amber-300 bg-slate-950/80 py-1.5 rounded-lg border border-amber-400/40 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                    >
                      Click or Slice to Open
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-950 via-slate-950 to-purple-950 border-2 border-amber-400 p-6 flex flex-col justify-between items-center overflow-hidden shadow-2xl"
                    style={{ transform: 'rotateY(180deg) translateZ(6px)', backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-amber-500/40 via-yellow-400/80 to-amber-500/40 border-x border-amber-300/60 shadow-lg" />
                    
                    <div className="font-cinzel text-sm font-bold text-amber-300 z-10 text-center">
                      DISNEY LORCANA<br />TRADING CARD GAME
                    </div>

                    <div className="bg-white/90 p-2 rounded text-slate-950 font-mono text-[9px] font-bold z-10 text-center shadow">
                      BARCODE: 4005556110902
                    </div>

                    <div className="text-[9px] text-amber-200/80 font-mono z-10 text-center">
                      Official 3D Physical Foil Pack
                    </div>
                  </div>

                  {/* LEFT THICKNESS SIDE */}
                  <div
                    className="absolute top-0 bottom-0 left-0 w-3 bg-amber-500/80 shadow"
                    style={{ transform: 'rotateY(-90deg) translateZ(6px)', backfaceVisibility: 'hidden' }}
                  />

                  {/* RIGHT THICKNESS SIDE */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-3 bg-amber-500/80 shadow"
                    style={{ transform: 'rotateY(90deg) translateZ(294px)', backfaceVisibility: 'hidden' }}
                  />
                </div>
              </div>

              {/* Task 8: Keyboard / Mobile alternative button */}
              <button
                onClick={handleStartTearPack}
                className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                Open Pack (เปิดซอง)
              </button>
            </div>
          )}

          {/* STEP 2: 3D TEARING ANIMATION */}
          {packState === 'tearing' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6 py-16">
              <div className="relative w-[280px] h-[430px] preserve-3d flex flex-col justify-center items-center">
                {/* Top Foil Half Rips Upwards */}
                <motion.div
                  animate={{ y: -90, rotateX: -70, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                  className="w-full h-20 rounded-t-3xl border-4 border-b-0 border-amber-300 overflow-hidden relative shadow-2xl z-20 bg-purple-950"
                >
                  <img src="/CardGachaDisney.png" alt="Pack Top" className="w-full h-[430px] object-cover" />
                  <div className="absolute inset-0 bg-amber-400/30" />
                </motion.div>

                {/* Bottom Foil Half Rips Downwards */}
                <motion.div
                  animate={{ y: 50, rotateX: 40 }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                  className="w-full h-[360px] rounded-b-3xl border-4 border-t-0 border-amber-300 overflow-hidden relative shadow-2xl z-10 bg-purple-950"
                >
                  <img src="/CardGachaDisney.png" alt="Pack Bottom" className="w-full h-[430px] object-cover -mt-20" />
                </motion.div>

                {/* 12 Cards Stack Erupts */}
                <motion.div
                  initial={{ scale: 0.4, y: 120, opacity: 0 }}
                  animate={{ scale: 1.1, y: -30, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute z-30 flex items-center justify-center"
                >
                  <div className="w-[210px] h-[300px] rounded-2xl border-2 border-amber-400 shadow-[0_0_70px_rgba(245,158,11,0.95)] overflow-hidden bg-slate-950">
                    <img src="/Lorcana_Card_Back.png" alt="Revealing Cards Stack" className="w-full h-full object-cover" />
                  </div>
                </motion.div>

                <div className="absolute font-cinzel font-black text-2xl text-amber-300 animate-pulse z-40 drop-shadow top-1/2 -translate-y-1/2 bg-slate-950/90 px-6 py-2.5 rounded-2xl border border-amber-400/80">
                  SLICING 3D FOIL PACK...
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 100% RELIABLE 3D CARD REVEAL (CLICK 1 = FLIP, CLICK 2 = NEXT CARD!) */}
          {packState === 'opened' && (
            <div className="w-full flex flex-col items-center space-y-6 py-2">
              {/* Top Progress Badge */}
              <div className="flex justify-between items-center w-full pb-3 border-b border-slate-800 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel font-bold text-amber-300 text-sm">Booster Reveal</span>
                  <span className="bg-slate-900/90 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 font-bold">
                    Card {currentCardIndex + 1} / 12
                  </span>
                </div>

                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Eye className="w-4 h-4 text-amber-400" />
                  {!isCurrentFlipped ? 'Click card to Flip 🔄' : 'Click card again to Next Card ➡️'}
                </div>
              </div>

              {/* SINGLE CENTERED 3D CARD WITH PERFECT 3D FLIP MATH & RELIABLE ONCLICK */}
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
                  className={`w-[290px] h-[410px] md:w-[320px] md:h-[450px] rounded-2xl relative cursor-pointer transition-transform duration-100 ease-out preserve-3d ${
                    isCurrentFlipped ? getRarityGlow(currentCard?.rarity) : 'shadow-2xl border-2 border-amber-400/60'
                  }`}
                  style={{
                    transform: `perspective(1000px) rotateX(${cardRotX}deg) rotateY(${cardRotY}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* INNER 3D FLIP CONTAINER THAT ROTATES 180 DEGREE ON Y-AXIS */}
                  <div
                    className="w-full h-full relative transition-transform duration-500 ease-out preserve-3d"
                    style={{
                      transform: isCurrentFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* CARD BACK (Unrevealed State facing 0deg) */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-amber-400/40 bg-slate-950"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src="/Lorcana_Card_Back.png"
                        alt="Lorcana Card Back"
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-150"
                        style={{
                          opacity: glarePos.opacity,
                          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.5) 0%, transparent 70%)`,
                        }}
                      />
                      <div className="absolute bottom-4 left-0 right-0 text-center font-cinzel text-xs font-bold text-amber-300 bg-slate-950/90 py-1.5 border-t border-amber-400/40 shadow">
                        Click Card to Flip 🔄
                      </div>
                    </div>

                    {/* CARD FRONT (Revealed Front Artwork facing 180deg) */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-slate-950"
                      style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                    >
                      <div className="relative w-full h-full rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                          <span className="font-cinzel text-sm font-bold text-amber-300 line-clamp-2">{currentCard.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">Image unavailable</span>
                        </div>
                        <img
                          src={currentCard.imageUrl}
                          alt={currentCard.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover rounded-2xl relative z-10"
                        />
                      </div>
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-150 z-20"
                        style={{
                          opacity: glarePos.opacity,
                          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.6) 0%, transparent 70%)`,
                        }}
                      />
                      <div className="absolute bottom-4 left-0 right-0 text-center font-cinzel text-xs font-bold text-amber-300 bg-slate-950/90 py-1.5 border-t border-amber-400/40 shadow flex items-center justify-center gap-1 z-30">
                        Click to Next Card ({currentCardIndex + 1}/12) <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Name & Rarity Banner when Flipped */}
                {isCurrentFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center space-y-1"
                  >
                    <div className="font-cinzel font-black text-xl text-amber-300">{currentCard.name}</div>
                    <div className="text-xs font-mono text-amber-200/90 font-bold uppercase flex items-center justify-center gap-1.5">
                      <span>{currentCard.rarity || 'Common'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><InkSymbol ink={currentCard.ink} size={14} /> {currentCard.ink}</span>
                      <span>•</span>
                      <span>{currentCard.type}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom Action Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
                <button
                  onClick={() => generatePack()}
                  className="px-6 py-3 bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Open New Pack (เปิดซองใหม่)
                </button>

                <button
                  onClick={() => {
                    onAddCardsToDeck(packCards);
                    onClose();
                  }}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-black text-xs uppercase tracking-wider rounded-xl shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" /> Add All 12 Cards To Deck
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
  );
};
