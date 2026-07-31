import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCw, Plus, Minus, Zap, Shield, Sword, Award, Flame } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';

// Rich High-Res Lorcana Card Dataset with Real Art & Stats
const SAMPLE_CARDS: LorcanaCard[] = [
  {
    id: '1',
    name: 'Mickey Mouse',
    title: 'Wayward Sorcerer',
    cost: 4,
    inkwell: true,
    ink: 'Amethyst',
    type: 'Character',
    rarity: 'Super Rare',
    strength: 3,
    willpower: 4,
    lore: 2,
    artist: 'Nicholas Kole',
    imageUrl: 'https://cards.lorcast.io/lc/set1/115/en/medium.png',
  },
  {
    id: '2',
    name: 'Elsa',
    title: 'Spirit of Winter',
    cost: 8,
    inkwell: true,
    ink: 'Amethyst',
    type: 'Character',
    rarity: 'Legendary',
    strength: 4,
    willpower: 6,
    lore: 3,
    artist: 'Matthew Robert Davies',
    imageUrl: 'https://cards.lorcast.io/lc/set1/42/en/medium.png',
  },
  {
    id: '3',
    name: 'Stitch',
    title: 'Rock Star',
    cost: 6,
    inkwell: true,
    ink: 'Amber',
    type: 'Character',
    rarity: 'Super Rare',
    strength: 3,
    willpower: 5,
    lore: 2,
    artist: 'Grace Tran',
    imageUrl: 'https://cards.lorcast.io/lc/set1/23/en/medium.png',
  },
  {
    id: '4',
    name: 'Dragon Fire',
    title: 'Banish Chosen Character',
    cost: 5,
    inkwell: false,
    ink: 'Ruby',
    type: 'Action',
    rarity: 'Uncommon',
    artist: 'Alice Pisoni',
    imageUrl: 'https://cards.lorcast.io/lc/set1/112/en/medium.png',
  },
];

export const LorcanaBoard: React.FC = () => {
  const [lore, setLore] = useState(12);
  const [inkwellCount, setInkwellCount] = useState(5);
  const [exertedCards, setExertedCards] = useState<Record<string, boolean>>({});

  const toggleExert = (id: string) => {
    setExertedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuest = (card: LorcanaCard) => {
    if (card.lore && !exertedCards[card.id]) {
      setExertedCards((prev) => ({ ...prev, [card.id]: true }));
      setLore((prev) => Math.min(20, prev + card.lore!));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 playmat-grid-bg rounded-3xl border border-purple-500/20 shadow-2xl mt-4">
      {/* Top Arena Dashboard: Lore Progress & Inkwell */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lore Tracker Meter (Goal 20) */}
        <div className="md:col-span-2 glass-panel-heavy p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg magic-glow-amber">
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h2 className="font-cinzel font-black text-lg text-amber-200 tracking-wider">
                  QUEST LORE TRACKER
                </h2>
                <p className="text-xs text-slate-400">First Illumineer to reach 20 Lore wins the match</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-amber-500/30">
              <button
                onClick={() => setLore((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all hover:scale-110 active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-cinzel text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] w-10 text-center">
                {lore}
              </span>
              <button
                onClick={() => setLore((prev) => Math.min(20, prev + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all hover:scale-110 active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full lore-glow-bar transition-all duration-500"
                style={{ width: `${(lore / 20) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>0 Lore</span>
              <span className="text-amber-400">{20 - lore} Lore needed to Win</span>
              <span>20 Lore Victory</span>
            </div>
          </div>
        </div>

        {/* Inkwell Reserve Dashboard */}
        <div className="glass-panel-heavy p-5 rounded-2xl flex flex-col justify-between space-y-3 border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 shadow-md">
              <Zap className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-base text-purple-200">INKWELL RESERVE</h3>
              <p className="text-xs text-purple-300/70">Ready Ink for playing cards</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInkwellCount((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-2xl text-purple-300 px-3">{inkwellCount}</span>
              <button
                onClick={() => setInkwellCount((prev) => prev + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-bold px-3 py-1 bg-purple-950/80 text-purple-300 rounded-lg border border-purple-700">
              Turn {inkwellCount} Ink
            </span>
          </div>
        </div>
      </div>

      {/* Cards Play Area Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel font-black text-lg text-slate-200 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>PLAY AREA ARENA (CHARACTERS & ACTIONS)</span>
          </h2>
          <span className="text-xs text-purple-300/70 font-semibold">
            Click "Exert" to rotate 90° or "Quest" to earn Lore
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_CARDS.map((card) => {
            const isExerted = exertedCards[card.id] || false;

            return (
              <motion.div
                key={card.id}
                layout
                animate={{ rotate: isExerted ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative glass-panel-heavy rounded-2xl p-4 border border-purple-500/20 hover:border-amber-400/60 shadow-2xl transition-all card-foil-sheen group flex flex-col justify-between space-y-3"
              >
                {/* Top Badge: Cost & Ink Type */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-purple-950/90 text-purple-200 border border-purple-700/60 shadow">
                    {card.ink}
                  </span>

                  <div className="flex items-center gap-1.5 font-black text-slate-950 text-xs bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-1 rounded-xl shadow-md">
                    <span>COST</span>
                    <span className="text-sm">{card.cost}</span>
                  </div>
                </div>

                {/* Card Illustration & Image */}
                <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-950 border border-purple-500/30 group-hover:shadow-2xl transition-all">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback placeholder if image load fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute bottom-2 left-3 right-3 text-left">
                    <h3 className="font-cinzel font-bold text-sm text-white drop-shadow">{card.name}</h3>
                    {card.title && <p className="text-[11px] text-amber-300 font-semibold">{card.title}</p>}
                  </div>
                </div>

                {/* Character Combat Stats Footer */}
                {card.type === 'Character' ? (
                  <div className="flex items-center justify-between text-xs font-black bg-slate-950/90 px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-inner">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Sword className="w-3.5 h-3.5" /> {card.strength}
                    </span>
                    <span className="text-sky-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> {card.willpower}
                    </span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> +{card.lore} Lore
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[11px] font-bold text-purple-300 bg-purple-950/50 rounded-xl border border-purple-800">
                    Action / Spell Card
                  </div>
                )}

                {/* Action Controls */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => toggleExert(card.id)}
                    className="py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isExerted ? 'Ready' : 'Exert'}</span>
                  </button>

                  {card.type === 'Character' && (
                    <button
                      onClick={() => handleQuest(card)}
                      disabled={isExerted}
                      className="py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Quest</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
