import React, { useState } from 'react';
import { Layers, CheckCircle2, Eye } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { DeckViewerModal } from './DeckViewerModal';

interface MatchDeckSelectProps {
  decks: any[];
  selectedDeckId: string | null;
  onSelect: (deckId: string, deckName: string) => void;
}

export const MatchDeckSelect: React.FC<MatchDeckSelectProps> = ({ decks, selectedDeckId, onSelect }) => {
  const [viewingDeck, setViewingDeck] = useState<any | null>(null);
  const { t, language } = useLanguageStore();

  if (!decks || decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#141a26] rounded-xl border border-[#30363d]">
        <Layers className="w-12 h-12 text-[#94A3B8] mb-4" />
        <p className="text-[#94A3B8] font-outfit">{t.noDecksYet}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[75vh] custom-scrollbar">
        <h2 className="font-cinzel text-xl text-[#F1F5F9] mb-1">{t.selectYourDeck}</h2>
        {decks.map((deck) => {
          const deckIdentifier = deck.deckId || deck.id;
          const isSelected = selectedDeckId === deckIdentifier;

          return (
            <div 
              key={deckIdentifier} 
              className={`flex flex-col rounded-xl bg-[#141a26] border-2 transition-all duration-300 cursor-pointer overflow-hidden ${isSelected ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-[#1a2133] scale-[1.02]' : 'border-[#30363d] hover:border-[#94A3B8] hover:bg-[#1a2133]'}`}
              onClick={() => onSelect(deckIdentifier, deck.name)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-16 bg-[#0B0F19] border border-[#30363d] rounded overflow-hidden flex items-center justify-center shrink-0">
                    {deck.cards && deck.cards.length > 0 ? (
                      <img src={deck.cards[0].card?.imageUrl || deck.cards[0].imageUrl} alt="cover" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <Layers className="w-5 h-5 text-[#94A3B8]" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#F59E0B]/20 flex items-center justify-center" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-outfit font-bold text-lg ${isSelected ? 'text-[#F59E0B]' : 'text-[#F1F5F9]'}`}>{deck.name}</h3>
                    <p className="text-xs text-[#94A3B8] font-mono">{deck.cards?.reduce((sum: number, c: any) => sum + (c.count || 1), 0) || 0} {t.cardsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#F59E0B] animate-in zoom-in duration-300" />}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDeck(deck);
                    }}
                    className="px-3 py-1.5 text-xs border border-[#30363d] hover:border-[#F59E0B] text-[#94A3B8] hover:text-[#F59E0B] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 bg-[#0B0F19]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {language === 'th' ? 'ดูการ์ด' : 'View'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deck Viewer Pop-up Modal */}
      <DeckViewerModal
        isOpen={Boolean(viewingDeck)}
        deck={viewingDeck}
        isSelected={viewingDeck ? (selectedDeckId === (viewingDeck.deckId || viewingDeck.id)) : false}
        onClose={() => setViewingDeck(null)}
        onSelect={viewingDeck ? () => onSelect(viewingDeck.deckId || viewingDeck.id, viewingDeck.name) : undefined}
      />
    </>
  );
};
