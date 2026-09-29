import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, Globe, Palette, PanelRightOpen, PanelRightClose } from 'lucide-react';

export interface BoardTopBarProps {
  inkwellCapacity: number;
  deckCount: number;
  discardCount: number;
  opponentLore: number;
  opponentInk: number;
  opponentInkCapacity: number;
  turnNumber: number;
  turnPhase: 'beginning' | 'main' | 'end';
  onExitMatch?: () => void;
  language: string;
  toggleLanguage: () => void;
  onOpenPlaymat: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const BoardTopBar: React.FC<BoardTopBarProps> = ({
  inkwellCapacity,
  deckCount,
  discardCount,
  opponentLore,
  opponentInk,
  opponentInkCapacity,
  turnNumber,
  turnPhase,
  onExitMatch,
  language,
  toggleLanguage,
  onOpenPlaymat,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-y-1.5 w-full z-20 pb-2 border-b border-[#30363d] shrink-0">
      {/* MOBILE COMPACT PILES BAR (visible < md, replaces hidden left sidebar) */}
      <div className="md:hidden flex items-center gap-1.5 w-full order-first">
        <div className="flex-1 flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-[#141a26] border border-[#30363d] text-[10px] font-mono font-bold">
          <span className="text-sky-400">🌊 {inkwellCapacity}</span>
          <span className="text-[#F1F5F9]">🂠 {deckCount}</span>
          <span className="text-rose-400">💀 {discardCount}</span>
          <span className="text-rose-300">OP Lore {opponentLore}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* OPPONENT LORE */}
        <div
          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 bg-[#141a26] shadow-sm transition-all duration-300 ${
            opponentLore >= 16
              ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] bg-rose-950/30'
              : 'border-rose-500/30 shadow-rose-950/20'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Sparkles className={`w-3.5 h-3.5 text-rose-400 ${opponentLore >= 16 ? 'animate-spin-slow' : ''}`} />
          </div>
          <div className="flex flex-col items-start min-w-[130px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider">
                Opponent Lore
              </span>
              {opponentLore >= 16 && (
                <span className="shimmer-badge badge-shimmer-ruby text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                  DANGER!
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <motion.span
                key={opponentLore}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="font-cinzel text-xl font-black text-rose-400 leading-none"
              >
                {opponentLore}
              </motion.span>
              <span className="font-cinzel text-xs font-bold text-[#94A3B8]">/ 20</span>
            </div>
            <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#30363d] mt-1">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-pink-300 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ width: `${Math.min(100, (opponentLore / 20) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* OPPONENT INK */}
        <div className="px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-2.5 bg-[#141a26] shadow-sm shadow-sky-950/20">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Droplets className="w-3.5 h-3.5 text-sky-400 fill-sky-400/50" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-cinzel font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
              Opponent Ink
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <motion.span
                key={`${opponentInk}-${opponentInkCapacity}`}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="font-mono text-lg font-black text-sky-400 leading-none"
              >
                {opponentInk}
              </motion.span>
              <span className="font-mono text-xs font-bold text-[#94A3B8]">
                / {opponentInkCapacity}
              </span>
            </div>
          </div>

          {/* Visual mini ink pips indicator */}
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-[#30363d]">
            {Array.from({ length: Math.max(1, Math.min(6, opponentInkCapacity || 1)) }).map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-4 rounded-sm transition-all duration-300 ${
                  idx < opponentInk
                    ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                    : opponentInkCapacity > 0
                    ? 'bg-slate-700/60 border border-slate-600/40'
                    : 'bg-slate-800/40 border border-slate-700/30 opacity-40'
                }`}
                title={opponentInkCapacity > 0 ? `Ink Slot ${idx + 1}` : 'No Inkwell'}
              />
            ))}
            {opponentInkCapacity > 6 && (
              <span className="text-[9px] font-mono text-sky-400 font-bold ml-0.5">
                +{opponentInkCapacity - 6}
              </span>
            )}
          </div>
        </div>
      </div>

      <motion.div
        key={`${turnNumber}-${turnPhase}`}
        initial={{ scale: 0.92, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="px-4 py-1.5 rounded-xl border border-[#F59E0B]/50 text-[#F59E0B] font-cinzel font-bold text-xs flex items-center gap-2 bg-[#141a26]"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span className="capitalize">
          {turnPhase} Phase | Turn {turnNumber}
        </span>
      </motion.div>

      <div className="flex items-center gap-2 font-mono text-xs">
        {onExitMatch && (
          <button
            onClick={onExitMatch}
            className="bg-rose-500/10 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Exit Match
          </button>
        )}

        <button
          onClick={toggleLanguage}
          title={`Switch Language (Current: ${language.toUpperCase()})`}
          className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className={language === 'th' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>TH</span>
          <span className="text-[#4B5563]">|</span>
          <span className={language === 'en' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>EN</span>
        </button>

        <button
          onClick={onOpenPlaymat}
          className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          title="Change Battlefield Playmat Skin"
        >
          <Palette className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="hidden sm:inline">Playmat</span>
        </button>

        <button
          onClick={onToggleSidebar}
          className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] p-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          <span className="font-sans text-[11px]">Log</span>
        </button>
      </div>
    </div>
  );
};
