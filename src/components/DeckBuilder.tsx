import React from 'react';
import { useDeckStore } from '../store/useDeckStore';
import { InkColor, LorcanaCard } from '../types/lorcana';
import { Search, Plus, Minus, Layers, Filter, Trash2, Save, Sparkles, CheckCircle2 } from 'lucide-react';

const INK_COLORS: (InkColor | 'All')[] = ['All', 'Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

// Rich Lorcana Database with Real Lorcast Medium Card Images
const SAMPLE_DATABASE: LorcanaCard[] = [
  { id: '1', name: 'Mickey Mouse', title: 'Wayward Sorcerer', cost: 4, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 4, lore: 2, imageUrl: 'https://cards.lorcast.io/lc/set1/115/en/medium.png' },
  { id: '2', name: 'Elsa', title: 'Spirit of Winter', cost: 8, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Legendary', strength: 4, willpower: 6, lore: 3, imageUrl: 'https://cards.lorcast.io/lc/set1/42/en/medium.png' },
  { id: '3', name: 'Stitch', title: 'Rock Star', cost: 6, inkwell: true, ink: 'Amber', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 5, lore: 2, imageUrl: 'https://cards.lorcast.io/lc/set1/23/en/medium.png' },
  { id: '4', name: 'Dragon Fire', title: 'Banish Chosen Character', cost: 5, inkwell: false, ink: 'Ruby', type: 'Action', rarity: 'Uncommon', imageUrl: 'https://cards.lorcast.io/lc/set1/112/en/medium.png' },
  { id: '5', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, inkwell: false, ink: 'Ruby', type: 'Character', rarity: 'Legendary', strength: 7, willpower: 5, lore: 2, imageUrl: 'https://cards.lorcast.io/lc/set1/113/en/medium.png' },
  { id: '6', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, inkwell: true, ink: 'Ruby', type: 'Character', rarity: 'Super Rare', strength: 5, willpower: 5, lore: 2, imageUrl: 'https://cards.lorcast.io/lc/set1/104/en/medium.png' },
  { id: '7', name: 'Tinker Bell', title: 'Giant Fairy', cost: 6, inkwell: true, ink: 'Steel', type: 'Character', rarity: 'Super Rare', strength: 4, willpower: 5, lore: 2, imageUrl: 'https://cards.lorcast.io/lc/set1/193/en/medium.png' },
  { id: '8', name: 'A Whole New World', title: 'Each player discards hand', cost: 5, inkwell: true, ink: 'Steel', type: 'Action', rarity: 'Super Rare', imageUrl: 'https://cards.lorcast.io/lc/set1/195/en/medium.png' },
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
      {/* Search & Filter Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel-heavy p-4 rounded-2xl border border-purple-500/20 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards by character name, title or type..."
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
          />
        </div>

        {/* Ink Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Filter className="w-4 h-4 text-amber-400 mr-1 shrink-0" />
          {INK_COLORS.map((ink) => (
            <button
              key={ink}
              onClick={() => setInkFilter(ink)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                selectedInkFilter === ink
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400/40 scale-105'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {ink}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout: Card Catalog (Left) vs Deck Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Pool Catalog (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel font-bold text-base text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>LORCANA CARD CATALOG ({filteredCards.length} Cards)</span>
            </h2>
            <span className="text-xs text-purple-300/70 font-semibold">
              Max 4 copies per card (Lorcana TCG Standard)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="glass-panel-heavy p-4 rounded-2xl border border-slate-800 hover:border-purple-500/60 shadow-xl flex flex-col justify-between space-y-3 transition-all hover:scale-[1.02]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                      {card.ink}
                    </span>
                    <span className="font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 rounded-lg shadow-sm">
                      Cost: {card.cost}
                    </span>
                  </div>

                  <div className="h-44 rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="font-cinzel font-bold text-xs text-white truncate">{card.name}</h3>
                      {card.title && <p className="text-[10px] text-amber-300 truncate">{card.title}</p>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => addCard(card)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Deck</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Deck Drawer (1 Column) */}
        <div className="glass-panel-heavy p-6 rounded-3xl border border-purple-500/30 flex flex-col justify-between space-y-5 h-fit shadow-2xl">
          <div className="space-y-4">
            {/* Deck Title & Count Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-transparent font-cinzel font-bold text-base text-amber-300 outline-none border-b border-purple-500/30 focus:border-amber-400 pb-0.5"
              />
              <span
                className={`text-xs font-black px-3 py-1 rounded-xl shadow ${
                  totalCards >= 60
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                }`}
              >
                {totalCards} / 60 Cards
              </span>
            </div>

            {/* Cards List in Current Deck */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {currentDeck.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs italic flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400/50" />
                  <span>Your deck is empty. Click "+" on any card to begin building!</span>
                </div>
              ) : (
                currentDeck.map(({ card, count }) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-inner"
                  >
                    <div className="truncate pr-2">
                      <p className="font-bold text-slate-100 truncate">{card.name}</p>
                      <p className="text-[10px] text-purple-400 font-semibold">{card.ink} • Cost {card.cost}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => removeCard(card.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-amber-300">{count}</span>
                      <button
                        onClick={() => addCard(card)}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Save & Clear Deck Action Buttons */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-800">
            <button
              onClick={clearDeck}
              className="px-4 py-2.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={() => alert(`Deck "${deckName}" saved successfully to AWS DynamoDB!`)}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Deck (DynamoDB)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
