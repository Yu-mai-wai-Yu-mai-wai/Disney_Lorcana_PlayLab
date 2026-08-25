import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sparkles, X, Shield, Star, Image as ImageIcon } from 'lucide-react';
import { PLAYMAT_SKINS, type PlaymatSkin } from '../data/playmats';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { InkSymbol } from './InkSymbol';

interface PlaymatSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaymatSelectorModal: React.FC<PlaymatSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentPlaymatId, setPlaymatId } = usePlaymatStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Official' | 'Classic' | 'Special'>('All');
  const [previewSkinId, setPreviewSkinId] = useState<string>(currentPlaymatId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and restore on unmount/close
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const filteredSkins = PLAYMAT_SKINS.filter((skin) => {
    if (selectedCategory === 'All') return true;
    return skin.tag === selectedCategory;
  });

  const activePreviewSkin = PLAYMAT_SKINS.find((s) => s.id === previewSkinId) || PLAYMAT_SKINS[0];
  const isEquipped = currentPlaymatId === activePreviewSkin.id;

  const handleSelectAndEquip = (skin: PlaymatSkin) => {
    setPreviewSkinId(skin.id);
    setPlaymatId(skin.id);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#0E131F] border border-[#F59E0B]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#141a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#F59E0B] flex items-center gap-2">
                {language === 'th' ? 'เลือกลาย PLAYMAT สนามประลอง' : 'SELECT PLAYMAT SKIN'}
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                  {PLAYMAT_SKINS.length} Skins
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-outfit">
                {language === 'th'
                  ? 'ปรับแต่งสกินและพื้นหลังสนามรบเวทมนตร์ของคุณเพื่อใช้งานทั้งในโต๊ะจำลองและสนามดวลออนไลน์'
                  : 'Customize your battlefield theme and magical background (Syncs across Sandbox & Matches)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#30363d] bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Left Preview + Right Grid */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* LEFT: Live Preview Panel */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#30363d] bg-[#0B0F19]/80 p-4 sm:p-5 flex flex-col justify-between shrink-0 lg:overflow-y-auto">
            <div>
              <div className="text-[10px] font-cinzel font-bold text-[#F59E0B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'th' ? 'ตัวอย่างการแสดงผลในสนาม' : 'Battlefield Preview'}
              </div>

              {/* Battlefield Mockup Frame */}
              <div
                className="relative w-full aspect-video rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-500 flex flex-col justify-between p-3.5"
                style={{
                  borderColor: activePreviewSkin.accentColor,
                  backgroundImage: `url(${activePreviewSkin.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Ambient glow overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-85"
                  style={{ background: activePreviewSkin.ambientGlow }}
                />

                {/* Top preview bar */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded bg-black/70 border border-white/20 text-white backdrop-blur-sm">
                    {language === 'th' ? activePreviewSkin.characterTh : activePreviewSkin.character}
                  </span>
                  <div className="flex items-center gap-1">
                    {activePreviewSkin.inkColors.map((ink) => (
                      <div key={ink} className="w-4 h-4 rounded-full bg-black/60 p-0.5 border border-white/20 flex items-center justify-center">
                        <InkSymbol ink={ink} size={12} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Card Zones */}
                <div className="relative z-10 grid grid-cols-3 gap-2 my-auto opacity-75 pointer-events-none">
                  <div className="h-14 rounded-lg border border-dashed border-white/40 bg-black/30 flex items-center justify-center">
                    <span className="text-[8px] font-mono text-slate-300">OPPONENT</span>
                  </div>
                  <div className="h-14 rounded-lg border border-[#F59E0B]/50 bg-black/40 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <span className="text-[8px] font-cinzel font-bold text-[#F59E0B]">BATTLEFIELD</span>
                  </div>
                  <div className="h-14 rounded-lg border border-dashed border-white/40 bg-black/30 flex items-center justify-center">
                    <span className="text-[8px] font-mono text-slate-300">PLAYER</span>
                  </div>
                </div>

                {/* Bottom skin tag */}
                <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-slate-200 bg-black/75 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                  <span>{activePreviewSkin.series}</span>
                  <span className="font-bold" style={{ color: activePreviewSkin.accentColor }}>
                    {activePreviewSkin.tag}
                  </span>
                </div>
              </div>

              {/* Skin Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-cinzel text-base font-bold text-white">
                    {language === 'th' ? activePreviewSkin.nameTh : activePreviewSkin.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {activePreviewSkin.character}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-outfit leading-relaxed bg-[#141a26] p-3 rounded-xl border border-[#30363d]">
                  {language === 'th' ? activePreviewSkin.descriptionTh : activePreviewSkin.description}
                </p>
              </div>
            </div>

            {/* Equip Button */}
            <div className="mt-4 pt-3 border-t border-[#30363d]">
              <button
                onClick={() => handleSelectAndEquip(activePreviewSkin)}
                className={`w-full py-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isEquipped
                    ? 'bg-emerald-600/20 border border-emerald-500/80 text-emerald-300 cursor-default'
                    : 'bg-[#F59E0B] hover:bg-[#D97706] text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
              >
                {isEquipped ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    {language === 'th' ? 'กำลังใช้งานลายนี้' : 'CURRENTLY EQUIPPED'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {language === 'th' ? 'ติดตั้งลายนี้ลงสนาม' : 'EQUIP PLAYMAT'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Grid Selection */}
          <div className="lg:col-span-7 p-5 flex flex-col overflow-hidden">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#30363d] overflow-x-auto shrink-0">
              {(['All', 'Official', 'Classic', 'Special'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#F59E0B] text-black shadow-md'
                      : 'bg-[#141a26] text-slate-400 border border-[#30363d] hover:text-white hover:border-slate-500'
                  }`}
                >
                  {cat === 'All' ? (language === 'th' ? 'ทุกลาย' : 'All Skins') : cat}
                </button>
              ))}
            </div>

            {/* Skins Grid */}
            <div className="flex-1 overflow-y-auto pt-3 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
              {filteredSkins.map((skin) => {
                const isSelected = previewSkinId === skin.id;
                const isCurrentActive = currentPlaymatId === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => setPreviewSkinId(skin.id)}
                    className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden bg-[#141a26] ${
                      isSelected
                        ? 'border-[#F59E0B] ring-1 ring-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'border-[#30363d] hover:border-slate-500'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-black">
                      <img
                        src={skin.previewImage}
                        alt={skin.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Tag */}
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 border border-white/20 text-white">
                        {skin.tag}
                      </span>

                      {/* Equipped Check */}
                      {isCurrentActive && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/90 border border-emerald-300 text-black text-[9px] font-bold font-mono flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                          EQUIPPED
                        </div>
                      )}

                      {/* Ink Symbols */}
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                        {skin.inkColors.map((ink) => (
                          <div key={ink} className="w-3.5 h-3.5 rounded-full bg-black/80 p-0.5 border border-white/20 flex items-center justify-center">
                            <InkSymbol ink={ink} size={10} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skin Details */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <h4 className="font-cinzel text-xs font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                          {language === 'th' ? skin.nameTh : skin.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-outfit">
                          {language === 'th' ? skin.characterTh : skin.character}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndEquip(skin);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-cinzel font-bold transition-all cursor-pointer ${
                          isCurrentActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 hover:bg-[#F59E0B] hover:text-black'
                        }`}
                      >
                        {isCurrentActive ? (language === 'th' ? 'ใช้งานอยู่' : 'Equipped') : (language === 'th' ? 'เลือก' : 'Select')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#30363d] bg-[#141a26] flex items-center justify-between text-xs text-slate-400 font-outfit">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{language === 'th' ? 'บันทึกลายอัตโนมัติลงในเบราว์เซอร์' : 'Skins auto-save to browser storage'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] text-slate-200 text-xs font-cinzel font-bold transition-colors cursor-pointer"
          >
            {language === 'th' ? 'ปิดหน้าต่าง' : 'Done'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
