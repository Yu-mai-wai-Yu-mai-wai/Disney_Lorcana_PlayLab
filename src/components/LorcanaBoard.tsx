import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wifi,
  Skull,
  Library,
  Droplets,
  Zap,
  RotateCw,
  PanelRightOpen,
  PanelRightClose,
  X,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  ArrowUpCircle,
  Sword,
  Shield,
  ChevronUp,
  ChevronDown,
  Dices,
  Palette,
} from 'lucide-react';
import { webSocketService } from '../services/websocket';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';
import { DiceDuelModal } from './DiceDuelModal';
import { PlaymatSelectorModal } from './PlaymatSelectorModal';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { translateCardAbilityText, translateCardType, translateInkColor } from '../utils/cardTranslator';

import { fetchCardPool, fetchFullDataset, enrichCard, STARTER_POOL, type PoolCard } from '../data/cardPool';

export type LorcanaCard = PoolCard & { isWet?: boolean };

export const isCardInkable = (card?: LorcanaCard | null): boolean => {
  if (!card) return false;
  if (card.isInkable !== undefined) return Boolean(card.isInkable);
  if (card.inkwell !== undefined) return Boolean(card.inkwell);
  return true;
};

export interface LorcanaBoardProps {
  initialDeck?: any;
  roomId?: string;
  playerRole?: 'player1' | 'player2';
  matchMode?: boolean;
  onExitMatch?: () => void;
}

