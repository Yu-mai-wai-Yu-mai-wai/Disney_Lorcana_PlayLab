import React from 'react';
import { useDeckStore } from '../store/useDeckStore';
import { InkColor, LorcanaCard } from '../types/lorcana';
import { Search, Plus, Minus, Layers, Filter, Trash2, Save } from 'lucide-react';

const INK_COLORS: (InkColor | 'All')[] = ['All', 'Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

const SAMPLE_DATABASE: LorcanaCard[] = [
  { id: '1', name: 'Mickey Mouse', title: 'Wayward Sorcerer', cost: 4, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 4, lore: 2, imageUrl: '' },
  { id: '2', name: 'Elsa', title: 'Spirit of Winter', cost: 8, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Legendary', strength: 4, willpower: 6, lore: 3, imageUrl: '' },
  { id: '3', name: 'Stitch', title: 'Rock Star', cost: 6, inkwell: true, ink: 'Amber', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 5, lore: 2, imageUrl: '' },
  { id: '4', name: 'Dragon Fire', title: '', cost: 5, inkwell: false, ink: 'Ruby', type: 'Action', rarity: 'Uncommon', imageUrl: '' },
  { id: '5', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, inkwell: false, ink: 'Ruby', type: 'Character', rarity: 'Legendary', strength: 7, willpower: 5, lore: 2, imageUrl: '' },
  { id: '6', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, inkwell: true, ink: 'Ruby', type: 'Character', rarity: 'Super Rare', strength: 5, willpower: 5, lore: 2, imageUrl: '' },
  { id: '7', name: 'Tinker Bell', title: 'Giant Fairy', cost: 6, inkwell: true, ink: 'Steel', type: 'Character', rarity: 'Super Rare', strength: 4, willpower: 5, lore: 2, imageUrl: '' },
  { id: '8', name: 'A Whole New World', title: '', cost: 5, inkwell: true, ink: 'Steel', type: 'Action', rarity: 'Super Rare', imageUrl: '' },
];

export const DeckBuilder: React.FC = () => {
  const {
    currentDeck,
    deckName,
    selectedInkFilter,
    searchQuery,
    setDeckName,
    addCard,
    removeCard,
    clearDeck,
    setInkFilter,
    setSearchQuery,
    getTotalCards,
  } = useDeckStore();

  const filteredCards = SAMPLE_DATABASE.filter((card) => {
    const matchesInk = selectedInkFilter === 'All' || card.ink === selectedInkFilter;
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (card.title && card.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesInk && matchesSearch;
  });

  const totalCards = getTotalCards();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-purple-500/20">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search card by name or title..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
          />
        </div>

        {/* Ink Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Filter className="w-4 h-4 text-purple-400 mr-1 shrink-0" />
          {INK_COLORS.map((ink) => (
            <button
              key={ink}
              onClick={() => setInkFilter(ink)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedInkFilter === ink
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {ink}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Card Pool (Left) vs Current Deck List (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Pool (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Card Database (Set 1 & Set 2)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-purple-400">{card.ink}</span>
                    <span className="font-extrabold text-amber-400 bg-amber-950 px-2 py-0.5 rounded">
                      Cost: {card.cost}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{card.name}</h3>
                  {card.title && <p className="text-xs text-slate-400 italic">{card.title}</p>}
                </div>

                <button
                  onClick={() => addCard(card)}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Deck</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Deck Drawer (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between space-y-4 h-fit">
          <div>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-transparent font-bold text-base text-amber-300 outline-none border-b border-purple-500/30 focus:border-amber-400 pb-1"
              />
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  totalCards >= 60 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}
              >
                {totalCards} / 60 Cards
              </span>
            </div>

            {/* Deck Item List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {currentDeck.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  No cards in deck yet. Click "+" on any card to build your deck!
                </div>
              ) : (
                currentDeck.map(({ card, count }) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-200">{card.name}</span>
                      <span className="text-[10px] text-purple-400 ml-1.5">({card.ink})</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => removeCard(card.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold text-amber-300">{count}</span>
                      <button
                        onClick={() => addCard(card)}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={clearDeck}
              className="px-3 py-2 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={() => alert(`Deck "${deckName}" saved successfully!`)}
              className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
            >
              <Save className="w-4 h-4" />
              Save Deck (DynamoDB)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
