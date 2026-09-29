import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, Droplets, Sword, Sparkles, Zap } from 'lucide-react';
import type { LorcanaCard } from '../LorcanaBoard';

export interface PlayerBattlefieldProps {
  isDraggingCard: boolean;
  fieldCards: LorcanaCard[];
  opponentFieldCards: LorcanaCard[];
  exertedCards: Record<string, boolean>;
  damage: Record<string, number>;
  selectedAttacker: string | null;
  onCardInteraction: (card: LorcanaCard) => void;
  onQuest: (card: LorcanaCard) => void;
  onSelectAttackerToggle: (cardId: string) => void;
  onInspectCard: (card: LorcanaCard) => void;
  onHoverCard: (card: LorcanaCard | null) => void;
}

export const PlayerBattlefield: React.FC<PlayerBattlefieldProps> = ({
  isDraggingCard,
  fieldCards,
  opponentFieldCards,
  exertedCards,
  damage,
  selectedAttacker,
  onCardInteraction,
  onQuest,
  onSelectAttackerToggle,
  onInspectCard,
  onHoverCard,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-1 relative min-h-0">
      <div className="text-[9px] font-cinzel font-bold text-[#F59E0B] mb-1 uppercase tracking-widest flex items-center gap-2">
        <span>Your Battlefield Area</span>
        <span className="text-[8px] font-mono text-[#94A3B8] font-normal">
          (Click ⚡ to Quest • Click ⚔️ to Challenge • Auto-Exerts)
        </span>
      </div>

      {/* ACTIVE DRAG-TO-PLAY DROPZONE HIGHLIGHT */}
      <AnimatePresence>
        {isDraggingCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute inset-x-4 inset-y-1 border-4 border-dashed border-[#F59E0B] bg-[#F59E0B]/20 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none z-30 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
          >
            <ArrowUpCircle className="w-8 h-8 text-[#F59E0B] animate-bounce" />
            <span className="font-cinzel text-sm font-bold text-[#F59E0B] uppercase tracking-widest">
              Release Card Here to Play / Ink
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-5 md:gap-8 xl:gap-12 w-full h-full max-h-40 sm:max-h-48 md:max-h-56 xl:max-h-64 overflow-y-auto no-scrollbar py-1">
        {fieldCards.map((card) => {
          const isExerted = exertedCards[card.id] || false;
          const isAttacking = selectedAttacker === card.id;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: isExerted ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              role="button"
              tabIndex={0}
              onMouseEnter={() => onHoverCard(card)}
              onTouchStart={() => onHoverCard(card)}
              onMouseLeave={() => onHoverCard(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                onInspectCard(card);
              }}
              onClick={() => onCardInteraction(card)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCardInteraction(card);
                }
              }}
              className={`w-24 h-32 sm:w-32 sm:h-44 md:w-36 md:h-52 xl:w-40 xl:h-56 rounded-xl relative cursor-pointer transition-colors group card-foil-light ${
                isAttacking
                  ? 'border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                  : isExerted
                  ? 'border-2 border-[#F59E0B]'
                  : 'border border-[#30363d] hover:border-[#F59E0B]'
              }`}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#141a26]">
                <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-1.5 text-center pointer-events-none">
                  <span className="font-cinzel text-[10px] font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                  <span className="text-[8px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                </div>
                <img
                  src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                  alt={card.name || 'Disney Lorcana Card'}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                  }}
                  className="w-full h-full object-cover rounded-xl relative z-10"
                />
              </div>

              {card.isWet && (
                <div className="absolute inset-0 bg-[#0B0F19]/70 rounded-xl flex flex-col items-center justify-center pointer-events-none z-20">
                  <Droplets className="w-5 h-5 text-[#F59E0B]" />
                  <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] bg-[#0B0F19] px-1.5 py-0.5 rounded mt-0.5 border border-[#30363d]">
                    Drying...
                  </span>
                </div>
              )}

              {(damage[card.id] || 0) > 0 && (
                <div className="absolute top-1 left-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold z-30 border-2 border-[#141a26]">
                  -{damage[card.id]}
                </div>
              )}

              {!card.isWet && (
                <div className="absolute top-1 right-1 flex flex-col gap-1.5 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuest(card);
                    }}
                    disabled={isExerted}
                    aria-label="Quest"
                    className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-2 sm:p-1.5 rounded-full transition-colors cursor-pointer font-bold flex items-center justify-center shadow-md"
                    title={isExerted ? 'Already exerted (exhausted)' : `Quest for +${card.lore || 1} Lore (Auto-exerts)`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                  </button>
                  {opponentFieldCards.length > 0 && !isExerted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAttackerToggle(card.id);
                      }}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-md ${
                        selectedAttacker === card.id
                          ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                          : 'bg-rose-400 hover:bg-rose-500 text-black'
                      }`}
                      title="Challenge Opponent (Auto-exerts upon attack)"
                    >
                      <Sword className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="absolute bottom-1 left-1 right-1 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d] flex justify-between items-center text-[9px] font-mono font-bold z-20 text-[#F1F5F9]">
                <span className="flex items-center gap-0.5">
                  <Sword className="w-2.5 h-2.5 text-[#F59E0B]" />
                  {card.strength}/{card.willpower}
                </span>
                <span className="flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-[#F59E0B]" />
                  {card.lore}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
