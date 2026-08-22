import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Shield, X, Flame, Layers, ChevronRight, Info, AlertTriangle } from 'lucide-react';

export interface AbilityAlert {
  id: string;
  source: 'player' | 'opponent';
  cardName: string;
  cardTitle?: string;
  cardImage?: string;
  inkColor?: string;
  abilityName: string;
  originalText: string;
  thaiText: string;
  category: 'auto_resolved' | 'keyword' | 'complex_effect' | 'trigger';
  actionHint?: string;
  timestamp: number;
}

interface AbilityNotificationBannerProps {
  alerts: AbilityAlert[];
  onDismiss: (id: string) => void;
}

export const AbilityNotificationBanner: React.FC<AbilityNotificationBannerProps> = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  // Render max 3 alerts stacked nicely to avoid viewport obstruction
  const visibleAlerts = alerts.slice(-3);

  return (
    <div
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2.5 w-full max-w-xl px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {visibleAlerts.map((alert) => (
          <AbilityBannerItem key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface AbilityBannerItemProps {
  alert: AbilityAlert;
  onDismiss: (id: string) => void;
}

const AbilityBannerItem: React.FC<AbilityBannerItemProps> = ({ alert, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 5500;

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now() - ((100 - progress) / 100) * duration;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(alert.id);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [alert.id, onDismiss, isPaused]);

  const isPlayer = alert.source === 'player';

  const getCategoryConfig = () => {
    switch (alert.category) {
      case 'auto_resolved':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
          badge: '⚡ Auto Resolved',
          badgeThai: 'ประมวลผลอัตโนมัติ',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          borderColor: isPlayer ? 'border-amber-500/60' : 'border-rose-500/60',
          glow: 'shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
          barGradient: 'from-amber-400 via-amber-300 to-yellow-200',
        };
      case 'keyword':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
          badge: '🛡️ Keyword Active',
          badgeThai: 'คีย์เวิร์ดพิเศษ',
          badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          borderColor: isPlayer ? 'border-cyan-500/60' : 'border-indigo-500/60',
          glow: 'shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
          barGradient: 'from-cyan-400 via-sky-300 to-indigo-300',
        };
      case 'complex_effect':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          badge: '🧩 Complex Effect',
          badgeThai: 'เอฟเฟกต์เฉพาะ',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          borderColor: isPlayer ? 'border-purple-500/60' : 'border-fuchsia-500/60',
          glow: 'shadow-[0_8px_30px_rgba(168,85,247,0.18)]',
          barGradient: 'from-purple-400 via-fuchsia-300 to-pink-300',
        };
      default:
        return {
          icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
          badge: '✨ Special Trigger',
          badgeThai: 'ทริกเกอร์พิเศษ',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          borderColor: isPlayer ? 'border-emerald-500/60' : 'border-amber-500/60',
          glow: 'shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
          barGradient: 'from-emerald-400 via-teal-300 to-amber-200',
        };
    }
  };

  const config = getCategoryConfig();

  const getInkBorderColor = (ink?: string) => {
    switch (ink?.toLowerCase()) {
      case 'amber': return 'border-amber-500/60';
      case 'amethyst': return 'border-purple-500/60';
      case 'emerald': return 'border-emerald-500/60';
      case 'ruby': return 'border-rose-500/60';
      case 'sapphire': return 'border-sky-500/60';
      case 'steel': return 'border-slate-400/60';
      default: return 'border-slate-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl bg-[#141a26]/98 backdrop-blur-md border ${config.borderColor} ${config.glow} p-3.5 text-white transition-all shadow-2xl`}
    >
      {/* Top Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0B0F19]">
        <div
          className={`h-full bg-gradient-to-r ${config.barGradient} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-3 mt-0.5">
        {/* Card Thumbnail */}
        <div className={`relative shrink-0 w-11 h-15 rounded-lg overflow-hidden border ${getInkBorderColor(alert.inkColor)} bg-[#0B0F19] shadow-md`}>
          {alert.cardImage ? (
            <img
              src={alert.cardImage}
              alt={alert.cardName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0B0F19] text-slate-400">
              <Layers className="w-5 h-5 text-amber-400/70" />
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Badges Row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isPlayer
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}
            >
              {isPlayer ? 'You (คุณ)' : 'Opponent (คู่แข่ง)'}
            </span>

            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
              {config.icon}
              <span>{config.badge}</span>
            </span>

            {alert.inkColor && (
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0B0F19] text-slate-300 border border-slate-700">
                {alert.inkColor}
              </span>
            )}
          </div>

          {/* Card & Ability Name */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <h4 className="font-cinzel font-bold text-sm text-amber-200 truncate">
              {alert.cardName}
              {alert.cardTitle && <span className="font-sans font-normal text-xs text-slate-400 ml-1">({alert.cardTitle})</span>}
            </h4>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-0.5">
              <ChevronRight className="w-3 h-3 inline text-amber-400/70" />
              {alert.abilityName}
            </span>
          </div>

          {/* Effect Description */}
          <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-[#0B0F19]/80 p-2 rounded-lg border border-slate-800 font-outfit">
            {alert.thaiText || alert.originalText}
          </p>

          {/* Action Hint (if any) */}
          {alert.actionHint && (
            <div className="mt-1.5 flex items-start gap-1.5 bg-purple-950/30 border border-purple-500/30 text-purple-200 text-[11px] p-2 rounded-lg leading-snug font-outfit">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>{alert.actionHint}</span>
            </div>
          )}
        </div>

        {/* Dismiss Button with Tactile Microinteraction */}
        <motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => onDismiss(alert.id)}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
          title="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
