import React, { useState } from 'react';
import { useDeckStore } from '../store/useDeckStore';
import { InkColor, LorcanaCard } from '../types/lorcana';
import { Search, Plus, Minus, Trash2, Save, ChevronLeft, ChevronRight, Eye, Gift, Sword, Shield, Sparkles } from 'lucide-react';
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

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const clearTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClearDeckClick = () => {
    if (isConfirmingClear) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setIsConfirmingClear(false);
      clearDeck();
    } else {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setIsConfirmingClear(true);
      clearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
    }
  };

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

  const [savedDeckId, setSavedDeckId] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [userDecks, setUserDecks] = React.useState<any[]>([]);

  const loadUserDecks = async () => {
    const token = localStorage.getItem('lorcana_token') || undefined;
    if (!token) return;
    const res = await apiService.getUserDecks(token);
    if (res.decks) setUserDecks(res.decks);
  };

  React.useEffect(() => {
    loadUserDecks();
  }, []);

  const handleSaveDeck = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const token = localStorage.getItem('lorcana_token') || undefined;
    try {
      const res = await apiService.saveDeck(deckName, currentDeck, token);
      if (res.error) {
        setSaveStatus(`Saved locally (Cloud mock mode)`);
      } else {
        setSaveStatus(`Saved successfully to AWS DynamoDB!`);
        if (res.deckId) {
          setSavedDeckId(res.deckId);
          setAnalysisResult(null);
        }
        loadUserDecks();
      }
    } catch {
      setSaveStatus(`Saved locally (Cloud ready)`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeDeck = async () => {
    if (!savedDeckId) {
      setSaveStatus('Please save the deck first before analyzing');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const token = localStorage.getItem('lorcana_token') || undefined;
    try {
      await apiService.analyzeDeck(savedDeckId, token);
      setSaveStatus('Analysis queued! Waiting for results...');
      
      // Poll for results
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        const res = await apiService.getDeckAnalysis(savedDeckId, token);
        if (res.analysis) {
          setAnalysisResult(res.analysis);
          setSaveStatus('Analysis complete!');
          clearInterval(pollInterval);
          setIsAnalyzing(false);
        } else if (attempts >= 10) {
          setSaveStatus('Analysis timed out. Try again.');
          clearInterval(pollInterval);
          setIsAnalyzing(false);
        }
      }, 2000);
    } catch {
      setSaveStatus('Failed to start analysis');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 mt-4 font-outfit select-none bg-[#0B0F19]">
      {/* Left Column: Filter Bar & Card Grid (70%) */}
      <div className="w-full md:w-[70%] flex flex-col gap-6">
        
        {/* Top Feature Banner & Filter Bar */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#141a26] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-[#30363d]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards by name or title..."
                className="w-full shadcn-input rounded-lg pl-10 pr-4 py-2 text-xs text-[#F1F5F9] placeholder:text-[#94A3B8] font-mono"
              />
            </div>

            {/* Open Booster Pack Button */}
            <button
              onClick={() => setIsBoosterModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-4 py-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <Gift className="w-4 h-4 text-black" />
              <span>Open Booster Pack</span>
            </button>
          </div>

          {/* Secondary Filters Bar */}
          <div className="bg-[#141a26] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-[#30363d]">
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
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      ink === 'All'
                        ? isActive
                          ? 'bg-[#242b3d] text-[#F59E0B] border border-[#F59E0B]'
                          : 'bg-[#0B0F19] text-[#94A3B8] border border-[#30363d]'
                        : pillClass
                    } ${isActive ? 'border-[#F59E0B] text-[#F59E0B]' : 'opacity-70 hover:opacity-100'}`}
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
                className="bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] rounded-lg py-1.5 px-3 text-xs outline-none focus:border-[#F59E0B] cursor-pointer"
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
                className="bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] rounded-lg py-1.5 px-3 text-xs outline-none focus:border-[#F59E0B] cursor-pointer"
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
        <div className="flex justify-between items-center px-1 font-mono text-xs text-[#94A3B8]">
          <div>
            Showing <strong className="text-[#F59E0B]">{paginatedCards.length}</strong> of <strong className="text-white">{filteredCards.length}</strong> Cards Found
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#141a26] border border-[#30363d] text-[#F1F5F9] hover:text-[#F59E0B] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[#F59E0B]">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#141a26] border border-[#30363d] text-[#F1F5F9] hover:text-[#F59E0B] disabled:opacity-30 cursor-pointer"
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
                role="button"
                tabIndex={0}
                onClick={() => setInspectedCard(card)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setInspectedCard(card);
                  }
                }}
                className="relative bg-[#141a26] rounded-xl border border-[#30363d] hover:border-[#F59E0B] aspect-[2.5/3.5] overflow-hidden group cursor-pointer flex flex-col justify-between transition-colors card-foil-light"
              >
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute inset-0 bg-[#141a26] border border-[#30363d] rounded-xl flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                    <span className="font-cinzel text-xs font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                    <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                  </div>
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover absolute inset-0 relative z-10"
                  />
                </div>

                {/* Overlays */}
                <div className="absolute top-2 left-2 w-7 h-7 bg-[#0B0F19] rounded-lg border border-[#30363d] flex items-center justify-center font-cinzel text-xs text-[#F59E0B] font-bold z-10 font-mono">
                  {card.cost}
                </div>

                {card.inkwell && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded bg-[#0B0F19] border border-[#30363d] flex items-center justify-center z-10"
                    title="Inkwell Card"
                  >
                    <div className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-[#0B0F19]/90 border-t border-[#30363d] z-10">
                  <h3 className="font-cinzel font-bold text-[#F1F5F9] truncate text-xs">{card.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[#F59E0B] font-mono text-[9px] font-bold uppercase">{card.ink} • {card.type}</span>
                    <div className="flex gap-1.5 font-mono text-[10px]">
                      {card.strength !== undefined && <span className="text-rose-400 font-bold flex items-center gap-0.5"><Sword className="w-2.5 h-2.5" />{card.strength}</span>}
                      {card.willpower !== undefined && <span className="text-indigo-400 font-bold flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{card.willpower}</span>}
                      {card.lore !== undefined && <span className="text-[#F59E0B] font-bold flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{card.lore}</span>}
                    </div>
                  </div>
                </div>

                {/* Hover Add Button & Details Overlay */}
                <div className="card-hover-overlay absolute inset-0 bg-[#0B0F19]/95 flex flex-col items-center justify-between z-20 p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#F59E0B] font-cinzel block">{card.name}</span>
                    {card.title && <span className="text-[10px] text-[#94A3B8] block">{card.title}</span>}
                    <span className="text-[9px] text-[#94A3B8] font-mono block">{card.ink} • {card.rarity}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedCard(card);
                    }}
                    className="w-full py-1.5 bg-[#141a26] hover:bg-[#1e2638] border border-[#30363d] text-[#F59E0B] rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 my-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect 3D Card
                  </button>

                  <div className="w-full flex flex-col items-center gap-1.5 pt-1">
                    <div className="flex items-center justify-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => removeCard(card.id)}
                        aria-label="Remove card"
                        className="p-1.5 rounded bg-[#141a26] border border-[#30363d] text-[#F1F5F9] hover:text-rose-400 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-mono font-bold text-[#F59E0B] text-base px-1">{countInDeck}</span>
                      <button
                        onClick={() => addCard(card)}
                        aria-label="Add card"
                        className="p-1.5 rounded bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Footer */}
        <div className="flex justify-between items-center bg-[#141a26] p-4 rounded-xl border border-[#30363d] font-mono text-xs text-[#94A3B8]">
          <div>
            Page <strong className="text-[#F59E0B]">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-[#30363d] bg-[#0B0F19] text-[#F1F5F9] hover:border-[#F59E0B] disabled:opacity-30 cursor-pointer transition-colors"
            >
              Previous Page
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-[#30363d] bg-[#0B0F19] text-[#F1F5F9] hover:border-[#F59E0B] disabled:opacity-30 cursor-pointer transition-colors"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Deck List Panel (30%) */}
      <div className="w-full md:w-[30%] flex flex-col gap-6">
        
        {userDecks.length > 0 && (
          <div className="bg-[#141a26] p-5 rounded-xl border border-[#30363d] flex flex-col gap-3">
            <h3 className="font-cinzel text-sm font-bold text-[#F59E0B]">Your Saved Decks</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
              {userDecks.map(deck => (
                <div key={deck.deckId} className="p-2 bg-[#0B0F19] rounded border border-[#30363d] flex justify-between items-center text-xs cursor-pointer hover:border-[#F59E0B]" onClick={() => {
                  setDeckName(deck.name);
                  clearDeck();
                  deck.cards.forEach((c: any) => {
                    for(let i = 0; i < c.count; i++) addCard(c.card);
                  });
                  setSavedDeckId(deck.deckId);
                  if(deck.analysis) setAnalysisResult(deck.analysis);
                  else setAnalysisResult(null);
                }}>
                  <span className="font-bold text-white truncate">{deck.name}</span>
                  <span className="text-[#94A3B8] font-mono shrink-0">{deck.totalCards} cards</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#141a26] p-5 rounded-xl border border-[#30363d] flex flex-col gap-4 sticky top-20">
          <div className="flex justify-between items-center pb-3 border-b border-[#30363d]">
            <div>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="bg-transparent font-cinzel font-bold text-lg text-[#F59E0B] outline-none border-b border-dashed border-[#F59E0B]/50 focus:border-[#F59E0B] py-0.5 w-full"
              />
              <div className="text-[10px] font-mono text-[#94A3B8] mt-1">AWS DynamoDB Deck Builder</div>
            </div>

            <div className="text-right">
              <div className={`font-mono text-base font-bold ${totalCards === 60 ? 'text-emerald-400' : totalCards > 60 ? 'text-rose-400' : 'text-[#F59E0B]'}`}>
                {totalCards}/60
              </div>
              <div className="text-[9px] text-[#94A3B8] font-mono">Cards in Deck</div>
            </div>
          </div>

          {/* Deck List Items */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {currentDeck.length === 0 ? (
              <div className="text-center py-12 text-[#94A3B8] font-mono text-xs">
                No cards added yet. Click cards on the left grid to build your deck.
              </div>
            ) : (
              currentDeck.map(({ card, count }) => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setInspectedCard(card)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInspectedCard(card);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-8 h-10 object-cover rounded"
                    />
                    <div className="truncate">
                      <div className="font-cinzel text-xs font-bold text-[#F1F5F9] truncate group-hover:text-[#F59E0B]">{card.name}</div>
                      <div className="text-[9px] text-[#F59E0B] font-mono">{card.ink} • {card.cost} Ink</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => removeCard(card.id)}
                      aria-label="Remove card"
                      className="p-1 text-[#94A3B8] hover:text-rose-400 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-[#F59E0B] w-4 text-center">{count}</span>
                    <button
                      onClick={() => addCard(card)}
                      aria-label="Add card"
                      className="p-1 text-[#94A3B8] hover:text-[#F59E0B] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Deck Controls */}
          <div className="space-y-2 pt-2 border-t border-[#30363d]">
            {saveStatus && (
              <div className="text-center font-mono text-[10px] text-[#F59E0B] bg-[#0B0F19] p-2 rounded border border-[#30363d]">
                {saveStatus}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleClearDeckClick}
                className={`flex-1 border py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isConfirmingClear
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                    : 'bg-[#0B0F19] border-[#30363d] hover:border-rose-500 text-rose-400'
                }`}
              >
                <Trash2 className="w-4 h-4" /> {isConfirmingClear ? 'Confirm Clear?' : 'Clear'}
              </button>

              <button
                onClick={handleSaveDeck}
                disabled={isSaving}
                className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black py-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4 text-black" /> {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={handleAnalyzeDeck}
                disabled={isAnalyzing || !savedDeckId}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#141a26] disabled:text-[#94A3B8] text-white py-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" /> {isAnalyzing ? '...' : 'Analyze'}
              </button>
            </div>

            {analysisResult && (
              <div className="mt-4 p-3 bg-[#0B0F19] border border-[#30363d] rounded-lg">
                <h4 className="text-[#F59E0B] font-cinzel font-bold mb-2">Deck Analysis</h4>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#94A3B8]">Synergy Score</span>
                  <span className={`text-lg font-bold ${analysisResult.synergyScore >= 80 ? 'text-emerald-400' : analysisResult.synergyScore >= 50 ? 'text-[#F59E0B]' : 'text-rose-400'}`}>
                    {analysisResult.synergyScore}/100
                  </span>
                </div>

                <div className="text-xs text-[#F1F5F9] mb-4">
                  {analysisResult.summaryText}
                </div>

                <div className="text-xs text-[#94A3B8] mb-1">Cost Curve</div>
                <div className="flex items-end h-16 gap-1 mb-2">
                  {['0-2', '3-4', '5-6', '7+'].map(bracket => {
                    const count = analysisResult.costCurve[bracket] || 0;
                    const height = Math.max(5, (count / analysisResult.totalCards) * 100);
                    return (
                      <div key={bracket} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-[#30363d] rounded-t-sm" style={{ height: `${height}%` }}>
                          <div className="bg-[#F59E0B] w-full h-full rounded-t-sm opacity-80"></div>
                        </div>
                        <span className="text-[9px] font-mono">{bracket} ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
