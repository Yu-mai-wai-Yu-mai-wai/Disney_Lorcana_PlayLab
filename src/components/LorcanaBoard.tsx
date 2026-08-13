import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wifi, Tag, History, MessageSquare, Skull, Trash2, Library, Droplets, Compass, Zap, RotateCw, PanelRightOpen, PanelRightClose, X, Layers, AlertCircle, CheckCircle2, XCircle, Users, Eye, Play, PlusCircle, ArrowUpCircle } from 'lucide-react';
import { webSocketService } from '../services/websocket';
import { InkSymbol } from './InkSymbol';

interface LorcanaCard {
  id: string;
  name: string;
  title: string;
  cost: number;
  strength?: number;
  willpower?: number;
  lore?: number;
  isInkable: boolean;
  type: 'character' | 'action' | 'song';
  ink?: string;
  subtypes?: string[];
  abilities?: { name: string; text: string }[];
  flavorText?: string;
  img: string;
  isWet?: boolean;
}

export const LorcanaBoard: React.FC = () => {
  const [playerLore, setPlayerLore] = useState(12);
  const [opponentLore, setOpponentLore] = useState(4);
  const [inkwellCapacity, setInkwellCapacity] = useState(5);
  const [availableInk, setAvailableInk] = useState(5);
  const [hasInkedThisTurn, setHasInkedThisTurn] = useState(false);
  const [turnNumber, setTurnNumber] = useState(4);
  const [isMyTurn, setIsMyTurn] = useState(true);
  
  const [deckCount, setDeckCount] = useState(40);
  const [discardCount, setDiscardCount] = useState(3);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'log' | 'chat' | 'graveyard' | 'exiled'>('log');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // SPRINT 3: AWS WEBSOCKETS REAL-TIME ROOM SYNC STATE
  const [inputRoomId, setInputRoomId] = useState('108249');
  const [activeRoomId, setActiveRoomId] = useState('108249');
  const [roomRole, setRoomRole] = useState<'player1' | 'player2'>('player1');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [connectedPlayersCount, setConnectedPlayersCount] = useState(1);

  // CARD HOVER, DRAG & ACTION MODAL STATES
  const [hoveredCard, setHoveredCard] = useState<LorcanaCard | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<LorcanaCard | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isDraggingOverInkwell, setIsDraggingOverInkwell] = useState(false);

  const [exertedCards, setExertedCards] = useState<Record<string, boolean>>({
    'elsa-1': true,
  });

  const [logMessages, setLogMessages] = useState<string[]>([
    'Start of Turn 4: Ready & Set phase complete.',
    'Opponent exerted Maleficent for 1 Lore.',
    'Opponent added a card to Inkwell.',
    'Match started. Initial decks shuffled.',
  ]);

  // Initial hand cards state with official Inkable properties & abilities
  const [handCards, setHandCards] = useState<LorcanaCard[]>([
    {
      id: 'h-1',
      name: 'Stitch',
      title: 'New Dog',
      cost: 1,
      strength: 2,
      willpower: 2,
      lore: 1,
      isInkable: true,
      type: 'character',
      ink: 'Amber',
      subtypes: ['Storyborn', 'Alien'],
      abilities: [{ name: 'RAPSCALLION', text: 'When played, you may draw a card if Stitch is ready.' }],
      flavorText: '"He may look like a dog, but he is a hero!"',
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg',
    },
    {
      id: 'h-2',
      name: 'Maleficent',
      title: 'Monstrous Dragon',
      cost: 9,
      strength: 7,
      willpower: 5,
      lore: 2,
      isInkable: true,
      type: 'character',
      ink: 'Ruby',
      subtypes: ['Storyborn', 'Villain', 'Dragon'],
      abilities: [{ name: 'DRAGON FIRE', text: 'When you play this character, you may banish chosen opposing character.' }],
      flavorText: '"Now shall you deal with ME, O Prince, and all the powers of HELL!"',
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg',
    },
    {
      id: 'h-3',
      name: 'Aladdin',
      title: 'Heroic Outlaw',
      cost: 7,
      strength: 5,
      willpower: 5,
      lore: 2,
      isInkable: true,
      type: 'character',
      ink: 'Ruby',
      subtypes: ['Floodborn', 'Hero'],
      abilities: [{ name: 'DARING EXPLOIT', text: 'During your turn, whenever this character banishes another character in a challenge, gain 2 Lore and opponent loses 2 Lore.' }],
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg',
    },
    {
      id: 'h-4',
      name: 'Dragon Fire',
      title: 'Action Spell',
      cost: 5,
      isInkable: false,
      type: 'action',
      ink: 'Ruby',
      abilities: [{ name: 'BANISHMENT', text: 'Banish chosen character.' }],
      flavorText: 'Pure crimson destruction.',
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/130_decfce2e256561e57abe8d2d5e378a3781c2ee6d.jpg',
    },
    {
      id: 'h-5',
      name: 'Tinker Bell',
      title: 'Giant Fairy',
      cost: 6,
      strength: 4,
      willpower: 6,
      lore: 2,
      isInkable: true,
      type: 'character',
      ink: 'Steel',
      subtypes: ['Floodborn', 'Ally', 'Fairy'],
      abilities: [
        { name: 'ROCK THE BOAT', text: 'When you play this character, deal 1 damage to each opposing character.' },
        { name: 'PUNISHMENT', text: 'Whenever this character banishes another character in a challenge, deal 2 damage to chosen character.' }
      ],
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/58_e13723fd1214327ef6f4ac4954201558bd90caa6.jpg',
    },
    {
      id: 'h-6',
      name: 'A Whole New World',
      title: 'Song Action',
      cost: 5,
      isInkable: false,
      type: 'song',
      ink: 'Steel',
      abilities: [{ name: 'WORLD RENEWAL', text: 'Each player discards their hand and draws 7 cards.' }],
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/195_94542b1a94127cea3923cf9975650520a9a08151.jpg',
    },
  ]);

  // Initial player battlefield cards state
  const [fieldCards, setFieldCards] = useState<LorcanaCard[]>([
    {
      id: 'mickey-1',
      name: 'Mickey Mouse',
      title: 'Wayward Sorcerer',
      cost: 4,
      strength: 3,
      willpower: 4,
      lore: 2,
      isInkable: true,
      type: 'character',
      ink: 'Amethyst',
      subtypes: ['Dreamborn', 'Sorcerer'],
      abilities: [{ name: 'ANIMATE BROOMS', text: 'Broom characters cost 1 less Ink to play.' }],
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg',
      isWet: false,
    },
    {
      id: 'elsa-1',
      name: 'Elsa',
      title: 'Spirit of Winter',
      cost: 8,
      strength: 4,
      willpower: 6,
      lore: 3,
      isInkable: true,
      type: 'character',
      ink: 'Amethyst',
      subtypes: ['Floodborn', 'Queen', 'Sorcerer'],
      abilities: [{ name: 'DEEP FREEZE', text: 'When played, exert up to 2 chosen characters. They cannot ready at start of next turn.' }],
      img: 'https://api.lorcana.ravensburger.com/images/en/set1/40_01dc5bb928054aa2b228f2a1f97910208b36b42b.jpg',
      isWet: false,
    },
  ]);

  const handleJoinRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    setActiveRoomId(inputRoomId.trim());
    webSocketService.joinRoom(inputRoomId.trim(), 'Illumineer_Player');
    showNotice(`🟢 Joined Match Room #${inputRoomId.trim()}`, 'success');
  };

  const showNotice = (msg: string, type: 'success' | 'warning' | 'error') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const toggleExert = (id: string) => {
    const nextState = !exertedCards[id];
    setExertedCards((prev) => ({ ...prev, [id]: nextState }));
    webSocketService.sendAction('CARD_EXERTED', { cardId: id, isExerted: nextState });
  };

  const handleQuest = (card: LorcanaCard) => {
    if (card.isWet) {
      showNotice(`⚠️ ${card.name} was played this turn! (Ink drying - cannot Quest until next turn)`, 'warning');
      return;
    }
    if (!exertedCards[card.id]) {
      const loreGain = card.lore || 1;
      setExertedCards((prev) => ({ ...prev, [card.id]: true }));
      webSocketService.sendAction('CARD_EXERTED', { cardId: card.id, isExerted: true });

      setPlayerLore((prev) => {
        const next = Math.min(20, prev + loreGain);
        webSocketService.sendAction('LORE_UPDATED', { loreScore: next });
        if (next >= 20) {
          showNotice(`🏆 VICTORY! You reached 20 Lore and won the Illumineer match!`, 'success');
        }
        return next;
      });
      setLogMessages((prev) => [`You exerted ${card.name} for ${loreGain} Lore!`, ...prev]);
      showNotice(`✨ ${card.name} Quested for +${loreGain} Lore!`, 'success');
    }
  };

  // Convert card into Inkwell (Checking Inkable Property & 1 Ink Per Turn Rule)
  const handleAddToInkwell = (card: LorcanaCard) => {
    if (!card.isInkable) {
      showNotice(`🚫 "${card.name}" is NON-INKABLE! (Look for the gold swirl icon around cost)`, 'error');
      return false;
    }
    if (hasInkedThisTurn) {
      showNotice(`⚠️ You can only put 1 card into the Inkwell per turn!`, 'warning');
      return false;
    }

    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setInkwellCapacity((prev) => prev + 1);
    setAvailableInk((prev) => prev + 1);
    setHasInkedThisTurn(true);
    setSelectedHandCard(null);

    webSocketService.sendAction('INK_PLAYED', { cardId: card.id });
    setLogMessages((prev) => [`You converted ${card.name} into Inkwell! (Capacity: ${inkwellCapacity + 1})`, ...prev]);
    showNotice(`💧 Converted "${card.name}" into Inkwell! (+1 Ink Capacity)`, 'success');
    return true;
  };

  // Play Card to Battlefield or Discard
  const handlePlayCard = (card: LorcanaCard) => {
    if (availableInk < card.cost) {
      showNotice(`⚠️ Not enough Inkwell! Requires ${card.cost} Ink, but you have ${availableInk} ready.`, 'warning');
      return false;
    }

    // Deduct Ink
    setAvailableInk((prev) => prev - card.cost);
    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setSelectedHandCard(null);

    if (card.type === 'action' || card.type === 'song') {
      // Actions/Songs go to Discard pile
      setDiscardCount((prev) => prev + 1);
      setLogMessages((prev) => [`You played ${card.type.toUpperCase()}: ${card.name}! (Sent to Discard Pile)`, ...prev]);
      showNotice(`✨ Cast Action "${card.name}"! (${card.cost} Ink used, sent to Discard)`, 'success');
    } else {
      // Characters enter battlefield with isWet: true
      const newFieldCard = { ...card, isWet: true };
      setFieldCards((prev) => [...prev, newFieldCard]);
      setLogMessages((prev) => [`You cast Character: ${card.name} (${card.title}) onto the battlefield!`, ...prev]);
      showNotice(`✨ Played ${card.name} onto field! (${card.cost} Ink used)`, 'success');
      webSocketService.sendAction('CARD_MOVED', { cardId: card.id, position: { x: 50, y: 50, zone: 'field' } });
    }
    return true;
  };

  // Drag-to-Play Card & Drag-to-Inkwell Handler
  const handleDragEnd = (card: LorcanaCard, info: any) => {
    setIsDraggingCard(false);
    setIsDraggingOverInkwell(false);

    // 1. Drag LEFT towards Inkwell Zone
    if (info.offset.x < -100 || info.point.x < 360) {
      handleAddToInkwell(card);
      return;
    }

    // 2. Drag UP onto the Battlefield
    if (info.offset.y < -30 || info.point.y < 520) {
      handlePlayCard(card);
    }
  };

  // Draw Card Action
  const handleDrawCard = () => {
    if (deckCount <= 0) {
      showNotice(`⚠️ Deck is empty! Cannot draw more cards.`, 'error');
      return;
    }
    if (handCards.length >= 7) {
      showNotice(`⚠️ Hand is full (Max 7 cards)!`, 'warning');
      return;
    }

    setDeckCount((prev) => prev - 1);
    const drawPool: LorcanaCard[] = [
      { id: `drawn-${Date.now()}-1`, name: 'Magic Broom', title: 'Bucket Brigade', cost: 2, strength: 2, willpower: 2, lore: 1, isInkable: true, type: 'character', ink: 'Amethyst', img: 'https://api.lorcana.ravensburger.com/images/en/set1/35_781112b3226a2d6eb5228198fdfb552b7d532a8f.jpg' },
      { id: `drawn-${Date.now()}-2`, name: 'Friends On The Other Side', title: 'Song', cost: 3, isInkable: false, type: 'song', ink: 'Amethyst', img: 'https://api.lorcana.ravensburger.com/images/en/set1/28_cbb0b22a00c6d7010f3c5f590b5ebbb9056d6edc.jpg' },
      { id: `drawn-${Date.now()}-3`, name: 'Lilo', title: 'Making Wishes', cost: 1, strength: 1, willpower: 1, lore: 2, isInkable: true, type: 'character', ink: 'Amber', img: 'https://api.lorcana.ravensburger.com/images/en/set1/17_ef31c4fce4c489bd07dd6e2ff62a5b6f387db287.jpg' },
    ];
    const drawn = drawPool[Math.floor(Math.random() * drawPool.length)];
    setHandCards((prev) => [...prev, drawn]);
    setLogMessages((prev) => [`You drew ${drawn.name} from your deck.`, ...prev]);
    showNotice(`🎴 Drew "${drawn.name}" from Deck!`, 'success');
  };

  // Official Turn Change Logic
  const handleEndTurn = () => {
    setIsMyTurn(false);
    showNotice(`⏳ Ending Turn ${turnNumber}... Opponent is playing.`, 'warning');

    setTimeout(() => {
      setOpponentLore((prev) => Math.min(20, prev + 1));
      setLogMessages((prev) => [`Opponent completed their turn and gained 1 Lore.`, ...logMessages]);
      
      setTimeout(() => {
        setTurnNumber((prev) => prev + 1);
        setIsMyTurn(true);
        setHasInkedThisTurn(false);
        setAvailableInk(inkwellCapacity);
        
        setExertedCards({});
        setFieldCards((prev) => prev.map((c) => ({ ...c, isWet: false })));

        if (deckCount > 0 && handCards.length < 7) {
          setDeckCount((prev) => prev - 1);
          setHandCards((prev) => [
            ...prev,
            { id: `turn-draw-${Date.now()}`, name: 'Tinker Bell', title: 'Tiny Fairy', cost: 3, strength: 2, willpower: 3, lore: 1, isInkable: true, type: 'character', ink: 'Steel', img: 'https://api.lorcana.ravensburger.com/images/en/set1/58_e13723fd1214327ef6f4ac4954201558bd90caa6.jpg' }
          ]);
        }
        showNotice(`⚡ Turn Refreshed! All Ink ready & 1 Card drawn.`, 'success');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex playmat-bg text-slate-100 font-outfit select-none overflow-hidden">
      
      {/* Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 rounded-2xl border font-bold text-xs shadow-2xl flex items-center gap-2.5 bg-[#051424]/95 ${
              notice.type === 'success'
                ? 'border-emerald-500/80 text-emerald-300'
                : notice.type === 'error'
                ? 'border-rose-500/80 text-rose-300'
                : 'border-amber-400/80 text-amber-300'
            }`}
          >
            {notice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notice.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
            {notice.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
            <span>{notice.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES */}
      <aside className={`w-64 border-r border-amber-500/20 bg-[#051424]/95 p-4 flex flex-col justify-between z-20 shrink-0 space-y-4 transition-colors ${
        isDraggingOverInkwell ? 'border-2 border-amber-400 bg-amber-500/10' : ''
      }`}>
        {/* Opponent Piles */}
        <div className="space-y-2 border-b border-slate-800 pb-3">
          <div className="text-[11px] font-cinzel font-bold text-amber-300">OPPONENT PILES</div>
          <div className="flex gap-2">
            <div className="w-16 h-22 rounded-xl border border-amber-400/40 flex flex-col items-center justify-between p-1.5 relative shadow-xl overflow-hidden group">
              <img
                src="/Lorcana_Card_Back.png"
                alt="Opponent Deck Back"
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
              <Layers className="w-4 h-4 text-amber-300 z-10 drop-shadow" />
              <span className="text-[10px] font-mono font-bold text-white z-10 bg-slate-950/80 px-1.5 py-0.5 rounded border border-amber-400/40">Deck: 48</span>
            </div>
            <div className="w-16 h-22 bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-1 relative shadow">
              <Skull className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[10px] font-mono font-bold text-slate-300">Grave: 2</span>
            </div>
          </div>
        </div>

        {/* Inkwell Reserve Drop Zone */}
        <div className="space-y-2 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs font-cinzel font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-amber-400 fill-amber-400" /> INKWELL ZONE
            </span>
            <span className="font-mono text-amber-400 text-sm font-bold">{availableInk}/{inkwellCapacity}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#010f1f] rounded-xl border border-amber-400/40 relative">
            {Array.from({ length: Math.max(6, inkwellCapacity) }).map((_, i) => (
              <div
                key={i}
                className={`h-14 rounded-lg border flex flex-col items-center justify-center transition-all ${
                  i < availableInk
                    ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] text-amber-300'
                    : i < inkwellCapacity
                    ? 'bg-slate-900 border-slate-700 text-slate-500'
                    : 'bg-slate-950/40 border-slate-900 text-slate-800'
                }`}
              >
                <Droplets className={`w-4 h-4 ${i < availableInk ? 'text-amber-400 fill-amber-400 animate-pulse' : ''}`} />
                <span className="text-[9px] font-mono text-amber-400/90 mt-0.5 font-bold">{i < availableInk ? 'Ready Ink' : i < inkwellCapacity ? 'Exerted' : 'Empty'}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-mono text-center px-2 py-1.5 rounded-lg border bg-slate-950/80 border-amber-500/30 text-amber-300 font-semibold">
            {hasInkedThisTurn ? '🚫 Inked this turn (1/1 Limit)' : '💧 Drag Card Here to Add Ink'}
          </div>
        </div>

        {/* Player Piles */}
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <div className="text-[11px] font-cinzel font-bold text-amber-300">YOUR PILES</div>
          <div className="flex gap-2">
            {/* Draw Deck */}
            <div
              onClick={handleDrawCard}
              className="w-20 h-28 rounded-xl border-2 border-amber-400 flex flex-col items-center justify-between p-2 relative shadow-2xl cursor-pointer hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all overflow-hidden group"
              title="Click to Draw Card from Deck"
            >
              <img
                src="/Lorcana_Card_Back.png"
                alt="Player Deck Back"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" />
              <Library className="w-5 h-5 text-amber-300 z-10 drop-shadow group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-cinzel font-bold text-white drop-shadow">DECK</span>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-400/50 shadow">{deckCount} Cards</span>
              </div>
            </div>

            {/* Discard */}
            <div className="w-20 h-28 bg-slate-950 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-1 relative shadow-xl cursor-pointer hover:border-rose-400 transition-all overflow-hidden">
              <Skull className="w-5 h-5 text-rose-400 mb-1" />
              <span className="text-[10px] font-cinzel font-bold text-slate-300">DISCARD</span>
              <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">{discardCount} Cards</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER PLAY AREA: 100% FULL SCREEN BATTLEFIELD */}
      <div className="flex-1 flex flex-col justify-between relative z-10 p-4 pb-32">
        
        {/* TOP STATUS HEADER BAR */}
        <div className="flex justify-between items-center w-full z-20 pb-2 border-b border-amber-500/20">
          <div className="glass-panel px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3 bg-[#0d1c2d]">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-cinzel font-bold text-slate-400 uppercase">Opponent Lore</span>
              <span className="font-cinzel text-xl font-black text-rose-400">{opponentLore} / 20</span>
            </div>
          </div>

          <div className="glass-panel px-5 py-1.5 rounded-full border border-amber-400/60 text-amber-300 font-cinzel font-bold text-xs pointer-events-auto shadow-2xl flex items-center gap-2 bg-[#0d1c2d]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Main Phase | Turn {turnNumber}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <form onSubmit={handleJoinRoomSubmit} className="flex items-center gap-1.5 glass-panel px-3 py-1 rounded-xl border border-amber-500/30">
              <Wifi className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Room:</span>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="w-16 bg-slate-950 border border-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono font-bold outline-none text-center"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                Join
              </button>
            </form>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/40 text-amber-300 p-2 rounded-xl font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="font-sans text-xs">Action Log</span>
            </button>
          </div>
        </div>

        {/* 1. OPPONENT BATTLEFIELD ZONE (ENLARGED CARDS: w-36 h-52) */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 border-b border-amber-500/10 min-h-[190px]">
          <div className="text-[10px] font-cinzel font-bold text-amber-300/70 mb-2 uppercase tracking-widest">
            Opponent Battlefield
          </div>
          <div className="flex items-center justify-center gap-8 w-full">
            <div className="w-36 h-52 glass-panel rounded-2xl exerted flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-amber-500/30">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs" />
              <img
                src="https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg"
                alt="Opponent Exerted"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <span className="absolute bottom-2 bg-slate-950/90 text-amber-300 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-amber-400/40 shadow">
                Exerted
              </span>
            </div>

            <div className="w-36 h-52 glass-panel rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-amber-500/30">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs" />
              <img
                src="https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg"
                alt="Opponent Ready"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <span className="absolute bottom-2 bg-slate-950/90 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* 2. PLAYER BATTLEFIELD ZONE (ENLARGED CARDS: w-36 h-52 + DRAG-TO-PLAY DROPZONE) */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 relative min-h-[240px]">
          <div className="text-[10px] font-cinzel font-bold text-amber-300 mb-2 uppercase tracking-widest flex items-center gap-2">
            <span>Your Battlefield Area</span>
            <span className="text-[9px] font-mono text-slate-400 font-normal">(Hover to read stats • Drag card here to Play)</span>
          </div>

          {/* ACTIVE DRAG-TO-PLAY DROPZONE HIGHLIGHT */}
          {isDraggingCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-x-12 inset-y-4 border-2 border-dashed border-amber-400 bg-amber-500/15 rounded-3xl flex flex-col items-center justify-center gap-2 pointer-events-none z-20 backdrop-blur-xs shadow-[0_0_50px_rgba(245,158,11,0.3)]"
            >
              <ArrowUpCircle className="w-10 h-10 text-amber-400 animate-bounce" />
              <span className="font-cinzel text-lg font-black text-amber-300 uppercase tracking-wider">
                Release Card Here to Play onto Battlefield!
              </span>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-8 w-full">
            {fieldCards.map((card) => {
              const isExerted = exertedCards[card.id] || false;
              return (
                <motion.div
                  key={card.id}
                  layout
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => toggleExert(card.id)}
                  className={`w-36 h-52 rounded-2xl relative cursor-pointer transition-all duration-300 preserve-3d group ${
                    isExerted ? 'exerted border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]' : 'border-2 border-slate-700 shadow-2xl hover:border-amber-400'
                  }`}
                >
                  <img
                    src={card.img}
                    alt={card.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  
                  {card.isWet && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center pointer-events-none">
                      <Droplets className="w-8 h-8 text-amber-300 animate-bounce" />
                      <span className="text-[10px] font-cinzel font-bold text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded mt-1 border border-amber-400/40">
                        Ink Drying...
                      </span>
                    </div>
                  )}

                  {!card.isWet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuest(card);
                      }}
                      className="absolute top-2.5 right-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 p-2 rounded-full shadow-lg opacity-90 group-hover:opacity-100 transition-all cursor-pointer font-bold text-[10px] flex items-center justify-center"
                      title={`Quest for +${card.lore || 1} Lore`}
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                    </button>
                  )}

                  <div className="absolute bottom-2.5 left-2 right-2 bg-slate-950/90 px-2 py-1 rounded-xl border border-amber-400/40 flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-amber-300">⚔️ {card.strength}/{card.willpower}</span>
                    <span className="text-amber-400">♦ {card.lore}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* PLAYER LORE & PASS TURN CONTROLS BAR */}
        <div className="absolute bottom-2 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
          <div className="glass-panel px-5 py-2 rounded-2xl border border-amber-400 flex items-center gap-3 bg-[#0d1c2d] pointer-events-auto shadow-2xl">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-cinzel font-bold text-amber-300 uppercase">Your Lore Score</span>
              <span className="font-cinzel text-2xl font-black text-amber-400">{playerLore} / 20</span>
            </div>
          </div>

          <button
            onClick={handleEndTurn}
            disabled={!isMyTurn}
            className="pointer-events-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 px-6 py-3 rounded-2xl font-cinzel font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <RotateCw className="w-4 h-4 fill-slate-950" />
            <span>Pass Turn</span>
          </button>
        </div>
      </div>

      {/* HOVER CARD INSPECTOR TOOLTIP PANEL */}
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 left-72 z-50 w-80 bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-slate-100 flex flex-col gap-2.5 pointer-events-none"
          >
            <div className="flex gap-3 items-center border-b border-amber-500/20 pb-2">
              <img
                src={hoveredCard.img}
                alt={hoveredCard.name}
                referrerPolicy="no-referrer"
                className="w-16 h-24 object-cover rounded-lg border border-amber-400/50 shadow"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  {hoveredCard.ink && <InkSymbol ink={hoveredCard.ink} size={16} />}
                  <span className="font-cinzel font-bold text-base text-amber-300 leading-tight">{hoveredCard.name}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{hoveredCard.title}</span>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-amber-400 font-bold">
                  <span>Cost: 💧{hoveredCard.cost}</span>
                  {hoveredCard.isInkable ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">💧 Inkable</span>
                  ) : (
                    <span className="text-rose-400">Non-Inkable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">STRENGTH</span>
                <span className="text-amber-400 font-bold">⚔️ {hoveredCard.strength ?? '-'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">WILLPOWER</span>
                <span className="text-amber-400 font-bold">🛡️ {hoveredCard.willpower ?? '-'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">LORE</span>
                <span className="text-amber-400 font-bold">♦ {hoveredCard.lore ?? '-'}</span>
              </div>
            </div>

            {/* Abilities & Text Box */}
            {hoveredCard.abilities && hoveredCard.abilities.length > 0 && (
              <div className="space-y-1.5 text-[11px] font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                {hoveredCard.abilities.map((ab, idx) => (
                  <div key={idx}>
                    <span className="font-bold text-amber-300">{ab.name}: </span>
                    <span className="text-slate-300">{ab.text}</span>
                  </div>
                ))}
              </div>
            )}

            {hoveredCard.flavorText && (
              <div className="text-[10px] font-outfit italic text-slate-400 border-t border-slate-800 pt-1">
                {hoveredCard.flavorText}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD ACTION MODAL */}
      <AnimatePresence>
        {selectedHandCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setSelectedHandCard(null)} />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative z-10 max-w-sm w-full bg-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center"
            >
              <button
                onClick={() => setSelectedHandCard(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-36 h-52 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
                <img
                  src={selectedHandCard.img}
                  alt={selectedHandCard.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="font-cinzel text-xl font-bold text-amber-300">{selectedHandCard.name}</div>
                <div className="text-xs font-mono text-slate-400">{selectedHandCard.title}</div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 pt-2">
                <button
                  onClick={() => handleAddToInkwell(selectedHandCard)}
                  disabled={!selectedHandCard.isInkable || hasInkedThisTurn}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-400/60 p-3.5 rounded-2xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Droplets className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    {!selectedHandCard.isInkable
                      ? '🚫 Non-Inkable Card'
                      : hasInkedThisTurn
                      ? '🚫 Inked this turn (1/1 Limit)'
                      : '💧 Add to Inkwell (+1 Ink Capacity)'}
                  </span>
                </button>

                <button
                  onClick={() => handlePlayCard(selectedHandCard)}
                  disabled={availableInk < selectedHandCard.cost}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 p-3.5 rounded-2xl font-cinzel font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>
                    {availableInk < selectedHandCard.cost
                      ? `⚠️ Requires ${selectedHandCard.cost} Ink (Have ${availableInk})`
                      : `✨ Play to Field (${selectedHandCard.cost} Ink)`}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SMART COLLAPSIBLE HAND DOCK WITH ENLARGED CARDS (w-32 h-48) */}
      <div className="fixed bottom-0 left-64 right-0 z-30 flex justify-center pointer-events-none">
        <motion.div
          initial={{ y: 90 }}
          whileHover={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-slate-950/95 border-t-2 border-amber-400/80 rounded-t-3xl px-8 pt-3 pb-6 backdrop-blur-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.85)] pointer-events-auto flex flex-col items-center max-w-5xl w-full"
        >
          <div className="w-20 h-1.5 bg-amber-400/80 rounded-full mb-2 cursor-grab active:cursor-grabbing" />
          <div className="text-[11px] font-cinzel font-bold text-amber-300 mb-2 uppercase tracking-widest flex items-center gap-2">
            <span>Your Hand ({handCards.length}/7 Cards)</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">• Drag Card Up to Play onto Field • Drag Left for Ink</span>
          </div>

          {/* Enlarge Hand Cards Stack (w-32 h-48) */}
          <div className="flex items-center justify-center -space-x-8 px-4 py-2">
            {handCards.map((card) => (
              <motion.div
                key={card.id}
                drag
                dragConstraints={{ left: -400, right: 400, top: -350, bottom: 50 }}
                dragElastic={0.15}
                onDragStart={() => setIsDraggingCard(true)}
                onMouseEnter={() => setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedHandCard(card)}
                onDragEnd={(_, info) => handleDragEnd(card, info)}
                whileHover={{ scale: 1.15, y: -35, zIndex: 50 }}
                className="w-32 h-48 rounded-2xl relative cursor-pointer preserve-3d shadow-2xl border-2 border-amber-400/60 bg-slate-950 group"
              >
                <img
                  src={card.img}
                  alt={card.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl"
                />

                <div className="absolute top-1.5 left-1.5 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-amber-400/50 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 shadow">
                  <Droplets className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{card.cost}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDEBAR: ACTION LOG & CHAT */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-72 border-l border-amber-500/20 bg-[#051424]/95 p-4 flex flex-col justify-between z-30 shrink-0 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-cinzel font-bold text-amber-300 text-xs">Match Action Log</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 text-xs font-mono text-slate-300">
              {logMessages.map((msg, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  {msg}
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-center border-t border-slate-800 pt-2">
              AWS WebSockets Live Sync Active
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