export const LorcanaBoard: React.FC<LorcanaBoardProps> = ({
  initialDeck,
  roomId,
  playerRole,
  matchMode = false,
  onExitMatch,
}) => {
  const { user } = useAuthStore();
  const { t, language } = useLanguageStore();
  const { getCurrentPlaymat } = usePlaymatStore();
  const currentPlaymat = getCurrentPlaymat();
  const [isPlaymatModalOpen, setIsPlaymatModalOpen] = useState(false);
  const myUsername = user?.username || webSocketService.getUsername() || 'Illumineer';

  // ==== REAL GAME STATE — no mock values. Match starts fresh every time. ====
  const [playerLore, setPlayerLore] = useState(0);
  const [opponentLore, setOpponentLore] = useState(0);
  const [inkwellCapacity, setInkwellCapacity] = useState(0);
  const [availableInk, setAvailableInk] = useState(0);
  const [opponentInk, setOpponentInk] = useState(0);
  const [opponentInkCapacity, setOpponentInkCapacity] = useState(0);
  const [hasInkedThisTurn, setHasInkedThisTurn] = useState(false);
  const [turnNumber, setTurnNumber] = useState(1);
  const [firstPlayerRole, setFirstPlayerRole] = useState<'player1' | 'player2'>('player1');
  const [isDiceDuelOpen, setIsDiceDuelOpen] = useState(matchMode);
  const [isMyTurn, setIsMyTurn] = useState(() => {
    // In a real match, player1 starts first by default unless dice duel decides otherwise
    if (matchMode) return playerRole !== 'player2';
    return true;
  });
  // Build initial 60-card deck from initialDeck or standard starter pool
  const [initialFullDeck] = useState<LorcanaCard[]>(() => {
    let deck: LorcanaCard[] = [];
    if (initialDeck && initialDeck.cards && Array.isArray(initialDeck.cards) && initialDeck.cards.length > 0) {
      initialDeck.cards.forEach((c: any) => {
        const count = c.count || 1;
        const cardData = c.card || c;
        for (let i = 0; i < count; i++) {
          const inkableFlag = cardData.inkwell !== undefined ? Boolean(cardData.inkwell) : (cardData.isInkable !== undefined ? Boolean(cardData.isInkable) : true);
          deck.push({
            ...cardData,
            inkwell: inkableFlag,
            isInkable: inkableFlag,
            id: `${cardData.id || cardData.name}-${i}-${Math.random().toString(36).substring(2, 6)}`
          });
        }
      });
    } else {
      for (let i = 0; i < 60; i++) {
        const c = STARTER_POOL[i % STARTER_POOL.length];
        deck.push({
          ...c,
          id: `${c.id}-${i}-${Math.random().toString(36).substring(2, 6)}`
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  });

  // Deal initial 7 cards to hand, remaining to deckCards
  const [handCards, setHandCards] = useState<LorcanaCard[]>(() => initialFullDeck.slice(0, 7));
  const [deckCards, setDeckCards] = useState<LorcanaCard[]>(() => initialFullDeck.slice(7));
  const [deckCount, setDeckCount] = useState<number>(() => initialFullDeck.length - 7);
  const [discardCount, setDiscardCount] = useState(0);

  const [opponentDeckCount, setOpponentDeckCount] = useState(53);
  const [opponentDiscardCount, setOpponentDiscardCount] = useState(0);

  const [cardPool, setCardPool] = useState<LorcanaCard[]>([]);
  const [damage, setDamage] = useState<Record<string, number>>({});
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [turnPhase, setTurnPhase] = useState<'beginning' | 'main' | 'end'>('beginning');
  const [hasMulliganed, setHasMulliganed] = useState(false);
  const [isMulliganPhase, setIsMulliganPhase] = useState(false);
  const [mulliganSelectedIds, setMulliganSelectedIds] = useState<string[]>([]);

  // Mutable refs to prevent stale closure issues in WebSocket callbacks
  const deckCardsRef = useRef<LorcanaCard[]>(deckCards);
  deckCardsRef.current = deckCards;
  const handCardsRef = useRef<LorcanaCard[]>(handCards);
  handCardsRef.current = handCards;
  const inkwellCapacityRef = useRef<number>(inkwellCapacity);
  inkwellCapacityRef.current = inkwellCapacity;
  const firstPlayerRoleRef = useRef<'player1' | 'player2'>(firstPlayerRole);
  firstPlayerRoleRef.current = firstPlayerRole;
  const turnNumberRef = useRef<number>(turnNumber);
  turnNumberRef.current = turnNumber;
  const playerRoleRef = useRef<'player1' | 'player2' | undefined>(playerRole);
  playerRoleRef.current = playerRole;
  const matchModeRef = useRef<boolean>(matchMode);
  matchModeRef.current = matchMode;

  const handleDuelFinished = (chosenFirst: 'player1' | 'player2') => {
    setFirstPlayerRole(chosenFirst);
    firstPlayerRoleRef.current = chosenFirst;
    const myTurn = chosenFirst === (playerRole || 'player1');
    setIsMyTurn(myTurn);
    setIsDiceDuelOpen(false);
    setIsMulliganPhase(true);
    setLogMessages((prev) => [
      `🎲 Dice Duel concluded: ${chosenFirst === (playerRole || 'player1') ? 'You were chosen to' : 'Opponent was chosen to'} PLAY FIRST!`,
      ...prev,
    ]);
    showNotice(
      myTurn
        ? 'You are PLAYING FIRST! (Turn 1 card draw skipped by official rule 3.2.3.1)'
        : 'Opponent is PLAYING FIRST! (You will draw on your Turn 1)',
      'success'
    );
  };

  const handleMulliganConfirm = () => {
    const keepCards = handCards.filter(c => !mulliganSelectedIds.includes(c.id));
    const returnedCards = handCards.filter(c => mulliganSelectedIds.includes(c.id));
    const replaceCount = returnedCards.length;
    
    if (replaceCount > 0) {
      const newDraws = deckCards.slice(0, replaceCount);
      const remainingDeck = deckCards.slice(replaceCount);
      // Place returned cards at bottom and reshuffle per Lorcana 2.2.2
      const updatedDeck = [...remainingDeck, ...returnedCards].sort(() => Math.random() - 0.5);
      
      const newHand = [...keepCards, ...newDraws];
      deckCardsRef.current = updatedDeck;
      handCardsRef.current = newHand;
      setHandCards(newHand);
      setDeckCards(updatedDeck);
      setDeckCount(updatedDeck.length);
      showNotice(`Mulliganed ${replaceCount} cards (Drew ${replaceCount} new cards)`, 'success');
      setLogMessages(prev => [`Mulliganed ${replaceCount} cards and reshuffled deck. Opening hand has ${newHand.length} cards.`, ...prev]);
    } else {
      showNotice('Kept original opening hand (7 cards)', 'success');
      setLogMessages(prev => [`Kept opening hand of 7 cards.`, ...prev]);
    }
    
    setHasMulliganed(true);
    setIsMulliganPhase(false);

    const myRole = playerRoleRef.current || 'player1';
    const isPlayerGoingFirst = myRole === firstPlayerRoleRef.current;

    if (isPlayerGoingFirst) {
      // First player begins Turn 1 with proper setup
      handleStartTurn(1);
    } else {
      setIsMyTurn(false);
      setTurnPhase('beginning');
      showNotice('Waiting for first player to take their turn...', 'warning');
    }
  };

  // Enrich all cards with full official dataset (abilities, inkwell, stats)
  React.useEffect(() => {
    fetchFullDataset().then(dataset => {
      setCardPool(dataset);
      setHandCards(prev => prev.map(c => enrichCard(c, dataset)));
      setDeckCards(prev => {
        const enriched = prev.map(c => enrichCard(c, dataset));
        deckCardsRef.current = enriched;
        return enriched;
      });
      setFieldCards(prev => prev.map(c => enrichCard(c, dataset)));
      setOpponentFieldCards(prev => prev.map(c => enrichCard(c, dataset)));
    });
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHandOpen, setIsHandOpen] = useState(false);
  const handHoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHandMouseEnter = () => {
    if (handHoverTimeout.current) clearTimeout(handHoverTimeout.current);
    setIsHandOpen(true);
  };

  const handleHandMouseLeave = () => {
    if (handHoverTimeout.current) clearTimeout(handHoverTimeout.current);
    handHoverTimeout.current = setTimeout(() => {
      setIsHandOpen(false);
    }, 150);
  };

  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // SPRINT 3: AWS WEBSOCKETS REAL-TIME ROOM SYNC STATE
  const [inputRoomId, setInputRoomId] = useState(roomId || '108249');
  const [, setActiveRoomId] = useState(roomId || '108249');
  const [isWsConnected] = useState(false);

  // CHAT STATE
  const [chatMessages, setChatMessages] = useState<{username: string, message: string, time: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInput, setChatInput] = useState('');

  // CARD HOVER, DRAG & ACTION MODAL STATES
  const [hoveredCard, setHoveredCard] = useState<LorcanaCard | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<LorcanaCard | null>(null);
  const [dragPendingCard, setDragPendingCard] = useState<LorcanaCard | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isDraggingOverInkwell, setIsDraggingOverInkwell] = useState(false);

  const [exertedCards, setExertedCards] = useState<Record<string, boolean>>({});

  const [logMessages, setLogMessages] = useState<string[]>([
    'Match started. Initial 60-card decks shuffled and 7 cards dealt to hand.',
  ]);

  // Initial player battlefield cards state
  const [fieldCards, setFieldCards] = useState<LorcanaCard[]>([]);
  
  const [opponentFieldCards, setOpponentFieldCards] = useState<LorcanaCard[]>(() => {
    if (matchMode) return [];
    return [
      {
        id: 'opp-1', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, strength: 7, willpower: 5, lore: 2, isInkable: true, inkwell: true, type: 'Character' as any, ink: 'Ruby', img: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg',
      },
      {
        id: 'opp-2', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, strength: 5, willpower: 5, lore: 2, isInkable: true, inkwell: true, type: 'Character' as any, ink: 'Ruby', img: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg',
      }
    ];
  });
  const [opponentExerted, setOpponentExerted] = useState<Record<string, boolean>>({});

  // Sync service params on mount / changes
  React.useEffect(() => {
    if (roomId) {
      webSocketService.setRoomId(roomId);
      setActiveRoomId(roomId);
    }
    if (playerRole) {
      webSocketService.setRole(playerRole);
      if (matchMode) {
        setIsMyTurn(playerRole === 'player1');
      }
    }
    if (user?.username) {
      webSocketService.setUsername(user.username);
    }
  }, [roomId, playerRole, matchMode, user]);

  React.useEffect(() => {
    if (!matchMode) return;

    const checkFromMe = (data: any) => {
      if (data.role && playerRole && data.role === playerRole) return true;
      if (data.username && myUsername && data.username === myUsername) return true;
      return false;
    };

    const unsubMoved = webSocketService.subscribe('CARD_MOVED', (data) => {
      if (checkFromMe(data)) return;
      if (data.payload?.zone === 'field' && data.payload?.card) {
        const oppCard = { ...data.payload.card, isWet: data.payload.card.isWet !== undefined ? data.payload.card.isWet : true };
        setOpponentFieldCards((prev) => {
          if (!prev.find(c => c.id === oppCard.id)) {
            return [...prev, oppCard];
          }
          return prev;
        });
        setOpponentDeckCount((prev) => Math.max(0, prev - 1));
        if (data.availableInk !== undefined) {
          setOpponentInk(data.availableInk);
        }
        setLogMessages(prev => [`Opponent played Character: ${oppCard.name}! (Ink drying...)`, ...prev]);
      }
    });

    const unsubExerted = webSocketService.subscribe('CARD_EXERTED', (data) => {
      if (checkFromMe(data)) return;
      if (data.cardId) {
        setOpponentExerted((prev) => ({ ...prev, [data.cardId!]: !!data.isExerted }));
      }
    });

    const unsubInk = webSocketService.subscribe('INK_PLAYED', (data) => {
      if (checkFromMe(data)) return;
      setLogMessages((prev) => [`Opponent added a card to Inkwell.`, ...prev]);
      if (data.inkCount !== undefined) {
        setOpponentInkCapacity(data.inkCount);
      }
      if (data.availableInk !== undefined) {
        setOpponentInk(data.availableInk);
      }
      setOpponentDeckCount((prev) => Math.max(0, prev - 1));
    });

    const unsubLore = webSocketService.subscribe('LORE_UPDATED', (data) => {
      if (checkFromMe(data)) return;
      if (data.loreScore !== undefined) {
        setOpponentLore(data.loreScore);
        if (data.loreScore >= 20) {
          showNotice('DEFEAT! Opponent reached 20 Lore and won the match.', 'error');
        }
      }
    });

    const unsubQuest = webSocketService.subscribe('QUEST_DONE', (data) => {
      if (checkFromMe(data)) return;
      if (data.loreScore !== undefined) {
        setOpponentLore(data.loreScore);
        if (data.cardId) {
          setOpponentExerted((prev) => ({ ...prev, [data.cardId!]: true }));
        }
        if (data.loreScore >= 20) {
          showNotice('DEFEAT! Opponent reached 20 Lore and won the match.', 'error');
        }
      }
    });

    const unsubPassed = webSocketService.subscribe('TURN_PASSED', (data) => {
      if (checkFromMe(data)) return;
      setLogMessages(prev => [`Opponent ended their turn.`, ...prev]);
      // Opponent's cards that were played on their turn will dry up and ready
      setOpponentFieldCards(prev => prev.map(c => ({ ...c, isWet: false })));
      // Use the turn number from the sender so both players see the SAME turn
      handleStartTurn(data.turnNumber);
    });

    const unsubChallenge = webSocketService.subscribe('CHALLENGE_DONE', (data) => {
      if (checkFromMe(data)) return;
      const p = data.payload;
      if (!p) return;

      if (p.targetBanished) {
        setFieldCards(prev => prev.filter(c => c.id !== p.targetId));
        setDiscardCount(prev => prev + 1);
        setLogMessages(prev => [`Your ${p.targetName} was banished by opponent's ${p.attackerName}!`, ...prev]);
        showNotice(`Your "${p.targetName}" was banished in challenge!`, 'error');
      } else if (p.targetDamage !== undefined) {
        setDamage(prev => ({ ...prev, [p.targetId]: p.targetDamage }));
      }

      if (p.attackerBanished) {
        setOpponentFieldCards(prev => prev.filter(c => c.id !== p.attackerId));
        setOpponentDiscardCount(prev => prev + 1);
        setLogMessages(prev => [`Opponent's ${p.attackerName} was banished defending against your card!`, ...prev]);
      } else if (p.attackerDamage !== undefined) {
        setDamage(prev => ({ ...prev, [p.attackerId]: p.attackerDamage }));
        setOpponentExerted(prev => ({ ...prev, [p.attackerId]: true }));
      }
    });

    const unsubDisconnect = webSocketService.subscribe('OPPONENT_DISCONNECTED', () => {
      showNotice('Opponent disconnected!', 'warning');
    });

    const unsubDrawn = webSocketService.subscribe('CARD_DRAWN', (data) => {
      if (checkFromMe(data)) return;
      if (data.deckCount !== undefined) {
        setOpponentDeckCount(data.deckCount);
      } else {
        setOpponentDeckCount((prev) => Math.max(0, prev - 1));
      }
      setLogMessages((prev) => [`Opponent drew a card from their deck.`, ...prev]);
    });

    const unsubChat = webSocketService.subscribe('CHAT_MESSAGE', (data) => {
      if (checkFromMe(data)) return;
      if (data.message && data.username) {
        setChatMessages(prev => [...prev, { username: data.username!, message: data.message!, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setUnreadChatCount(prev => prev + 1);
        showNotice(`💬 ${data.username}: ${data.message}`, 'warning');
      }
    });

    // Handle INITIAL SYNC on GAME_START/ROOM_STATE
    const unsubGameStart = webSocketService.subscribe('GAME_START', () => {
      setPlayerLore(0);
      setOpponentLore(0);
      setAvailableInk(0);
      setInkwellCapacity(0);
      setOpponentInk(0);
      setOpponentInkCapacity(0);
      setTurnNumber(1);
      if (matchMode) {
        setIsMyTurn(playerRole === 'player1');
      }
    });

    const unsubRoomState = webSocketService.subscribe('ROOM_STATE', () => {
      setPlayerLore(0);
      setOpponentLore(0);
      setAvailableInk(0);
      setInkwellCapacity(0);
      setOpponentInk(0);
      setOpponentInkCapacity(0);
      setTurnNumber(1);
      if (matchMode) {
        setIsMyTurn(playerRole === 'player1');
      }
    });

    return () => {
      unsubMoved();
      unsubExerted();
      unsubInk();
      unsubLore();
      unsubQuest();
      unsubPassed();
      unsubChallenge();
      unsubDisconnect();
      unsubDrawn();
      unsubChat();
      unsubGameStart();
      unsubRoomState();
    };
  }, [matchMode, playerRole, myUsername, roomId]);

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

  const handleAttackTarget = (target: LorcanaCard) => {
    if (!selectedAttacker) return;
    const attacker = fieldCards.find(c => c.id === selectedAttacker);
    if (!attacker) return;
    
    if (attacker.isWet) {
       showNotice(`${attacker.name} was played this turn! (Ink drying - cannot Challenge until next turn)`, 'warning');
       setSelectedAttacker(null);
       return;
    }
    
    if (!opponentExerted[target.id]) {
       showNotice(`You can only challenge Exerted characters!`, 'warning');
       return;
    }
    
    const attackerDmg = target.strength || 0;
    const targetDmg = attacker.strength || 0;
    
    let newAttackerDamage = (damage[attacker.id] || 0) + attackerDmg;
    let newTargetDamage = (damage[target.id] || 0) + targetDmg;
    
    const attackerBanished = newAttackerDamage >= (attacker.willpower || 0);
    const targetBanished = newTargetDamage >= (target.willpower || 0);
    
    if (attackerBanished) {
       setFieldCards(prev => prev.filter(c => c.id !== attacker.id));
       setDiscardCount(prev => prev + 1);
       setLogMessages(prev => [`${attacker.name} was banished in challenge!`, ...prev]);
    } else {
       setDamage(prev => ({ ...prev, [attacker.id]: newAttackerDamage }));
       setExertedCards(prev => ({ ...prev, [attacker.id]: true }));
       webSocketService.sendAction('CARD_EXERTED', { roomId: roomId || undefined, role: playerRole, cardId: attacker.id, isExerted: true });
    }
    
    if (targetBanished) {
       setOpponentFieldCards(prev => prev.filter(c => c.id !== target.id));
       setOpponentDiscardCount(prev => prev + 1);
       setLogMessages(prev => [`Opponent's ${target.name} was banished in challenge!`, ...prev]);
    } else {
       setDamage(prev => ({ ...prev, [target.id]: newTargetDamage }));
    }

    if (matchMode) {
      webSocketService.sendAction('CHALLENGE_DONE', {
        roomId: roomId || undefined,
        role: playerRole,
        payload: {
          attackerId: attacker.id,
          targetId: target.id,
          attackerName: attacker.name,
          targetName: target.name,
          attackerDamage: newAttackerDamage,
          targetDamage: newTargetDamage,
          attackerBanished,
          targetBanished,
        }
      });
    }

    setSelectedAttacker(null);
  };

  const toggleExert = (id: string) => {
    const nextState = !exertedCards[id];
    setExertedCards((prev) => ({ ...prev, [id]: nextState }));
    webSocketService.sendAction('CARD_EXERTED', { roomId: roomId || undefined, role: playerRole, cardId: id, isExerted: nextState });
  };

  const handleQuest = (card: LorcanaCard) => {
    if (card.isWet) {
      showNotice(`${card.name} was played this turn! (Ink drying - cannot Quest until next turn)`, 'warning');
      return;
    }
    if (!exertedCards[card.id]) {
      const loreGain = card.lore || 1;
      setExertedCards((prev) => ({ ...prev, [card.id]: true }));
      webSocketService.sendAction('CARD_EXERTED', { roomId: roomId || undefined, role: playerRole, cardId: card.id, isExerted: true });

      setPlayerLore((prev) => {
        const next = Math.min(20, prev + loreGain);
        webSocketService.sendAction('LORE_UPDATED', { roomId: roomId || undefined, role: playerRole, loreScore: next });
        webSocketService.sendAction('QUEST_DONE', { roomId: roomId || undefined, role: playerRole, cardId: card.id, loreScore: next });
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
    if (!isCardInkable(card)) {
      const hasInkable = handCards.some(c => isCardInkable(c));
      if (hasInkable) {
        showNotice(`"${card.name}" is non-inkable! Choose an inkable card.`, 'error');
        return false;
      } else {
        showNotice(`No inkable cards in hand — revealed hand, using "${card.name}" as ink`, 'warning');
      }
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

    webSocketService.sendAction('INK_PLAYED', { 
      roomId: roomId || undefined,
      role: playerRole,
      cardId: card.id,
      inkCount: inkwellCapacity + 1,
      availableInk: availableInk + 1
    });
    setLogMessages((prev) => [`You converted ${card.name} into Inkwell! (Capacity: ${inkwellCapacity + 1})`, ...prev]);
    showNotice(`Converted "${card.name}" into Inkwell! (+1 Ink Capacity)`, 'success');
    return true;
  };

  const resolveAbilities = (card: LorcanaCard) => {
    if (!card.abilities || !Array.isArray(card.abilities)) return;
    card.abilities.forEach(ability => {
      const text = (ability.text || '').toLowerCase();
      
      // Draw card ability (e.g. "draw a card", "draw 2 cards")
      const drawMatch = text.match(/draw (\d+) cards/);
      if (drawMatch) {
        const count = parseInt(drawMatch[1]);
        for (let i = 0; i < count; i++) {
          handleDrawCard();
        }
        setLogMessages(logs => [`[Ability: ${ability.name}] Drew ${count} cards!`, ...logs]);
      } else if (/draw a card/.test(text)) {
        handleDrawCard();
        setLogMessages(logs => [`[Ability: ${ability.name}] Drew 1 card!`, ...logs]);
      }

      // Gain lore
      const loreMatch = text.match(/gain (\d+) lore/);
      if (loreMatch) {
        const gain = parseInt(loreMatch[1]);
        setPlayerLore(prev => {
          const next = Math.min(20, prev + gain);
          webSocketService.sendAction('LORE_UPDATED', { roomId: roomId || undefined, role: playerRole, loreScore: next });
          return next;
        });
        setLogMessages(logs => [`[Ability: ${ability.name}] Gained ${gain} Lore!`, ...logs]);
      }

      // Banish chosen character
      if (/banish chosen (opposing )?character/.test(text)) {
        setOpponentFieldCards(prev => {
          if (prev.length > 0) {
            setLogMessages(logs => [`[Ability: ${ability.name}] Banished opponent's ${prev[0].name}!`, ...logs]);
            return prev.slice(1);
          }
          return prev;
        });
      }

      // Damage to each opposing character
      const dmgMatch = text.match(/deal (\d+) damage to each opposing character/);
      if (dmgMatch) {
        const dmg = parseInt(dmgMatch[1]);
        setOpponentFieldCards(prev => {
          const next: LorcanaCard[] = [];
          setDamage(d => {
            const nd = { ...d };
            prev.forEach(op => {
              nd[op.id] = (nd[op.id] || 0) + dmg;
              if (nd[op.id] >= (op.willpower || 0)) {
                setLogMessages(logs => [`Opponent's ${op.name} was banished by ${ability.name}!`, ...logs]);
              } else {
                next.push(op);
              }
            });
            return nd;
          });
          return next;
        });
      }

      // Exert characters
      const exertMatch = text.match(/exert up to (\d+) chosen characters/);
      if (exertMatch) {
        const count = parseInt(exertMatch[1]);
        setOpponentExerted(prev => {
          const next = { ...prev };
          opponentFieldCards.slice(0, count).forEach(op => {
            next[op.id] = true;
          });
          return next;
        });
        setLogMessages(logs => [`[Ability: ${ability.name}] Exerted ${count} opposing characters!`, ...logs]);
      }
    });
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

    const cardType = String(card.type).toLowerCase();
    if (cardType === 'action' || cardType === 'song') {
      // Actions/Songs go to Discard pile
      setDiscardCount((prev) => prev + 1);
      setLogMessages((prev) => [`You played ${card.type.toUpperCase()}: ${card.name}! (Sent to Discard Pile)`, ...prev]);
      showNotice(`Cast Action "${card.name}"! (${card.cost} Ink used, sent to Discard)`, 'success');
      resolveAbilities(card);
    } else {
      // Characters enter battlefield with isWet: true
      const newFieldCard = { ...card, isWet: true };
      setFieldCards((prev) => [...prev, newFieldCard]);
      setLogMessages((prev) => [`You cast Character: ${card.name} (${card.title}) onto the battlefield!`, ...prev]);
      showNotice(`Played ${card.name} onto field! (${card.cost} Ink used)`, 'success');
      webSocketService.sendAction('CARD_MOVED', { 
        roomId: roomId || undefined,
        role: playerRole,
        cardId: card.id, 
        availableInk: availableInk - card.cost,
        payload: { zone: 'field', card: newFieldCard } 
      });
      resolveAbilities(card);
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

    const cardInkable = isCardInkable(card);
    const canInk = (cardInkable || !handCards.some(c => isCardInkable(c))) && !hasInkedThisTurn;
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
      if (!cardInkable && availableInk < card.cost) {
        showNotice(`Cannot play (requires ${card.cost} Ink, have ${availableInk}) and "${card.name}" is non-inkable!`, 'warning');
      } else if (hasInkedThisTurn && availableInk < card.cost) {
        showNotice(`Already inked this turn and not enough Ink (${availableInk}/${card.cost}) to play!`, 'warning');
      } else {
        showNotice(`No valid action available for "${card.name}".`, 'warning');
      }
    }
  };

  // Draw Card Action (Enforcing Official Lorcana Deck-Out Defeat Rule & Real Deck State via Refs)
  const handleDrawCard = (isAutoDraw = false) => {
    const currentDeck = deckCardsRef.current;
    if (!currentDeck || currentDeck.length === 0) {
      showNotice(`DEFEAT! Your deck is empty (Loss by Deck-out / Draw-out).`, 'error');
      setLogMessages((prev) => [`Match finished: You attempted to draw from an empty deck and lost!`, ...prev]);
      return null;
    }

    const drawn = currentDeck[0];
    const newDeck = currentDeck.slice(1);
    deckCardsRef.current = newDeck;
    setDeckCards(newDeck);
    setDeckCount(newDeck.length);
    setHandCards((prev) => {
      const nextHand = [...prev, drawn];
      handCardsRef.current = nextHand;
      return nextHand;
    });

    if (isAutoDraw) {
      setLogMessages((prev) => [`[Draw Step] Drew 1 card automatically for turn: "${drawn.name}".`, ...prev]);
    } else {
      setLogMessages((prev) => [`You drew ${drawn.name} from your deck.`, ...prev]);
      showNotice(`Drew "${drawn.name}" from Deck!`, 'success');
    }

    if (matchModeRef.current) {
      webSocketService.sendAction('CARD_DRAWN', {
        roomId: roomId || undefined,
        role: playerRoleRef.current,
        deckCount: newDeck.length,
      });
    }

    return drawn;
  };

  const handleDeckClick = () => {
    showNotice(`Card draw is automatic at the start of your turn (Official Lorcana Rule 3.2.3).`, 'warning');
  };

  // Official Turn Change Logic
  const handleEndTurn = () => {
    setIsMyTurn(false);
    setSelectedAttacker(null);
    setOpponentInk(opponentInkCapacity); // Refill opponent's ink on their turn start
    setOpponentExerted({}); // Opponent's cards ready at start of their turn
    setOpponentFieldCards(prev => prev.map(c => ({ ...c, isWet: false }))); // Opponent's wet cards dry out

    if (matchModeRef.current) {
      // Advance the turn number IMMEDIATELY on our side too, so both players
      // show the same turn at the same time (no stale number while waiting).
      const nextTurn = turnNumberRef.current + 1;
      turnNumberRef.current = nextTurn;
      setTurnNumber(nextTurn);
      showNotice(`Turn ${nextTurn} — Opponent is playing.`, 'warning');
      // Send the NEXT turn number so the opponent syncs to the same value
      webSocketService.sendAction('TURN_PASSED', {
        roomId: roomId || undefined,
        role: playerRoleRef.current,
        turnNumber: nextTurn
      });
    } else {
      setTimeout(() => {
        setOpponentLore((prev) => Math.min(20, prev + 1));
        setLogMessages((prev) => [`Opponent completed their turn and gained 1 Lore.`, ...prev]);
        
        setTimeout(() => {
          handleStartTurn();
        }, 1200);
      }, 1000);
    }
  };

  const handleStartTurn = (syncedTurnNumber?: number) => {
    // === 1. READY STEP ===
    // Turn all exerted cards upright (field cards & inkwell)
    setExertedCards({});
    // Characters dry their ink (isWet: false)
    setFieldCards(prev => prev.map(c => ({ ...c, isWet: false })));
    setHasInkedThisTurn(false);
    // Refill available ink to maximum inkwell capacity
    const currentCap = inkwellCapacityRef.current;
    setAvailableInk(currentCap);

    // Official Lorcana Rule 3.2.3.1: The player who plays FIRST does NOT draw on Turn 1
    const myRole = playerRoleRef.current || 'player1';
    const isPlayerGoingFirst = myRole === firstPlayerRoleRef.current;
    const effectiveTurn = syncedTurnNumber !== undefined ? syncedTurnNumber : (turnNumberRef.current + 1);
    const isFirstTurnForFirstPlayer = effectiveTurn === 1 && isPlayerGoingFirst;

    turnNumberRef.current = effectiveTurn;
    setTurnNumber(effectiveTurn);
    setIsMyTurn(true);

    // === 2. SET STEP ===
    // Resolve start-of-turn effects and gain location lore
    setTurnPhase('beginning');
    setLogMessages(prev => [
      `--- Turn ${effectiveTurn} Started [Ready, Set, Draw] ---`,
      `[Ready Step] Readied all cards and inkwell (${currentCap}/${currentCap}).`,
      `[Set Step] Characters dried and start-of-turn effects checked.`,
      ...prev
    ]);

    // === 3. DRAW STEP (AUTOMATIC) ===
    if (!isFirstTurnForFirstPlayer) {
      handleDrawCard(true);
      showNotice(`Turn ${effectiveTurn}: Ready, Set, Draw! (1 Card Drawn)`, 'success');
    } else {
      setLogMessages(prev => [`[Draw Step] Turn 1: First player skips draw step by official rule 3.2.3.1.`, ...prev]);
      showNotice(`Turn 1 Started: Ready, Set! (First player skips Draw).`, 'success');
    }

    // === MAIN PHASE ===
    setTurnPhase('main');
  };

  return (
    <div className="relative w-full h-full max-h-full flex bg-[#0B0F19] text-[#F1F5F9] font-outfit select-none overflow-hidden">
      
      {/* Notice Banner */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0d1c2d] px-6 py-3 rounded-lg border font-bold text-xs flex items-center gap-2.5 shadow-2xl ${
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

      {/* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES (NO SCROLL, H-FULL) */}
      <aside className={`w-72 border-r border-[#30363d] bg-[#141a26] p-3.5 pb-1.5 grid grid-rows-[auto_1fr_auto] z-20 shrink-0 h-full overflow-hidden transition-colors ${
        isDraggingOverInkwell ? 'border-2 border-[#F59E0B] bg-[#1e2638]' : ''
      }`}>
        {/* Opponent Piles */}
        <div className="space-y-1.5 border-b border-[#30363d] pb-2.5 shrink-0">
          <div className="text-[11px] font-cinzel font-bold text-[#F59E0B] flex justify-between items-center">
            <span>OPPONENT PILES</span>
            <span className="text-[#94A3B8] font-mono text-[10px] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Active
            </span>
          </div>
          <div className="flex gap-2 mt-1">
            <div className="flex-1 h-28 rounded-lg border border-[#30363d] flex flex-col items-center justify-between p-1.5 relative overflow-hidden bg-[#0B0F19]">
              <img
                src="/Lorcana_Card_Back.png"
                alt="Opponent Deck Back"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-[#0B0F19]/40" />
              <Layers className="w-5 h-5 text-[#F59E0B] z-10" />
              <span className="text-[11px] font-mono font-bold text-white z-10 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">{opponentDeckCount}</span>
            </div>
            <div className="flex-1 h-28 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-1.5 relative">
              <Skull className="w-5 h-5 text-rose-400 mb-1" />
              <span className="text-[10px] font-cinzel font-bold text-[#94A3B8]">GRAVE</span>
              <span className="text-[11px] font-mono font-bold text-[#94A3B8] mt-0.5">{opponentDiscardCount}</span>
            </div>
          </div>
        </div>

        {/* Inkwell Reserve Zone */}
        <div className="space-y-2 py-2 min-h-0 flex flex-col">
          <div className="flex justify-between items-center text-xs font-cinzel font-bold text-[#F59E0B] shrink-0">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" /> INKWELL ZONE
            </span>
            <motion.span
              key={availableInk}
              initial={{ scale: 1.2, color: '#FCD34D' }}
              animate={{ scale: 1, color: '#F59E0B' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="font-mono text-sm font-bold"
            >
              {availableInk}/{inkwellCapacity}
            </motion.span>
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 p-2 bg-[#0B0F19] rounded-xl border border-[#30363d] relative">
            {Array.from({ length: Math.max(6, inkwellCapacity) }).map((_, i) => {
              const isReady = i < availableInk;
              const isExerted = !isReady && i < inkwellCapacity;

              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24, delay: i * 0.02 }}
                  className={`h-full min-h-9 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                    isReady
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#F59E0B]'
                      : isExerted
                      ? 'bg-[#141a26] border-[#30363d] text-[#94A3B8]'
                      : 'bg-[#0B0F19]/50 border-[#30363d]/40 text-[#94A3B8]/30'
                  }`}
                >
                  <Droplets className={`w-3.5 h-3.5 ${isReady ? 'text-[#F59E0B] fill-[#F59E0B]' : isExerted ? 'text-[#94A3B8]' : 'text-[#94A3B8]/30'}`} />
                  <span className={`text-[9px] font-mono mt-0.5 ${isReady ? 'text-[#F59E0B] font-bold' : isExerted ? 'text-[#94A3B8] font-semibold' : 'text-[#94A3B8]/40'}`}>
                    {isReady ? 'Ready' : isExerted ? 'Exerted' : 'Empty'}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <div className="text-[9px] font-mono text-center px-2 py-1 rounded-lg border bg-[#0B0F19] border-[#30363d] text-[#F59E0B] font-semibold">
            {hasInkedThisTurn ? 'Inked this turn (1/1 Limit)' : 'Drag Card Here to Add Ink'}
          </div>
        </div>

        {/* Player Piles */}
        <div className="space-y-1.5 border-t border-[#30363d] pt-2.5 shrink-0">
          <div className="text-[11px] font-cinzel font-bold text-[#F59E0B]">YOUR PILES</div>
          <div className="flex gap-2">
            {/* Draw Deck */}
            <motion.div
              role="button"
              tabIndex={0}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={handleDeckClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDeckClick();
                }
              }}
              className="flex-1 h-32 rounded-lg border-2 border-[#F59E0B] flex flex-col items-center justify-between p-2 relative cursor-pointer hover:border-amber-300 transition-colors overflow-hidden bg-[#0B0F19]"
              title="Deck (Draws automatically at turn start)"
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
                <span className="text-[11px] font-mono font-bold text-[#F59E0B] bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d]">{deckCount}</span>
              </div>
            </motion.div>

            {/* Discard */}
            <div className="flex-1 h-32 bg-[#0B0F19] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-2 relative cursor-pointer hover:border-rose-400 transition-colors overflow-hidden">
              <Skull className="w-5 h-5 text-rose-400 mb-1" />
              <span className="text-[10px] font-cinzel font-bold text-[#F1F5F9]">DISCARD</span>
              <span className="text-[11px] font-mono font-bold text-[#94A3B8] mt-0.5">{discardCount}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER PLAY AREA: FIT-IN-SCREEN PLAYFIELD (OVERFLOW-HIDDEN, NO SCROLL) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 p-3 justify-between">
        
        {/* TOP STATUS HEADER BAR */}
        <div className="flex justify-between items-center w-full z-20 pb-2 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2.5">
            {/* OPPONENT LORE */}
            <div className="px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-2.5 bg-[#141a26] shadow-sm shadow-rose-950/20">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider">Opponent Lore</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <motion.span
                    key={opponentLore}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="font-cinzel text-xl font-black text-rose-400 leading-none"
                  >
                    {opponentLore}
                  </motion.span>
                  <span className="font-cinzel text-xs font-bold text-[#94A3B8]">/ 20</span>
                </div>
              </div>
            </div>

            {/* OPPONENT INK (NEW PROMINENT & ATTRACTIVE DISPLAY) */}
            <div className="px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-2.5 bg-[#141a26] shadow-sm shadow-sky-950/20">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                <Droplets className="w-3.5 h-3.5 text-sky-400 fill-sky-400/50" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-cinzel font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                  Opponent Ink
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <motion.span
                    key={`${opponentInk}-${opponentInkCapacity}`}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                    className="font-mono text-lg font-black text-sky-400 leading-none"
                  >
                    {opponentInk}
                  </motion.span>
                  <span className="font-mono text-xs font-bold text-[#94A3B8]">
                    / {opponentInkCapacity}
                  </span>
                </div>
              </div>

              {/* Visual mini ink pips indicator */}
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-[#30363d]">
                {Array.from({ length: Math.max(1, Math.min(6, opponentInkCapacity || 1)) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-4 rounded-sm transition-all duration-300 ${
                      idx < opponentInk
                        ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                        : opponentInkCapacity > 0
                        ? 'bg-slate-700/60 border border-slate-600/40'
                        : 'bg-slate-800/40 border border-slate-700/30 opacity-40'
                    }`}
                    title={opponentInkCapacity > 0 ? `Ink Slot ${idx + 1}` : 'No Inkwell'}
                  />
                ))}
                {opponentInkCapacity > 6 && (
                  <span className="text-[9px] font-mono text-sky-400 font-bold ml-0.5">+{opponentInkCapacity - 6}</span>
                )}
              </div>
            </div>
          </div>

          <motion.div
            key={`${turnNumber}-${turnPhase}`}
            initial={{ scale: 0.92, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="px-4 py-1.5 rounded-xl border border-[#F59E0B]/50 text-[#F59E0B] font-cinzel font-bold text-xs flex items-center gap-2 bg-[#141a26]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="capitalize">{turnPhase} Phase | Turn {turnNumber}</span>
          </motion.div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {!matchMode && (
              <form onSubmit={handleJoinRoomSubmit} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#30363d] bg-[#141a26]">
                <Wifi className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400' : 'text-[#F59E0B]'}`} />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Room:</span>
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  className="w-14 bg-[#0B0F19] border border-[#30363d] text-[#F59E0B] px-1 py-0.5 rounded text-xs font-mono font-bold outline-none text-center"
                />
                <button
                  type="submit"
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors"
                >
                  Join
                </button>
              </form>
            )}
            
            {onExitMatch && (
              <button
                onClick={onExitMatch}
                className="bg-rose-500/10 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Exit Match
              </button>
            )}

            <button
              onClick={() => setIsPlaymatModalOpen(true)}
              className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Change Battlefield Playmat Skin"
            >
              <Palette className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden sm:inline">Playmat</span>
            </button>

            <button
              onClick={() => setIsDiceDuelOpen(true)}
              className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Open Pre-Match Dice Duel"
            >
              <Dices className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dice Duel</span>
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] p-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span className="font-sans text-[11px]">Log</span>
            </button>
          </div>
        </div>

        {/* BATTLEFIELD CONTAINERS (FIT IN REMAINING HEIGHT) WITH PLAYMAT SKIN BACKGROUND */}
        <div className="flex-1 flex flex-col min-h-0 justify-between py-1 relative overflow-hidden">
          
          {/* Custom Playmat Background Layer */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-20"
            style={{
              backgroundImage: `url(${currentPlaymat.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{ background: currentPlaymat.ambientGlow }}
          />
          
          {/* 1. OPPONENT BATTLEFIELD ZONE */}
          <div className="flex-1 flex flex-col justify-center items-center py-1 border-b border-[#30363d]/40 min-h-0">
            <div className="text-[9px] font-cinzel font-bold text-[#F59E0B]/70 mb-1 uppercase tracking-widest">
              Opponent Battlefield ({opponentFieldCards.length} Cards)
              {matchMode && opponentFieldCards.length === 0 && (
                <span className="text-[#94A3B8] normal-case tracking-normal ml-2">
                  (waiting for opponent's cards...)
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-12 w-full h-full max-h-56">
              {opponentFieldCards.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-[#30363d] rounded-xl w-full h-full min-h-[140px]">
                  <Sword className="w-8 h-8 text-[#94A3B8] mb-2" />
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    {matchMode ? 'Opponent cards will appear here in real-time' : 'No opponent cards'}
                  </span>
                </div>
              )}
              <AnimatePresence>
                {opponentFieldCards.map((card) => {
                  const isOpExerted = opponentExerted[card.id] || false;
                  const isOpWet = card.isWet || false;
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, rotate: isOpExerted ? 90 : 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => selectedAttacker && handleAttackTarget(card)}
                      className={`w-36 h-50 bg-[#141a26] rounded-xl flex items-center justify-center relative overflow-hidden border ${
                        selectedAttacker
                          ? isOpExerted
                            ? 'border-rose-500 cursor-pointer hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'border-slate-700 opacity-60 cursor-not-allowed'
                          : isOpExerted
                          ? 'border-[#F59E0B]/60'
                          : 'border-[#30363d]'
                      }`}
                    >
                      <img
                        src={card.imageUrl || card.img}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-70"
                      />
                      
                      {isOpWet && (
                        <div className="absolute inset-0 bg-[#0B0F19]/70 rounded-xl flex flex-col items-center justify-center pointer-events-none z-20">
                          <Droplets className="w-5 h-5 text-[#F59E0B]" />
                          <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] bg-[#0B0F19] px-1.5 py-0.5 rounded mt-0.5 border border-[#30363d]">
                            Drying...
                          </span>
                        </div>
                      )}

                      <span className={`absolute bottom-1 bg-[#0B0F19]/90 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border z-20 ${
                        isOpWet
                          ? 'text-[#F59E0B] border-[#F59E0B]/40'
                          : isOpExerted
                          ? 'text-[#F59E0B] border-[#30363d]'
                          : 'text-emerald-400 border-emerald-500/40'
                      }`}>
                        {isOpWet ? 'Drying' : isOpExerted ? 'Exerted' : 'Ready'}
                      </span>
                      {selectedAttacker && isOpExerted && (
                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center hover:bg-rose-500/40 transition-colors z-20">
                          <Sword className="w-10 h-10 text-rose-500 drop-shadow-md" />
                        </div>
                      )}
                      {(damage[card.id] || 0) > 0 && (
                        <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold z-30 border-2 border-[#141a26]">
                          -{damage[card.id]}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* 2. PLAYER BATTLEFIELD ZONE */}
          <div className="flex-1 flex flex-col justify-center items-center py-1 relative min-h-0">
            <div className="text-[9px] font-cinzel font-bold text-[#F59E0B] mb-1 uppercase tracking-widest flex items-center gap-2">
              <span>Your Battlefield Area</span>
              <span className="text-[8px] font-mono text-[#94A3B8] font-normal">(Click ⚡ to Quest • Click ⚔️ to Challenge • Auto-Exerts)</span>
            </div>

            {/* ACTIVE DRAG-TO-PLAY DROPZONE HIGHLIGHT */}
            <AnimatePresence>
              {isDraggingCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="absolute inset-x-4 inset-y-1 border-4 border-dashed border-[#F59E0B] bg-[#F59E0B]/20 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none z-30 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                >
                  <ArrowUpCircle className="w-8 h-8 text-[#F59E0B] animate-bounce" />
                  <span className="font-cinzel text-sm font-bold text-[#F59E0B] uppercase tracking-widest">
                    Release Card Here to Play / Ink
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-12 w-full h-full max-h-64">
              {fieldCards.map((card) => {
                const isExerted = exertedCards[card.id] || false;
                const isAttacking = selectedAttacker === card.id;

                const handleCardInteraction = () => {
                  if (card.isWet) {
                    showNotice(`"${card.name}" is drying ink (wet). It cannot Quest or Challenge until your next turn.`, 'warning');
                    return;
                  }
                  if (isExerted) {
                    showNotice(`"${card.name}" is already exerted (exhausted). It will ready at the start of your turn.`, 'warning');
                    return;
                  }
                  if (isAttacking) {
                    setSelectedAttacker(null);
                  } else {
                    setSelectedAttacker(card.id);
                    showNotice(`"${card.name}" selected! Click an exerted opponent character to Challenge, or click ⚡ to Quest.`, 'success');
                  }
                };

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: isExerted ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={handleCardInteraction}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardInteraction();
                      }
                    }}
                    className={`w-40 h-56 rounded-xl relative cursor-pointer transition-colors group card-foil-light ${
                      isAttacking
                        ? 'border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                        : isExerted
                        ? 'border-2 border-[#F59E0B]'
                        : 'border border-[#30363d] hover:border-[#F59E0B]'
                    }`}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#141a26]">
                      <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-1.5 text-center pointer-events-none">
                        <span className="font-cinzel text-[10px] font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                        <span className="text-[8px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                      </div>
                      <img
                        src={card.imageUrl || card.img}
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
                        <Droplets className="w-5 h-5 text-[#F59E0B]" />
                        <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] bg-[#0B0F19] px-1.5 py-0.5 rounded mt-0.5 border border-[#30363d]">
                          Drying...
                        </span>
                      </div>
                    )}

                    {(damage[card.id] || 0) > 0 && (
                      <div className="absolute top-1 left-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold z-30 border-2 border-[#141a26]">
                        -{damage[card.id]}
                      </div>
                    )}

                    {!card.isWet && (
                      <div className="absolute top-1 right-1 flex flex-col gap-1.5 z-30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuest(card);
                          }}
                          disabled={isExerted}
                          aria-label="Quest"
                          className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-1.5 rounded-full transition-colors cursor-pointer font-bold flex items-center justify-center shadow-md"
                          title={isExerted ? "Already exerted (exhausted)" : `Quest for +${card.lore || 1} Lore (Auto-exerts)`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-black" />
                        </button>
                        {opponentFieldCards.length > 0 && !isExerted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedAttacker === card.id) {
                                setSelectedAttacker(null);
                              } else {
                                setSelectedAttacker(card.id);
                                showNotice(`Select an exerted opponent's character to challenge!`, 'warning');
                              }
                            }}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-md ${
                              selectedAttacker === card.id ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-rose-400 hover:bg-rose-500 text-black'
                            }`}
                            title="Challenge Opponent (Auto-exerts upon attack)"
                          >
                            <Sword className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="absolute bottom-1 left-1 right-1 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded border border-[#30363d] flex justify-between items-center text-[9px] font-mono font-bold z-20 text-[#F1F5F9]">
                      <span className="flex items-center gap-0.5"><Sword className="w-2.5 h-2.5 text-[#F59E0B]" />{card.strength}/{card.willpower}</span>
                      <span className="flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5 text-[#F59E0B]" />{card.lore}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PLAYER LORE & PASS TURN CONTROLS BAR (IN-FLOW) */}
        <div className="w-full flex justify-between items-center z-20 py-2 px-4 border border-[#30363d] bg-[#141a26] rounded-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] uppercase tracking-wider">Your Lore Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <motion.span
                  key={playerLore}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="font-cinzel text-xl font-black text-[#F59E0B] leading-none"
                >
                  {playerLore}
                </motion.span>
                <span className="font-cinzel text-xs font-bold text-[#94A3B8]">/ 20</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {turnNumber === 1 && isMyTurn && !hasMulliganed && (
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setIsMulliganPhase(true)}
                 className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
               >
                 <RotateCw className="w-3.5 h-3.5" />
                 <span>{language === 'th' ? 'สลับการ์ด (Mulligan)' : 'Mulligan'}</span>
               </motion.button>
            )}
            {matchMode ? (
              isMyTurn ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={handleEndTurn}
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-6 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <RotateCw className="w-3.5 h-3.5 fill-black" />
                  <span>{t.passTurn}</span>
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2 rounded-xl border border-[#30363d] bg-[#0B0F19] text-[#94A3B8] font-cinzel font-bold text-xs uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                  <span>{t.opponentTurn}...</span>
                </div>
              )
            ) : (
              <>
                {!isMyTurn && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartTurn()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{language === 'th' ? 'เริ่มเทิร์น' : 'Start Turn'}</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={handleEndTurn}
                  disabled={!isMyTurn}
                  className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 fill-black" />
                  <span>{t.passTurn}</span>
                </motion.button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* MULLIGAN OVERLAY MODAL */}
      <AnimatePresence>
        {isMulliganPhase && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0F19]/90 backdrop-blur-sm">
            <h2 className="text-3xl font-cinzel font-bold text-[#F59E0B] mb-2">{t.mulliganTitle}</h2>
            <p className="text-[#94A3B8] mb-8 font-mono">{t.mulliganDesc}</p>
            
            <div className="flex gap-4 mb-12">
              {handCards.map((card) => {
                const isSelected = mulliganSelectedIds.includes(card.id);
                return (
                  <motion.div
                    key={card.id}
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => {
                      if (isSelected) {
                        setMulliganSelectedIds(prev => prev.filter(id => id !== card.id));
                      } else {
                        setMulliganSelectedIds(prev => [...prev, card.id]);
                      }
                    }}
                    whileHover={{ y: -10 }}
                    animate={{ y: isSelected ? -20 : 0 }}
                    className={`w-40 h-56 rounded-xl cursor-pointer border-2 transition-colors overflow-hidden ${
                      isSelected ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' : 'border-[#30363d] hover:border-[#F59E0B]'
                    }`}
                  >
                     <img
                       src={card.imageUrl || card.img}
                       alt={card.name}
                       className="w-full h-full object-cover rounded-xl"
                     />
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsMulliganPhase(false);
                  setHasMulliganed(true);
                  showNotice(language === 'th' ? 'คงการ์ดชุดเดิมบนมือ' : 'Kept original hand', 'success');
                }}
                className="px-6 py-3 rounded-xl border border-[#30363d] text-[#F1F5F9] font-cinzel font-bold hover:bg-[#141a26] transition-colors cursor-pointer"
              >
                {t.keepHand}
              </button>
              <button
                onClick={handleMulliganConfirm}
                className="px-6 py-3 rounded-xl bg-[#F59E0B] text-black font-cinzel font-bold hover:bg-[#D97706] transition-colors cursor-pointer"
              >
                {language === 'th' ? `ยืนยันสลับการ์ด (${mulliganSelectedIds.length})` : `Confirm Mulligan (${mulliganSelectedIds.length})`}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* SPEC 3 — HAND DOCK: HOVER TAB AT BOTTOM (show on hover, hide on leave with padding bridge) */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto"
        onMouseEnter={handleHandMouseEnter}
        onMouseLeave={handleHandMouseLeave}
      >
        {/* Transparent padding bridge to prevent mouse leave gap jitter */}
        <div className="absolute -top-4 inset-x-0 h-4 pointer-events-auto" />

        {/* TAB TOGGLE BUTTON (hover to expand, no click needed) */}
        <button
          onClick={() => setIsHandOpen((prev) => !prev)}
          className="bg-[#141a26] hover:bg-[#1e2638] text-[#F59E0B] border-t border-x border-[#30363d] rounded-t-xl px-6 py-1.5 font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-2xl z-50"
        >
          <span>{language === 'th' ? `การ์ดบนมือ (${handCards.length})` : `Your Hand (${handCards.length})`}</span>
          {isHandOpen ? <ChevronDown className="w-4 h-4 text-[#F59E0B]" /> : <ChevronUp className="w-4 h-4 text-[#F59E0B]" />}
        </button>

        {/* EXPANDABLE HAND TRAY WITH FRAMER MOTION */}
        <AnimatePresence>
          {isHandOpen && (
            <motion.div
              initial={{ y: 240, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 240, opacity: 0, transition: { duration: 0.2, delay: 0.15 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="bg-[#0d1420]/95 backdrop-blur-md border-t border-x border-[#30363d] rounded-t-2xl px-8 pt-2.5 pb-6 flex flex-col items-center max-w-6xl w-max shadow-2xl relative"
            >
              <div className="text-[10px] font-mono text-[#94A3B8] mb-1.5">
                {language === 'th' ? 'ลากการ์ดขึ้นสู่สนาม หรือคลิกการ์ดเพื่อเปิดเมนูคำสั่ง' : 'Drag card up onto battlefield or click for action menu'}
              </div>

              {/* Hand Cards Stack with Spring & Layout Animation */}
              <motion.div layout className="flex items-center justify-center -space-x-3 px-3 py-1 max-w-full overflow-visible">
                {handCards.map((card) => (
                  <motion.div
                    key={card.id}
                    layout
                    role="button"
                    tabIndex={0}
                    drag
                    dragMomentum={false}
                    dragTransition={{ power: 0.1, timeConstant: 200 }}
                    dragElastic={0.3}
                    dragConstraints={{ left: -300, right: 300, top: -600, bottom: 300 }}
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
                    whileHover={{ y: -16, zIndex: 50 }}
                    whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="w-36 h-52 rounded-xl relative cursor-grab active:cursor-grabbing border border-[#30363d] hover:border-[#F59E0B] bg-[#141a26] group card-foil-light shrink-0 shadow-lg"
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                        <span className="font-cinzel text-sm font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                        <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                      </div>
                      <img
                        src={card.imageUrl || card.img}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover rounded-xl relative z-10"
                      />
                    </div>

                    <div className="absolute top-1.5 left-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded border border-[#30363d] text-xs font-mono font-bold text-[#F59E0B] flex items-center gap-1 z-20">
                      <Droplets className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span>{card.cost}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HOVER CARD INSPECTOR TOOLTIP PANEL (VIEWPORT FIXED - BOTTOM RIGHT MARKED AREA, ENLARGED) */}
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 md:right-10 z-[110] w-[420px] max-w-[calc(100vw-2rem)] bg-[#141a26]/95 backdrop-blur-md border border-[#30363d] rounded-2xl p-5 text-[#F1F5F9] flex flex-col gap-3.5 pointer-events-none shadow-[0_16px_50px_rgba(0,0,0,0.9)]"
          >
            <div className="flex gap-3.5 items-center border-b border-[#30363d] pb-3">
              <img
                src={hoveredCard.imageUrl || hoveredCard.img}
                alt={hoveredCard.name}
                referrerPolicy="no-referrer"
                className="w-24 h-34 object-cover rounded-xl border border-[#30363d] shrink-0 shadow-lg"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {hoveredCard.ink && <InkSymbol ink={hoveredCard.ink} size={18} />}
                  <span className="font-cinzel font-bold text-lg text-[#F59E0B] leading-tight truncate">{hoveredCard.name}</span>
                </div>
                <span className="text-[13px] font-mono text-[#94A3B8] mt-0.5">{hoveredCard.title}</span>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono font-bold">
                  <span className="text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d]">{t.cost}: {hoveredCard.cost} Ink</span>
                  {isCardInkable(hoveredCard) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Droplets className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      {t.inkable}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      {language === 'th' ? 'ไม่สามารถใส่ Inkwell ได้' : 'Non-Inkable'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0F19] p-2.5 rounded-xl border border-[#30363d] text-center font-mono text-sm">
              <div>
                <span className="text-[10px] text-[#94A3B8] block font-bold">{t.strength}</span>
                <span className="text-[#F59E0B] font-bold text-base flex items-center justify-center gap-1 mt-0.5">
                  <Sword className="w-4 h-4 text-[#F59E0B]" />
                  {hoveredCard.strength ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block font-bold">{t.willpower}</span>
                <span className="text-[#F59E0B] font-bold text-base flex items-center justify-center gap-1 mt-0.5">
                  <Shield className="w-4 h-4 text-[#F59E0B]" />
                  {hoveredCard.willpower ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block font-bold">{t.lore}</span>
                <span className="text-[#F59E0B] font-bold text-base flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  {hoveredCard.lore ?? '-'}
                </span>
              </div>
            </div>

            {/* Abilities & Text Box */}
            {hoveredCard.abilities && hoveredCard.abilities.length > 0 && (
              <div className="space-y-2 text-[12px] font-mono bg-[#0B0F19] p-3 rounded-xl border border-[#30363d] max-h-40 overflow-y-auto">
                <div className="text-[10px] font-cinzel text-[#F59E0B] font-bold uppercase tracking-wider mb-1">
                  {t.specialAbilities}
                </div>
                {hoveredCard.abilities.map((ab, idx) => (
                  <div key={idx} className="leading-relaxed bg-[#141a26]/70 p-1.5 rounded border border-[#30363d]/50">
                    <span className="font-bold text-xs text-[#F59E0B] tracking-wide">{ab.name}: </span>
                    <span className="text-[#E2E8F0]">
                      {language === 'th' ? translateCardAbilityText(ab.text) : ab.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hoveredCard.flavorText && (
              <div className="text-[12px] font-outfit text-[#94A3B8] italic border-t border-[#30363d] pt-2 leading-relaxed">
                "{hoveredCard.flavorText}"
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
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative bg-[#141a26] border border-[#30363d] rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-3.5 text-center"
            >
              <button
                onClick={() => setDragPendingCard(null)}
                aria-label="Cancel action choice"
                className="absolute top-4 right-4 p-1 bg-[#0B0F19] text-[#94A3B8] hover:text-white rounded border border-[#30363d] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-28 h-42 rounded-xl overflow-hidden border border-[#30363d] relative bg-[#0B0F19]">
                <img
                  src={dragPendingCard.imageUrl || dragPendingCard.img}
                  alt={dragPendingCard.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover relative z-10"
                />
              </div>

              <div className="space-y-0.5">
                <div className="font-cinzel text-sm font-bold text-[#F59E0B]">{dragPendingCard.name}</div>
                <div className="text-[11px] font-mono text-[#94A3B8]">{dragPendingCard.title}</div>
              </div>

              <div className="w-full space-y-2 pt-1">
                {(isCardInkable(dragPendingCard) || !handCards.some(c => isCardInkable(c))) && !hasInkedThisTurn && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    onClick={() => {
                      const card = dragPendingCard;
                      setDragPendingCard(null);
                      handleAddToInkwell(card);
                    }}
                    className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#F59E0B] border border-[#F59E0B]/50 p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{language === 'th' ? 'ใส่เป็นหมึก (+1 Inkwell)' : 'Add to Inkwell (+1 Ink Capacity)'}</span>
                  </motion.button>
                )}

                {availableInk >= dragPendingCard.cost && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    onClick={() => {
                      const card = dragPendingCard;
                      setDragPendingCard(null);
                      handlePlayCard(card);
                    }}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>{language === 'th' ? `ลงสู่สนาม (${dragPendingCard.cost} Ink)` : `Play to Field (${dragPendingCard.cost} Ink)`}</span>
                  </motion.button>
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
          <div className="relative z-10 max-w-sm w-full bg-[#141a26] border border-[#30363d] rounded-xl p-5 flex flex-col items-center gap-3 text-center">
            <button
              onClick={() => setSelectedHandCard(null)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1 bg-[#0B0F19] text-[#94A3B8] hover:text-white rounded border border-[#30363d] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-28 h-42 rounded-xl overflow-hidden border border-[#30363d] relative bg-[#0B0F19]">
              <img
                src={selectedHandCard.imageUrl || selectedHandCard.img}
                alt={selectedHandCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-full h-full object-cover relative z-10"
              />
            </div>

            <div className="space-y-0.5">
              <div className="font-cinzel text-base font-bold text-[#F59E0B]">{selectedHandCard.name}</div>
              <div className="text-[11px] font-mono text-[#94A3B8]">{selectedHandCard.title}</div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              {String(selectedHandCard.type).toLowerCase() === 'action' && 
               (selectedHandCard.subtypes?.map(s=>s.toLowerCase()).includes('song') || selectedHandCard.name.toLowerCase().includes('song')) && (
                <button
                  onClick={() => {
                    const availableSingers = fieldCards.filter(c => !c.isWet && !exertedCards[c.id] && (c.cost || 0) >= selectedHandCard.cost);
                    if (availableSingers.length === 0) {
                      showNotice(language === 'th' ? `ไม่มีตัวละครพร้อมใช้งานที่มี Cost ${selectedHandCard.cost} ขึ้นไปเพื่อร้องเพลงนี้!` : `No ready character with cost ${selectedHandCard.cost} or more to sing this!`, 'warning');
                      return;
                    }
                    const singer = availableSingers[0];
                    toggleExert(singer.id);
                    setHandCards((prev) => prev.filter((c) => c.id !== selectedHandCard.id));
                    setSelectedHandCard(null);
                    setDiscardCount((prev) => prev + 1);
                    setLogMessages((prev) => [language === 'th' ? `คุณร้องเพลง ${selectedHandCard.name} โดยใช้ ${singer.name}!` : `You sang ${selectedHandCard.name} using ${singer.name}!`, ...prev]);
                    showNotice(language === 'th' ? `ร้องเพลง "${selectedHandCard.name}" โดย ${singer.name} สำเร็จ!` : `Sang "${selectedHandCard.name}" using ${singer.name}!`, 'success');
                    resolveAbilities(selectedHandCard);
                  }}
                  disabled={!fieldCards.some(c => !c.isWet && !exertedCards[c.id] && (c.cost || 0) >= selectedHandCard.cost)}
                  className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{language === 'th' ? `ร้องเพลง (Exert Cost ${selectedHandCard.cost}+)` : `Sing (Exert cost ${selectedHandCard.cost}+)`}</span>
                </button>
              )}
              {(isCardInkable(selectedHandCard) || !handCards.some(c => isCardInkable(c))) && (
                <button
                  onClick={() => handleAddToInkwell(selectedHandCard)}
                  disabled={hasInkedThisTurn}
                  className="w-full bg-[#141a26] hover:bg-[#1e2638] disabled:opacity-40 text-[#F59E0B] border border-[#F59E0B]/50 p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>
                    {hasInkedThisTurn
                      ? (language === 'th' ? 'ใส่ Ink ไปแล้วในเทิร์นนี้ (ขีดจำกัด 1/1)' : 'Inked this turn (1/1 Limit)')
                      : (language === 'th' ? 'ใส่เป็นหมึก (+1 Inkwell)' : 'Add to Inkwell (+1 Ink Capacity)')}
                  </span>
                </button>
              )}

              <button
                onClick={() => handlePlayCard(selectedHandCard)}
                disabled={availableInk < selectedHandCard.cost}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>
                  {availableInk < selectedHandCard.cost
                    ? (language === 'th' ? `ต้องการ ${selectedHandCard.cost} Ink (มี ${availableInk})` : `Requires ${selectedHandCard.cost} Ink (Have ${availableInk})`)
                    : (language === 'th' ? `ลงสู่สนาม (${selectedHandCard.cost} Ink)` : `Play to Field (${selectedHandCard.cost} Ink)`)}
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
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-72 border-l border-[#30363d] bg-[#141a26] p-4 flex flex-col justify-between z-30 shrink-0 shadow-xl h-full"
          >
            <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
              <span className="font-cinzel font-bold text-[#F59E0B] text-xs">Match Action Log</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-[#94A3B8] hover:text-white rounded cursor-pointer"
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

      {/* CHAT IN-GAME */}
      {matchMode && (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="mb-4 w-80 h-80 bg-[#0B0F19] border border-[#30363d] rounded-xl flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="bg-[#141a26] border-b border-[#30363d] p-3 flex justify-between items-center shrink-0">
                  <span className="font-cinzel font-bold text-[#F59E0B] text-sm">Match Chat</span>
                  <button onClick={() => setIsChatOpen(false)} className="text-[#94A3B8] hover:text-rose-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.username === 'You' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#94A3B8]">{msg.username}</span>
                        <span className="text-[9px] font-mono text-[#94A3B8]/60">{msg.time}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-sm ${msg.username === 'You' ? 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/30 rounded-br-none' : 'bg-[#141a26] text-[#F1F5F9] border border-[#30363d] rounded-bl-none'}`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    const text = chatInput.trim();
                    webSocketService.sendChat(text, roomId, playerRole);
                    setChatMessages(prev => [...prev, { username: 'You', message: text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                    setChatInput('');
                  }}
                  className="p-3 border-t border-[#30363d] bg-[#141a26] flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#F59E0B]"
                  />
                  <button type="submit" className="bg-[#F59E0B] text-black px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-[#FCD34D] transition-colors">
                    Send
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setUnreadChatCount(0);
            }}
            className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] p-3 rounded-full shadow-lg transition-colors flex items-center justify-center cursor-pointer relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-[#0B0F19]">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* PRE-MATCH DICE DUEL MODAL (ODD/EVEN & TURN ORDER SELECTION) */}
      <DiceDuelModal
        isOpen={isDiceDuelOpen}
        roomId={roomId}
        myRole={playerRole || 'player1'}
        opponentName={playerRole === 'player1' ? 'Challenger' : 'Host'}
        onDuelFinished={handleDuelFinished}
        isSandbox={!matchMode}
      />

      {/* PLAYMAT SKIN SELECTOR MODAL */}
      <PlaymatSelectorModal
        isOpen={isPlaymatModalOpen}
        onClose={() => setIsPlaymatModalOpen(false)}
      />
    </div>
  );
};
