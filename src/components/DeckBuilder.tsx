import React, { useState } from 'react';
import { useDeckStore } from '../store/useDeckStore';
import { InkColor, LorcanaCard } from '../types/lorcana';
import { Search, Plus, Minus, Trash2, Save, ChevronLeft, ChevronRight, Eye, Gift, Sword, Shield, Sparkles, Star, Edit3 } from 'lucide-react';
import { apiService } from '../services/api';
import { Card3DInspectorModal } from './Card3DInspectorModal';
import { BoosterPackModal } from './BoosterPackModal';
import { DeckViewerModal } from './DeckViewerModal';
import { InkSymbol } from './InkSymbol';
import { RECOMMENDED_DECKS, RecommendedDeck } from '../data/recommendedDecks';
import { useLanguageStore } from '../store/useLanguageStore';
import { translateCardType, translateInkColor, translateRarity } from '../utils/cardTranslator';

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
  const { t, language } = useLanguageStore();
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
  const [isRecommendedModalOpen, setIsRecommendedModalOpen] = React.useState(false);
  const [isDeckViewerOpen, setIsDeckViewerOpen] = React.useState(false);

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
    const token =
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('lorcana_token') || localStorage.getItem('lorcana_token'))) ||
      undefined;
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
    const token =
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('lorcana_token') || localStorage.getItem('lorcana_token'))) ||
      undefined;
    try {
      const res = await apiService.saveDeck(deckName, currentDeck, token);
      if (res.error) {
        setSaveStatus(t.saveSuccess || 'Saved locally (Cloud mock mode)');
      } else {
        setSaveStatus(t.saveSuccess || 'Saved successfully to AWS DynamoDB!');
        if (res.deckId) {
          setSavedDeckId(res.deckId);
          setAnalysisResult(null);
        }
        loadUserDecks();
      }
    } catch {
      setSaveStatus(t.saveSuccess || 'Saved locally (Cloud ready)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeDeck = async () => {
    if (!savedDeckId) {
      setSaveStatus(language === 'th' ? 'กรุณาบันทึกเด็คก่อนทำการวิเคราะห์' : 'Please save the deck first before analyzing');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const token =
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('lorcana_token') || localStorage.getItem('lorcana_token'))) ||
      undefined;
    try {
      await apiService.analyzeDeck(savedDeckId, token);
      setSaveStatus(language === 'th' ? 'ส่งคำขอวิเคราะห์แล้ว กำลังรอผลลัพธ์...' : 'Analysis queued! Waiting for results...');
      
      // Poll for results
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        const res = await apiService.getDeckAnalysis(savedDeckId, token);
        if (res.analysis) {
          setAnalysisResult(res.analysis);
          setSaveStatus(language === 'th' ? 'วิเคราะห์สำเร็จเรียบร้อย!' : 'Analysis complete!');
          clearInterval(pollInterval);
          setIsAnalyzing(false);
        } else if (attempts >= 10) {
          setSaveStatus(language === 'th' ? 'หมดเวลาการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' : 'Analysis timed out. Try again.');
          clearInterval(pollInterval);
          setIsAnalyzing(false);
        }
      }, 2000);
    } catch {
      setSaveStatus(language === 'th' ? 'ไม่สามารถเริ่มการวิเคราะห์ได้' : 'Failed to start analysis');
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
                placeholder={t.searchPlaceholder}
                className="w-full shadcn-input rounded-lg pl-10 pr-4 py-2 text-xs text-[#F1F5F9] placeholder:text-[#94A3B8] font-mono"
              />
            </div>

            {/* Open Booster Pack Button */}
            <button
              onClick={() => setIsBoosterModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-4 py-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <Gift className="w-4 h-4 text-black" />
              <span>{t.openBoosterPack}</span>
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
                    {ink === 'All' ? t.allInks : translateInkColor(ink, language)}
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
                <option value="All">{t.allTypes}</option>
                <option value="Character">{translateCardType('Character', language)}</option>
                <option value="Action">{translateCardType('Action', language)}</option>
                <option value="Item">{translateCardType('Item', language)}</option>
                <option value="Location">{translateCardType('Location', language)}</option>
              </select>

              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] rounded-lg py-1.5 px-3 text-xs outline-none focus:border-[#F59E0B] cursor-pointer"
              >
                <option value="All">{t.allRarities}</option>
                <option value="Common">{translateRarity('Common', language)}</option>
                <option value="Uncommon">{translateRarity('Uncommon', language)}</option>
                <option value="Rare">{translateRarity('Rare', language)}</option>
                <option value="Super Rare">{translateRarity('Super Rare', language)}</option>
                <option value="Epic">{translateRarity('Epic', language)}</option>
                <option value="Legendary">{translateRarity('Legendary', language)}</option>
                <option value="Enchanted">{translateRarity('Enchanted', language)}</option>
                <option value="Iconic">{translateRarity('Iconic', language)}</option>
                <option value="Special">{translateRarity('Special', language)}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter & Pagination Header */}
        <div className="flex justify-between items-center px-1 font-mono text-xs text-[#94A3B8]">
          <div>
            {t.showingCards} <strong className="text-[#F59E0B]">{paginatedCards.length}</strong> {t.ofCards} <strong className="text-white">{filteredCards.length}</strong> {t.cardsFound}
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
              {t.page} {currentPage} / {totalPages}
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
                    <span className="text-[#F59E0B] font-mono text-[9px] font-bold uppercase">{translateInkColor(card.ink, language)} • {translateCardType(card.type, language)}</span>
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
                    <span className="text-[9px] text-[#94A3B8] font-mono block">{translateInkColor(card.ink, language)} • {translateRarity(card.rarity || 'Common', language)}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedCard(card);
                    }}
                    className="w-full py-1.5 bg-[#141a26] hover:bg-[#1e2638] border border-[#30363d] text-[#F59E0B] rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 my-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t.inspect3dCard}
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
            {t.page} <strong className="text-[#F59E0B]">{currentPage}</strong> {t.ofCards} <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-[#30363d] bg-[#0B0F19] text-[#F1F5F9] hover:border-[#F59E0B] disabled:opacity-30 cursor-pointer transition-colors"
            >
              {t.prevPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-[#30363d] bg-[#0B0F19] text-[#F1F5F9] hover:border-[#F59E0B] disabled:opacity-30 cursor-pointer transition-colors"
            >
              {t.nextPage}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Deck List Panel (30%) - Fixed/Sticky on Desktop */}
      <div className="w-full md:w-[30%] flex flex-col gap-6 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)]">
        
        {userDecks.length > 0 && (
          <div className="bg-[#141a26] p-4 rounded-xl border border-[#30363d] flex flex-col gap-2.5 shadow-lg">
            <h3 className="font-cinzel text-xs font-bold text-[#F59E0B] uppercase tracking-wider">{t.savedDecks}</h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {userDecks.map(deck => (
                <div key={deck.deckId} className="p-2 bg-[#0B0F19] rounded-lg border border-[#30363d] flex justify-between items-center text-xs cursor-pointer hover:border-[#F59E0B] transition-colors" onClick={() => {
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
                  <span className="text-[#94A3B8] font-mono text-[11px] shrink-0">{deck.totalCards} {t.cardsCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#141a26] p-5 rounded-2xl border border-[#30363d] flex flex-col gap-4 shadow-xl overflow-hidden">
          {/* Deck Header & Custom Name Input */}
          <div className="pb-3 border-b border-[#30363d] space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{language === 'th' ? 'ชื่อเด็คของคุณ (ตั้งชื่ออิสระ)' : 'Custom Deck Name'}</span>
              </label>
              <div className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${totalCards === 60 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : totalCards > 60 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-[#0B0F19] text-[#F59E0B] border border-[#30363d]'}`}>
                {totalCards}/60 {t.cardsCount}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={language === 'th' ? 'พิมพ์ชื่อเด็คของคุณที่นี่...' : 'Enter your custom deck name...'}
                className="w-full bg-[#0B0F19] border border-[#30363d] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] rounded-xl px-3.5 py-2 font-cinzel font-bold text-base text-[#F59E0B] outline-none transition-all placeholder:text-[#94A3B8]/50 placeholder:font-normal placeholder:text-xs"
              />
            </div>
          </div>

          {/* Deck List Items */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {currentDeck.length === 0 ? (
              <div className="text-center py-12 text-[#94A3B8] font-mono text-xs">
                {t.emptyDeckPrompt}
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
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-8 h-10 object-cover rounded-lg"
                    />
                    <div className="truncate">
                      <div className="font-cinzel text-xs font-bold text-[#F1F5F9] truncate group-hover:text-[#F59E0B]">{card.name}</div>
                      <div className="text-[9px] text-[#F59E0B] font-mono">{translateInkColor(card.ink, language)} • {card.cost} Ink</div>
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
          <div className="space-y-2.5 pt-3 border-t border-[#30363d]">
            {saveStatus && (
              <div className="text-center font-mono text-[10px] text-[#F59E0B] bg-[#0B0F19] p-2 rounded-lg border border-[#30363d]">
                {saveStatus}
              </div>
            )}

            {/* Primary Save Action */}
            <button
              onClick={handleSaveDeck}
              disabled={isSaving}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black py-3 rounded-xl font-cinzel font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-[1.01] active:scale-[0.99]"
            >
              <Save className="w-4 h-4 text-black" />
              <span>{isSaving ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t.saveDeck}</span>
            </button>

            {/* Secondary Action Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAnalyzeDeck}
                disabled={isAnalyzing || !savedDeckId}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0B0F19] disabled:text-[#94A3B8]/60 disabled:border-[#30363d] text-white py-2.5 px-2 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-indigo-500/40"
                title={!savedDeckId ? (language === 'th' ? 'กรุณาบันทึกเด็คก่อนวิเคราะห์' : 'Save deck first before analysis') : ''}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isAnalyzing ? '...' : (language === 'th' ? 'วิเคราะห์เด็ค' : 'Analyze')}</span>
              </button>

              <button
                onClick={handleClearDeckClick}
                className={`border py-2.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isConfirmingClear
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                    : 'bg-[#0B0F19] border-[#30363d] hover:border-rose-500 text-rose-400 hover:bg-rose-950/30'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isConfirmingClear ? t.confirmClear : (language === 'th' ? 'ล้างเด็ค' : 'Clear')}</span>
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsRecommendedModalOpen(true)}
                className="bg-[#1e1a14] border border-[#F59E0B]/50 hover:bg-[#2c2419] text-[#F59E0B] py-2 px-2 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Star className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{language === 'th' ? 'เด็คแนะนำ' : 'Meta Decks'}</span>
              </button>

              <button
                onClick={() => setIsDeckViewerOpen(true)}
                disabled={currentDeck.length === 0}
                className="bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] text-[#F1F5F9] hover:text-[#F59E0B] disabled:opacity-40 py-2 px-2 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{language === 'th' ? 'ดูเด็คเต็มจอ' : 'View Full Deck'}</span>
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

      {/* RECOMMENDED DECKS MODAL */}
      {isRecommendedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsRecommendedModalOpen(false)}>
          <div className="bg-[#141a26] border-2 border-[#F59E0B] rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-[#30363d]">
              <h2 className="font-cinzel text-xl font-bold text-[#F59E0B] flex items-center gap-2">
                <Star className="w-6 h-6" /> {t.recommendedDecks}
              </h2>
              <button onClick={() => setIsRecommendedModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors p-2 cursor-pointer">
                <Minus className="w-6 h-6 rotate-45" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              {RECOMMENDED_DECKS.map((deck) => {
                const totalCards = deck.cards.reduce((sum, c) => sum + c.count, 0);
                return (
                  <div key={deck.id} className="bg-[#0B0F19] rounded-xl border border-[#30363d] p-5 flex flex-col gap-4 hover:border-[#F59E0B] transition-colors group">
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">{deck.name}</h3>
                      <div className="flex gap-2 mt-2">
                        {deck.inkColors.map(ink => (
                          <span key={ink} className={`text-[10px] font-bold px-2 py-0.5 rounded border border-[#30363d] ${ink === 'Ruby' ? 'text-rose-400' : ink === 'Amethyst' ? 'text-purple-400' : ink === 'Amber' ? 'text-amber-400' : ink === 'Steel' ? 'text-slate-400' : ink === 'Sapphire' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {translateInkColor(ink, language)}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-[#94A3B8] flex-1">{deck.description}</p>
                    
                    <div className="flex justify-between items-center text-xs font-mono border-t border-[#30363d] pt-4">
                      <span className="text-[#F1F5F9]">{deck.archetype}</span>
                      <span className="text-[#F59E0B] font-bold">{totalCards} {t.cardsCount}</span>
                    </div>

                    <button 
                      onClick={() => {
                        const confirmMsg = language === 'th' ? 'ต้องการโหลดเด็คนี้หรือไม่? การกระทำนี้จะแทนที่เด็คปัจจุบันของคุณ' : 'Load this deck? This will replace your current deck.';
                        if(window.confirm(confirmMsg)) {
                          clearDeck();
                          setDeckName(deck.name);
                          deck.cards.forEach(deckCard => {
                            const foundCard = cardsDatabase.find(c => c.id === deckCard.cardId);
                            if (foundCard) {
                              for(let i=0; i<deckCard.count; i++) addCard(foundCard);
                            }
                          });
                          setIsRecommendedModalOpen(false);
                        }
                      }}
                      className="w-full bg-[#141a26] hover:bg-[#F59E0B] border border-[#F59E0B] text-[#F59E0B] hover:text-black py-2 rounded font-cinzel font-bold text-xs uppercase tracking-wider transition-colors mt-2 cursor-pointer"
                    >
                      {t.loadRecommended}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULL DECK VIEWER POP-UP MODAL */}
      <DeckViewerModal
        isOpen={isDeckViewerOpen}
        deck={{
          name: deckName,
          cards: currentDeck,
        }}
        onClose={() => setIsDeckViewerOpen(false)}
      />
    </div>
  );
};
