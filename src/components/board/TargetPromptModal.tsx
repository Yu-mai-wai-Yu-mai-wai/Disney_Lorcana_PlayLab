import React from 'react';
import { Sparkles, Target, X, Check } from 'lucide-react';
import type { GamePrompt } from '../../game/types';
import type { LorcanaCard } from '../../types/lorcana';

interface TargetPromptModalProps {
  prompt: GamePrompt | null;
  fieldCards: LorcanaCard[];
  opponentFieldCards: LorcanaCard[];
  onSelectTarget: (targetId: string) => void;
  onCancel?: () => void;
}

export const TargetPromptModal: React.FC<TargetPromptModalProps> = ({
  prompt,
  fieldCards,
  opponentFieldCards,
  onSelectTarget,
  onCancel,
}) => {
  if (!prompt) return null;

  const validTargetIds = prompt.validTargetIds || [];
  const allCards = [
    ...fieldCards.map((c) => ({ card: c, isOpponent: false })),
    ...opponentFieldCards.map((c) => ({ card: c, isOpponent: true })),
  ];

  const validCards = allCards.filter((c) => validTargetIds.includes(c.card.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#121927] border-2 border-amber-500 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d3a52] bg-[#182235] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h2 id="prompt-title" className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                Choose Target for Ability
              </h2>
              <p className="text-xs text-amber-300 font-mono mt-0.5">{prompt.message}</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              aria-label="Cancel targeting"
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Target candidates */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {validCards.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">
              No eligible targets meet the ability requirements on the board.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {validCards.map(({ card, isOpponent }) => (
                <button
                  key={card.id}
                  onClick={() => onSelectTarget(card.id)}
                  className="p-3 rounded-xl border border-amber-500/40 bg-[#182338] hover:bg-amber-500/10 hover:border-amber-400 text-left transition-all flex items-center justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <div>
                    <span className="font-cinzel text-xs font-bold text-white block group-hover:text-amber-300">
                      {card.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {isOpponent ? 'Opponent Character' : 'Your Character'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono mt-0.5 block">
                      Str: {card.strength || 0} / Will: {card.willpower || 0}
                    </span>
                  </div>
                  <span className="p-1 rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <Check className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
