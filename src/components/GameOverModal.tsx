import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Sparkles, Swords, RotateCcw, LogOut, Flame, Shield, Award } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';

export interface GameOverModalProps {
  isOpen: boolean;
  isWinner: boolean;
  winnerName: string;
  loserName: string;
  winnerLore: number;
  loserLore: number;
  turnNumber: number;
  roomId?: string;
  onPlayAgain: () => void;
  onExitMatch?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isWinner,
  winnerName,
  loserName,
  winnerLore = 20,
  loserLore = 0,
  turnNumber = 1,
  roomId,
  onPlayAgain,
  onExitMatch,
}) => {
  const { language } = useLanguageStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-md p-4 overflow-y-auto select-none">
        {/* Background Lore Particle Aura */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30 ${
              isWinner ? 'bg-amber-500' : 'bg-rose-600'
            }`}
          />
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative max-w-lg w-full bg-[#141a26]/95 border-2 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center flex flex-col items-center gap-6 ${
            isWinner
              ? 'border-[#F59E0B] shadow-[0_0_60px_rgba(245,158,11,0.35)]'
              : 'border-rose-500/70 shadow-[0_0_60px_rgba(244,63,94,0.3)]'
          }`}
        >
          {/* Top Decorative Sparkle Bars */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-80" />

          {/* Victory / Defeat Icon Badge */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border-2 relative z-10 ${
                isWinner
                  ? 'bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-600/30 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-br from-rose-500/30 via-red-500/20 to-rose-600/30 border-rose-500 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
              }`}
            >
              {isWinner ? (
                <Trophy className="w-10 h-10 animate-bounce" />
              ) : (
                <Swords className="w-10 h-10" />
              )}
            </motion.div>

            {/* Glowing Halo Rings */}
            {isWinner && (
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-md pointer-events-none"
              />
            )}
          </div>

          {/* Header Title & Subtitle */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#0B0F19] border border-[#30363d]">
              <Sparkles className={`w-3.5 h-3.5 ${isWinner ? 'text-[#F59E0B]' : 'text-rose-400'}`} />
              <span className={isWinner ? 'text-[#FCD34D]' : 'text-rose-300'}>
                {isWinner
                  ? language === 'th' ? 'บรรลุ 20 LORE สำเร็จ!' : '20 LORE REACHED!'
                  : language === 'th' ? 'สิ้นสุดการประลอง' : 'MATCH CONCLUDED'}
              </span>
            </div>

            <h2 className="font-cinzel text-3xl md:text-4xl font-black tracking-wide">
              {isWinner ? (
                <span className="bg-gradient-to-r from-amber-200 via-[#F59E0B] to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                  {language === 'th' ? '🎉 ยินดีด้วย! คุณคือผู้ชนะ' : '🎉 VICTORY!'}
                </span>
              ) : (
                <span className="bg-gradient-to-r from-rose-200 via-rose-400 to-red-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(244,63,94,0.5)]">
                  {language === 'th' ? '⚔️ พ่ายแพ้ในการประลอง' : '⚔️ DEFEAT'}
                </span>
              )}
            </h2>

            <p className="text-sm text-slate-300 font-outfit max-w-md mx-auto leading-relaxed">
              {isWinner ? (
                language === 'th' ? (
                  <>
                    ขอแสดงความยินดีกับ Illumineer <strong className="text-[#FCD34D] font-bold">"{winnerName}"</strong> ผู้รวบรวมครบ 20 Lore ได้สำเร็จและคว้าชัยชนะในการประลองครั้งนี้!
                  </>
                ) : (
                  <>
                    Congratulations to Illumineer <strong className="text-[#FCD34D] font-bold">"{winnerName}"</strong> for securing 20 Lore and claiming victory in this match!
                  </>
                )
              ) : (
                language === 'th' ? (
                  <>
                    ผู้เล่น <strong className="text-amber-300 font-bold">"{winnerName}"</strong> รวบรวมครบ 20 Lore ก่อน เป็นฝ่ายชนะในรอบนี้ เตรียมตัวและวางแผนใหม่ในรอบถัดไป!
                  </>
                ) : (
                  <>
                    Player <strong className="text-amber-300 font-bold">"{winnerName}"</strong> reached 20 Lore first and won the match. Refine your strategy and play again!
                  </>
                )
              )}
            </p>
          </div>

          {/* Synchronized Winner & Loser Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
            {/* WINNER CARD */}
            <div className="relative bg-gradient-to-b from-[#1c2436] to-[#0f172a] border-2 border-[#F59E0B] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-black font-cinzel font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Crown className="w-3 h-3" />
                {language === 'th' ? 'ผู้ชนะ' : 'WINNER'}
              </div>

              <div className="mt-2 w-10 h-10 rounded-full bg-amber-500/20 border border-[#F59E0B]/50 flex items-center justify-center text-[#F59E0B]">
                <Award className="w-5 h-5" />
              </div>

              <div className="w-full text-center truncate">
                <span className="font-cinzel text-base font-bold text-[#F1F5F9] block truncate" title={winnerName}>
                  {winnerName}
                </span>
                <span className="text-[11px] font-mono text-amber-300/80">Illumineer Champion</span>
              </div>

              <div className="w-full bg-[#0B0F19] rounded-xl p-2 border border-amber-500/30 flex items-center justify-between mt-1">
                <span className="text-[10px] font-cinzel font-bold text-slate-400">{language === 'th' ? 'แต้ม Lore สิ้นสุด' : 'FINAL LORE'}</span>
                <span className="text-sm font-mono font-black text-[#F59E0B] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {winnerLore} / 20
                </span>
              </div>
            </div>

            {/* LOSER / RUNNER-UP CARD */}
            <div className="relative bg-gradient-to-b from-[#1a202c] to-[#0f172a] border border-[#30363d] rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 border border-slate-600 text-slate-200 font-cinzel font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {language === 'th' ? 'ผู้แพ้' : 'RUNNER-UP'}
              </div>

              <div className="mt-2 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Swords className="w-5 h-5" />
              </div>

              <div className="w-full text-center truncate">
                <span className="font-cinzel text-base font-bold text-slate-300 block truncate" title={loserName}>
                  {loserName}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Challenger</span>
              </div>

              <div className="w-full bg-[#0B0F19] rounded-xl p-2 border border-[#30363d] flex items-center justify-between mt-1">
                <span className="text-[10px] font-cinzel font-bold text-slate-400">{language === 'th' ? 'แต้ม Lore สิ้นสุด' : 'FINAL LORE'}</span>
                <span className="text-sm font-mono font-bold text-slate-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  {loserLore} / 20
                </span>
              </div>
            </div>
          </div>

          {/* Match Metadata Pill */}
          <div className="w-full bg-[#0B0F19]/90 rounded-xl px-4 py-2.5 border border-[#30363d] flex flex-wrap items-center justify-around gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>{language === 'th' ? 'จำนวนเทิร์น:' : 'Turns:'}</span>
              <strong className="text-[#F1F5F9] font-bold">{turnNumber}</strong>
            </div>
            {roomId && (
              <div className="flex items-center gap-1.5">
                <span>{language === 'th' ? 'รหัสห้อง:' : 'Room:'}</span>
                <strong className="text-[#F59E0B] font-bold">{roomId}</strong>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span>{language === 'th' ? 'เงื่อนไขชนะ:' : 'Condition:'}</span>
              <strong className="text-[#38BDF8] font-bold">{language === 'th' ? 'สะสมครบ 20 Lore' : 'First to 20 Lore'}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPlayAgain}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-[#F59E0B] to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-cinzel font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {language === 'th' ? 'เล่นอีกครั้ง' : 'Play Again'}
            </motion.button>

            {onExitMatch && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExitMatch}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#0B0F19] hover:bg-slate-800 border border-[#30363d] hover:border-slate-500 text-slate-200 font-cinzel font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                {language === 'th' ? 'กลับหน้าหลัก' : 'Exit to Lobby'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
