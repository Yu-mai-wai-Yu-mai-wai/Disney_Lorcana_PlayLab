import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';

export interface UndoVoteModalProps {
  incomingUndoRequest: { requesterUsername: string } | null;
  undoVoteTimer: number;
  language: string;
  onRespond: (accept: boolean) => void;
}

export const UndoVoteModal: React.FC<UndoVoteModalProps> = ({
  incomingUndoRequest,
  undoVoteTimer,
  language,
  onRespond,
}) => {
  return (
    <AnimatePresence>
      {incomingUndoRequest && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0B0F19]/85 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col items-center text-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
              <Undo2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9] mb-1">
                {language === 'th' ? 'คู่แข่งขออนุญาตย้อนการเล่น' : 'Opponent Requested Undo'}
              </h3>
              <p className="text-sm text-slate-300 font-outfit">
                {language === 'th'
                  ? `ผู้เล่น "${incomingUndoRequest.requesterUsername}" ขออนุญาตย้อนการเล่นแอคชั่นล่าสุด คุณยินยอมหรือไม่?`
                  : `Player "${incomingUndoRequest.requesterUsername}" wants to undo their last action. Do you accept?`}
              </p>
            </div>

            <div className="w-full bg-[#0B0F19] rounded-xl p-3 border border-[#30363d] flex items-center justify-between text-xs font-mono text-[#F59E0B]">
              <span>{language === 'th' ? 'เวลาในการตัดสินใจ:' : 'Time remaining:'}</span>
              <span className="text-base font-bold px-2 py-0.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40">
                {undoVoteTimer}s
              </span>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => onRespond(false)}
                className="flex-1 py-3 rounded-xl bg-[#0B0F19] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-rose-300 font-cinzel font-bold text-sm transition-all cursor-pointer"
              >
                {language === 'th' ? '❌ ปฏิเสธ' : '❌ Decline'}
              </button>
              <button
                onClick={() => onRespond(true)}
                className="flex-1 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                {language === 'th' ? '✅ ยินยอม' : '✅ Accept'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
