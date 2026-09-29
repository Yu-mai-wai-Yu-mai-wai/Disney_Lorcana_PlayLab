import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, RotateCw, Play } from 'lucide-react';

export interface PlayerControlsBarProps {
  playerLore: number;
  isMyTurn: boolean;
  previousSnapshot: any | null;
  undoCountRemaining: number;
  isUndoPending: boolean;
  onRequestUndo: () => void;
  turnNumber: number;
  hasMulliganed: boolean;
  onOpenMulligan: () => void;
  matchMode: boolean;
  onEndTurn: () => void;
  onStartTurn: () => void;
  language: string;
  passTurnText: string;
  opponentTurnText: string;
}

export const PlayerControlsBar: React.FC<PlayerControlsBarProps> = ({
  playerLore,
  isMyTurn,
  previousSnapshot,
  undoCountRemaining,
  isUndoPending,
  onRequestUndo,
  turnNumber,
  hasMulliganed,
  onOpenMulligan,
  matchMode,
  onEndTurn,
  onStartTurn,
  language,
  passTurnText,
  opponentTurnText,
}) => {
  return (
    <div
      className={`w-full flex justify-between items-center z-20 py-2 px-4 border rounded-xl shrink-0 transition-all duration-300 bg-[#141a26] ${
        playerLore >= 16
          ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-r from-[#141a26] via-amber-950/20 to-[#141a26]'
          : 'border-[#30363d]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-start min-w-[140px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] uppercase tracking-wider">
              Your Lore Score
            </span>
            {playerLore >= 16 && (
              <span className="shimmer-badge badge-shimmer-gold text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                MATCH POINT!
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <motion.span
              key={playerLore}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="font-cinzel text-xl font-black text-[#F59E0B] leading-none"
            >
              {playerLore}
            </motion.span>
            <span className="font-cinzel text-xs font-bold text-[#94A3B8]">/ 20</span>
          </div>
          <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#30363d] mt-1">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              style={{ width: `${Math.min(100, (playerLore / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* UNDO / RETURN BUTTON */}
        {isMyTurn && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRequestUndo}
            disabled={!previousSnapshot || undoCountRemaining <= 0 || isUndoPending}
            className="bg-[#141a26] hover:bg-[#1e2638] disabled:opacity-40 disabled:hover:bg-[#141a26] text-[#F59E0B] border border-[#F59E0B]/40 hover:border-[#F59E0B] px-4 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title={
              !previousSnapshot
                ? 'No action to undo'
                : undoCountRemaining <= 0
                ? 'No undos remaining'
                : `Request opponent to undo last action (${undoCountRemaining} remaining)`
            }
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>
              {language === 'th' ? `ขอแก้มือ (${undoCountRemaining})` : `Return (${undoCountRemaining})`}
            </span>
            {isUndoPending && <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping ml-1" />}
          </motion.button>
        )}

        {turnNumber === 1 && isMyTurn && !hasMulliganed && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMulligan}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'สลับการ์ด' : 'Mulligan'}</span>
          </motion.button>
        )}

        {matchMode ? (
          isMyTurn ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={onEndTurn}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-6 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <RotateCw className="w-3.5 h-3.5 fill-black" />
              <span>{passTurnText}</span>
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2 rounded-xl border border-[#30363d] bg-[#0B0F19] text-[#94A3B8] font-cinzel font-bold text-xs uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span>{opponentTurnText}...</span>
            </div>
          )
        ) : (
          <>
            {!isMyTurn && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartTurn}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{language === 'th' ? 'เริ่มเทิร์น' : 'Start Turn'}</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={onEndTurn}
              disabled={!isMyTurn}
              className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 fill-black" />
              <span>{passTurnText}</span>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};
