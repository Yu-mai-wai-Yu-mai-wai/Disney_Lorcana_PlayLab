import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dices, Crown, ArrowRight, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { webSocketService } from '../services/websocket';

export interface DiceDuelModalProps {
  isOpen: boolean;
  roomId?: string;
  myRole: 'player1' | 'player2';
  opponentName?: string;
  onDuelFinished: (firstPlayerRole: 'player1' | 'player2') => void;
  isSandbox?: boolean;
}

export const DiceDuelModal: React.FC<DiceDuelModalProps> = ({
  isOpen,
  roomId,
  myRole,
  opponentName = 'Opponent Illumineer',
  onDuelFinished,
  isSandbox = false,
}) => {
  const isHost = myRole === 'player1';

  const [step, setStep] = useState<'CHOOSE' | 'READY_TO_ROLL' | 'ROLLING' | 'RESULT' | 'TIE' | 'ORDER_CHOSEN'>('CHOOSE');
  const [myChoice, setMyChoice] = useState<'ODD' | 'EVEN' | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<'ODD' | 'EVEN' | null>(null);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [winnerRole, setWinnerRole] = useState<'player1' | 'player2' | null>(null);
  const [chosenFirstPlayer, setChosenFirstPlayer] = useState<'player1' | 'player2' | null>(null);
  const [tieReason, setTieReason] = useState<string>('');

  // Refs to avoid stale closures in timeouts and socket event handlers
  const myChoiceRef = useRef<'ODD' | 'EVEN' | null>(null);
  const opponentChoiceRef = useRef<'ODD' | 'EVEN' | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    myChoiceRef.current = myChoice;
  }, [myChoice]);

  useEffect(() => {
    opponentChoiceRef.current = opponentChoice;
  }, [opponentChoice]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('CHOOSE');
      setMyChoice(null);
      setOpponentChoice(null);
      myChoiceRef.current = null;
      opponentChoiceRef.current = null;
      setDiceValue(1);
      setWinnerRole(null);
      setChosenFirstPlayer(null);
      setTieReason('');
    }
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isOpen]);

  // Handle dice roll evaluation logic shared by both host and challenger
  const evaluateDiceResult = (rolled: number, p1Choice: 'ODD' | 'EVEN', p2Choice: 'ODD' | 'EVEN') => {
    setDiceValue(rolled);
    setStep('ROLLING');

    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      const isOdd = rolled % 2 !== 0;
      const p1Won = (p1Choice === 'ODD' && isOdd) || (p1Choice === 'EVEN' && !isOdd);
      const p2Won = (p2Choice === 'ODD' && isOdd) || (p2Choice === 'EVEN' && !isOdd);

      if (p1Won && !p2Won) {
        setWinnerRole('player1');
        setStep('RESULT');
      } else if (!p1Won && p2Won) {
        setWinnerRole('player2');
        setStep('RESULT');
      } else {
        if (p1Won && p2Won) {
          setTieReason(`ทั้งคู่ทายถูกเหมือนกัน (ผลเต๋าคือ ${rolled} ซึ่งเป็นเลข${isOdd ? 'คี่' : 'คู่'})`);
        } else {
          setTieReason(`ทั้งคู่ทายผิดเหมือนกัน (ผลเต๋าคือ ${rolled} ซึ่งเป็นเลข${isOdd ? 'คี่' : 'คู่'})`);
        }
        setStep('TIE');
      }
    }, 2400);
  };

  // Subscribe to WebSocket Dice Events
  useEffect(() => {
    if (!isOpen || isSandbox) return;

    // 1. Receive Opponent's Choice
    const unsubChoice = webSocketService.subscribe('DICE_CHOICE', (data: any) => {
      const choice = (data.choice || data.payload?.choice || data.p1Choice || data.p2Choice) as 'ODD' | 'EVEN';
      if (choice) {
        setOpponentChoice(choice);
        opponentChoiceRef.current = choice;
      }
    });

    // 2. Receive Dice Roll Result (broadcast from host or challenger)
    const unsubRolled = webSocketService.subscribe('DICE_ROLLED', (data: any) => {
      const rolled = Number(data.diceValue || data.payload?.diceValue || 1);
      const p1Choice = (data.p1Choice || data.payload?.p1Choice || (myRole === 'player1' ? myChoiceRef.current : opponentChoiceRef.current) || 'ODD') as 'ODD' | 'EVEN';
      const p2Choice = (data.p2Choice || data.payload?.p2Choice || (myRole === 'player2' ? myChoiceRef.current : opponentChoiceRef.current) || 'EVEN') as 'ODD' | 'EVEN';

      evaluateDiceResult(rolled, p1Choice, p2Choice);
    });

    // 3. Receive Re-roll event
    const unsubReroll = webSocketService.subscribe('DICE_REROLL', () => {
      setStep('CHOOSE');
      setMyChoice(null);
      setOpponentChoice(null);
      myChoiceRef.current = null;
      opponentChoiceRef.current = null;
      setWinnerRole(null);
      setTieReason('');
    });

    // 4. Receive First Player Order Choice
    const unsubOrder = webSocketService.subscribe('FIRST_PLAYER_CHOSEN', (data: any) => {
      const first = (data.firstPlayerRole || data.payload?.firstPlayerRole) as 'player1' | 'player2';
      if (first) {
        setChosenFirstPlayer(first);
        setStep('ORDER_CHOSEN');
        setTimeout(() => {
          onDuelFinished(first);
        }, 1800);
      }
    });

    return () => {
      unsubChoice();
      unsubRolled();
      unsubReroll();
      unsubOrder();
    };
  }, [isOpen, isSandbox, myRole, onDuelFinished]);

  // Trigger Roll when both choices are locked in
  useEffect(() => {
    const opp = opponentChoice || opponentChoiceRef.current;
    if (step === 'CHOOSE' && myChoice && (opp || isSandbox)) {
      setStep('READY_TO_ROLL');

      if (isHost || isSandbox) {
        if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
        rollTimerRef.current = setTimeout(() => {
          const finalRoll = Math.floor(Math.random() * 6) + 1;
          const p1Choice = isSandbox ? myChoice : (myRole === 'player1' ? myChoice : (opponentChoiceRef.current || opponentChoice || 'ODD'));
          const p2Choice = isSandbox ? (myChoice === 'ODD' ? 'EVEN' : 'ODD') : (myRole === 'player2' ? myChoice : (opponentChoiceRef.current || opponentChoice || 'EVEN'));

          if (!isSandbox) {
            const rollPayload = {
              roomId,
              role: myRole,
              diceValue: finalRoll,
              p1Choice,
              p2Choice,
              payload: {
                diceValue: finalRoll,
                p1Choice,
                p2Choice,
              },
            };
            webSocketService.sendAction('DICE_ROLLED', rollPayload);
          }

          evaluateDiceResult(finalRoll, p1Choice, p2Choice);
        }, 1000);
      }
    }
  }, [step, myChoice, opponentChoice, isSandbox, isHost, myRole, roomId]);

  // Player picks Odd or Even
  const handleSelectChoice = (choice: 'ODD' | 'EVEN') => {
    if (myChoice) return;
    setMyChoice(choice);
    myChoiceRef.current = choice;

    if (isSandbox) {
      setTimeout(() => {
        const autoOppChoice = choice === 'ODD' ? 'EVEN' : 'ODD';
        setOpponentChoice(autoOppChoice);
        opponentChoiceRef.current = autoOppChoice;
      }, 400);
    } else {
      webSocketService.sendAction('DICE_CHOICE', {
        roomId,
        role: myRole,
        choice,
        payload: { choice, role: myRole },
      });
    }
  };

  // Re-roll on Tie
  const handleReroll = () => {
    setStep('CHOOSE');
    setMyChoice(null);
    setOpponentChoice(null);
    myChoiceRef.current = null;
    opponentChoiceRef.current = null;
    setWinnerRole(null);
    setTieReason('');

    if (!isSandbox) {
      webSocketService.sendAction('DICE_REROLL', {
        roomId,
        role: myRole,
        payload: {},
      });
    }
  };

  // Winner picks who goes first
  const handleChooseTurnOrder = (selectedRole: 'player1' | 'player2') => {
    setChosenFirstPlayer(selectedRole);
    setStep('ORDER_CHOSEN');

    if (!isSandbox) {
      webSocketService.sendAction('FIRST_PLAYER_CHOSEN', {
        roomId,
        role: myRole,
        firstPlayerRole: selectedRole,
        payload: { firstPlayerRole: selectedRole },
      });
    }

    setTimeout(() => {
      onDuelFinished(selectedRole);
    }, 1800);
  };

  const isWinner = winnerRole === myRole || (isSandbox && winnerRole === 'player1');
  const isOddResult = diceValue % 2 !== 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#0B0F19] border-2 border-[#F59E0B]/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#F59E0B]/20 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Dices className="w-7 h-7 text-[#F59E0B] animate-pulse" />
          <h2 className="font-cinzel text-2xl font-bold text-[#F1F5F9]">
            PRE-MATCH <span className="text-[#F59E0B]">DICE DUEL</span>
          </h2>
        </div>
        <p className="text-xs text-[#94A3B8] font-outfit mb-5">
          ผู้เล่นทั้งสองฝั่งเลือกทายเลขคู่-เลขคี่พร้อมกัน ผู้ที่ทายถูกต้องจะได้รับสิทธิ์เลือกลำดับเริ่มเกม
        </p>

        {/* STATUS CARDS FOR BOTH PLAYERS */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* You */}
          <div className={`p-3 rounded-xl border text-left transition-all ${
            myChoice
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[#141a26] border-[#30363d]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#F1F5F9]">You ({myRole === 'player1' ? 'Host' : 'Challenger'})</span>
              {myChoice ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Choosing...
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#94A3B8]">
              {myChoice ? `เลือก: ${myChoice === 'ODD' ? 'เลขคี่ (ODD)' : 'เลขคู่ (EVEN)'}` : 'กำลังตัดสินใจ...'}
            </p>
          </div>

          {/* Opponent */}
          <div className={`p-3 rounded-xl border text-left transition-all ${
            opponentChoice || isSandbox
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[#141a26] border-[#30363d]'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#F1F5F9] truncate max-w-[100px]">{opponentName}</span>
              {opponentChoice || isSandbox ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-[10px] bg-[#30363d]/60 text-[#94A3B8] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Choosing...
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#94A3B8]">
              {opponentChoice
                ? `เลือก: ${opponentChoice === 'ODD' ? 'เลขคี่ (ODD)' : 'เลขคู่ (EVEN)'}`
                : (isSandbox ? 'Auto Pick (Sandbox)' : 'กำลังตัดสินใจ...')}
            </p>
          </div>
        </div>

        {/* STEP 1: CHOICE PHASE */}
        {step === 'CHOOSE' && (
          <div className="w-full space-y-4">
            <p className="text-sm font-bold text-[#F1F5F9] font-cinzel">
              {myChoice ? '✨ คุณได้ล็อกตัวเลือกแล้ว — กำลังรอคู่ต่อสู้เลือก' : 'กรุณาเลือกทายเลขคี่ หรือ เลขคู่:'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectChoice('ODD')}
                disabled={!!myChoice}
                className={`py-4 px-6 rounded-xl border-2 font-cinzel font-bold text-lg transition-all flex flex-col items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                  myChoice === 'ODD'
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.03]'
                    : myChoice
                    ? 'bg-[#141a26]/40 border-[#30363d]/40 text-[#64748B] opacity-50'
                    : 'bg-[#141a26] border-[#30363d] text-[#94A3B8] hover:border-[#F59E0B]/50 hover:text-[#F1F5F9] hover:scale-[1.02]'
                }`}
              >
                <span>ODD (คี่)</span>
                <span className="text-xs font-mono text-[#94A3B8]">1, 3, 5</span>
              </button>

              <button
                onClick={() => handleSelectChoice('EVEN')}
                disabled={!!myChoice}
                className={`py-4 px-6 rounded-xl border-2 font-cinzel font-bold text-lg transition-all flex flex-col items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                  myChoice === 'EVEN'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-[1.03]'
                    : myChoice
                    ? 'bg-[#141a26]/40 border-[#30363d]/40 text-[#64748B] opacity-50'
                    : 'bg-[#141a26] border-[#30363d] text-[#94A3B8] hover:border-cyan-400/50 hover:text-[#F1F5F9] hover:scale-[1.02]'
                }`}
              >
                <span>EVEN (คู่)</span>
                <span className="text-xs font-mono text-[#94A3B8]">2, 4, 6</span>
              </button>
            </div>

            {!myChoice && (
              <p className="text-[11px] text-[#94A3B8]">
                💡 เมื่อทั้งสองฝ่ายเลือกเสร็จ ระบบจะทอยลูกเต๋าอัตโนมัติ
              </p>
            )}
          </div>
        )}

        {/* STEP: READY TO ROLL (BRIEF COUNTDOWN / TRANSITION) */}
        {step === 'READY_TO_ROLL' && (
          <div className="py-6 space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center animate-bounce">
              <Dices className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h3 className="font-cinzel text-lg text-[#F1F5F9]">ทั้งสองฝ่ายเลือกแล้ว!</h3>
            <p className="text-xs text-[#F59E0B] font-mono animate-pulse">
              Rolling the Destiny Die in a moment...
            </p>
          </div>
        )}

        {/* STEP 2: ROLLING ANIMATION */}
        {step === 'ROLLING' && (
          <div className="py-8 space-y-6 flex flex-col items-center">
            <motion.div
              animate={{
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                scale: [1, 1.2, 0.9, 1.1, 1],
              }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="w-24 h-24 bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#78350F] rounded-2xl flex items-center justify-center text-black font-cinzel font-bold text-4xl shadow-[0_0_40px_rgba(245,158,11,0.6)] border-4 border-amber-200"
            >
              🎲
            </motion.div>
            <div className="space-y-1">
              <h3 className="font-cinzel text-xl text-[#F1F5F9] animate-pulse">Rolling the Destiny Die...</h3>
              <p className="text-xs text-[#94A3B8] font-mono">Randomizing D6 [1 .. 6]</p>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT & ORDER SELECTION */}
        {step === 'RESULT' && (
          <div className="w-full space-y-5">
            {/* Dice Face Reveal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="p-4 bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
            >
              <span className="text-xs font-mono text-[#94A3B8]">DICE RESULT</span>
              <div className="w-16 h-16 bg-[#F59E0B] text-black font-cinzel font-black text-3xl rounded-xl flex items-center justify-center shadow-lg">
                {diceValue}
              </div>
              <span className="text-sm font-bold font-cinzel text-[#F1F5F9]">
                ผลทอยคือเลข {diceValue} — <span className={isOddResult ? 'text-[#F59E0B]' : 'text-cyan-400'}>{isOddResult ? 'ODD (คี่)' : 'EVEN (คู่)'}</span>
              </span>
            </motion.div>

            {/* Winner Box */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-3">
              <Crown className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs text-emerald-300 uppercase tracking-wider font-mono">Winner of the Toss</p>
                <p className="text-base font-bold text-white font-cinzel">
                  {winnerRole === myRole ? '🎉 You Won the Toss!' : `👑 ${opponentName} Won the Toss!`}
                </p>
              </div>
            </div>

            {/* Winner selects order */}
            {isWinner ? (
              <div className="space-y-3">
                <p className="text-xs text-[#CBD5E1]">
                  คุณชนะการทายลูกเต๋า! กรุณาเลือกสิทธิ์ในการเริ่มเกม:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChooseTurnOrder(myRole)}
                    className="p-4 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-xl text-left transition-all hover:scale-[1.02] group shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel font-bold text-sm text-[#F59E0B]">PLAY FIRST (เริ่มก่อน)</span>
                      <ArrowRight className="w-4 h-4 text-[#F59E0B] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      ได้เริ่มเดินเกมก่อน ได้เปรียบจังหวะลงการ์ด (ข้ามการจั่วในการเริ่มเทิร์น 1)
                    </p>
                  </button>

                  <button
                    onClick={() => handleChooseTurnOrder(myRole === 'player1' ? 'player2' : 'player1')}
                    className="p-4 bg-cyan-950/30 hover:bg-cyan-900/40 border-2 border-cyan-500/60 rounded-xl text-left transition-all hover:scale-[1.02] group shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-cinzel font-bold text-sm text-cyan-300">PLAY SECOND (เริ่มหลัง)</span>
                      <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      ได้จั่วการ์ดในเทิร์นแรกทันที มีการ์ดบนมือมากกว่าเพื่อแก้ทาง
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#94A3B8] font-mono bg-[#141a26] rounded-xl border border-[#30363d] p-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                <span>Waiting for {opponentName} to choose turn order...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP: TIE RESOLUTION */}
        {step === 'TIE' && (
          <div className="w-full space-y-5">
            {/* Dice Face Reveal */}
            <div className="p-4 bg-[#141a26] border-2 border-amber-500/50 rounded-2xl flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-[#94A3B8]">DICE RESULT: {diceValue} ({isOddResult ? 'ODD' : 'EVEN'})</span>
              <div className="text-sm font-bold text-amber-300 font-cinzel">
                🤝 ผลเสมอกัน! (TIE)
              </div>
              <p className="text-xs text-[#94A3B8] max-w-xs">{tieReason}</p>
            </div>

            <button
              onClick={handleReroll}
              className="w-full py-4 bg-[#F59E0B] text-black font-cinzel font-bold text-base rounded-xl hover:bg-[#D97706] hover:scale-[1.02] transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" /> RE-ROLL (ทอยตัดสินใหม่)
            </button>
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMED */}
        {step === 'ORDER_CHOSEN' && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
              {chosenFirstPlayer === myRole ? 'You will PLAY FIRST!' : `${opponentName} will PLAY FIRST!`}
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {chosenFirstPlayer === myRole
                ? 'คุณจะเริ่มเทิร์นที่ 1 (ตามกฎทางการ จะไม่จั่วการ์ดในเทิร์นนี้)'
                : 'ฝ่ายตรงข้ามจะเริ่มก่อน คุณจะได้จั่วการ์ดในเทิร์นแรกของคุณ'}
            </p>
            <div className="text-xs text-[#F59E0B] font-mono animate-pulse">
              Entering match & starting Mulligan phase...
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
