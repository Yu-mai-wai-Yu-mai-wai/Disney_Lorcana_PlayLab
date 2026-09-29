import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sword, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';
import type { LorcanaCard } from '../../types/lorcana';
import { parseCardKeywords } from '../../game/keywords';

interface FieldCardProps {
  card: LorcanaCard;
  isExerted: boolean;
  isAttacking: boolean;
  damageAmount: number;
  canQuestNow: boolean;
  questReason?: string;
  canChallengeNow: boolean;
  challengeReason?: string;
  onQuest: () => void;
  onSelectAttacker: () => void;
  onInspect: () => void;
  onHover: (card: LorcanaCard | null) => void;
  hasOpponentTargets: boolean;
}

export const FieldCard: React.FC<FieldCardProps> = ({
  card,
  isExerted,
  isAttacking,
  damageAmount,
  canQuestNow,
  questReason,
  canChallengeNow,
  challengeReason,
  onQuest,
  onSelectAttacker,
  onInspect,
  onHover,
  hasOpponentTargets,
}) => {
  const kw = parseCardKeywords(card);
  const isActionable = canQuestNow || canChallengeNow;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: isExerted ? 90 : 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      role="button"
      tabIndex={0}
      aria-label={`${card.name}, Strength ${card.strength || 0}, Willpower ${card.willpower || 0}, Lore ${card.lore || 0}${
        isExerted ? ', Exerted' : ''
      }${card.isWet ? ', Drying' : ''}`}
      onMouseEnter={() => onHover(card)}
      onTouchStart={() => onHover(card)}
      onMouseLeave={() => onHover(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        onInspect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (canQuestNow) onQuest();
          else if (canChallengeNow) onSelectAttacker();
          else onInspect();
        }
      }}
      className={`w-24 h-32 sm:w-32 sm:h-44 md:w-36 md:h-52 xl:w-40 xl:h-56 rounded-xl relative cursor-pointer transition-all group card-foil-light focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] ${
        isAttacking
          ? 'border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)]'
          : isActionable
          ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.55)] ring-1 ring-amber-300'
          : isExerted
          ? 'border-2 border-[#D97706]/70 opacity-90'
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

      {/* Drying Overlay */}
      {card.isWet && !kw.rush && (
        <div className="absolute inset-0 bg-[#0B0F19]/75 rounded-xl flex flex-col items-center justify-center pointer-events-none z-20">
          <Droplets className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-[9px] font-cinzel font-bold text-amber-300 bg-[#0B0F19] px-2 py-0.5 rounded mt-0.5 border border-amber-500/40">
            Drying...
          </span>
        </div>
      )}

      {/* Damage Counter */}
      {damageAmount > 0 && (
        <div className="absolute top-1 left-1 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-mono font-bold z-30 border-2 border-[#141a26] shadow-sm">
          -{damageAmount}
        </div>
      )}

      {/* Action Buttons with high contrast and engine reasons */}
      <div className="absolute top-1 right-1 flex flex-col gap-1.5 z-30">
        {/* Quest Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canQuestNow) onQuest();
          }}
          disabled={!canQuestNow}
          aria-label={canQuestNow ? `Quest for ${card.lore || 1} Lore` : `Cannot Quest: ${questReason}`}
          title={canQuestNow ? `Quest for +${card.lore || 1} Lore` : questReason}
          className={`p-2 sm:p-1.5 rounded-full transition-all flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
            canQuestNow
              ? 'bg-[#F59E0B] hover:bg-amber-300 text-black cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.5)] ring-1 ring-amber-200'
              : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Challenge Button */}
        {hasOpponentTargets && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canChallengeNow || isAttacking) onSelectAttacker();
            }}
            disabled={!canChallengeNow && !isAttacking}
            aria-label={
              isAttacking
                ? 'Cancel attacking'
                : canChallengeNow
                ? 'Challenge Opponent'
                : `Cannot Challenge: ${challengeReason}`
            }
            title={
              isAttacking
                ? 'Click to cancel attacker selection'
                : canChallengeNow
                ? 'Challenge Exerted Opponent Card'
                : challengeReason
            }
            className={`p-2 sm:p-1.5 rounded-full transition-all flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
              isAttacking
                ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.8)] ring-2 ring-white'
                : canChallengeNow
                ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-40'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-1 left-1 right-1 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d] flex justify-between items-center text-[9px] font-mono font-bold z-20 text-[#F1F5F9]">
        <span className="flex items-center gap-0.5">
          <Sword className="w-2.5 h-2.5 text-[#F59E0B]" />
          {card.strength || 0}/{card.willpower || 0}
        </span>
        <span className="flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-[#F59E0B]" />
          {card.lore || 0}
        </span>
      </div>
    </motion.div>
  );
};
