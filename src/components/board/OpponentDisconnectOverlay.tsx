import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, LogOut } from 'lucide-react';

export interface OpponentDisconnectOverlayProps {
  isOpponentDisconnected: boolean;
  opponentLeftName: string | null;
  language: string;
  onExitMatch?: () => void;
  onReturnToLobby?: () => void;
}

const GRACE_SECONDS = 60; // matches the 60 s rejoin window in the room Lambda

export const OpponentDisconnectOverlay: React.FC<OpponentDisconnectOverlayProps> = ({
  isOpponentDisconnected,
  opponentLeftName,
  language,
  onExitMatch,
  onReturnToLobby,
}) => {
  // The overlay owns its timer. It used to live in the WebSocket effect, whose cleanup killed it on every
  // dependency change. The value comes from a wall-clock deadline, so background-tab throttling cannot drift it.
  const [disconnectCountdown, setDisconnectCountdown] = useState(GRACE_SECONDS);
  useEffect(() => {
    if (!isOpponentDisconnected) return;
    const deadline = Date.now() + GRACE_SECONDS * 1000;
    const tick = () => setDisconnectCountdown(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isOpponentDisconnected]);

  return (
    <>
      {/* OPPONENT DISCONNECTED OVERLAY (60s GRACE PERIOD) */}
      <AnimatePresence>
        {isOpponentDisconnected && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-amber-500/70 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 animate-pulse">
                <WifiOff className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-cinzel text-2xl font-bold text-[#F1F5F9] mb-2">
                  {language === 'th' ? 'คู่แข่งขาดการเชื่อมต่อ' : 'Opponent Disconnected'}
                </h3>
                <p className="text-sm text-slate-300 font-outfit max-w-md">
                  {language === 'th'
                    ? 'สัญญาณเน็ตของคู่แข่งหลุดชั่วคราว ระบบกำลังรอการเชื่อมต่อใหม่เพื่อให้โอกาสกลับเข้าห้อง'
                    : 'Your opponent lost connection. The system is waiting for them to rejoin the match.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 w-full bg-[#0B0F19] rounded-2xl p-4 border border-[#30363d]">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                  {language === 'th' ? 'เวลารอเชื่อมต่อคงเหลือ' : 'Grace Period Remaining'}
                </span>
                <span data-testid="grace-countdown" className="text-3xl font-mono font-black text-[#F59E0B] tracking-wider">
                  {disconnectCountdown}s
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#F59E0B] h-full transition-all duration-1000"
                    style={{ width: `${(disconnectCountdown / GRACE_SECONDS) * 100}%` }}
                  />
                </div>
              </div>

              {disconnectCountdown === 0 && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-xs text-rose-400 font-mono">
                    {language === 'th'
                      ? 'หมดเวลาเชื่อมต่อ คู่แข่งไม่กลับเข้าห้อง'
                      : 'Grace period expired. Opponent did not rejoin.'}
                  </p>
                  {onExitMatch && (
                    <button
                      onClick={onExitMatch}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-cinzel font-bold text-sm transition-all cursor-pointer shadow-lg"
                    >
                      {language === 'th' ? 'ออกจากห้อง' : 'Exit Match'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPPONENT LEFT (pressed Exit Match) */}
      <AnimatePresence>
        {opponentLeftName && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-md p-4">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="opponent-left-title"
              aria-describedby="opponent-left-desc"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-rose-500/70 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(244,63,94,0.25)] flex flex-col items-center text-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-rose-400">
                <LogOut className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h3 id="opponent-left-title" className="font-cinzel text-2xl font-bold text-[#F1F5F9] mb-2">
                  {language === 'th' ? 'คู่แข่งออกจากห้องแล้ว' : 'Opponent Left the Match'}
                </h3>
                <p id="opponent-left-desc" className="text-sm text-slate-300 font-outfit max-w-md">
                  {language === 'th'
                    ? `${opponentLeftName} กดออกจากห้อง แมตช์นี้จบแล้วและจะกลับเข้ามาไม่ได้`
                    : `${opponentLeftName} exited the match. This match has ended and cannot be resumed.`}
                </p>
              </div>
              {(onReturnToLobby || onExitMatch) && (
                <button
                  autoFocus
                  onClick={() => (onReturnToLobby ?? onExitMatch)?.()}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white text-white font-cinzel font-bold text-sm transition-all cursor-pointer shadow-lg"
                >
                  {language === 'th' ? 'ออกจากห้อง กลับ Lobby' : 'Exit to Lobby'}
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
