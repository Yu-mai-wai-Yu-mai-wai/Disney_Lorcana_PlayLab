import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Droplets,
  Sword,
  Shield,
  X,
  Play,
  Pin,
  XCircle,
} from 'lucide-react';
import type { LorcanaCard } from '../LorcanaBoard';
import { InkSymbol } from '../InkSymbol';
import { isCardInkable } from '../../game';
import {
  translateCardAbilityText,
  translateAbilityName,
  translateCardType,
  translateInkColor,
} from '../../utils/cardTranslator';

interface CardInspectModalProps {
  pinnedCard: LorcanaCard | null;
  hoveredCard: LorcanaCard | null;
  onClosePinned: () => void;
  onPinHovered: (card: LorcanaCard) => void;
  onOpenActionMenu?: (card: LorcanaCard) => void;
  isCardInHand?: boolean;
  language: string;
}

export const CardInspectModal: React.FC<CardInspectModalProps> = ({
  pinnedCard,
  hoveredCard,
  onClosePinned,
  onPinHovered,
  onOpenActionMenu,
  isCardInHand = false,
  language,
}) => {
  return (
    <>
      {/* PINNED CARD DETAILED INSPECTOR MODAL */}
      <AnimatePresence>
        {pinnedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pinned-card-name"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[420px] max-w-[calc(100vw-2rem)] bg-[#141a26]/98 backdrop-blur-xl border border-[#F59E0B]/60 rounded-2xl p-5 text-[#F1F5F9] flex flex-col gap-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#30363d]/80 pb-2 text-xs font-mono text-slate-400">
              <span className="text-[#F59E0B] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                {language === 'th' ? 'รายละเอียดการ์ด' : 'Card Inspector'}
              </span>
              <button
                onClick={onClosePinned}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <img
                src={pinnedCard.imageUrl || pinnedCard.img || '/Lorcana_Card_Back.png'}
                alt={pinnedCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                }}
                className="w-24 h-34 object-cover rounded-xl border border-[#30363d] shrink-0 shadow-lg"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {pinnedCard.ink && <InkSymbol ink={pinnedCard.ink} size={18} />}
                  <span
                    id="pinned-card-name"
                    className="font-cinzel font-bold text-base text-[#F59E0B] leading-tight truncate"
                  >
                    {pinnedCard.name}
                  </span>
                </div>
                {pinnedCard.title && (
                  <span className="text-xs font-mono text-slate-400 truncate leading-tight mt-0.5">
                    {pinnedCard.title}
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                  {pinnedCard.type && (
                    <span className="bg-[#1e2638] text-amber-200 px-2 py-0.5 rounded border border-[#30363d]">
                      {language === 'th' ? translateCardType(pinnedCard.type, 'th') : pinnedCard.type}
                    </span>
                  )}
                  {pinnedCard.ink && (
                    <span className="bg-[#0B0F19] text-slate-300 px-2 py-0.5 rounded border border-[#30363d]">
                      {language === 'th' ? translateInkColor(pinnedCard.ink, 'th') : pinnedCard.ink}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[11px] font-mono font-bold">
                  <span className="text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d]">
                    Cost: {pinnedCard.cost}
                  </span>
                  {isCardInkable(pinnedCard) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Droplets className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      Inkable
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      Non-Inkable
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0F19] p-2 rounded-lg border border-[#30363d] text-center font-mono">
              <div className="flex items-center justify-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-slate-400 text-[10px] font-bold">Str:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.strength ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 border-x border-[#30363d]">
                <Shield className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-slate-400 text-[10px] font-bold">Will:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.willpower ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-slate-400 text-[10px] font-bold">Lore:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.lore ?? '-'}</span>
              </div>
            </div>

            {/* Abilities */}
            {pinnedCard.abilities && pinnedCard.abilities.length > 0 && (
              <div className="space-y-2 bg-[#0B0F19] p-2.5 rounded-lg border border-[#30363d] max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
                <div className="text-[10px] font-cinzel text-[#F59E0B] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Special Abilities</span>
                  <span className="text-slate-400 font-mono text-[10px]">({pinnedCard.abilities.length})</span>
                </div>
                {pinnedCard.abilities.map((ab, idx) => (
                  <div key={idx} className="leading-relaxed bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]/60">
                    <div className="font-bold text-xs text-[#F59E0B] mb-0.5">
                      {language === 'th' ? translateAbilityName(ab.name, ab.text, 'th') : translateAbilityName(ab.name, ab.text, 'en')}
                    </div>
                    <div className="text-[#E2E8F0] text-xs font-mono">
                      {language === 'th' ? translateCardAbilityText(ab.text, ab.name, 'th') : translateCardAbilityText(ab.text, ab.name, 'en')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pinnedCard.flavorText && (
              <div className="text-xs font-outfit text-slate-400 italic border-t border-[#30363d]/60 pt-2 leading-relaxed max-h-24 overflow-y-auto">
                "{pinnedCard.flavorText}"
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-[#30363d]/50">
              {isCardInHand && onOpenActionMenu && (
                <button
                  onClick={() => {
                    onOpenActionMenu(pinnedCard);
                    onClosePinned();
                  }}
                  className="flex-1 py-2 px-3 bg-[#F59E0B] hover:bg-amber-400 text-black font-cinzel font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{language === 'th' ? 'สั่งการการ์ดนี้' : 'Action Menu'}</span>
                </button>
              )}
              <button
                onClick={onClosePinned}
                className="flex-1 py-2 px-3 bg-[#1e2638] hover:bg-slate-700 text-slate-300 hover:text-white font-cinzel font-bold text-xs rounded-lg border border-[#30363d] transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK GLANCE TOOLTIP (HOVER) */}
      <AnimatePresence>
        {hoveredCard && !pinnedCard && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => onPinHovered(hoveredCard)}
            className="fixed bottom-4 right-4 md:right-6 z-[110] w-[350px] max-w-[calc(100vw-2rem)] bg-[#141a26]/95 backdrop-blur-md border border-[#30363d] hover:border-[#F59E0B]/70 rounded-xl p-3.5 text-[#F1F5F9] flex flex-col gap-2.5 cursor-pointer shadow-[0_16px_48px_rgba(0,0,0,0.85)] group transition-colors"
          >
            <div className="flex items-center justify-between border-b border-[#30363d]/70 pb-1.5 text-[10px] font-mono text-slate-400">
              <span className="text-[#F59E0B] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                {language === 'th' ? 'ดูรายละเอียดเร็ว' : 'Quick Glance'}
              </span>
              <span className="text-amber-300 font-bold group-hover:text-amber-200 transition-colors flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" /> {language === 'th' ? 'คลิกเพื่อตรึง' : 'Click to Pin'}
              </span>
            </div>

            <div className="flex gap-2.5 items-center">
              <img
                src={hoveredCard.imageUrl || hoveredCard.img || '/Lorcana_Card_Back.png'}
                alt={hoveredCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                }}
                className="w-16 h-22 object-cover rounded-lg border border-[#30363d] shrink-0 shadow-md"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-cinzel font-bold text-sm text-[#F59E0B] leading-tight truncate">
                  {hoveredCard.name}
                </span>
                {hoveredCard.title && (
                  <span className="text-[11px] font-mono text-slate-400 truncate leading-tight mt-0.5">
                    {hoveredCard.title}
                  </span>
                )}

                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono font-bold">
                  <span className="text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d]">
                    Cost: {hoveredCard.cost}
                  </span>
                  {isCardInkable(hoveredCard) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Droplets className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                      Inkable
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <XCircle className="w-2.5 h-2.5 text-rose-400" />
                      Non-Ink
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
