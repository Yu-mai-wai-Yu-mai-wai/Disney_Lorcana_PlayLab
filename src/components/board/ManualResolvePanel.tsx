import React, { useState } from 'react';
import { X, Sparkles, Droplets, Skull, Plus, Minus, Layers, AlertCircle } from 'lucide-react';
import type { LorcanaCard } from '../../types/lorcana';

interface ManualResolvePanelProps {
  isOpen: boolean;
  onClose: () => void;
  playerLore: number;
  opponentLore: number;
  onSetLore: (target: 'player' | 'opponent', lore: number) => void;
  fieldCards: LorcanaCard[];
  opponentFieldCards: LorcanaCard[];
  damage: Record<string, number>;
  onSetDamage: (cardId: string, damage: number) => void;
  onBanishCard: (cardId: string, isOpponent: boolean) => void;
  onDrawCard: () => void;
}

export const ManualResolvePanel: React.FC<ManualResolvePanelProps> = ({
  isOpen,
  onClose,
  playerLore,
  opponentLore,
  onSetLore,
  fieldCards,
  opponentFieldCards,
  damage,
  onSetDamage,
  onBanishCard,
  onDrawCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allCards = [
    ...fieldCards.map((c) => ({ card: c, isOpponent: false })),
    ...opponentFieldCards.map((c) => ({ card: c, isOpponent: true })),
  ];

  const selectedCard = allCards.find((c) => c.card.id === selectedCardId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-resolve-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#121927] border border-[#2d3a52] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3a52] bg-[#182235]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-[#F59E0B] border border-amber-500/30">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 id="manual-resolve-title" className="font-cinzel text-base font-bold text-white tracking-wide">
                Manual Ability Resolver & Arbiter Panel
              </h2>
              <p className="text-xs text-slate-300">
                Use tools below to execute card mechanics that require manual player judgment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close arbiter panel"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Draw */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#182338] border border-[#2e3b54]">
            <div>
              <span className="font-cinzel text-sm font-bold text-white">Draw Additional Card</span>
              <p className="text-xs text-slate-300">Draw directly into your hand (e.g. from look at top N ability)</p>
            </div>
            <button
              onClick={onDrawCard}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-cinzel text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Layers className="w-4 h-4" />
              <span>Draw 1 Card</span>
            </button>
          </div>

          {/* Adjust Lore Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player Lore */}
            <div className="p-4 rounded-xl bg-[#182338] border border-[#2e3b54]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-cinzel text-xs font-bold text-amber-400 uppercase">Your Lore</span>
                <span className="font-cinzel text-xl font-black text-white">{playerLore}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetLore('player', Math.max(0, playerLore - 1))}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Minus className="w-3.5 h-3.5" /> 1
                </button>
                <button
                  onClick={() => onSetLore('player', Math.min(20, playerLore + 1))}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono font-bold flex items-center justify-center gap-1 border border-amber-500/40 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Plus className="w-3.5 h-3.5" /> 1
                </button>
              </div>
            </div>

            {/* Opponent Lore */}
            <div className="p-4 rounded-xl bg-[#182338] border border-[#2e3b54]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-cinzel text-xs font-bold text-slate-300 uppercase">Opponent Lore</span>
                <span className="font-cinzel text-xl font-black text-white">{opponentLore}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetLore('opponent', Math.max(0, opponentLore - 1))}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Minus className="w-3.5 h-3.5" /> 1
                </button>
                <button
                  onClick={() => onSetLore('opponent', Math.min(20, opponentLore + 1))}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Plus className="w-3.5 h-3.5" /> 1
                </button>
              </div>
            </div>
          </div>

          {/* Select Character to modify damage or banish */}
          <div className="p-4 rounded-xl bg-[#182338] border border-[#2e3b54] space-y-3">
            <span className="font-cinzel text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Field Characters (Damage & Banish Arbiter)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {allCards.map(({ card, isOpponent }) => {
                const currentDmg = damage[card.id] || 0;
                const isSelected = selectedCardId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`p-2 rounded-xl text-left border transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                        : 'border-[#33425c] bg-[#121927] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-white truncate">
                      <span className="truncate">{card.name}</span>
                      {currentDmg > 0 && (
                        <span className="text-rose-400 font-mono ml-1 shrink-0">-{currentDmg}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isOpponent ? "Opponent's" : 'Your'} Card
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedCard && (
              <div className="mt-4 pt-4 border-t border-[#2e3b54] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Damage Counter:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSetDamage(selectedCard.card.id, Math.max(0, (damage[selectedCard.card.id] || 0) - 1))}
                      className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-sm font-bold text-rose-400 px-2">
                      {damage[selectedCard.card.id] || 0}
                    </span>
                    <button
                      onClick={() => onSetDamage(selectedCard.card.id, (damage[selectedCard.card.id] || 0) + 1)}
                      className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onBanishCard(selectedCard.card.id, selectedCard.isOpponent);
                    setSelectedCardId(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-cinzel text-xs font-bold border border-rose-500/40 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Banish to Discard</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2d3a52] bg-[#182235] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-cinzel text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
