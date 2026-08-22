import React, { useState, useRef } from 'react';
import { X, Plus, Minus, Sparkles, Star, Tag, Globe, HelpCircle } from 'lucide-react';
import { LorcanaCard } from '../types/lorcana';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';
import { useLanguageStore } from '../store/useLanguageStore';
import { translateCardAbilityText, translateAbilityName, extractKeywordsFromText, translateCardType, translateRarity, translateInkColor } from '../utils/cardTranslator';

interface Card3DInspectorModalProps {
  card: LorcanaCard | null;
  countInDeck?: number;
  onClose: () => void;
  onAddCard?: (card: LorcanaCard) => void;
  onRemoveCard?: (card: LorcanaCard) => void;
}

export const Card3DInspectorModal: React.FC<Card3DInspectorModalProps> = ({
  card,
  countInDeck = 0,
  onClose,
  onAddCard,
  onRemoveCard,
}) => {
  const { language, t } = useLanguageStore();
  const [showThai, setShowThai] = useState(language === 'th');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync with global language if changed
  React.useEffect(() => {
    setShowThai(language === 'th');
  }, [language]);

  if (!card) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotX = ((y - centerY) / centerY) * -22;
    const rotY = ((x - centerX) / centerX) * 22;
    
    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.5,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  };

  const rarity = card.rarity || 'Common';

  const getRarityFoilStyle = () => {
    switch (rarity) {
      case 'Legendary':
      case 'Enchanted':
      case 'Iconic':
        return {
          border: 'border-2 border-[#F59E0B]',
          badgeBg: 'bg-[#F59E0B] text-black font-bold',
        };
      case 'Epic':
      case 'Super Rare':
        return {
          border: 'border-2 border-purple-400',
          badgeBg: 'bg-purple-500 text-white font-bold',
        };
      case 'Rare':
      case 'Uncommon':
        return {
          border: 'border border-amber-400/80',
          badgeBg: 'bg-[#242b3d] text-[#F59E0B] border border-[#F59E0B]',
        };
      default:
        return {
          border: 'border border-[#30363d]',
          badgeBg: 'bg-[#0B0F19] text-[#94A3B8]',
        };
    }
  };

  const foilConfig = getRarityFoilStyle();

  return (
    <Modal isOpen={!!card} onClose={onClose} ariaLabel="Card Inspector" overlayClassName="bg-[#0B0F19]/85 font-outfit select-none overflow-y-auto">
      <div className="relative z-10 max-w-4xl w-full bg-[#141a26] border border-[#30363d] rounded-2xl p-5 sm:p-6 md:p-7 flex flex-col md:flex-row gap-6 md:gap-7 items-stretch max-h-[88vh] overflow-hidden mx-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 p-1.5 text-[#94A3B8] hover:text-white rounded-xl bg-[#0B0F19]/90 border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer z-30 shadow-md"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* LEFT: 3D ROTATING HOLOGRAPHIC CARD */}
        <div className="w-full md:w-[42%] flex flex-col items-center justify-center py-1 shrink-0">
          <div className="text-[11px] font-mono text-[#F59E0B] mb-2 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{t.hoverToRotate3D}</span>
          </div>

          {/* 3D Card Container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`w-[220px] h-[310px] sm:w-[250px] sm:h-[350px] rounded-xl relative cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out preserve-3d shadow-2xl ${foilConfig.border}`}
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Main Card Image */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0B0F19]">
              <div className="absolute inset-0 bg-[#0B0F19] border border-[#30363d] rounded-xl flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                <span className="font-cinzel text-sm font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                <span className="text-[9px] text-[#94A3B8] font-mono mt-1">Image unavailable</span>
              </div>
              <img
                src={card.imageUrl}
                alt={card.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-full h-full object-cover rounded-xl pointer-events-none relative z-10"
              />
            </div>

            {/* Interactive Light Beam Spot Reflection (Glare) */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 z-20"
              style={{
                opacity: glarePos.opacity,
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.4) 0%, transparent 70%)`,
              }}
            />
          </div>
        </div>

        {/* RIGHT: CARD STATS & DETAILS BREAKDOWN (Self-contained scroll area) */}
        <div className="w-full md:w-[58%] flex flex-col justify-between overflow-y-auto custom-scrollbar pr-1.5 space-y-3.5 max-h-[78vh]">
          <div>
            {/* Rarity & Ink Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${foilConfig.badgeBg} flex items-center gap-1`}>
                <Star className="w-3 h-3 fill-current" /> {translateRarity(rarity, language)}
              </span>

              <span className="bg-[#0B0F19] border border-[#30363d] text-[#F59E0B] px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1">
                <InkSymbol ink={card.ink} size={14} /> {translateInkColor(card.ink, language)}
              </span>

              <span className="bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold">
                {translateCardType(card.type, language)}
              </span>
            </div>

            {/* Card Title & Subtitle */}
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#F59E0B] leading-tight">
              {card.name}
            </h2>
            {card.title && (
              <p className="text-xs text-[#94A3B8] font-cinzel font-semibold mb-2">
                {card.title}
              </p>
            )}

            {/* Attributes Grid */}
            <div className="grid grid-cols-4 gap-2 my-2.5">
              <div className="bg-[#0B0F19] border border-[#30363d] p-1.5 rounded-lg text-center">
                <div className="text-[9px] text-[#94A3B8] font-mono uppercase">{t.cost}</div>
                <div className="font-cinzel text-sm sm:text-base font-bold text-[#F59E0B]">{card.cost} Ink</div>
              </div>

              <div className="bg-[#0B0F19] border border-[#30363d] p-1.5 rounded-lg text-center">
                <div className="text-[9px] text-[#94A3B8] font-mono uppercase">{t.inkable}</div>
                <div className={`font-mono text-xs sm:text-sm font-bold mt-0.5 ${(card.inkwell ?? (card as any).isInkable ?? true) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(card.inkwell ?? (card as any).isInkable ?? true) ? t.yes : t.no}
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-[#30363d] p-1.5 rounded-lg text-center">
                <div className="text-[9px] text-[#94A3B8] font-mono uppercase">{t.strengthWill}</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-rose-300 mt-0.5">
                  {card.strength ?? '-'} / {card.willpower ?? '-'}
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-[#30363d] p-1.5 rounded-lg text-center">
                <div className="text-[9px] text-[#94A3B8] font-mono uppercase">{t.loreValue}</div>
                <div className="font-cinzel text-sm sm:text-base font-bold text-[#F59E0B]">
                  {card.lore ? card.lore : '-'}
                </div>
              </div>
            </div>

            {/* Special Abilities Box with Live Translation Switcher */}
            {card.abilities && card.abilities.length > 0 && (
              <div className="bg-[#0B0F19] border border-[#30363d] p-2.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-cinzel text-[#F59E0B] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" /> {t.specialAbilities}
                  </div>

                  {/* Toggle between Thai translation and Original English */}
                  <button
                    onClick={() => setShowThai(!showThai)}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Toggle translation mode"
                  >
                    <Globe className="w-2.5 h-2.5 text-[#F59E0B]" />
                    <span>{showThai ? 'แปลไทย' : 'English'}</span>
                  </button>
                </div>

                {card.abilities.map((ab, idx) => (
                  <div key={idx} className="text-[11px] font-mono leading-relaxed bg-[#141a26]/70 p-2 rounded border border-[#30363d]/60">
                    <span className="font-bold text-[#F59E0B]">{showThai ? translateAbilityName(ab.name, ab.text, 'th') : translateAbilityName(ab.name, ab.text, 'en')}: </span>
                    <span className="text-[#F1F5F9]">
                      {showThai ? translateCardAbilityText(ab.text, ab.name, 'th') : translateCardAbilityText(ab.text, ab.name, 'en')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Keywords Glossary Interactive Badges */}
            {(() => {
              const fullText = (card.abilities?.map(a => `${a.name} ${a.text}`).join(' ') || '') + ' ' + (card.flavorText || '');
              const keywordsFound = extractKeywordsFromText(fullText);
              if (keywordsFound.length === 0) return null;

              return (
                <div className="bg-[#0B0F19] border border-[#30363d] p-2.5 rounded-lg space-y-1.5">
                  <div className="text-[10px] font-cinzel text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-[#F59E0B]" />
                    <span>{t.keywordsGlossary}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {keywordsFound.map((kw) => (
                      <div key={kw.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setSelectedKeywordId(selectedKeywordId === kw.id ? null : kw.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${kw.badgeColor} hover:scale-105 flex items-center gap-1`}
                        >
                          <span>{kw.name}</span>
                          <span className="text-[8px] opacity-75 font-normal">({kw.thaiName})</span>
                        </button>

                        {/* Interactive Tooltip Card */}
                        {(selectedKeywordId === kw.id || undefined) && (
                          <div className="mt-1 p-2 bg-[#141a26] border border-[#F59E0B]/50 rounded-lg text-left text-[11px] shadow-xl space-y-0.5">
                            <div className="font-bold text-[#F59E0B]">
                              <span>{kw.name} • {kw.thaiName}</span>
                            </div>
                            <p className="text-[#F1F5F9] text-[10px] leading-snug">{kw.descriptionTh}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Card Description / Flavor Text */}
            <div className="bg-[#0B0F19] border border-[#30363d] p-2.5 rounded-lg space-y-1 text-[11px] leading-relaxed text-[#94A3B8]">
              <div className="font-cinzel text-[#F59E0B] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#F59E0B]" /> {t.cardInformation}
              </div>
              <p className="font-mono text-[10px] text-[#F1F5F9] italic">
                {card.flavorText ? `"${card.flavorText}"` : `"${card.name} - ${card.title || 'Official Lorcana Card'}."`}
              </p>
              <div className="pt-1 border-t border-[#30363d] flex justify-between text-[9px] font-mono text-[#94A3B8]">
                <span>{t.set}: {card.setCode || 'Set 1'}</span>
                <span>{t.cardId}: #{card.id}</span>
              </div>
            </div>
          </div>

          {/* Deck Management Actions */}
          {(onAddCard || onRemoveCard) ? (
            <div className="space-y-2 pt-1 border-t border-[#30363d]/60 shrink-0">
              <div className="flex items-center justify-between bg-[#0B0F19] px-3 py-1.5 rounded-lg border border-[#30363d]">
                <span className="text-xs font-cinzel text-[#F1F5F9] font-bold">{t.inCurrentDeck}</span>
                <span className="font-mono text-xs font-bold text-[#F59E0B]">{countInDeck} / 4 {t.cardsCount}</span>
              </div>

              <div className="flex gap-2.5">
                {onRemoveCard && (
                  <button
                    onClick={() => onRemoveCard(card)}
                    disabled={countInDeck === 0}
                    className="flex-1 bg-[#0B0F19] hover:bg-rose-950/40 border border-[#30363d] disabled:opacity-30 text-rose-400 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" /> {t.removeOne}
                  </button>
                )}

                {onAddCard && (
                  <button
                    onClick={() => onAddCard(card)}
                    disabled={countInDeck >= 4}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black py-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5 text-black" /> {t.addOneToDeck}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-1 shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#F1F5F9] border border-[#30363d] py-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
