import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Droplets } from 'lucide-react';
import type { LorcanaCard } from '../LorcanaBoard';

export interface OpponentBattlefieldProps {
  opponentFieldCards: LorcanaCard[];
  matchMode: boolean;
  opponentExerted: Record<string, boolean>;
  damage: Record<string, number>;
  selectedAttacker: string | null;
  onAttackTarget: (card: LorcanaCard) => void;
  onInspectCard: (card: LorcanaCard) => void;
  onHoverCard: (card: LorcanaCard | null) => void;
}

export const OpponentBattlefield: React.FC<OpponentBattlefieldProps> = ({
  opponentFieldCards,
  matchMode,
  opponentExerted,
  damage,
  selectedAttacker,
  onAttackTarget,
  onInspectCard,
  onHoverCard,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-1 border-b border-[#30363d]/40 min-h-0">
      <div className="text-[9px] font-cinzel font-bold text-[#F59E0B]/70 mb-1 uppercase tracking-widest">
        Opponent Battlefield ({opponentFieldCards.length} Cards)
        {matchMode && opponentFieldCards.length === 0 && (
          <span className="text-[#94A3B8] normal-case tracking-normal ml-2">
            (waiting for opponent's cards...)
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-5 md:gap-8 xl:gap-12 w-full h-full max-h-36 sm:max-h-44 md:max-h-52 xl:max-h-56 overflow-y-auto no-scrollbar py-1">
        {opponentFieldCards.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-[#30363d] rounded-xl w-full min-h-[90px] sm:min-h-[140px]">
            <Sword className="w-8 h-8 text-[#94A3B8] mb-2" />
            <span className="text-[11px] font-mono text-[#94A3B8]">
              {matchMode ? 'Opponent cards will appear here in real-time' : 'No opponent cards'}
            </span>
          </div>
        )}
        <AnimatePresence>
          {opponentFieldCards.map((card) => {
            const isOpExerted = opponentExerted[card.id] || false;
            const isOpWet = card.isWet || false;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: isOpExerted ? 90 : 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                onMouseEnter={() => onHoverCard(card)}
                onTouchStart={() => onHoverCard(card)}
                onMouseLeave={() => onHoverCard(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onInspectCard(card);
                }}
                onClick={() => {
                  if (selectedAttacker) {
                    onAttackTarget(card);
                  } else {
                    onInspectCard(card);
                  }
                }}
                className={`w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 xl:w-36 xl:h-50 bg-[#141a26] rounded-xl flex items-center justify-center relative overflow-hidden border cursor-pointer ${
                  selectedAttacker
                    ? isOpExerted
                      ? 'border-rose-500 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'border-slate-700 opacity-60 cursor-not-allowed'
                    : isOpExerted
                    ? 'border-[#F59E0B]/60 hover:border-[#F59E0B]'
                    : 'border-[#30363d] hover:border-[#F59E0B]/60'
                }`}
              >
                <img
                  src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                  alt={card.name || 'Disney Lorcana Card'}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                  }}
                  className="w-full h-full object-cover opacity-70"
                />

                {isOpWet && (
                  <div className="absolute inset-0 bg-[#0B0F19]/70 rounded-xl flex flex-col items-center justify-center pointer-events-none z-20">
                    <Droplets className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] bg-[#0B0F19] px-1.5 py-0.5 rounded mt-0.5 border border-[#30363d]">
                      Drying...
                    </span>
                  </div>
                )}

                <span
                  className={`absolute bottom-1 bg-[#0B0F19]/90 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border z-20 ${
                    isOpWet
                      ? 'text-[#F59E0B] border-[#F59E0B]/40'
                      : isOpExerted
                      ? 'text-[#F59E0B] border-[#30363d]'
                      : 'text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isOpWet ? 'Drying' : isOpExerted ? 'Exerted' : 'Ready'}
                </span>
                {selectedAttacker && isOpExerted && (
                  <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center hover:bg-rose-500/40 transition-colors z-20">
                    <Sword className="w-10 h-10 text-rose-500 drop-shadow-md" />
                  </div>
                )}
                {(damage[card.id] || 0) > 0 && (
                  <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold z-30 border-2 border-[#141a26]">
                    -{damage[card.id]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
