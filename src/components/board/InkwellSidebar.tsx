import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Skull, Droplets, Library } from 'lucide-react';

export interface InkwellSidebarProps {
  isDraggingOverInkwell: boolean;
  opponentDeckCount: number;
  opponentDiscardCount: number;
  availableInk: number;
  inkwellCapacity: number;
  hasInkedThisTurn: boolean;
  deckCount: number;
  discardCount: number;
  onDeckClick: () => void;
}

export const InkwellSidebar: React.FC<InkwellSidebarProps> = ({
  isDraggingOverInkwell,
  opponentDeckCount,
  opponentDiscardCount,
  availableInk,
  inkwellCapacity,
  hasInkedThisTurn,
  deckCount,
  discardCount,
  onDeckClick,
}) => {
  return (
    <aside
      className={`hidden md:grid md:w-60 lg:w-72 border-r border-[#30363d] bg-[#141a26] p-3.5 pb-1.5 grid-rows-[auto_1fr_auto] z-20 shrink-0 h-full overflow-hidden transition-colors ${
        isDraggingOverInkwell ? 'border-2 border-[#F59E0B] bg-[#1e2638]' : ''
      }`}
    >
      {/* Opponent Piles */}
      <div className="space-y-1.5 border-b border-[#30363d] pb-2.5 shrink-0">
        <div className="text-[11px] font-cinzel font-bold text-[#F59E0B] flex justify-between items-center">
          <span>OPPONENT PILES</span>
          <span className="text-[#94A3B8] font-mono text-[10px] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Active
          </span>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-28 rounded-lg border border-[#30363d] flex flex-col items-center justify-between p-1.5 relative overflow-hidden bg-[#0B0F19]">
            <img
              src="/Lorcana_Card_Back.png"
              alt="Opponent Deck Back"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-[#0B0F19]/40" />
            <Layers className="w-5 h-5 text-[#F59E0B] z-10" />
            <span className="text-[11px] font-mono font-bold text-white z-10 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">
              {opponentDeckCount}
            </span>
          </div>
          <div className="flex-1 h-28 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-1.5 relative">
            <Skull className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-[10px] font-cinzel font-bold text-[#94A3B8]">GRAVE</span>
            <span className="text-[11px] font-mono font-bold text-[#94A3B8] mt-0.5">
              {opponentDiscardCount}
            </span>
          </div>
        </div>
      </div>

      {/* Inkwell Reserve Zone */}
      <div className="space-y-2 py-2 min-h-0 flex flex-col">
        <div className="flex justify-between items-center text-xs font-cinzel font-bold text-[#F59E0B] shrink-0">
          <span className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" /> INKWELL ZONE
          </span>
          <motion.span
            key={availableInk}
            initial={{ scale: 1.2, color: '#FCD34D' }}
            animate={{ scale: 1, color: '#F59E0B' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="font-mono text-sm font-bold"
          >
            {availableInk}/{inkwellCapacity}
          </motion.span>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 p-2 bg-[#0B0F19] rounded-xl border border-[#30363d] relative">
          {Array.from({ length: Math.max(6, inkwellCapacity) }).map((_, i) => {
            const isReady = i < availableInk;
            const isExerted = !isReady && i < inkwellCapacity;

            return (
              <motion.div
                key={i}
                layout
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: i * 0.02 }}
                className={`h-full min-h-9 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                  isReady
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#F59E0B]'
                    : isExerted
                    ? 'bg-[#141a26] border-[#30363d] text-[#94A3B8]'
                    : 'bg-[#0B0F19]/50 border-[#30363d]/40 text-[#94A3B8]/30'
                }`}
              >
                <Droplets
                  className={`w-3.5 h-3.5 ${
                    isReady ? 'text-[#F59E0B] fill-[#F59E0B]' : isExerted ? 'text-[#94A3B8]' : 'text-[#94A3B8]/30'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono mt-0.5 ${
                    isReady ? 'text-[#F59E0B] font-bold' : isExerted ? 'text-[#94A3B8] font-semibold' : 'text-[#94A3B8]/40'
                  }`}
                >
                  {isReady ? 'Ready' : isExerted ? 'Exerted' : 'Empty'}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="text-[9px] font-mono text-center px-2 py-1 rounded-lg border bg-[#0B0F19] border-[#30363d] text-[#F59E0B] font-semibold">
          {hasInkedThisTurn ? 'Inked this turn (1/1 Limit)' : 'Drag Card Here to Add Ink'}
        </div>
      </div>

      {/* Player Piles */}
      <div className="space-y-1.5 border-t border-[#30363d] pt-2.5 shrink-0">
        <div className="text-[11px] font-cinzel font-bold text-[#F59E0B]">YOUR PILES</div>
        <div className="flex gap-2">
          {/* Draw Deck */}
          <motion.div
            role="button"
            tabIndex={0}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={onDeckClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDeckClick();
              }
            }}
            className="flex-1 h-32 rounded-lg border-2 border-[#F59E0B] flex flex-col items-center justify-between p-2 relative cursor-pointer hover:border-amber-300 transition-colors overflow-hidden bg-[#0B0F19]"
            title="Deck (Draws automatically at turn start)"
          >
            <img
              src="/Lorcana_Card_Back.png"
              alt="Player Deck Back"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#0B0F19]/40" />
            <Library className="w-5 h-5 text-[#F59E0B] z-10" />
            <div className="flex flex-col items-center z-10">
              <span className="text-[10px] font-cinzel font-bold text-white">DECK</span>
              <span className="text-[11px] font-mono font-bold text-[#F59E0B] bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">
                {deckCount}
              </span>
            </div>
          </motion.div>

          {/* Discard */}
          <div className="flex-1 h-32 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-2 relative cursor-pointer hover:border-rose-400 transition-colors overflow-hidden">
            <Skull className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-[10px] font-cinzel font-bold text-[#F1F5F9]">DISCARD</span>
            <span className="text-[11px] font-mono font-bold text-[#94A3B8] mt-0.5">{discardCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
