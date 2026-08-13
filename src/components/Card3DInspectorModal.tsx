import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Sparkles, Shield, Swords, Compass, Droplets, Tag, Star, Flame, Eye } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';
import { InkSymbol } from './InkSymbol';

interface Card3DInspectorModalProps {
  card: LorcanaCard | null;
  countInDeck: number;
  onClose: () => void;
  onAddCard: (card: LorcanaCard) => void;
  onRemoveCard: (card: LorcanaCard) => void;
}

export const Card3DInspectorModal: React.FC<Card3DInspectorModalProps> = ({
  card,
  countInDeck,
  onClose,
  onAddCard,
  onRemoveCard,
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  if (!card) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotX = ((y - centerY) / centerY) * -22; // Tilt X angle (-22 to +22 deg)
    const rotY = ((x - centerX) / centerX) * 22;  // Tilt Y angle (-22 to +22 deg)
    
    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.75,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  const rarity = card.rarity || 'Common';

  // Specific Rarity Holographic Foil & Shadow Styles
  const getRarityFoilStyle = () => {
    switch (rarity) {
      case 'Legendary':
        return {
          shadow: 'shadow-[0_0_60px_rgba(245,158,11,0.85)] border-2 border-amber-400',
          foilBg: 'bg-gradient-to-r from-red-500/30 via-yellow-400/30 via-emerald-400/30 via-cyan-400/30 via-purple-500/30 to-pink-500/30 animate-pulse',
          badgeBg: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black',
          glowColor: 'rgba(245,158,11,0.9)',
        };
      case 'Super Rare':
        return {
          shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.75)] border-2 border-purple-400',
          foilBg: 'bg-gradient-to-tr from-purple-600/30 via-cyan-400/30 to-pink-500/30',
          badgeBg: 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold',
          glowColor: 'rgba(168,85,247,0.8)',
        };
      case 'Rare':
        return {
          shadow: 'shadow-[0_0_40px_rgba(234,179,8,0.65)] border border-amber-400/80',
          foilBg: 'bg-gradient-to-b from-amber-400/20 via-yellow-500/20 to-transparent',
          badgeBg: 'bg-amber-500 text-slate-950 font-bold',
          glowColor: 'rgba(234,179,8,0.7)',
        };
      case 'Uncommon':
        return {
          shadow: 'shadow-[0_0_30px_rgba(148,163,184,0.5)] border border-slate-300/60',
          foilBg: 'bg-gradient-to-tr from-slate-400/20 to-cyan-300/20',
          badgeBg: 'bg-slate-300 text-slate-900 font-bold',
          glowColor: 'rgba(148,163,184,0.5)',
        };
      case 'Enchanted':
        return {
          shadow: 'shadow-[0_0_70px_rgba(236,72,153,0.9)] border-2 border-pink-400',
          foilBg: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/40 via-purple-600/40 to-indigo-900/40',
          badgeBg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-black',
          glowColor: 'rgba(236,72,153,0.9)',
        };
      case 'Iconic':
        return {
          shadow: 'shadow-[0_0_80px_rgba(239,68,68,0.95)] border-2 border-rose-400 animate-pulse',
          foilBg: 'bg-gradient-to-r from-rose-500/40 via-amber-400/40 via-emerald-400/40 via-cyan-400/40 via-purple-500/40 to-pink-500/40 animate-pulse',
          badgeBg: 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 text-slate-950 font-black',
          glowColor: 'rgba(239,68,68,0.95)',
        };
      case 'Epic':
        return {
          shadow: 'shadow-[0_0_65px_rgba(249,115,22,0.9)] border-2 border-orange-400',
          foilBg: 'bg-gradient-to-tr from-orange-500/40 via-amber-400/30 to-purple-600/40',
          badgeBg: 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-slate-950 font-black',
          glowColor: 'rgba(249,115,22,0.9)',
        };
      case 'Special':
        return {
          shadow: 'shadow-[0_0_55px_rgba(16,185,129,0.85)] border-2 border-emerald-400',
          foilBg: 'bg-gradient-to-tr from-emerald-500/30 via-teal-400/30 to-cyan-400/30',
          badgeBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-bold',
          glowColor: 'rgba(16,185,129,0.85)',
        };
      default: // Common
        return {
          shadow: 'shadow-[0_0_20px_rgba(100,116,139,0.3)] border border-slate-700',
          foilBg: 'bg-slate-900/40',
          badgeBg: 'bg-slate-700 text-slate-200 font-bold',
          glowColor: 'rgba(100,116,139,0.3)',
        };
    }
  };

  const foilConfig = getRarityFoilStyle();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl font-outfit select-none overflow-y-auto">
        {/* Backdrop Close Click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-10 max-w-4xl w-full glass-panel border border-amber-400/30 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center bg-[#051424]/95"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer z-30"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT: 3D ROTATING HOLOGRAPHIC CARD */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center py-4">
            <div className="text-xs font-mono text-amber-300/80 mb-3 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Hover & Move mouse to rotate 3D Foil</span>
            </div>

            {/* 3D Card Container */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`w-[290px] h-[410px] md:w-[320px] md:h-[450px] rounded-2xl relative cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out preserve-3d ${foilConfig.shadow}`}
              style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Main Card Image */}
              <img
                src={card.imageUrl}
                alt={card.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.lorcana.ravensburger.com/images/en/set1/1_ea50bda8825b4ccdf7e71c7052ee9688f92e75ab.jpg';
                }}
                className="w-full h-full object-cover rounded-2xl shadow-2xl pointer-events-none"
              />

              {/* Rarity Holographic Foil Overlay */}
              <div
                className={`absolute inset-0 rounded-2xl pointer-events-none mix-blend-color-dodge transition-opacity duration-300 ${foilConfig.foilBg}`}
                style={{ opacity: glarePos.opacity ? 0.65 : 0.25 }}
              />

              {/* Interactive Light Beam Spot Reflection (Glare) */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: glarePos.opacity,
                  background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 80%)`,
                }}
              />

              {/* Holographic Sparkle Particle Effect for Legendary / Super Rare */}
              {(rarity === 'Legendary' || rarity === 'Super Rare' || rarity === 'Enchanted') && (
                <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                  <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-30 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CARD STATS & DETAILS BREAKDOWN */}
          <div className="w-full md:w-1/2 flex flex-col justify-between space-y-5">
            <div>
              {/* Rarity & Ink Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${foilConfig.badgeBg} shadow flex items-center gap-1`}>
                  <Star className="w-3.5 h-3.5 fill-current" /> {rarity}
                </span>

                <span className="bg-slate-900 border border-slate-700 text-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                  <InkSymbol ink={card.ink} size={16} /> {card.ink} Ink
                </span>

                <span className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  {card.type}
                </span>
              </div>

              {/* Card Title & Subtitle */}
              <h2 className="font-cinzel font-black text-2xl md:text-3xl text-amber-300 leading-tight">
                {card.name}
              </h2>
              {card.title && (
                <p className="text-sm text-amber-400/90 italic font-cinzel font-semibold mb-3">
                  {card.title}
                </p>
              )}

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Cost</div>
                  <div className="font-cinzel text-lg font-black text-amber-300">{card.cost} Ink</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Inkable</div>
                  <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                    {card.inkwell ? '💧 Yes' : '🚫 No'}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Strength / Will</div>
                  <div className="font-mono text-sm font-bold text-rose-300 mt-0.5">
                    {card.strength ?? '-'} / {card.willpower ?? '-'}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Lore Value</div>
                  <div className="font-cinzel text-lg font-black text-amber-400">
                    {card.lore ? `♦ ${card.lore}` : '-'}
                  </div>
                </div>
              </div>

              {/* Card Description / Flavor Text */}
              <div className="bg-[#010f1f] border border-slate-800 p-4 rounded-2xl space-y-2 text-xs leading-relaxed text-[#c6c6cc]">
                <div className="font-cinzel text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Card Information
                </div>
                <p className="italic font-mono text-[11px] text-slate-300">
                  "{card.name} - {card.title || 'Official Lorcana Card'}. A powerful {card.rarity || 'Common'} {card.ink} {card.type} ready for battle in the Lorcana Realm."
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Set 1: The First Chapter</span>
                  <span>ID: #{card.id}</span>
                </div>
              </div>
            </div>

            {/* Deck Management Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-cinzel text-slate-300 font-bold">In Current Deck:</span>
                <span className="font-mono text-sm font-black text-amber-400">{countInDeck} / 4 Cards</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onRemoveCard(card)}
                  disabled={countInDeck === 0}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30 text-rose-300 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" /> Remove 1
                </button>

                <button
                  onClick={() => onAddCard(card)}
                  disabled={countInDeck >= 4}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Add 1 To Deck
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
