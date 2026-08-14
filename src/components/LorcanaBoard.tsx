import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wifi, Skull, Library, Droplets, Zap, RotateCw, PanelRightOpen, PanelRightClose, X, Layers, AlertCircle, CheckCircle2, XCircle, Play, ArrowUpCircle, Sword, Shield } from 'lucide-react';
import { webSocketService } from '../services/websocket';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // SPRINT 3: AWS WEBSOCKETS REAL-TIME ROOM SYNC STATE
  const [inputRoomId, setInputRoomId] = useState('108249');
  const [, setActiveRoomId] = useState('108249');
  const [isWsConnected] = useState(false);

  // CARD HOVER, DRAG & ACTION MODAL STATES
  const [hoveredCard, setHoveredCard] = useState<LorcanaCard | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<LorcanaCard | null>(null);
  const [dragPendingCard, setDragPendingCard] = useState<LorcanaCard | null>(null);
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
    showNotice(`Joined Match Room #${inputRoomId.trim()}`, 'success');
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
      showNotice(`${card.name} was played this turn! (Ink drying - cannot Quest until next turn)`, 'warning');
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
          showNotice(`VICTORY! You reached 20 Lore and won the Illumineer match!`, 'success');
        }
        return next;
      });
      setLogMessages((prev) => [`You exerted ${card.name} for ${loreGain} Lore!`, ...prev]);
      showNotice(`${card.name} Quested for +${loreGain} Lore!`, 'success');
    }
  };

  // Convert card into Inkwell (Checking Inkable Property & 1 Ink Per Turn Rule)
  const handleAddToInkwell = (card: LorcanaCard) => {
    if (!card.isInkable) {
      showNotice(`"${card.name}" is NON-INKABLE!`, 'error');
      return false;
    }
    if (hasInkedThisTurn) {
      showNotice(`You can only put 1 card into the Inkwell per turn!`, 'warning');
      return false;
    }

    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setInkwellCapacity((prev) => prev + 1);
    setAvailableInk((prev) => prev + 1);
    setHasInkedThisTurn(true);
    setSelectedHandCard(null);

    webSocketService.sendAction('INK_PLAYED', { cardId: card.id });
    setLogMessages((prev) => [`You converted ${card.name} into Inkwell! (Capacity: ${inkwellCapacity + 1})`, ...prev]);
    showNotice(`Converted "${card.name}" into Inkwell! (+1 Ink Capacity)`, 'success');
    return true;
  };

  // Play Card to Battlefield or Discard
  const handlePlayCard = (card: LorcanaCard) => {
    if (availableInk < card.cost) {
      showNotice(`Not enough Inkwell! Requires ${card.cost} Ink, but you have ${availableInk} ready.`, 'warning');
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
      showNotice(`Cast Action "${card.name}"! (${card.cost} Ink used, sent to Discard)`, 'success');
    } else {
      // Characters enter battlefield with isWet: true
      const newFieldCard = { ...card, isWet: true };
      setFieldCards((prev) => [...prev, newFieldCard]);
      setLogMessages((prev) => [`You cast Character: ${card.name} (${card.title}) onto the battlefield!`, ...prev]);
      showNotice(`Played ${card.name} onto field! (${card.cost} Ink used)`, 'success');
      webSocketService.sendAction('CARD_MOVED', { cardId: card.id, position: { x: 50, y: 50, zone: 'field' } });
    }
    return true;
  };

  // Drag-to-Play Card & Drag-to-Inkwell Handler with Action Choice Modal & Auto-Resolve
  const handleDragEnd = (card: LorcanaCard, info: any) => {
    setIsDraggingCard(false);
    setIsDraggingOverInkwell(false);

    // Ignore tiny accidental jitters / clicks
    if (Math.hypot(info.offset.x, info.offset.y) < 20) {
      return;
    }

    const canInk = card.isInkable && !hasInkedThisTurn;
    const canPlay = availableInk >= card.cost;

    if (canInk && canPlay) {
      // Both choices available: open choice menu modal
      setDragPendingCard(card);
    } else if (canInk && !canPlay) {
      // Auto-resolve: Only Inkwell is valid
      handleAddToInkwell(card);
    } else if (!canInk && canPlay) {
      // Auto-resolve: Only Play to Field is valid
      handlePlayCard(card);
    } else {
      // Neither action is valid: provide descriptive feedback
      if (!card.isInkable && availableInk < card.cost) {
        showNotice(`Cannot play (requires ${card.cost} Ink, have ${availableInk}) and "${card.name}" is non-inkable!`, 'warning');
      } else if (hasInkedThisTurn && availableInk < card.cost) {
        showNotice(`Already inked this turn and not enough Ink (${availableInk}/${card.cost}) to play!`, 'warning');
      } else {
        showNotice(`No valid action available for "${card.name}".`, 'warning');
      }
    }
  };

  // Draw Card Action
  const handleDrawCard = () => {
    if (deckCount <= 0) {
      showNotice(`Deck is empty! Cannot draw more cards.`, 'error');
      return;
    }
    if (handCards.length >= 7) {
      showNotice(`Hand is full (Max 7 cards)!`, 'warning');
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
    showNotice(`Drew "${drawn.name}" from Deck!`, 'success');
  };

  // Official Turn Change Logic
  const handleEndTurn = () => {
    setIsMyTurn(false);
    showNotice(`Ending Turn ${turnNumber}... Opponent is playing.`, 'warning');

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
        showNotice(`Turn Refreshed! All Ink ready & 1 Card drawn.`, 'success');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="relative w-full min-h-screen flex bg-[#0B0F19] text-[#F1F5F9] font-outfit select-none overflow-y-auto">
      
      {/* Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0d1c2d] px-6 py-3 rounded-lg border font-bold text-xs flex items-center gap-2.5 ${
              notice.type === 'success'
                ? 'border-emerald-500/80 text-emerald-300'
                : notice.type === 'error'
                ? 'border-rose-500/80 text-rose-300'
                : 'border-[#F59E0B]/80 text-[#F59E0B]'
            }`}
          >
            {notice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notice.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
            {notice.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#F59E0B]" />}
            <span>{notice.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES */}
      <aside className={`w-64 border-r border-[#30363d] bg-[#141a26] p-4 flex flex-col justify-between z-20 shrink-0 space-y-4 transition-colors sticky top-0 h-screen overflow-y-auto ${
        isDraggingOverInkwell ? 'border-2 border-[#F59E0B] bg-[#1e2638]' : ''
      }`}>
        {/* Opponent Piles */}
        <div className="space-y-2 border-b border-[#30363d] pb-3">
          <div className="text-[11px] font-cinzel font-bold text-[#F59E0B]">OPPONENT PILES</div>
          <div className="flex gap-2">
            <div className="w-16 h-22 rounded-lg border border-[#30363d] flex flex-col items-center justify-between p-1.5 relative overflow-hidden bg-[#0B0F19]">
              <img
                src="/Lorcana_Card_Back.png"
                alt="Opponent Deck Back"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-[#0B0F19]/40" />
              <Layers className="w-4 h-4 text-[#F59E0B] z-10" />
              <span className="text-[10px] font-mono font-bold text-white z-10 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">Deck: 48</span>
            </div>
            <div className="w-16 h-22 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-1 relative">
              <Skull className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[10px] font-mono font-bold text-[#94A3B8]">Grave: 2</span>
            </div>
          </div>
        </div>

        {/* Inkwell Reserve Drop Zone */}
        <div className="space-y-2 flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs font-cinzel font-bold text-[#F59E0B]">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" /> INKWELL ZONE
            </span>
            <span className="font-mono text-[#F59E0B] text-sm font-bold">{availableInk}/{inkwellCapacity}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#0B0F19] rounded-xl border border-[#30363d] relative">
            {Array.from({ length: Math.max(6, inkwellCapacity) }).map((_, i) => {
              const isReady = i < availableInk;
              const isExerted = !isReady && i < inkwellCapacity;

              return (
                <div
                  key={i}
                  className={`h-12 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                    isReady
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#F59E0B]'
                      : isExerted
                      ? 'bg-[#141a26] border-[#30363d] text-[#94A3B8]'
                      : 'bg-[#0B0F19]/50 border-[#30363d]/40 text-[#94A3B8]/30'
                  }`}
                >
                  <Droplets className={`w-3.5 h-3.5 ${isReady ? 'text-[#F59E0B] fill-[#F59E0B]' : isExerted ? 'text-[#94A3B8]' : 'text-[#94A3B8]/30'}`} />
                  <span className={`text-[9px] font-mono mt-0.5 ${isReady ? 'text-[#F59E0B] font-bold' : isExerted ? 'text-[#94A3B8] font-semibold' : 'text-[#94A3B8]/40'}`}>
                    {isReady ? 'Ready Ink' : isExerted ? 'Exerted' : 'Empty'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-center px-2 py-1.5 rounded-lg border bg-[#0B0F19] border-[#30363d] text-[#F59E0B] font-semibold">
            {hasInkedThisTurn ? 'Inked this turn (1/1 Limit)' : 'Drag Card Here to Add Ink'}
          </div>
        </div>

        {/* Player Piles */}
        <div className="space-y-2 border-t border-[#30363d] pt-3">
          <div className="text-[11px] font-cinzel font-bold text-[#F59E0B]">YOUR PILES</div>
          <div className="flex gap-2">
            {/* Draw Deck */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleDrawCard}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDrawCard();
                }
              }}
              className="w-20 h-28 rounded-lg border-2 border-[#F59E0B] flex flex-col items-center justify-between p-2 relative cursor-pointer hover:border-amber-300 transition-colors overflow-hidden bg-[#0B0F19]"
              title="Click to Draw Card from Deck"
            >
              <img
                src="/Lorcana_Card_Back.png"
                alt="Player Deck Back"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#0B0F19]/40" />
              <Library className="w-5 h-5 text-[#F59E0B] z-10" />
              <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-cinzel font-bold text-white">DECK</span>
                <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">{deckCount} Cards</span>
              </div>
            </div>

            {/* Discard */}
            <div className="w-20 h-28 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-1 relative cursor-pointer hover:border-rose-400 transition-colors overflow-hidden">
              <Skull className="w-5 h-5 text-rose-400 mb-1" />
              <span className="text-[10px] font-cinzel font-bold text-[#F1F5F9]">DISCARD</span>
              <span className="text-[10px] font-mono font-bold text-[#94A3B8] mt-1">{discardCount} Cards</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER PLAY AREA: NATURAL SCROLL PLAYFIELD */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 p-4 space-y-6">
        
        {/* TOP STATUS HEADER BAR */}
        <div className="flex justify-between items-center w-full z-20 pb-2 border-b border-[#30363d]">
          <div className="px-4 py-2 rounded-xl border border-[#30363d] flex items-center gap-3 bg-[#141a26]">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider">Opponent Lore</span>
              <span className="font-cinzel text-2xl font-black text-rose-400 leading-none mt-0.5">{opponentLore} / 20</span>
            </div>
          </div>

          <div className="px-5 py-2 rounded-xl border border-[#F59E0B]/50 text-[#F59E0B] font-cinzel font-bold text-sm flex items-center gap-2.5 bg-[#141a26]">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Main Phase | Turn {turnNumber}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <form onSubmit={handleJoinRoomSubmit} className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#30363d] bg-[#141a26]">
              <Wifi className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400' : 'text-[#F59E0B]'}`} />
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Room:</span>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="w-16 bg-[#0B0F19] border border-[#30363d] text-[#F59E0B] px-1.5 py-0.5 rounded text-xs font-mono font-bold outline-none text-center"
              />
              <button
                type="submit"
                className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                Join
              </button>
            </form>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] p-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="font-sans text-xs">Action Log</span>
            </button>
          </div>
        </div>

        {/* 1. OPPONENT BATTLEFIELD ZONE */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 border-b border-[#30363d]/50 min-h-[190px]">
          <div className="text-[10px] font-cinzel font-bold text-[#F59E0B]/70 mb-2 uppercase tracking-widest">
            Opponent Battlefield
          </div>
          <div className="flex items-center justify-center gap-8 w-full">
            <div className="w-36 h-52 bg-[#141a26] rounded-xl exerted flex items-center justify-center relative overflow-hidden border border-[#30363d]">
              <img
                src="https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg"
                alt="Opponent Exerted"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <span className="absolute bottom-2 bg-[#0B0F19]/90 text-[#F59E0B] text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#30363d]">
                Exerted
              </span>
            </div>

            <div className="w-36 h-52 bg-[#141a26] rounded-xl flex items-center justify-center relative overflow-hidden border border-[#30363d]">
              <img
                src="https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg"
                alt="Opponent Ready"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <span className="absolute bottom-2 bg-[#0B0F19]/90 text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* 2. PLAYER BATTLEFIELD ZONE */}
        <div className="flex-1 flex flex-col justify-center items-center py-2 relative min-h-[240px]">
          <div className="text-[10px] font-cinzel font-bold text-[#F59E0B] mb-2 uppercase tracking-widest flex items-center gap-2">
            <span>Your Battlefield Area</span>
            <span className="text-[9px] font-mono text-[#94A3B8] font-normal">(Hover to read stats • Drag card here to Play or Ink)</span>
          </div>

          {/* ACTIVE DRAG-TO-PLAY DROPZONE HIGHLIGHT */}
          {isDraggingCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-x-12 inset-y-4 border-2 border-dashed border-[#F59E0B] bg-[#F59E0B]/10 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none z-20"
            >
              <ArrowUpCircle className="w-8 h-8 text-[#F59E0B]" />
              <span className="font-cinzel text-base font-bold text-[#F59E0B] uppercase tracking-wider">
                Release Card Here to Choose Action
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
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => toggleExert(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExert(card.id);
                    }
                  }}
                  className={`w-36 h-52 rounded-xl relative cursor-pointer transition-colors group card-foil-light ${
                    isExerted ? 'exerted border-2 border-[#F59E0B]' : 'border border-[#30363d] hover:border-[#F59E0B]'
                  }`}
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#141a26]">
                    <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      <span className="font-cinzel text-xs font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                      <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                    </div>
                    <img
                      src={card.img}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover rounded-xl relative z-10"
                    />
                  </div>
                  
                  {card.isWet && (
                    <div className="absolute inset-0 bg-[#0B0F19]/70 rounded-xl flex flex-col items-center justify-center pointer-events-none z-20">
                      <Droplets className="w-6 h-6 text-[#F59E0B]" />
                      <span className="text-[10px] font-cinzel font-bold text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded mt-1 border border-[#30363d]">
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
                      aria-label="Quest"
                      className="absolute top-2 right-2 bg-[#F59E0B] hover:bg-[#D97706] text-black p-1.5 rounded-full transition-colors cursor-pointer font-bold text-[10px] flex items-center justify-center z-20"
                      title={`Quest for +${card.lore || 1} Lore`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                    </button>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 bg-[#0B0F19]/90 px-2 py-1 rounded-lg border border-[#30363d] flex justify-between items-center text-[10px] font-mono font-bold z-20 text-[#F1F5F9]">
                    <span className="flex items-center gap-1"><Sword className="w-3 h-3 text-[#F59E0B]" />{card.strength}/{card.willpower}</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#F59E0B]" />{card.lore}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* PLAYER LORE & PASS TURN CONTROLS BAR (IN-FLOW) */}
        <div className="w-full flex justify-between items-center z-20 py-3 px-4 border border-[#30363d] bg-[#141a26] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-cinzel font-bold text-[#F59E0B] uppercase tracking-wider">Your Lore Score</span>
              <span className="font-cinzel text-2xl font-black text-[#F59E0B] leading-none mt-0.5">{playerLore} / 20</span>
            </div>
          </div>

          <button
            onClick={handleEndTurn}
            disabled={!isMyTurn}
            className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCw className="w-4 h-4 fill-black" />
            <span>Pass Turn</span>
          </button>
        </div>

        {/* HAND DOCK (NATURAL SCROLL FLOW AT BOTTOM) */}
        <div className="w-full flex justify-center z-20 pb-8">
          <div className="bg-[#0d1420] border border-[#30363d] rounded-xl px-8 pt-4 pb-6 flex flex-col items-center max-w-5xl w-full shadow-2xl">
            <div className="w-16 h-1 bg-[#30363d] rounded-full mb-2" />
            <div className="text-[11px] font-cinzel font-bold text-[#F59E0B] mb-2 uppercase tracking-widest flex items-center gap-2">
              <span>Your Hand ({handCards.length}/7 Cards)</span>
              <span className="text-[10px] font-mono text-[#94A3B8] font-normal">• Drag Card to Play or Add to Inkwell</span>
            </div>

            {/* Hand Cards Stack */}
            <div className="flex items-center justify-center -space-x-6 px-4 py-3 overflow-x-auto max-w-full">
              {handCards.map((card) => (
                <motion.div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  drag
                  dragConstraints={{ left: -300, right: 300, top: -400, bottom: 50 }}
                  dragElastic={0.15}
                  dragSnapToOrigin
                  onDragStart={() => setIsDraggingCard(true)}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedHandCard(card)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedHandCard(card);
                    }
                  }}
                  onDragEnd={(_, info) => handleDragEnd(card, info)}
                  whileHover={{ y: -20, zIndex: 50 }}
                  className="w-32 h-48 rounded-xl relative cursor-pointer border border-[#30363d] hover:border-[#F59E0B] bg-[#141a26] group card-foil-light shrink-0"
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      <span className="font-cinzel text-xs font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                      <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                    </div>
                    <img
                      src={card.img}
                      alt={card.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover rounded-xl relative z-10"
                    />
                  </div>

                  <div className="absolute top-1.5 left-1.5 bg-[#0B0F19] px-1.5 py-0.5 rounded border border-[#30363d] text-[10px] font-mono font-bold text-[#F59E0B] flex items-center gap-1 z-20">
                    <Droplets className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{card.cost}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* HOVER CARD INSPECTOR TOOLTIP PANEL (VIEWPORT FIXED) */}
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-72 z-50 w-80 bg-[#141a26] border border-[#30363d] rounded-xl p-4 text-[#F1F5F9] flex flex-col gap-2.5 pointer-events-none shadow-2xl"
          >
            <div className="flex gap-3 items-center border-b border-[#30363d] pb-2">
              <img
                src={hoveredCard.img}
                alt={hoveredCard.name}
                referrerPolicy="no-referrer"
                className="w-14 h-20 object-cover rounded border border-[#30363d]"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  {hoveredCard.ink && <InkSymbol ink={hoveredCard.ink} size={16} />}
                  <span className="font-cinzel font-bold text-sm text-[#F59E0B] leading-tight">{hoveredCard.name}</span>
                </div>
                <span className="text-[11px] font-mono text-[#94A3B8]">{hoveredCard.title}</span>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#F59E0B] font-bold">
                  <span>Cost: {hoveredCard.cost} Ink</span>
                  {hoveredCard.isInkable ? (
                    <span className="text-emerald-400">Inkable</span>
                  ) : (
                    <span className="text-rose-400">Non-Inkable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-1 bg-[#0B0F19] p-2 rounded border border-[#30363d] text-center font-mono text-xs">
              <div>
                <span className="text-[9px] text-[#94A3B8] block">STRENGTH</span>
                <span className="text-[#F59E0B] font-bold flex items-center justify-center gap-1"><Sword className="w-3 h-3 text-[#F59E0B]" />{hoveredCard.strength ?? '-'}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#94A3B8] block">WILLPOWER</span>
                <span className="text-[#F59E0B] font-bold flex items-center justify-center gap-1"><Shield className="w-3 h-3 text-[#F59E0B]" />{hoveredCard.willpower ?? '-'}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#94A3B8] block">LORE</span>
                <span className="text-[#F59E0B] font-bold flex items-center justify-center gap-1"><Sparkles className="w-3 h-3 text-[#F59E0B]" />{hoveredCard.lore ?? '-'}</span>
              </div>
            </div>

            {/* Abilities & Text Box */}
            {hoveredCard.abilities && hoveredCard.abilities.length > 0 && (
              <div className="space-y-1.5 text-[11px] font-mono bg-[#0B0F19] p-2 rounded border border-[#30363d]">
                {hoveredCard.abilities.map((ab, idx) => (
                  <div key={idx}>
                    <span className="font-bold text-[#F59E0B]">{ab.name}: </span>
                    <span className="text-[#F1F5F9]">{ab.text}</span>
                  </div>
                ))}
              </div>
            )}

            {hoveredCard.flavorText && (
              <div className="text-[10px] font-outfit text-[#94A3B8] border-t border-[#30363d] pt-1">
                {hoveredCard.flavorText}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAG CHOICE ACTION MODAL */}
      <AnimatePresence>
        {dragPendingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative bg-[#141a26] border border-[#30363d] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-4 text-center"
            >
              <button
                onClick={() => setDragPendingCard(null)}
                aria-label="Cancel action choice"
                className="absolute top-4 right-4 p-1 bg-[#0B0F19] text-[#94A3B8] hover:text-white rounded border border-[#30363d] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-32 h-48 rounded-xl overflow-hidden border border-[#30363d] relative bg-[#0B0F19]">
                <img
                  src={dragPendingCard.img}
                  alt={dragPendingCard.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover relative z-10"
                />
              </div>

              <div className="space-y-1">
                <div className="font-cinzel text-base font-bold text-[#F59E0B]">{dragPendingCard.name}</div>
                <div className="text-xs font-mono text-[#94A3B8]">{dragPendingCard.title}</div>
              </div>

              <div className="w-full space-y-2 pt-1">
                {dragPendingCard.isInkable && !hasInkedThisTurn && (
                  <button
                    onClick={() => {
                      const card = dragPendingCard;
                      setDragPendingCard(null);
                      handleAddToInkwell(card);
                    }}
                    className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#F59E0B] border border-[#F59E0B]/50 p-3 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>Add to Inkwell (+1 Ink Capacity)</span>
                  </button>
                )}

                {availableInk >= dragPendingCard.cost && (
                  <button
                    onClick={() => {
                      const card = dragPendingCard;
                      setDragPendingCard(null);
                      handlePlayCard(card);
                    }}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black p-3 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Play to Field ({dragPendingCard.cost} Ink)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CARD CLICK ACTION MODAL */}
      <Modal
        isOpen={!!selectedHandCard}
        onClose={() => setSelectedHandCard(null)}
        ariaLabel="Card Action"
        overlayClassName="bg-[#0B0F19]/80"
      >
        {selectedHandCard && (
          <div className="relative z-10 max-w-sm w-full bg-[#141a26] border border-[#30363d] rounded-xl p-6 flex flex-col items-center gap-4 text-center">
            <button
              onClick={() => setSelectedHandCard(null)}
              aria-label="Close"
              className="absolute top-4 right-4 p-1 bg-[#0B0F19] text-[#94A3B8] hover:text-white rounded border border-[#30363d] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-36 h-52 rounded-xl overflow-hidden border border-[#30363d] relative bg-[#0B0F19]">
              <img
                src={selectedHandCard.img}
                alt={selectedHandCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-full h-full object-cover relative z-10"
              />
            </div>

            <div className="space-y-1">
              <div className="font-cinzel text-lg font-bold text-[#F59E0B]">{selectedHandCard.name}</div>
              <div className="text-xs font-mono text-[#94A3B8]">{selectedHandCard.title}</div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => handleAddToInkwell(selectedHandCard)}
                disabled={!selectedHandCard.isInkable || hasInkedThisTurn}
                className="w-full bg-[#141a26] hover:bg-[#1e2638] disabled:opacity-40 text-[#F59E0B] border border-[#F59E0B]/50 p-3 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span>
                  {!selectedHandCard.isInkable
                    ? 'Non-Inkable Card'
                    : hasInkedThisTurn
                    ? 'Inked this turn (1/1 Limit)'
                    : 'Add to Inkwell (+1 Ink Capacity)'}
                </span>
              </button>

              <button
                onClick={() => handlePlayCard(selectedHandCard)}
                disabled={availableInk < selectedHandCard.cost}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-3 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>
                  {availableInk < selectedHandCard.cost
                    ? `Requires ${selectedHandCard.cost} Ink (Have ${availableInk})`
                    : `Play to Field (${selectedHandCard.cost} Ink)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RIGHT SIDEBAR: ACTION LOG */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-72 border-l border-[#30363d] bg-[#141a26] p-4 flex flex-col justify-between z-30 shrink-0 shadow-xl sticky top-0 h-screen"
          >
            <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
              <span className="font-cinzel font-bold text-[#F59E0B] text-xs">Match Action Log</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 text-xs font-mono text-[#F1F5F9]">
              {logMessages.map((msg, idx) => (
                <div key={idx} className="bg-[#0B0F19] p-2.5 rounded border border-[#30363d] leading-relaxed">
                  {msg}
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono text-[#94A3B8] text-center border-t border-[#30363d] pt-2">
              AWS WebSockets Live Sync Active
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
