import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface MatchDeckSelectProps {
  decks: any[];
  selectedDeckId: string | null;
  onSelect: (deckId: string, deckName: string) => void;
}

export const MatchDeckSelect: React.FC<MatchDeckSelectProps> = ({ decks, selectedDeckId, onSelect }) => {
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);

  if (!decks || decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#141a26] rounded-xl border border-[#30363d]">
        <Layers className="w-12 h-12 text-[#94A3B8] mb-4" />
        <p className="text-[#94A3B8] font-outfit">No decks found. Please create a deck first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[70vh] custom-scrollbar">
      <h2 className="font-cinzel text-xl text-[#F1F5F9] mb-2">Select Your Deck</h2>
      {decks.map((deck) => {
        const isSelected = selectedDeckId === deck.id;
        const isExpanded = expandedDeckId === deck.id;

        return (
          <div 
            key={deck.id} 
            className={`flex flex-col rounded-xl bg-[#141a26] border transition-colors cursor-pointer overflow-hidden ${isSelected ? 'border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'border-[#30363d] hover:border-[#94A3B8]'}`}
            onClick={() => onSelect(deck.id, deck.name)}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-16 bg-[#0B0F19] border border-[#30363d] rounded overflow-hidden flex items-center justify-center shrink-0">
                  {deck.cards && deck.cards.length > 0 ? (
                    <img src={deck.cards[0].card?.imageUrl || deck.cards[0].imageUrl} alt="cover" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Layers className="w-5 h-5 text-[#94A3B8]" />
                  )}
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-[#F1F5F9]">{deck.name}</h3>
                  <p className="text-xs text-[#94A3B8] font-mono">{deck.cards?.reduce((sum: number, c: any) => sum + (c.count || 1), 0) || 0} Cards</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedDeckId(isExpanded ? null : deck.id);
                }}
                className="px-3 py-1 text-xs border border-[#30363d] text-[#94A3B8] rounded hover:text-[#F1F5F9] transition-colors"
              >
                {isExpanded ? 'Hide' : 'View'}
              </button>
            </div>
            {isExpanded && (
              <div className="bg-[#0B0F19] p-3 border-t border-[#30363d] max-h-48 overflow-y-auto custom-scrollbar">
                {deck.cards?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-[#30363d]/50 last:border-0">
                    <span className="text-sm font-outfit text-[#F1F5F9] truncate mr-2">{item.card?.name || item.name}</span>
                    <span className="text-xs font-mono text-[#F59E0B]">x{item.count || 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
