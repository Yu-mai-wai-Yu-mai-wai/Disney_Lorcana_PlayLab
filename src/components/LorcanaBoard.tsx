import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, RotateCw, Plus, Minus, Layers, Zap } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';

// Sample Cards for Playground Demo
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
    imageUrl: 'https://images.lorcana-api.com/cards/1/mickey_mouse_wayward_sorcerer.jpg',
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
    imageUrl: 'https://images.lorcana-api.com/cards/1/elsa_spirit_of_winter.jpg',
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
    imageUrl: 'https://images.lorcana-api.com/cards/1/stitch_rock_star.jpg',
  },
  {
    id: '4',
    name: 'Dragon Fire',
    title: '',
    cost: 5,
    inkwell: false,
    ink: 'Ruby',
    type: 'Action',
    rarity: 'Uncommon',
    imageUrl: 'https://images.lorcana-api.com/cards/1/dragon_fire.jpg',
  },
];

export const LorcanaBoard: React.FC = () => {
  const [lore, setLore] = useState(0);
  const [inkwellCount, setInkwellCount] = useState(3);
  const [exertedCards, setExertedCards] = useState<Record<string, boolean>>({});

  const toggleExert = (id: string) => {
    setExertedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls & Lore Counter */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-purple-500/20">
        {/* Lore Tracker */}
        <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>Lore Counter:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLore((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 w-8 text-center">
              {lore}
            </span>

            <button
              onClick={() => setLore((prev) => Math.min(20, prev + 1))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[10px] text-amber-300/60 font-semibold uppercase tracking-wider">
            (Goal: 20 Lore)
          </span>
        </div>

        {/* Inkwell Counter */}
        <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>Inkwell Count:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInkwellCount((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="text-xl font-bold text-purple-300 w-6 text-center">{inkwellCount}</span>

            <button
              onClick={() => setInkwellCount((prev) => prev + 1)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>1P Guest Playground Active</span>
        </div>
      </div>

      {/* Main Play Area Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {SAMPLE_CARDS.map((card) => {
          const isExerted = exertedCards[card.id] || false;

          return (
            <motion.div
              key={card.id}
              layout
              animate={{ rotate: isExerted ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative glass-panel rounded-2xl p-4 border border-slate-800 hover:border-purple-500/50 shadow-xl group"
            >
              {/* Card Badge Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                  {card.ink}
                </span>

                <div className="flex items-center gap-1 font-extrabold text-amber-400 text-xs bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                  <span>Cost:</span>
                  <span>{card.cost}</span>
                </div>
              </div>

              {/* Card Image Simulation Placeholder */}
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center mb-3 group-hover:scale-105 transition-transform">
                <Shield className="w-10 h-10 text-purple-400/80 mb-2" />
                <h3 className="font-bold text-sm text-slate-100">{card.name}</h3>
                {card.title && <p className="text-[11px] text-purple-300/70 italic">{card.title}</p>}
              </div>

              {/* Stats Footer */}
              {card.type === 'Character' && (
                <div className="flex items-center justify-between text-xs font-bold bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 mb-3">
                  <span className="text-rose-400">⚔️ Str: {card.strength}</span>
                  <span className="text-sky-400">🛡️ Will: {card.willpower}</span>
                  <span className="text-amber-400">✨ Lore: {card.lore}</span>
                </div>
              )}

              {/* Action Controls */}
              <button
                onClick={() => toggleExert(card.id)}
                className="w-full py-2 bg-slate-800 hover:bg-purple-900/60 text-purple-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isExerted ? 'Ready Card (0°)' : 'Exert Card (90°)'}</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
