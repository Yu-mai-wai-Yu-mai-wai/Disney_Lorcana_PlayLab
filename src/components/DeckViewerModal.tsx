import React, { useState } from 'react';
import { X, Layers, Sparkles, Sword, Shield, Eye, CheckCircle2 } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { translateCardType, translateInkColor, translateRarity } from '../utils/cardTranslator';
import { InkSymbol } from './InkSymbol';
import { Card3DInspectorModal } from './Card3DInspectorModal';
import { LorcanaCard } from '../types/lorcana';

interface DeckCardItem {
  card?: LorcanaCard;
  count?: number;
  [key: string]: any;
}

interface DeckViewerModalProps {
  isOpen: boolean;
  deck: {
    name?: string;
    deckId?: string;
    id?: string;
    totalCards?: number;
    cards?: DeckCardItem[];
    [key: string]: any;
  } | null;
  onClose: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const DeckViewerModal: React.FC<DeckViewerModalProps> = ({
  isOpen,
  deck,
  onClose,
  onSelect,
  isSelected = false,
}) => {
  const { t, language } = useLanguageStore();
  const [inspectedCard, setInspectedCard] = useState<LorcanaCard | null>(null);

  if (!isOpen || !deck) return null;

  const rawCards = deck.cards || [];
  const normalizedCards: { card: LorcanaCard; count: number }[] = rawCards.map((item: any) => {
    if (item.card) {
      return { card: item.card, count: item.count || 1 };
    }
    return {
      card: {
        id: item.id || item.cardId || 'unknown',
        name: item.name || 'Unknown Card',
        title: item.title || '',
        cost: item.cost ?? 1,
        inkwell: item.inkwell ?? true,
        ink: item.ink || 'Amber',
        type: item.type || 'Character',
        rarity: item.rarity || 'Common',
        strength: item.strength,
        willpower: item.willpower,
        lore: item.lore,
        imageUrl: item.imageUrl || '',
        abilities: item.abilities,
      } as LorcanaCard,
      count: item.count || 1,
    };
  });

  const totalCount = normalizedCards.reduce((sum, item) => sum + item.count, 0);
  const inksFound = Array.from(new Set(normalizedCards.map((c) => c.card.ink).filter(Boolean)));
  const characterCount = normalizedCards.filter(c => c.card.type === 'Character').reduce((s, c) => s + c.count, 0);
  const actionCount = normalizedCards.filter(c => c.card.type === 'Action').reduce((s, c) => s + c.count, 0);
  const itemCount = normalizedCards.filter(c => c.card.type === 'Item').reduce((s, c) => s + c.count, 0);
  const locationCount = normalizedCards.filter(c => c.card.type === 'Location').reduce((s, c) => s + c.count, 0);

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(245,158,11,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-[#30363d] bg-[#0B0F19]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#141a26] border border-[#F59E0B]/50 flex items-center justify-center text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-cinzel text-xl md:text-2xl font-bold text-[#F1F5F9]">{deck.name || 'Custom Deck'}</h2>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'th' ? 'เด็คที่เลือกอยู่' : 'Selected'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono text-[#F59E0B] bg-[#141a26] px-2.5 py-0.5 rounded border border-[#30363d]">
                    {totalCount} {t.cardsCount}
                  </span>
                  {inksFound.map((ink) => (
                    <span key={ink} className="inline-flex items-center gap-1 text-xs font-mono text-[#F1F5F9] bg-[#141a26] px-2 py-0.5 rounded border border-[#30363d]">
                      <InkSymbol ink={ink} size={13} />
                      {translateInkColor(ink, language)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-white bg-[#141a26] hover:bg-[#1f2738] rounded-xl border border-[#30363d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-[#0f141f] border-b border-[#30363d] text-xs font-mono">
            <div className="flex justify-between items-center bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsCharacters}:</span>
              <strong className="text-white">{characterCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsActions}:</span>
              <strong className="text-white">{actionCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsItems}:</span>
              <strong className="text-white">{itemCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsLocations}:</span>
              <strong className="text-white">{locationCount}</strong>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0B0F19]">
            {normalizedCards.length === 0 ? (
              <div className="text-center py-16 text-[#94A3B8]">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>{language === 'th' ? 'ไม่มีการ์ดในเด็คนี้' : 'No cards found in this deck.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {normalizedCards.map(({ card, count }, idx) => (
                  <div
                    key={`${card.id}-${idx}`}
                    onClick={() => setInspectedCard(card)}
                    className="relative bg-[#141a26] rounded-xl border border-[#30363d] hover:border-[#F59E0B] aspect-[2.5/3.5] overflow-hidden group cursor-pointer flex flex-col justify-between transition-all hover:scale-105 shadow-md"
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                        <span className="font-cinzel text-xs font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                        <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image</span>
                      </div>
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover absolute inset-0 relative z-10"
                        />
                      )}
                    </div>

                    {/* Cost Badge */}
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-[#0B0F19]/90 rounded-md border border-[#30363d] flex items-center justify-center font-cinzel text-xs text-[#F59E0B] font-bold z-10 font-mono">
                      {card.cost}
                    </div>

                    {/* Quantity Badge */}
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-[#F59E0B] text-black font-mono font-bold text-xs rounded-full shadow-lg z-10">
                      x{count}
                    </div>

                    {/* Bottom Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-[#0B0F19]/90 border-t border-[#30363d] z-10">
                      <h4 className="font-cinzel font-bold text-[#F1F5F9] truncate text-[11px]">{card.name}</h4>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[#F59E0B] font-mono text-[9px] uppercase font-bold truncate">
                          {translateInkColor(card.ink, language)}
                        </span>
                        <div className="flex gap-1 font-mono text-[9px] text-[#94A3B8]">
                          {card.strength !== undefined && <span className="text-rose-400 font-bold">{card.strength}</span>}
                          {card.willpower !== undefined && <span className="text-indigo-400 font-bold">/{card.willpower}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#0B0F19]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F59E0B] text-black font-cinzel font-bold text-xs rounded-lg shadow-lg">
                        <Eye className="w-3.5 h-3.5" /> {language === 'th' ? 'ดู 3D' : 'Inspect'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-[#30363d] bg-[#0B0F19]">
            <p className="text-xs text-[#94A3B8] font-mono">
              {language === 'th' ? 'คลิกที่การ์ดเพื่อเปิดดูรายละเอียด 3D และความสามารถ' : 'Click any card to inspect 3D model & abilities'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-[#30363d] hover:bg-[#141a26] text-[#F1F5F9] text-sm font-semibold transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ปิด' : 'Close'}
              </button>
              {onSelect && (
                <button
                  onClick={() => {
                    onSelect();
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] cursor-pointer"
                >
                  {language === 'th' ? 'เลือกเด็คนี้' : 'Select Deck'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded 3D Card Inspector */}
      <Card3DInspectorModal
        card={inspectedCard}
        countInDeck={0}
        onClose={() => setInspectedCard(null)}
      />
    </>
  );
};
