import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCw, Sparkles, Layers, ArrowRight } from 'lucide-react';
import type { TurnPhase } from '../../game/types';

interface TurnPhaseBarProps {
  currentPhase: TurnPhase;
  turnNumber: number;
  isMyTurn: boolean;
  onPassTurn: () => void;
  canPassTurn: boolean;
  passTurnDisabledReason?: string;
}

const PHASES: { id: TurnPhase; label: string; description: string }[] = [
  { id: 'ready', label: 'READY', description: 'Ready all cards & ink' },
  { id: 'set', label: 'SET', description: 'Check start of turn effects & locations' },
  { id: 'draw', label: 'DRAW', description: 'Draw 1 card' },
  { id: 'main', label: 'MAIN', description: 'Play, Ink, Quest, Challenge' },
  { id: 'end', label: 'END', description: 'End of turn checks' },
];

export const TurnPhaseBar: React.FC<TurnPhaseBarProps> = ({
  currentPhase,
  turnNumber,
  isMyTurn,
  onPassTurn,
  canPassTurn,
  passTurnDisabledReason,
}) => {
  return (
    <div
      role="region"
      aria-label="Turn Phase Indicator"
      className="w-full bg-[#101726] border border-[#2b3548] rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md"
    >
      {/* Turn badge & active status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#182338] border border-[#374561]">
          <Layers className="w-4 h-4 text-[#F59E0B]" />
          <span className="font-cinzel text-xs font-bold text-[#F59E0B]">TURN {turnNumber}</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
            isMyTurn
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
              : 'bg-slate-800 text-slate-300 border border-slate-600'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isMyTurn ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
            }`}
          />
          <span>{isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}</span>
        </div>
      </div>

      {/* Phase Stepper */}
      <nav
        aria-label="Game Turn Steps"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
      >
        {PHASES.map((p, idx) => {
          const isActive = currentPhase === p.id && isMyTurn;
          return (
            <React.Fragment key={p.id}>
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  isActive
                    ? 'bg-[#F59E0B] text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-amber-300'
                    : 'bg-[#182338] text-slate-300 hover:text-white'
                }`}
                title={p.description}
                aria-current={isActive ? 'step' : undefined}
              >
                <span>{p.label}</span>
              </div>
              {idx < PHASES.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* End Turn Action Button */}
      {isMyTurn && (
        <div className="flex items-center gap-2">
          {passTurnDisabledReason && (
            <span
              className="text-[11px] text-amber-300 font-mono bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-600/50 max-w-xs truncate"
              title={passTurnDisabledReason}
            >
              {passTurnDisabledReason}
            </span>
          )}
          <button
            onClick={onPassTurn}
            disabled={!canPassTurn}
            className={`px-4 py-1.5 rounded-xl font-cinzel text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101726] ${
              canPassTurn
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
            title={passTurnDisabledReason || 'End your turn and pass to opponent'}
          >
            <span>Pass Turn</span>
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};
