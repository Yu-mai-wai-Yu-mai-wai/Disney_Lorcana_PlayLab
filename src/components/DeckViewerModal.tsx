import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, Sparkles, Sword, Shield, Eye, CheckCircle2 } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { translateInkColor } from '../utils/cardTranslator';
import { InkSymbol } from './InkSymbol';
import { Card3DInspectorModal } from './Card3DInspectorModal';
import { LorcanaCard } from '../types/lorcana';
import { fetchFullDataset, enrichCard } from '../data/cardPool';

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
  const [mounted, setMounted] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<LorcanaCard | null>(null);
  const [dataset, setDataset] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInkFilter, setSelectedInkFilter] = useState<string>('ALL');

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

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectedCard) {
          setInspectedCard(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inspectedCard, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedInkFilter('ALL');
      fetchFullDataset().then((data) => {
        if (data && data.length > 0) setDataset(data);
      });
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !deck) return null;

  const rawCards = deck.cards || [];
  const normalizedCards: { card: LorcanaCard; count: number }[] = rawCards.map((item: any) => {
    if (item.card) {
      const enriched = dataset.length > 0 ? enrichCard(item.card, dataset) : item.card;
      return { card: enriched, count: item.count || 1 };
    }
    const cardId = item.id || item.cardId;
    const baseCard = {
      id: cardId || 'unknown',
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
    };
    const enriched = dataset.length > 0 ? enrichCard(baseCard, dataset) : baseCard;
    return {
      card: enriched as LorcanaCard,
      count: item.count || 1,
    };
  });

  const totalCount = normalizedCards.reduce((sum, item) => sum + item.count, 0);
  const inksFound = Array.from(new Set(normalizedCards.map((c) => c.card.ink).filter(Boolean)));
  const characterCount = normalizedCards.filter(c => c.card.type === 'Character').reduce((s, c) => s + c.count, 0);
  const actionCount = normalizedCards.filter(c => c.card.type === 'Action').reduce((s, c) => s + c.count, 0);
  const itemCount = normalizedCards.filter(c => c.card.type === 'Item').reduce((s, c) => s + c.count, 0);
  const locationCount = normalizedCards.filter(c => c.card.type === 'Location').reduce((s, c) => s + c.count, 0);

  const filteredCards = normalizedCards.filter(({ card }) => {
    const matchesSearch = !searchQuery || 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.title && card.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.abilities && card.abilities.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesInk = selectedInkFilter === 'ALL' || card.ink === selectedInkFilter;
    return matchesSearch && matchesInk;
  });

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl w-full max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden relative z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 sm:py-5 border-b border-[#30363d] bg-[#0B0F19] shrink-0">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#141a26] border border-[#F59E0B]/50 flex items-center justify-center text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-cinzel text-lg sm:text-xl md:text-2xl font-bold text-[#F1F5F9] truncate">{deck.name || 'Custom Deck'}</h2>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
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
                {deck.description && (
                  <p className="text-xs text-[#94A3B8] font-outfit mt-1.5 leading-relaxed max-w-2xl">
                    {deck.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-white bg-[#141a26] hover:bg-[#1f2738] rounded-xl border border-[#30363d] transition-colors cursor-pointer shrink-0 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Ink Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#0e131d] border-b border-[#30363d] shrink-0">
            <div className="flex-1 min-w-[200px] max-w-sm relative">
              <input
                type="text"
                placeholder={language === 'th' ? '🔍 ค้นหาชื่อการ์ดในเด็ค...' : '🔍 Search cards in deck...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141a26] border border-[#30363d] focus:border-[#F59E0B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedInkFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedInkFilter === 'ALL'
                    ? 'bg-[#F59E0B] text-black shadow-sm'
                    : 'bg-[#141a26] text-slate-400 border border-[#30363d] hover:text-white'
                }`}
              >
                {language === 'th' ? 'ทั้งหมด' : 'All'}
              </button>
              {inksFound.map((ink) => (
                <button
                  key={ink}
                  onClick={() => setSelectedInkFilter(selectedInkFilter === ink ? 'ALL' : ink)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedInkFilter === ink
                      ? 'bg-[#F59E0B] text-black shadow-sm'
                      : 'bg-[#141a26] text-slate-400 border border-[#30363d] hover:text-white'
                  }`}
                >
                  <InkSymbol ink={ink} size={12} />
                  <span>{translateInkColor(ink, language)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 px-6 py-2.5 sm:py-3 bg-[#0f141f] border-b border-[#30363d] text-xs font-mono shrink-0">
            <div className="flex justify-between items-center bg-[#141a26] p-2 sm:p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsCharacters}:</span>
              <strong className="text-white">{characterCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2 sm:p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsActions}:</span>
              <strong className="text-white">{actionCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2 sm:p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsItems}:</span>
              <strong className="text-white">{itemCount}</strong>
            </div>
            <div className="flex justify-between items-center bg-[#141a26] p-2 sm:p-2.5 rounded-lg border border-[#30363d]">
              <span className="text-[#94A3B8]">{t.analyticsLocations}:</span>
              <strong className="text-white">{locationCount}</strong>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#0B0F19]">
            {filteredCards.length === 0 ? (
              <div className="text-center py-16 text-[#94A3B8]">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>{language === 'th' ? 'ไม่พบการ์ดที่ตรงกับคำค้นหาหรือตัวกรอง' : 'No cards match your search or filter.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
                {filteredCards.map(({ card, count }, idx) => (
                  <div
                    key={`${card.id}-${idx}`}
                    onClick={() => setInspectedCard(card)}
                    className="relative bg-[#141a26] rounded-xl border border-[#30363d] hover:border-[#F59E0B] aspect-[2.5/3.5] overflow-hidden group cursor-pointer flex flex-col justify-between transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] shadow-lg"
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                        <span className="font-cinzel text-xs font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono mt-1">Image</span>
                      </div>
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover absolute inset-0 z-10"
                        />
                      )}
                    </div>

                    {/* Cost Badge */}
                    <div className="absolute top-2 left-2 w-7 h-7 bg-[#0B0F19]/90 backdrop-blur-sm rounded-lg border border-[#F59E0B]/50 flex items-center justify-center font-cinzel text-xs sm:text-sm text-[#F59E0B] font-bold z-20 font-mono shadow-md">
                      {card.cost}
                    </div>

                    {/* Quantity Badge */}
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-[#F59E0B] text-black font-mono font-bold text-xs rounded-full shadow-lg z-20 border border-amber-300">
                      x{count}
                    </div>

                    {/* Bottom Info Banner */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent border-t border-[#30363d]/80 z-20">
                      <h4 className="font-cinzel font-bold text-[#F1F5F9] truncate text-xs sm:text-sm drop-shadow-sm">{card.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[#F59E0B] font-mono text-[10px] sm:text-[11px] uppercase font-bold truncate flex items-center gap-1">
                          <InkSymbol ink={card.ink} size={11} />
                          {translateInkColor(card.ink, language)}
                        </span>
                        <div className="flex gap-1.5 font-mono text-[10px] sm:text-[11px]">
                          {card.strength !== undefined && <span className="text-rose-400 font-bold flex items-center gap-0.5"><Sword className="w-2.5 h-2.5" />{card.strength}</span>}
                          {card.willpower !== undefined && <span className="text-indigo-400 font-bold flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{card.willpower}</span>}
                          {card.lore !== undefined && card.lore > 0 && <span className="text-amber-300 font-bold flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{card.lore}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#0B0F19]/75 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F59E0B] text-black font-cinzel font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        <Eye className="w-4 h-4" /> {language === 'th' ? 'ดู 3D' : 'Inspect'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-[#30363d] bg-[#0B0F19] shrink-0">
            <p className="text-xs text-[#94A3B8] font-mono hidden sm:block">
              {language === 'th' ? 'คลิกที่การ์ดเพื่อเปิดดูรายละเอียด 3D และความสามารถ' : 'Click any card to inspect 3D model & abilities'}
            </p>
            <div className="flex items-center gap-3 ml-auto sm:ml-0">
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
    </>,
    document.body
  );
};
