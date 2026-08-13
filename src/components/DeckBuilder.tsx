import React from 'react';
import { useDeckStore } from '../store/useDeckStore';
import { InkColor, LorcanaCard } from '../types/lorcana';
import { Search, Plus, Minus, Layers, Filter, Trash2, Save, Sparkles, CheckCircle2, CloudUpload, BarChart3, AlertTriangle, ChevronLeft, ChevronRight, Eye, Gift } from 'lucide-react';
import { apiService } from '../services/api';
import { Card3DInspectorModal } from './Card3DInspectorModal';
import { BoosterPackModal } from './BoosterPackModal';
import { InkSymbol } from './InkSymbol';

const INK_COLORS: (InkColor | 'All')[] = ['All', 'Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

const SAMPLE_DATABASE: LorcanaCard[] = [
  { id: '1', name: 'Mickey Mouse', title: 'Wayward Sorcerer', cost: 4, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 4, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg' },
  { id: '2', name: 'Elsa', title: 'Spirit of Winter', cost: 8, inkwell: true, ink: 'Amethyst', type: 'Character', rarity: 'Legendary', strength: 4, willpower: 6, lore: 3, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/40_01dc5bb928054aa2b228f2a1f97910208b36b42b.jpg' },
  { id: '3', name: 'Stitch', title: 'Rock Star', cost: 6, inkwell: true, ink: 'Amber', type: 'Character', rarity: 'Super Rare', strength: 3, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg' },
  { id: '4', name: 'Dragon Fire', title: 'Banish Chosen Character', cost: 5, inkwell: false, ink: 'Ruby', type: 'Action', rarity: 'Uncommon', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/130_decfce2e256561e57abe8d2d5e378a3781c2ee6d.jpg' },
  { id: '5', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, inkwell: false, ink: 'Ruby', type: 'Character', rarity: 'Legendary', strength: 7, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg' },
  { id: '6', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, inkwell: true, ink: 'Ruby', type: 'Character', rarity: 'Super Rare', strength: 5, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg' },
  { id: '7', name: 'Tinker Bell', title: 'Giant Fairy', cost: 6, inkwell: true, ink: 'Steel', type: 'Character', rarity: 'Super Rare', strength: 4, willpower: 5, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/58_e13723fd1214327ef6f4ac4954201558bd90caa6.jpg' },
  { id: '8', name: 'A Whole New World', title: 'Each player discards hand', cost: 5, inkwell: true, ink: 'Steel', type: 'Action', rarity: 'Super Rare', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/195_94542b1a94127cea3923cf9975650520a9a08151.jpg' },
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

  const [cardsDatabase, setCardsDatabase] = React.useState<LorcanaCard[]>(SAMPLE_DATABASE);
  const [selectedType, setSelectedType] = React.useState<string>('All');
  const [selectedRarity, setSelectedRarity] = React.useState<string>('All');
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = React.useState<LorcanaCard | null>(null);
  const [isBoosterModalOpen, setIsBoosterModalOpen] = React.useState(false);

  const CARDS_PER_PAGE = 24;

  React.useEffect(() => {
    fetch('/dataset/lorcana_set1_set2.json')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCardsDatabase(data);
        }
      })
      .catch(() => {});
  }, []);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedInkFilter, selectedType, selectedRarity, searchQuery]);

  const filteredCards = React.useMemo(() => {
    return cardsDatabase.filter((card) => {
      const matchesInk = selectedInkFilter === 'All' || card.ink === selectedInkFilter;
      const matchesType = selectedType === 'All' || card.type === selectedType;
      const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity;
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (card.title && card.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesInk && matchesType && matchesRarity && matchesSearch;
    });
  }, [cardsDatabase, selectedInkFilter, selectedType, selectedRarity, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const paginatedCards = React.useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredCards.slice(start, start + CARDS_PER_PAGE);
  }, [filteredCards, currentPage]);

  const totalCards = getTotalCards();

  const handleSaveDeck = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await apiService.saveDeck(deckName, currentDeck);
      if (res.error) {
        setSaveStatus(`Saved locally (Cloud mock mode)`);
      } else {
        setSaveStatus(`Saved successfully to AWS DynamoDB!`);
      }
    } catch (e: any) {
      setSaveStatus(`Saved locally (Cloud ready)`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 mt-4 font-outfit select-none">
      {/* Left Column: Filter Bar & Card Grid (70%) */}
      <div className="w-full md:w-[70%] flex flex-col gap-6">
        
        {/* Top Feature Banner & Filter Bar */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-amber-500/15 shadow-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards by name or title..."
                className="w-full shadcn-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono"
              />
            </div>

            {/* Open Booster Pack Button */}
            <button
              onClick={() => setIsBoosterModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-cinzel font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shrink-0"
            >
              <Gift className="w-4 h-4 fill-slate-950" />
              <span>Open Booster Pack (เปิดซองการ์ด)</span>
            </button>
          </div>

          {/* Secondary Filters Bar */}
          <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-amber-500/15 shadow-2xl">
            {/* Ink Color Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {INK_COLORS.map((ink) => {
                const pillClass = ink === 'Amber' ? 'ink-amber'
                  : ink === 'Amethyst' ? 'ink-amethyst'
                  : ink === 'Emerald' ? 'ink-emerald'
                  : ink === 'Ruby' ? 'ink-ruby'
                  : ink === 'Sapphire' ? 'ink-sapphire'
                  : ink === 'Steel' ? 'ink-steel' : '';

                const isActive = selectedInkFilter === ink;

                return (
                  <button
                    key={ink}
                    onClick={() => setInkFilter(ink)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      ink === 'All'
                        ? isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60'
                          : 'bg-slate-900/90 text-slate-400 border border-slate-800'
                        : pillClass
                    } ${isActive ? 'scale-105 shadow-md font-extrabold' : 'opacity-70 hover:opacity-100'}`}
                  >
                    {ink !== 'All' && (
                      <InkSymbol ink={ink} size={15} />
                    )}
                    {ink}
                  </button>
                );
              })}
            </div>

            {/* Right Select Filters */}
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#0B0F19] border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Character">Character</option>
                <option value="Action">Action</option>
                <option value="Item">Item</option>
                <option value="Location">Location</option>
              </select>

              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-[#0B0F19] border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="All">Any Rarity</option>
                <option value="Common">Common</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Rare">Rare</option>
                <option value="Super Rare">Super Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
                <option value="Enchanted">Enchanted</option>
                <option value="Iconic">Iconic</option>
                <option value="Special">Special</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter & Pagination Header */}
        <div className="flex justify-between items-center px-1 font-mono text-xs text-slate-400">
          <div>
            Showing <strong className="text-amber-400">{paginatedCards.length}</strong> of <strong className="text-white">{filteredCards.length}</strong> Cards Found
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-amber-300">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedCards.map((card) => {
            const countInDeck = currentDeck.find((item) => item.card.id === card.id)?.count || 0;

            return (
              <div
                key={card.id}
                onClick={() => setInspectedCard(card)}
                className="card-container relative bg-slate-950/80 rounded-2xl card-foil border border-purple-500/20 hover:border-amber-400 aspect-[2.5/3.5] overflow-hidden group cursor-pointer shadow-xl flex flex-col justify-between"
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.lorcana.ravensburger.com/images/en/set1/1_ea50bda8825b4ccdf7e71c7052ee9688f92e75ab.jpg';
                  }}
                  className="w-full h-full object-cover absolute inset-0"
                />

                {/* Overlays */}
                <div className="absolute top-2 left-2 w-8 h-8 bg-slate-950/90 rounded-full border border-amber-400 flex items-center justify-center font-cinzel text-sm text-amber-300 font-black shadow-lg z-10 font-mono">
                  {card.cost}
                </div>

                {card.inkwell && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-950/90 border border-amber-400 flex items-center justify-center z-10"
                    title="Inkwell Card"
                  >
                    <div className="w-3 h-3 bg-amber-400 rounded-full blur-[1px]" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10">
                  <h3 className="font-cinzel font-bold text-slate-100 truncate text-xs">{card.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-amber-400 font-mono text-[9px] font-bold uppercase">{card.ink} • {card.type}</span>
                    <div className="flex gap-1 font-mono text-[10px]">
                      {card.strength !== undefined && <span className="text-rose-400 font-bold">{card.strength}</span>}
                      {card.willpower !== undefined && <span className="text-indigo-400 font-bold">/{card.willpower}</span>}
                      {card.lore !== undefined && <span className="text-amber-300 font-bold ml-1">♦{card.lore}</span>}
                    </div>
                  </div>
                </div>

                {/* Hover Add Button & Details Overlay */}
                <div className="card-hover-overlay absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-between backdrop-blur-md z-20 p-3.5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-amber-300 font-cinzel block">{card.name}</span>
                    {card.title && <span className="text-[10px] text-purple-300 italic block">{card.title}</span>}
                    <span className="text-[9px] text-slate-400 font-mono block">{card.ink} • {card.rarity}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedCard(card);
                    }}
                    className="w-full py-1.5 bg-purple-900/80 hover:bg-purple-600 border border-purple-400/40 text-amber-300 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow cursor-pointer flex items-center justify-center gap-1 my-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect 3D Card
                  </button>

                  <div className="w-full flex flex-col items-center gap-1.5 pt-1">
                    <div className="flex items-center justify-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono font-black text-amber-300 text-base px-1">{countInDeck}</span>
                      <button
                        onClick={() => addCard(card)}
                        className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Footer */}
        <div className="flex justify-between items-center glass-panel p-4 rounded-2xl font-mono text-xs text-slate-400">
          <div>
            Page <strong className="text-amber-300">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Previous Page
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Deck List Panel (30%) */}
      <div className="w-full md:w-[30%] flex flex-col gap-6">
        <div className="glass-panel p-5 rounded-3xl border border-purple-500/20 shadow-2xl flex flex-col gap-4 sticky top-20">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-transparent font-cinzel font-black text-lg text-amber-300 outline-none border-b border-dashed border-amber-400/50 focus:border-amber-400 py-0.5 w-full"
              />
              <div className="text-[10px] font-mono text-slate-400 mt-1">AWS DynamoDB Deck Builder</div>
            </div>

            <div className="text-right">
              <div className={`font-mono text-base font-black ${totalCards === 60 ? 'text-emerald-400' : totalCards > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                {totalCards}/60
              </div>
              <div className="text-[9px] text-slate-400 font-mono">Cards in Deck</div>
            </div>
          </div>

          {/* Deck List Items */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {currentDeck.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No cards added yet. Click cards on the left grid to build your deck!
              </div>
            ) : (
              currentDeck.map(({ card, count }) => (
                <div
                  key={card.id}
                  onClick={() => setInspectedCard(card)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-10 object-cover rounded shadow"
                    />
                    <div className="truncate">
                      <div className="font-cinzel text-xs font-bold text-slate-100 truncate group-hover:text-amber-300">{card.name}</div>
                      <div className="text-[9px] text-amber-400 font-mono">{card.ink} • {card.cost} Ink</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => removeCard(card.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-black text-amber-300 w-4 text-center">{count}</span>
                    <button
                      onClick={() => addCard(card)}
                      className="p-1 text-slate-400 hover:text-amber-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Deck Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {saveStatus && (
              <div className="text-center font-mono text-[10px] text-amber-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                {saveStatus}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={clearDeck}
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-rose-500 text-rose-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear Deck
              </button>

              <button
                onClick={handleSaveDeck}
                disabled={isSaving}
                className="flex-1 btn-primary py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Deck'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D HOLOGRAPHIC CARD INSPECTOR POPUP MODAL */}
      <Card3DInspectorModal
        card={inspectedCard}
        countInDeck={inspectedCard ? (currentDeck.find((i) => i.card.id === inspectedCard.id)?.count || 0) : 0}
        onClose={() => setInspectedCard(null)}
        onAddCard={(c) => addCard(c)}
        onRemoveCard={(c) => removeCard(c.id)}
      />

      {/* DISNEY LORCANA BOOSTER PACK OPENING SIMULATOR */}
      <BoosterPackModal
        isOpen={isBoosterModalOpen}
        cardsDatabase={cardsDatabase}
        onClose={() => setIsBoosterModalOpen(false)}
        onAddCardsToDeck={(cards) => {
          cards.forEach((c) => addCard(c));
        }}
      />
    </div>
  );
};
