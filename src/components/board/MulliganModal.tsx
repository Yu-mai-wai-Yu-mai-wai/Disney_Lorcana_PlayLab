import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LorcanaCard } from '../../types/lorcana';

interface MulliganModalProps {
  isMulliganPhase: boolean;
  handCards: LorcanaCard[];
  mulliganSelectedIds: string[];
  setMulliganSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onKeepHand: () => void;
  onConfirmMulligan: () => void;
  language: string;
}

export const MulliganModal: React.FC<MulliganModalProps> = ({
  isMulliganPhase,
  handCards,
  mulliganSelectedIds,
  setMulliganSelectedIds,
  onKeepHand,
  onConfirmMulligan,
  language,
}) => {
  if (!isMulliganPhase) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mulligan-heading"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0F19]/90 backdrop-blur-sm p-4"
      >
        <h2 id="mulligan-heading" className="text-2xl sm:text-3xl font-cinzel font-bold text-[#F59E0B] mb-2 text-center">
          {language === 'th' ? 'ช่วงเลือกสลับการ์ด (Mulligan)' : 'Opening Hand Mulligan'}
        </h2>
        <p className="text-slate-300 mb-8 font-mono text-center text-xs sm:text-sm">
          {language === 'th'
            ? 'เลือกการ์ดที่ต้องการสลับกลับเข้าเด็คแล้วจั่วใบใหม่ทดแทน'
            : 'Select cards to put on the bottom of your deck and draw replacements'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 max-w-5xl">
          {handCards.map((card) => {
            const isSelected = mulliganSelectedIds.includes(card.id);
            return (
              <motion.div
                key={card.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${card.name}, ${isSelected ? 'Selected for mulligan' : 'Keep in hand'}`}
                onClick={() => {
                  if (isSelected) {
                    setMulliganSelectedIds((prev) => prev.filter((id) => id !== card.id));
                  } else {
                    setMulliganSelectedIds((prev) => [...prev, card.id]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isSelected) {
                      setMulliganSelectedIds((prev) => prev.filter((id) => id !== card.id));
                    } else {
                      setMulliganSelectedIds((prev) => [...prev, card.id]);
                    }
                  }
                }}
                whileHover={{ y: -8 }}
                animate={{ y: isSelected ? -16 : 0 }}
                className={`w-28 h-40 sm:w-36 sm:h-52 md:w-40 md:h-56 rounded-xl cursor-pointer border-2 transition-all overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                  isSelected
                    ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                    : 'border-[#30363d] hover:border-[#F59E0B]'
                }`}
              >
                <img
                  src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                  alt={card.name || 'Disney Lorcana Card'}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onKeepHand}
            className="px-6 py-2.5 sm:py-3 rounded-xl border border-slate-600 hover:border-slate-400 text-white font-cinzel font-bold hover:bg-[#141a26] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {language === 'th' ? 'คงการ์ดชุดเดิมบนมือ' : 'Keep Hand'}
          </button>
          <button
            onClick={onConfirmMulligan}
            className="px-6 py-2.5 sm:py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black font-cinzel font-bold transition-colors cursor-pointer shadow-lg focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {language === 'th'
              ? `ยืนยันสลับการ์ด (${mulliganSelectedIds.length})`
              : `Confirm Mulligan (${mulliganSelectedIds.length})`}
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};
