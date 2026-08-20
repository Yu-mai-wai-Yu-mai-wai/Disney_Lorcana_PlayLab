import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, Eye, Flame, Sparkles } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { DeckViewerModal } from './DeckViewerModal';
import { RECOMMENDED_DECKS } from '../data/recommendedDecks';
import { translateInkColor } from '../utils/cardTranslator';
import { InkSymbol } from './InkSymbol';
import { fetchFullDataset, PoolCard } from '../data/cardPool';

interface MatchDeckSelectProps {
  decks: any[];
  selectedDeckId: string | null;
  onSelect: (deckId: string, deckName: string, deckObject?: any) => void;
}

export const MatchDeckSelect: React.FC<MatchDeckSelectProps> = ({ decks, selectedDeckId, onSelect }) => {
  const [viewingDeck, setViewingDeck] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'myDecks' | 'metaDecks'>('metaDecks');
  const [dataset, setDataset] = useState<PoolCard[]>([]);
  const { t, language } = useLanguageStore();

  useEffect(() => {
    fetchFullDataset().then((data) => {
      if (data && data.length > 0) {
        setDataset(data);
      }
    });
  }, []);

  const formattedMetaDecks = RECOMMENDED_DECKS.map((d) => ({
    deckId: d.id,
    id: d.id,
    name: d.name,
    description: d.description,
    inkColors: d.inkColors,
    archetype: d.archetype,
    isMeta: true,
    totalCards: d.cards.reduce((sum, c) => sum + c.count, 0),
    cards: d.cards.map((c) => ({
      cardId: c.cardId,
      count: c.count,
    })),
  }));

  const displayedDecks = activeTab === 'myDecks' ? decks : formattedMetaDecks;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const getDeckCoverImage = (deck: any) => {
    if (deck.cards && deck.cards.length > 0) {
      const first = deck.cards[0];
      if (first.card?.imageUrl) return first.card.imageUrl;
      if (first.imageUrl) return first.imageUrl;
      if (first.img) return first.img;
      const cardId = first.cardId || first.id;
      if (cardId && dataset.length > 0) {
        const found = dataset.find((c) => c.id === cardId);
        if (found?.imageUrl || found?.img) return found.imageUrl || found.img;
      }
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        {/* Header & Glassmorphic Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-cinzel text-xl md:text-2xl font-bold text-[#F1F5F9]">{t.selectYourDeck}</h2>
              <span className="shimmer-badge badge-shimmer-gold text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                {displayedDecks.length}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-mono mt-1">
              {activeTab === 'metaDecks' 
                ? (language === 'th' ? `เด็ค Meta ยอดนิยม (${formattedMetaDecks.length} เด็ค)` : `Popular Meta Decks (${formattedMetaDecks.length})`)
                : (language === 'th' ? `เด็คที่คุณสร้างไว้ (${decks.length} เด็ค)` : `Your Custom Decks (${decks.length})`)}
            </p>
          </div>

          {/* Glass Tab Pills */}
          <div className="flex bg-[#0B0F19]/90 p-1 rounded-xl border border-white/10 shadow-inner backdrop-blur-md self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('metaDecks')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'metaDecks' 
                  ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'Meta Decks' : 'Meta Decks'}</span>
            </button>
            <button
              onClick={() => setActiveTab('myDecks')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'myDecks' 
                  ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'เด็คของฉัน' : 'My Decks'}</span>
            </button>
          </div>
        </div>

        {/* Deck List with Spotlight Cards & Shimmer Badges */}
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto pr-1.5 custom-scrollbar min-h-[380px] max-h-[560px]">
          {displayedDecks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-white/10 p-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <Layers className="w-7 h-7 text-[#94A3B8] opacity-60" />
              </div>
              <p className="text-[#94A3B8] font-outfit text-sm">{t.noDecksYet}</p>
            </div>
          ) : (
            displayedDecks.map((deck) => {
              const deckIdentifier = deck.deckId || deck.id;
              const isSelected = selectedDeckId === deckIdentifier;
              const coverImage = getDeckCoverImage(deck);
              const primaryInk = deck.inkColors && deck.inkColors.length > 0 ? deck.inkColors[0].toLowerCase() : 'amber';
              const totalCards = deck.totalCards || deck.cards?.reduce((sum: number, c: any) => sum + (c.count || 1), 0) || 0;

              return (
                <div 
                  key={deckIdentifier} 
                  onMouseMove={handleMouseMove}
                  onClick={() => onSelect(deckIdentifier, deck.name, deck)}
                  className={`spotlight-card spotlight-card-${primaryInk} group relative rounded-2xl border transition-all duration-250 cursor-pointer overflow-hidden p-4 sm:p-4.5 min-h-[92px] ${
                    isSelected 
                      ? 'border-[#F59E0B] bg-gradient-to-br from-[#1c2436]/95 via-[#141a26]/90 to-[#101622]/95 shadow-[0_0_25px_rgba(245,158,11,0.25),inset_0_1px_0_0_rgba(254,240,138,0.2)]' 
                      : 'border-white/10 bg-gradient-to-br from-[#141a26]/80 via-[#101622]/70 to-[#0b0f19]/80 hover:border-white/20 hover:bg-[#161d2b]/90 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      {/* Deck Cover Thumbnail with Card-Foil Light */}
                      <div className={`relative w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border transition-all duration-300 ${
                        isSelected 
                          ? 'border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.4)]' 
                          : 'border-white/15 group-hover:border-white/30 shadow-md'
                      }`}>
                        {coverImage ? (
                          <img 
                            src={coverImage} 
                            alt={deck.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full bg-[#0B0F19] flex items-center justify-center">
                            <Layers className="w-6 h-6 text-[#F59E0B]" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#F59E0B]/15 backdrop-blur-[0.5px] pointer-events-none" />
                        )}
                      </div>

                      {/* Deck Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-cinzel font-bold text-sm sm:text-base md:text-lg truncate transition-colors ${
                            isSelected ? 'text-[#F59E0B]' : 'text-[#F1F5F9] group-hover:text-white'
                          }`}>
                            {deck.name}
                          </h3>

                          {deck.isMeta && (
                            <span className="shimmer-badge badge-shimmer-gold text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 font-bold">
                              <Flame className="w-2.5 h-2.5 text-amber-400" />
                              <span>META</span>
                            </span>
                          )}
                        </div>

                        {deck.description && (
                          <p className="text-xs text-[#94A3B8] truncate max-w-full font-outfit mt-0.5">
                            {deck.description}
                          </p>
                        )}

                        {/* Badges Bar: Shimmer Inks, Card Count, Archetype */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5">
                          <span className="shimmer-badge badge-shimmer-amber text-[10px] sm:text-[11px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 font-semibold">
                            <Layers className="w-3 h-3" />
                            <span>{totalCards} {t.cardsCount}</span>
                          </span>

                          {deck.archetype && (
                            <span className="shimmer-badge text-[10px] sm:text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full shrink-0 font-semibold">
                              {deck.archetype}
                            </span>
                          )}

                          {deck.inkColors && deck.inkColors.map((ink: string) => {
                            const inkLower = ink.toLowerCase();
                            return (
                              <span 
                                key={ink} 
                                className={`shimmer-badge badge-shimmer-${inkLower} text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold font-mono tracking-wide shrink-0`}
                              >
                                <InkSymbol ink={ink} size={12} className="shrink-0" />
                                <span>{translateInkColor(ink, language)}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Controls: Dedicated container for Selection badge & View Cards button */}
                    <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 shrink-0 ml-2 sm:ml-3">
                      {isSelected && (
                        <div 
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F59E0B] text-black font-bold shadow-[0_0_14px_rgba(245,158,11,0.6)] animate-in zoom-in-50 duration-200 shrink-0"
                          title={language === 'th' ? 'เด็คที่เลือก' : 'Selected Deck'}
                        >
                          <CheckCircle2 className="w-4.5 h-4.5 fill-black text-[#F59E0B]" />
                        </div>
                      )}
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDeck(deck);
                        }}
                        className="px-3.5 py-2 text-xs border border-[#F59E0B]/50 hover:border-[#F59E0B] text-[#F59E0B] hover:text-black bg-[#F59E0B]/10 hover:bg-[#F59E0B] rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-sm shrink-0 active:scale-95 group/btn font-cinzel font-bold"
                        title={language === 'th' ? 'ดูการ์ดทั้งหมดในเด็ค' : 'View Deck Cards'}
                      >
                        <Eye className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                        <span>{language === 'th' ? 'ดูการ์ด' : 'View Cards'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deck Viewer Pop-up Modal */}
      <DeckViewerModal
        isOpen={Boolean(viewingDeck)}
        deck={viewingDeck}
        isSelected={viewingDeck ? (selectedDeckId === (viewingDeck.deckId || viewingDeck.id)) : false}
        onClose={() => setViewingDeck(null)}
        onSelect={viewingDeck ? () => {
          onSelect(viewingDeck.deckId || viewingDeck.id, viewingDeck.name, viewingDeck);
          setViewingDeck(null);
        } : undefined}
      />
    </>
  );
};

