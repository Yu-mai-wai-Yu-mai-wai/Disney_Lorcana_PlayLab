import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Tag, Calendar, CheckCircle2, ChevronRight, Layers, Swords, ShieldCheck, Wrench } from 'lucide-react';
import { PATCH_NOTES, APP_VERSION, APP_BUILD_DATE, PatchNote } from '../data/patchNotes';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(PATCH_NOTES[0].version);

  if (!isOpen) return null;

  const currentPatch = PATCH_NOTES.find((p) => p.version === selectedVersion) || PATCH_NOTES[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Multiplayer':
        return <SwitchesIcon className="w-4 h-4 text-cyan-400" />;
      case 'Gameplay':
        return <Swords className="w-4 h-4 text-[#F59E0B]" />;
      case 'UI/UX':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Cloud/Backend':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'Fixes':
        return <Wrench className="w-4 h-4 text-rose-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Multiplayer':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50';
      case 'Gameplay':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'UI/UX':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/50';
      case 'Cloud/Backend':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'Fixes':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#0B0F19] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#141a26]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
                <Tag className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
                    Lorcana PlayLab <span className="text-[#F59E0B]">Patch Notes</span>
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#F59E0B] text-black rounded-full shadow-sm">
                    {APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] font-outfit">
                  บันทึกรายการอัปเดตระบบ, ฟีเจอร์ใหม่ และการปรับปรุงความเสถียร
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0B0F19] rounded-lg border border-transparent hover:border-[#30363d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Version List Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#30363d] bg-[#0d1320] p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
              <div className="text-[11px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider mb-1 hidden md:block px-2">
                Version History
              </div>
              {PATCH_NOTES.map((patch) => {
                const isSelected = patch.version === selectedVersion;
                const isLatest = patch.version === APP_VERSION;
                return (
                  <button
                    key={patch.version}
                    onClick={() => setSelectedVersion(patch.version)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#141a26] border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-[#0B0F19]/60 border-[#30363d] hover:border-[#94A3B8]/50 text-[#94A3B8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-sm ${isSelected ? 'text-[#F59E0B]' : 'text-[#F1F5F9]'}`}>
                          {patch.version}
                        </span>
                        {isLatest && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                            LATEST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {patch.releaseDate}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#F59E0B] translate-x-0.5' : 'text-[#94A3B8] opacity-0 group-hover:opacity-100'}`} />
                  </button>
                );
              })}
            </div>

            {/* Patch Details Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6">
              {/* Patch Title & Highlight */}
              <div className="bg-[#141a26] border border-[#30363d] p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F59E0B]" />
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9]">
                    {currentPatch.title}
                  </h3>
                  <span className="text-xs font-mono text-[#F59E0B] bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-[#30363d]">
                    Release: {currentPatch.releaseDate}
                  </span>
                </div>
                <p className="text-sm text-[#94A3B8] font-outfit leading-relaxed">
                  {currentPatch.highlight}
                </p>
              </div>

              {/* Categorized Features */}
              <div className="space-y-4">
                {currentPatch.features.map((cat, idx) => (
                  <div key={idx} className="bg-[#141a26]/70 border border-[#30363d] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold font-cinzel px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${getCategoryBadgeClass(cat.category)}`}>
                        {cat.category}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs text-[#CBD5E1] flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#30363d] bg-[#141a26] flex items-center justify-between text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Build: {APP_VERSION} ({APP_BUILD_DATE})</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#F59E0B] text-black font-bold font-cinzel text-xs rounded-lg hover:bg-[#D97706] transition-colors"
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SwitchesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 3h5v5" />
    <path d="M8 3H3v5" />
    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
    <path d="m15 9 6-6" />
  </svg>
);
