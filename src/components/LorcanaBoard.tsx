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
  Undo2,
  WifiOff,
  BookOpen,
  Crown,
  Trophy,
  HelpCircle,
  Flame,
  Info,
  Pin,
  Eye,
} from 'lucide-react';
import { webSocketService } from '../services/websocket';
import { InkSymbol } from './InkSymbol';
import { Modal } from './ui/Modal';
import { DiceDuelModal } from './DiceDuelModal';
import { PlaymatSelectorModal } from './PlaymatSelectorModal';
import { AbilityNotificationBanner, type AbilityAlert } from './AbilityNotificationBanner';
import { GameOverModal } from './GameOverModal';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { translateCardAbilityText, translateAbilityName, translateCardType, translateInkColor } from '../utils/cardTranslator';

import { fetchCardPool, fetchFullDataset, enrichCard, STARTER_POOL, type PoolCard } from '../data/cardPool';

export type LorcanaCard = PoolCard & { isWet?: boolean };

export interface SavedBoardState {
  playerLore: number;
  opponentLore: number;
  inkwellCapacity: number;
  availableInk: number;
  opponentInk: number;
  opponentInkCapacity: number;
  hasInkedThisTurn: boolean;
  turnNumber: number;
  firstPlayerRole: 'player1' | 'player2';
  isMyTurn: boolean;
  handCards: LorcanaCard[];
  deckCards: LorcanaCard[];
  deckCount: number;
  discardCount: number;
  opponentDeckCount: number;
  opponentDiscardCount: number;
  fieldCards: LorcanaCard[];
  opponentFieldCards: LorcanaCard[];
  exertedCards: Record<string, boolean>;
  opponentExerted: Record<string, boolean>;
  damage: Record<string, number>;
  turnPhase: 'beginning' | 'main' | 'end';
  hasMulliganed: boolean;
  isMulliganPhase: boolean;
  logMessages: string[];
  undoCountRemaining: number;
  timestamp: number;
}

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
  opponentUsername?: string;
  matchMode?: boolean;
  isRejoin?: boolean;
  onExitMatch?: () => void;
}

export const LorcanaBoard: React.FC<LorcanaBoardProps> = ({
  initialDeck,
  roomId,
  playerRole,
  opponentUsername,
  matchMode = false,
  isRejoin = false,
  onExitMatch,
}) => {
  const { user } = useAuthStore();
  const { t, language } = useLanguageStore();
  const { getCurrentPlaymat } = usePlaymatStore();
  const currentPlaymat = getCurrentPlaymat();
  const [isPlaymatModalOpen, setIsPlaymatModalOpen] = useState(false);
  const [isRulesQuickModalOpen, setIsRulesQuickModalOpen] = useState(false);
  const [rulesActiveTab, setRulesActiveTab] = useState<'steps' | 'actions' | 'keywords' | 'win'>('steps');
  const myUsername = user?.username || webSocketService.getUsername() || 'Illumineer';

  // Load saved active board state for this room (if available, recent, and explicitly in isRejoin mode)
  const savedBoard: SavedBoardState | null = React.useMemo(() => {
    if (!roomId || !isRejoin) return null;
    try {
      const raw = localStorage.getItem(`lorcana_board_state_${roomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - (parsed.timestamp || 0) < 7200000) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved board state', e);
    }
    return null;
  }, [roomId, isRejoin]);

  // ==== REAL GAME STATE — restored from saved state on Rejoin or fresh start ====
  const [playerLore, setPlayerLore] = useState<number>(() => (savedBoard ? savedBoard.playerLore ?? 0 : 0));
  const [opponentLore, setOpponentLore] = useState<number>(() => (savedBoard ? savedBoard.opponentLore ?? 0 : 0));
  const [inkwellCapacity, setInkwellCapacity] = useState<number>(() => (savedBoard ? savedBoard.inkwellCapacity ?? 0 : 0));
  const [availableInk, setAvailableInk] = useState<number>(() => (savedBoard ? savedBoard.availableInk ?? 0 : 0));
  const [opponentInk, setOpponentInk] = useState<number>(() => (savedBoard ? savedBoard.opponentInk ?? 0 : 0));
  const [opponentInkCapacity, setOpponentInkCapacity] = useState<number>(() => (savedBoard ? savedBoard.opponentInkCapacity ?? 0 : 0));
  const [hasInkedThisTurn, setHasInkedThisTurn] = useState<boolean>(() => (savedBoard ? savedBoard.hasInkedThisTurn ?? false : false));
  const [turnNumber, setTurnNumber] = useState<number>(() => (savedBoard ? savedBoard.turnNumber ?? 1 : 1));
  const [firstPlayerRole, setFirstPlayerRole] = useState<'player1' | 'player2'>(() => (savedBoard ? savedBoard.firstPlayerRole ?? 'player1' : 'player1'));
  const [isDiceDuelOpen, setIsDiceDuelOpen] = useState<boolean>(() => (isRejoin ? false : matchMode));
  const [isMyTurn, setIsMyTurn] = useState<boolean>(() => {
    if (savedBoard) return savedBoard.isMyTurn ?? (playerRole !== 'player2');
    if (matchMode) return playerRole !== 'player2';
    return true;
  });

  const [opponentName, setOpponentName] = useState<string>(() => {
    if (opponentUsername) return opponentUsername;
    if (playerRole === 'player1') return 'Challenger';
    if (playerRole === 'player2') return 'Host Illumineer';
    return 'Opponent Illumineer';
  });

  const [gameOverData, setGameOverData] = useState<{
    isOpen: boolean;
    isWinner: boolean;
    winnerName: string;
    loserName: string;
    winnerLore: number;
    loserLore: number;
    turnNumber: number;
  } | null>(null);

  // Build initial 60-card deck from initialDeck or standard starter pool
  const [initialFullDeck] = useState<LorcanaCard[]>(() => {
    let deck: LorcanaCard[] = [];
    if (initialDeck && initialDeck.cards && Array.isArray(initialDeck.cards) && initialDeck.cards.length > 0) {
      initialDeck.cards.forEach((c: any) => {
        const count = c.count || 1;
        const cardData = c.card || c;
        const baseId = cardData.cardId || cardData.id || cardData.name || 'card';
        const enriched = enrichCard({ ...cardData, id: baseId, cardId: cardData.cardId || cardData.id });
        for (let i = 0; i < count; i++) {
          const inkableFlag = enriched.inkwell !== undefined ? Boolean(enriched.inkwell) : (enriched.isInkable !== undefined ? Boolean(enriched.isInkable) : true);
          deck.push({
            ...enriched,
            baseCardId: baseId,
            cardId: cardData.cardId || cardData.id,
            inkwell: inkableFlag,
            isInkable: inkableFlag,
            id: `${baseId}-${i}-${Math.random().toString(36).substring(2, 6)}`
          });
        }
      });
    } else {
      for (let i = 0; i < 60; i++) {
        const c = STARTER_POOL[i % STARTER_POOL.length];
        deck.push({
          ...c,
          baseCardId: c.id,
          cardId: c.id,
          id: `${c.id}-${i}-${Math.random().toString(36).substring(2, 6)}`
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  });

  // Deal initial 7 cards to hand, remaining to deckCards (or restore saved hand/deck)
  const [handCards, setHandCards] = useState<LorcanaCard[]>(() => (savedBoard?.handCards && savedBoard.handCards.length > 0 ? savedBoard.handCards : initialFullDeck.slice(0, 7)));
  const [deckCards, setDeckCards] = useState<LorcanaCard[]>(() => (savedBoard?.deckCards ? savedBoard.deckCards : initialFullDeck.slice(7)));
  const [deckCount, setDeckCount] = useState<number>(() => (savedBoard?.deckCount !== undefined ? savedBoard.deckCount : (savedBoard?.deckCards ? savedBoard.deckCards.length : initialFullDeck.length - 7)));
  const [discardCount, setDiscardCount] = useState<number>(() => (savedBoard?.discardCount ?? 0));

  const [opponentDeckCount, setOpponentDeckCount] = useState<number>(() => (savedBoard?.opponentDeckCount ?? 53));
  const [opponentDiscardCount, setOpponentDiscardCount] = useState<number>(() => (savedBoard?.opponentDiscardCount ?? 0));

  const [cardPool, setCardPool] = useState<LorcanaCard[]>([]);
  const [damage, setDamage] = useState<Record<string, number>>(() => (savedBoard?.damage ?? {}));
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [turnPhase, setTurnPhase] = useState<'beginning' | 'main' | 'end'>(() => (savedBoard?.turnPhase ?? 'beginning'));
  const [hasMulliganed, setHasMulliganed] = useState<boolean>(() => (savedBoard?.hasMulliganed ?? (isRejoin ? true : false)));
  const [isMulliganPhase, setIsMulliganPhase] = useState<boolean>(() => (savedBoard ? (savedBoard.isMulliganPhase ?? false) : false));
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

  const handleTriggerGameOver = (
    winner: 'me' | 'opponent',
    explicitData?: { winnerName?: string; loserName?: string; winnerLore?: number; loserLore?: number }
  ) => {
    const isMeWinner = winner === 'me';
    const myName = myUsername;
    const oppName = opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');

    const wName = explicitData?.winnerName || (isMeWinner ? myName : oppName);
    const lName = explicitData?.loserName || (isMeWinner ? oppName : myName);
    const wLore = explicitData?.winnerLore ?? (isMeWinner ? playerLore : opponentLore);
    const lLore = explicitData?.loserLore ?? (isMeWinner ? opponentLore : playerLore);

    setGameOverData({
      isOpen: true,
      isWinner: isMeWinner,
      winnerName: wName,
      loserName: lName,
      winnerLore: Math.max(20, wLore),
      loserLore: lLore,
      turnNumber: turnNumberRef.current,
    });

    if (isMeWinner && matchMode) {
      webSocketService.sendAction('GAME_OVER' as any, {
        roomId: roomId || undefined,
        role: playerRole,
        username: myUsername,
        winnerRole: playerRole,
        winnerName: myName,
        loserRole: playerRole === 'player1' ? 'player2' : 'player1',
        loserName: oppName,
        winnerLore: Math.max(20, wLore),
        loserLore: lLore,
        turnNumber: turnNumberRef.current,
      });
    }
  };

  const resetGameBoard = () => {
    setPlayerLore(0);
    setOpponentLore(0);
    setAvailableInk(0);
    setInkwellCapacity(0);
    setOpponentInk(0);
    setOpponentInkCapacity(0);
    setHasInkedThisTurn(false);
    setTurnNumber(1);
    turnNumberRef.current = 1;
    setFieldCards([]);
    setOpponentFieldCards([]);
    setExertedCards({});
    setOpponentExerted({});
    setDamage({});
    setDiscardCount(0);
    setOpponentDiscardCount(0);

    // Re-deal hand & deck
    const shuffled = [...initialFullDeck].sort(() => Math.random() - 0.5);
    const initialHand = shuffled.slice(0, 7);
    const initialDeckList = shuffled.slice(7);
    deckCardsRef.current = initialDeckList;
    handCardsRef.current = initialHand;
    setHandCards(initialHand);
    setDeckCards(initialDeckList);
    setDeckCount(initialDeckList.length);
    setOpponentDeckCount(53);
    setTurnPhase('beginning');
    setIsMulliganPhase(false);
    setHasMulliganed(false);
    setGameOverData(null);

    if (matchMode) {
      setIsMyTurn(firstPlayerRole === (playerRole || 'player1'));
    } else {
      setIsMyTurn(true);
    }
  };

  const handlePlayAgain = () => {
    resetGameBoard();
    if (matchMode) {
      webSocketService.sendAction('GAME_RESTART' as any, {
        roomId: roomId || undefined,
        role: playerRole,
        username: myUsername,
      });
    }
    showNotice('Starting a new match!', 'success');
  };

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
      setHandCards(prev => {
        const enriched = prev.map(c => enrichCard(c, dataset));
        handCardsRef.current = enriched;
        return enriched;
      });
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

  // CARD HOVER, PINNED INSPECTOR, DRAG & ACTION MODAL STATES
  const [hoveredCard, setHoveredCard] = useState<LorcanaCard | null>(null);
  const [pinnedCard, setPinnedCard] = useState<LorcanaCard | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<LorcanaCard | null>(null);
  const [dragPendingCard, setDragPendingCard] = useState<LorcanaCard | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isDraggingOverInkwell, setIsDraggingOverInkwell] = useState(false);

  // Close pinned card inspector on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pinnedCard) {
        setPinnedCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedCard]);

  const [exertedCards, setExertedCards] = useState<Record<string, boolean>>(() => (savedBoard?.exertedCards ?? {}));

  // ABILITY & COMPLEX EFFECTS NOTIFICATION STATE
  const [abilityAlerts, setAbilityAlerts] = useState<AbilityAlert[]>([]);

  const dismissAbilityAlert = (id: string) => {
    setAbilityAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerAbilityAlert = (
    card: LorcanaCard,
    abilityName: string,
    abilityText: string,
    source: 'player' | 'opponent' = 'player',
    category: 'auto_resolved' | 'keyword' | 'complex_effect' | 'trigger' = 'auto_resolved',
    actionHint?: string
  ) => {
    const newAlert: AbilityAlert = {
      id: `${card.id}-${Date.now()}-${Math.random()}`,
      source,
      cardName: card.name,
      cardTitle: card.title,
      cardImage: card.imageUrl,
      inkColor: card.ink,
      abilityName: translateAbilityName(abilityName || 'Special Ability', abilityText),
      originalText: abilityText,
      thaiText: translateCardAbilityText(abilityText, abilityName),
      category,
      actionHint,
      timestamp: Date.now(),
    };

    setAbilityAlerts((prev) => [newAlert, ...prev.slice(0, 2)]);

    if (source === 'player' && matchModeRef.current) {
      webSocketService.sendAction('ABILITY_TRIGGERED' as any, {
        roomId: roomId || undefined,
        role: playerRoleRef.current,
        cardId: card.id,
        cardName: card.name,
        cardTitle: card.title,
        cardImage: card.imageUrl,
        inkColor: card.ink,
        abilityName: translateAbilityName(abilityName || 'Special Ability', abilityText),
        abilityText: abilityText,
        thaiText: translateCardAbilityText(abilityText, abilityName),
        category,
        actionHint,
        payload: {
          cardName: card.name,
          cardTitle: card.title,
          cardImage: card.imageUrl,
          inkColor: card.ink,
          abilityName: translateAbilityName(abilityName || 'Special Ability', abilityText),
          abilityText: abilityText,
          thaiText: translateCardAbilityText(abilityText, abilityName),
          category,
          actionHint,
        },
      });
    }
  };

  const [logMessages, setLogMessages] = useState<string[]>(() => {
    if (savedBoard?.logMessages && savedBoard.logMessages.length > 0) {
      return [`🔄 Restored active game state (Turn ${savedBoard.turnNumber || 1}). Resuming match...`, ...savedBoard.logMessages];
    }
    if (isRejoin) {
      return [`🔄 Reconnected to match in room ${roomId || ''}. Resuming gameplay...`];
    }
    return ['Match started. Initial 60-card decks shuffled and 7 cards dealt to hand.'];
  });

  // Initial player battlefield cards state
  const [fieldCards, setFieldCards] = useState<LorcanaCard[]>(() => (savedBoard?.fieldCards ?? []));
  
  const [opponentFieldCards, setOpponentFieldCards] = useState<LorcanaCard[]>(() => {
    if (savedBoard?.opponentFieldCards) return savedBoard.opponentFieldCards;
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
  const [opponentExerted, setOpponentExerted] = useState<Record<string, boolean>>(() => (savedBoard?.opponentExerted ?? {}));

  // UNDO / RETURN VOTE SYSTEM STATES
  const [previousSnapshot, setPreviousSnapshot] = useState<any | null>(null);
  const [undoCountRemaining, setUndoCountRemaining] = useState<number>(() => (savedBoard?.undoCountRemaining ?? 2)); // Max 2 undos per match
  const [isUndoPending, setIsUndoPending] = useState(false);
  const [incomingUndoRequest, setIncomingUndoRequest] = useState<{ requesterUsername: string; previousState: any } | null>(null);
  const [undoVoteTimer, setUndoVoteTimer] = useState(15);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-persist board state to localStorage whenever state changes
  React.useEffect(() => {
    if (!matchMode || !roomId) return;
    try {
      const stateToSave: SavedBoardState = {
        playerLore,
        opponentLore,
        inkwellCapacity,
        availableInk,
        opponentInk,
        opponentInkCapacity,
        hasInkedThisTurn,
        turnNumber,
        firstPlayerRole,
        isMyTurn,
        handCards,
        deckCards,
        deckCount,
        discardCount,
        opponentDeckCount,
        opponentDiscardCount,
        fieldCards,
        opponentFieldCards,
        exertedCards,
        opponentExerted,
        damage,
        turnPhase,
        hasMulliganed,
        isMulliganPhase,
        logMessages: logMessages.slice(0, 30),
        undoCountRemaining,
        timestamp: Date.now(),
      };
      localStorage.setItem(`lorcana_board_state_${roomId}`, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to auto-save board state', e);
    }
  }, [
    matchMode,
    roomId,
    playerLore,
    opponentLore,
    inkwellCapacity,
    availableInk,
    opponentInk,
    opponentInkCapacity,
    hasInkedThisTurn,
    turnNumber,
    firstPlayerRole,
    isMyTurn,
    handCards,
    deckCards,
    deckCount,
    discardCount,
    opponentDeckCount,
    opponentDiscardCount,
    fieldCards,
    opponentFieldCards,
    exertedCards,
    opponentExerted,
    damage,
    turnPhase,
    hasMulliganed,
    isMulliganPhase,
    logMessages,
    undoCountRemaining,
  ]);

  // OPPONENT DISCONNECT OVERLAY STATE (60s Grace Period)
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [disconnectCountdown, setDisconnectCountdown] = useState(60);
  const disconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capture game snapshot before an action
  const captureSnapshot = () => {
    setPreviousSnapshot({
      playerLore,
      opponentLore,
      inkwellCapacity,
      availableInk,
      opponentInk,
      opponentInkCapacity,
      hasInkedThisTurn,
      turnNumber,
      isMyTurn,
      handCards: [...handCards],
      deckCards: [...deckCards],
      deckCount,
      discardCount,
      fieldCards: [...fieldCards],
      opponentFieldCards: [...opponentFieldCards],
      exertedCards: { ...exertedCards },
      opponentExerted: { ...opponentExerted },
      damage: { ...damage },
    });
  };

  const handleRequestUndo = () => {
    if (!previousSnapshot) {
      showNotice('No previous action to undo this turn!', 'warning');
      return;
    }
    if (undoCountRemaining <= 0) {
      showNotice('You have reached the maximum undo limit (2 per game)!', 'error');
      return;
    }
    if (!isMyTurn) {
      showNotice('You can only request undo during your turn!', 'warning');
      return;
    }

    setIsUndoPending(true);
    webSocketService.requestUndo(previousSnapshot, roomId);
    showNotice('Sent undo request to opponent (Waiting for vote)...', 'warning');
    setLogMessages(prev => ['You requested to undo the last action. Waiting for opponent vote...', ...prev]);
  };

  const handleRespondUndoVote = (accept: boolean) => {
    if (!incomingUndoRequest) return;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    
    webSocketService.respondUndo(accept, incomingUndoRequest.previousState, roomId);
    if (accept && incomingUndoRequest.previousState) {
      // Restore from opponent perspective (i.e. I am NOT the requester)
      applySnapshot(incomingUndoRequest.previousState, false);
      showNotice('You accepted opponent undo request. Game state restored.', 'success');
      setLogMessages(prev => ['You voted YES to undo. Game rolled back to previous state.', ...prev]);
    } else {
      showNotice('You declined opponent undo request.', 'warning');
      setLogMessages(prev => ['You voted NO to undo request.', ...prev]);
    }
    setIncomingUndoRequest(null);
  };

  const applySnapshot = (snap: any, isRequester: boolean = true) => {
    if (!snap) return;

    if (isRequester) {
      // Full restore for the player who requested undo
      if (snap.playerLore !== undefined) setPlayerLore(snap.playerLore);
      if (snap.opponentLore !== undefined) setOpponentLore(snap.opponentLore);
      if (snap.inkwellCapacity !== undefined) setInkwellCapacity(snap.inkwellCapacity);
      if (snap.availableInk !== undefined) setAvailableInk(snap.availableInk);
      if (snap.opponentInk !== undefined) setOpponentInk(snap.opponentInk);
      if (snap.opponentInkCapacity !== undefined) setOpponentInkCapacity(snap.opponentInkCapacity);
      if (snap.hasInkedThisTurn !== undefined) setHasInkedThisTurn(snap.hasInkedThisTurn);
      if (snap.turnNumber !== undefined) setTurnNumber(snap.turnNumber);
      if (snap.isMyTurn !== undefined) setIsMyTurn(snap.isMyTurn);
      if (snap.handCards) setHandCards(snap.handCards);
      if (snap.deckCards) {
        setDeckCards(snap.deckCards);
        deckCardsRef.current = snap.deckCards;
      }
      if (snap.deckCount !== undefined) setDeckCount(snap.deckCount);
      if (snap.discardCount !== undefined) setDiscardCount(snap.discardCount);
      if (snap.fieldCards) setFieldCards(snap.fieldCards);
      if (snap.opponentFieldCards) setOpponentFieldCards(snap.opponentFieldCards);
      if (snap.exertedCards) setExertedCards(snap.exertedCards);
      if (snap.opponentExerted) setOpponentExerted(snap.opponentExerted);
      if (snap.damage) setDamage(snap.damage);
    } else {
      // Perspective restore for opponent who accepted requester's undo
      if (snap.playerLore !== undefined) setOpponentLore(snap.playerLore);
      if (snap.opponentLore !== undefined) setPlayerLore(snap.opponentLore);
      if (snap.availableInk !== undefined) setOpponentInk(snap.availableInk);
      if (snap.inkwellCapacity !== undefined) setOpponentInkCapacity(snap.inkwellCapacity);
      if (snap.fieldCards) setOpponentFieldCards(snap.fieldCards);
      if (snap.exertedCards) setOpponentExerted(snap.exertedCards);
      if (snap.damage) setDamage(snap.damage);
    }
  };

  // Sync service params on mount / changes
  React.useEffect(() => {
    if (roomId) {
      webSocketService.setRoomId(roomId);
      setActiveRoomId(roomId);
    }
    if (playerRole) {
      webSocketService.setRole(playerRole);
      if (matchMode && !isRejoin) {
        setIsMyTurn(playerRole === 'player1');
      }
    }
    if (user?.username) {
      webSocketService.setUsername(user.username);
    }

    // If mounting as Rejoin or Match, broadcast active state & request sync immediately
    if (matchMode && roomId) {
      setTimeout(() => {
        webSocketService.sendAction('PLAYER_RECONNECTED' as any, {
          roomId,
          role: playerRole,
          username: myUsername,
          isSelf: false,
        });
        webSocketService.sendAction('REQUEST_STATE_SYNC' as any, {
          roomId,
          role: playerRole,
          username: myUsername,
        });
      }, 200);
    }
  }, [roomId, playerRole, matchMode, user, isRejoin, myUsername]);

  React.useEffect(() => {
    if (!matchMode) return;

    const markOpponentActive = (username?: string) => {
      setIsOpponentDisconnected(false);
      if (disconnectTimerRef.current) {
        clearInterval(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      if (username && username !== myUsername) {
        setOpponentName(username);
      }
    };

    const checkFromMe = (data: any) => {
      if (data.role && playerRole && data.role === playerRole) return true;
      if (data.username && myUsername && data.username === myUsername) return true;
      return false;
    };

    const unsubMoved = webSocketService.subscribe('CARD_MOVED', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const card = p.card || data.card;
      if ((p.zone === 'field' || data.zone === 'field') && card) {
        const oppCard = { ...card, isWet: card.isWet !== undefined ? card.isWet : true };
        setOpponentFieldCards((prev) => {
          if (!prev.find(c => c.id === oppCard.id)) {
            return [...prev, oppCard];
          }
          return prev;
        });
        const availInk = p.availableInk !== undefined ? p.availableInk : data.availableInk;
        if (availInk !== undefined) {
          setOpponentInk(availInk);
        }
        setLogMessages(prev => [`Opponent played Character: ${oppCard.name}! (Ink drying...)`, ...prev]);
      }
    });

    const unsubActionPlayed = webSocketService.subscribe('ACTION_PLAYED', (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const availInk = p.availableInk !== undefined ? p.availableInk : data.availableInk;
      if (availInk !== undefined) {
        setOpponentInk(availInk);
      }
      setOpponentDiscardCount(prev => prev + 1);
      const cName = p.cardName || p.card?.name || data.cardName || 'Action/Song';
      const cType = p.cardType || 'Action';
      setLogMessages(prev => [`Opponent cast ${cType}: ${cName}! (Sent to Discard)`, ...prev]);
      showNotice(`Opponent cast "${cName}"!`, 'warning');
    });

    const unsubAbility = webSocketService.subscribe('ABILITY_TRIGGERED' as any, (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const cName = p.cardName || data.cardName || 'Card';
      const cTitle = p.cardTitle || data.cardTitle;
      const cImg = p.cardImage || data.cardImage;
      const ink = p.inkColor || data.inkColor;
      const abName = p.abilityName || data.abilityName || 'Special Ability';
      const abText = p.abilityText || data.abilityText || '';
      const thText = p.thaiText || data.thaiText || translateCardAbilityText(abText, abName);
      const cat = p.category || data.category || 'trigger';
      const hint = p.actionHint || data.actionHint;

      const newAlert: AbilityAlert = {
        id: `opp-${Date.now()}-${Math.random()}`,
        source: 'opponent',
        cardName: cName,
        cardTitle: cTitle,
        cardImage: cImg,
        inkColor: ink,
        abilityName: abName,
        originalText: abText,
        thaiText: thText,
        category: cat,
        actionHint: hint ? `⚡ คู่แข่ง: ${hint}` : undefined,
        timestamp: Date.now(),
      };

      setAbilityAlerts((prev) => [newAlert, ...prev.slice(0, 2)]);
      setLogMessages((prev) => [`[⚡ Opponent Ability: ${abName}] ${cName} triggered!`, ...prev]);
    });

    const unsubExerted = webSocketService.subscribe('CARD_EXERTED', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (data.cardId) {
        setOpponentExerted((prev) => ({ ...prev, [data.cardId!]: !!data.isExerted }));
      }
    });

    const unsubInk = webSocketService.subscribe('INK_PLAYED', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      setLogMessages((prev) => [`Opponent added a card to Inkwell.`, ...prev]);
      const p = data.payload || data;
      const inkCap = p.inkCount !== undefined ? p.inkCount : (p.inkwellCapacity !== undefined ? p.inkwellCapacity : data.inkCount);
      const inkAvail = p.availableInk !== undefined ? p.availableInk : data.availableInk;
      if (inkCap !== undefined) {
        setOpponentInkCapacity(inkCap);
      }
      if (inkAvail !== undefined) {
        setOpponentInk(inkAvail);
      }
    });

    const unsubLore = webSocketService.subscribe('LORE_UPDATED', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (data.loreScore !== undefined) {
        setOpponentLore(data.loreScore);
        if (data.loreScore >= 20) {
          const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
          showNotice(`DEFEAT! ${opp} reached 20 Lore and won the match.`, 'error');
          setGameOverData({
            isOpen: true,
            isWinner: false,
            winnerName: opp,
            loserName: myUsername,
            winnerLore: data.loreScore,
            loserLore: playerLore,
            turnNumber: turnNumberRef.current,
          });
        }
      }
    });

    const unsubQuest = webSocketService.subscribe('QUEST_DONE', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (data.loreScore !== undefined) {
        setOpponentLore(data.loreScore);
        if (data.cardId) {
          setOpponentExerted((prev) => ({ ...prev, [data.cardId!]: true }));
        }
        if (data.loreScore >= 20) {
          const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
          showNotice(`DEFEAT! ${opp} reached 20 Lore and won the match.`, 'error');
          setGameOverData({
            isOpen: true,
            isWinner: false,
            winnerName: opp,
            loserName: myUsername,
            winnerLore: data.loreScore,
            loserLore: playerLore,
            turnNumber: turnNumberRef.current,
          });
        }
      }
    });

    const unsubGameOver = webSocketService.subscribe('GAME_OVER' as any, (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const isMeWinner = (p.winnerRole && p.winnerRole === playerRole) || (p.winnerName && p.winnerName === myUsername);
      const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
      const wName = p.winnerName || (isMeWinner ? myUsername : opp);
      const lName = p.loserName || (isMeWinner ? opp : myUsername);
      const wLore = p.winnerLore || 20;
      const lLore = p.loserLore !== undefined ? p.loserLore : (isMeWinner ? opponentLore : playerLore);

      setGameOverData({
        isOpen: true,
        isWinner: isMeWinner,
        winnerName: wName,
        loserName: lName,
        winnerLore: wLore,
        loserLore: lLore,
        turnNumber: p.turnNumber || turnNumberRef.current,
      });

      if (isMeWinner) {
        showNotice(`VICTORY! You reached 20 Lore and won the match!`, 'success');
      } else {
        showNotice(`DEFEAT! ${wName} reached 20 Lore and won the match.`, 'error');
      }
    });

    const unsubMatchFinished = webSocketService.subscribe('MATCH_FINISHED' as any, (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const isMeWinner = (p.winnerRole && p.winnerRole === playerRole) || (p.winnerName && p.winnerName === myUsername);
      const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
      const wName = p.winnerName || (isMeWinner ? myUsername : opp);
      const lName = p.loserName || (isMeWinner ? opp : myUsername);
      const wLore = p.winnerLore || 20;
      const lLore = p.loserLore !== undefined ? p.loserLore : (isMeWinner ? opponentLore : playerLore);

      setGameOverData({
        isOpen: true,
        isWinner: isMeWinner,
        winnerName: wName,
        loserName: lName,
        winnerLore: wLore,
        loserLore: lLore,
        turnNumber: p.turnNumber || turnNumberRef.current,
      });
    });

    const unsubRestart = webSocketService.subscribe('GAME_RESTART' as any, () => {
      resetGameBoard();
      showNotice('Match restarted! A new game has begun.', 'success');
    });

    const unsubPassed = webSocketService.subscribe('TURN_PASSED', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      setLogMessages(prev => [`Opponent ended their turn.`, ...prev]);
      // Opponent's cards that were played on their turn will dry up and ready
      setOpponentFieldCards(prev => prev.map(c => ({ ...c, isWet: false })));
      
      const p = data.payload || data;
      if (p.senderInk !== undefined || data.senderInk !== undefined) {
        setOpponentInk(p.senderInk !== undefined ? p.senderInk : data.senderInk);
      }
      if (p.senderInkCapacity !== undefined || data.senderInkCapacity !== undefined) {
        setOpponentInkCapacity(p.senderInkCapacity !== undefined ? p.senderInkCapacity : data.senderInkCapacity);
      }
      if (p.senderLore !== undefined || data.senderLore !== undefined) {
        setOpponentLore(p.senderLore !== undefined ? p.senderLore : data.senderLore);
      }
      if (p.senderExerted || data.senderExerted) {
        setOpponentExerted(p.senderExerted || data.senderExerted);
      }
      if (p.senderFieldCards || data.senderFieldCards) {
        setOpponentFieldCards(p.senderFieldCards || data.senderFieldCards);
      }
      // Use the turn number from the sender so both players see the SAME turn
      handleStartTurn(data.turnNumber || p.turnNumber);
    });

    const unsubChallenge = webSocketService.subscribe('CHALLENGE_DONE', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
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

    const unsubDisconnect = webSocketService.subscribe('OPPONENT_DISCONNECTED', (data: any) => {
      if (checkFromMe(data)) return;
      showNotice('Opponent disconnected! Grace period started (60s)...', 'warning');
      setIsOpponentDisconnected(true);
      setDisconnectCountdown(60);

      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      disconnectTimerRef.current = setInterval(() => {
        setDisconnectCountdown((prev) => {
          if (prev <= 1) {
            if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // Opponent pressed Exit Match (voluntary leave) — no grace period, room slot freed
    const unsubLeft = webSocketService.subscribe('OPPONENT_LEFT' as any, (data: any) => {
      if (checkFromMe(data)) return;
      showNotice(`${data.username || 'Opponent'} left the match.`, 'warning');
      setIsOpponentDisconnected(false);
      setDisconnectCountdown(0);
      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      setLogMessages(prev => [`${data.username || 'Opponent'} exited the match.`, ...prev]);
    });

    const unsubReconnected = webSocketService.subscribe('PLAYER_RECONNECTED', (data: any) => {
      markOpponentActive(data.username);
      if (!data.isSelf) {
        showNotice(`🎉 ${data.username || 'Opponent'} reconnected to the match!`, 'success');
        setLogMessages(prev => [`Opponent reconnected to the room. Match resumed.`, ...prev]);

        // Send current full match state so rejoining opponent gets updated instantly
        const isP1 = playerRole === 'player1';
        webSocketService.sendAction('STATE_SYNC_RESPONSE' as any, {
          roomId,
          role: playerRole,
          username: myUsername,
          payload: {
            loreP1: isP1 ? playerLore : opponentLore,
            loreP2: isP1 ? opponentLore : playerLore,
            inkP1: isP1 ? availableInk : opponentInk,
            inkP2: isP1 ? opponentInk : availableInk,
            inkCapP1: isP1 ? inkwellCapacity : opponentInkCapacity,
            inkCapP2: isP1 ? opponentInkCapacity : inkwellCapacity,
            turnNumber: turnNumberRef.current,
            isTurnP1: isP1 ? isMyTurn : !isMyTurn,
            p1FieldCards: isP1 ? fieldCards : opponentFieldCards,
            p2FieldCards: isP1 ? opponentFieldCards : fieldCards,
            damage: damage,
            p1Exerted: isP1 ? exertedCards : opponentExerted,
            p2Exerted: isP1 ? opponentExerted : exertedCards,
          },
        });
      }
    });

    // Request State Sync (When a rejoining player asks for current board status)
    const unsubSyncRequest = webSocketService.subscribe('REQUEST_STATE_SYNC', (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const isP1 = playerRole === 'player1';
      webSocketService.sendAction('STATE_SYNC_RESPONSE' as any, {
        roomId,
        role: playerRole,
        username: myUsername,
        payload: {
          loreP1: isP1 ? playerLore : opponentLore,
          loreP2: isP1 ? opponentLore : playerLore,
          inkP1: isP1 ? availableInk : opponentInk,
          inkP2: isP1 ? opponentInk : availableInk,
          inkCapP1: isP1 ? inkwellCapacity : opponentInkCapacity,
          inkCapP2: isP1 ? opponentInkCapacity : inkwellCapacity,
          turnNumber: turnNumberRef.current,
          isTurnP1: isP1 ? isMyTurn : !isMyTurn,
          p1FieldCards: isP1 ? fieldCards : opponentFieldCards,
          p2FieldCards: isP1 ? opponentFieldCards : fieldCards,
          damage: damage,
          p1Exerted: isP1 ? exertedCards : opponentExerted,
          p2Exerted: isP1 ? opponentExerted : exertedCards,
        },
      });
    });

    // State Sync Response (Apply full board status from active peer)
    const unsubSyncResponse = webSocketService.subscribe('STATE_SYNC_RESPONSE', (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      if (p) {
        const isP1 = playerRole === 'player1';
        if (p.loreP1 !== undefined && p.loreP2 !== undefined) {
          const myL = isP1 ? (p.loreP1 ?? 0) : (p.loreP2 ?? 0);
          const oppL = isP1 ? (p.loreP2 ?? 0) : (p.loreP1 ?? 0);
          setPlayerLore(myL);
          setOpponentLore(oppL);
        }
        if (p.inkP1 !== undefined && p.inkP2 !== undefined) {
          const myI = isP1 ? (p.inkP1 ?? 0) : (p.inkP2 ?? 0);
          const oppI = isP1 ? (p.inkP2 ?? 0) : (p.inkP1 ?? 0);
          const myCap = isP1 ? (p.inkCapP1 ?? 0) : (p.inkCapP2 ?? 0);
          const oppCap = isP1 ? (p.inkCapP2 ?? 0) : (p.inkCapP1 ?? 0);
          setAvailableInk(myI);
          setInkwellCapacity(myCap);
          setOpponentInk(oppI);
          setOpponentInkCapacity(oppCap);
        }
        if (p.turnNumber !== undefined) {
          setTurnNumber(p.turnNumber);
          turnNumberRef.current = p.turnNumber;
        }
        if (p.isTurnP1 !== undefined) {
          setIsMyTurn(isP1 ? p.isTurnP1 : !p.isTurnP1);
        }
        const oppF = isP1 ? (p.p2FieldCards || p.fieldCards) : (p.p1FieldCards || p.opponentFieldCards || p.fieldCards);
        const myF = isP1 ? (p.p1FieldCards || p.opponentFieldCards) : (p.p2FieldCards || p.fieldCards);
        if (oppF && Array.isArray(oppF)) {
          setOpponentFieldCards(oppF);
        }
        if (myF && Array.isArray(myF) && myF.length > 0 && (!fieldCards || fieldCards.length === 0)) {
          setFieldCards(myF);
        }
        if (p.damage) {
          setDamage(prev => ({ ...prev, ...p.damage }));
        }
        const oppEx = isP1 ? (p.p2Exerted || p.exertedCards) : (p.p1Exerted || p.opponentExerted || p.exertedCards);
        if (oppEx) {
          setOpponentExerted(prev => ({ ...prev, ...oppEx }));
        }
        showNotice('Game state synced with match server.', 'success');
      }
    });

    // Undo requested by opponent (Supports UNDO_REQUESTED & REQUEST_UNDO)
    const handleUndoRequestedEvent = (data: any) => {
      const p = data.payload || data;
      const fromUsername = p.requesterUsername || p.username || data.username || data.requesterUsername;
      const fromRole = p.requesterRole || p.role || data.role || data.requesterRole;
      
      // If sent from self, ignore
      if ((fromUsername && myUsername && fromUsername === myUsername) || (fromRole && playerRole && fromRole === playerRole)) {
        return;
      }

      markOpponentActive(fromUsername);
      setIncomingUndoRequest({
        requesterUsername: fromUsername || 'Opponent',
        previousState: p.previousState || data.previousState,
      });
      setUndoVoteTimer(15);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      undoTimerRef.current = setInterval(() => {
        setUndoVoteTimer((prev) => {
          if (prev <= 1) {
            if (undoTimerRef.current) clearInterval(undoTimerRef.current);
            // Auto decline on timer expiry
            handleRespondUndoVote(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const unsubUndoRequested = webSocketService.subscribe('UNDO_REQUESTED', handleUndoRequestedEvent);
    const unsubRequestUndo = webSocketService.subscribe('REQUEST_UNDO', handleUndoRequestedEvent);

    // Undo resolved by opponent (Supports UNDO_RESOLVED & RESPOND_UNDO)
    const handleUndoResolvedEvent = (data: any) => {
      const p = data.payload || data;
      const fromUser = p.respondedBy || p.username || data.username;
      markOpponentActive(fromUser);
      setIsUndoPending(false);

      const isAccepted = p.voteAccepted === true || data.voteAccepted === true;
      const stateToRestore = p.previousState || data.previousState;

      if (isAccepted) {
        if (stateToRestore) {
          applySnapshot(stateToRestore, true);
        }
        setUndoCountRemaining(prev => Math.max(0, prev - 1));
        showNotice('Opponent accepted your undo request! Action reverted.', 'success');
        setLogMessages(prev => [`Undo request ACCEPTED by opponent. Turn action rolled back.`, ...prev]);
      } else {
        showNotice('Opponent declined your undo request.', 'error');
        setLogMessages(prev => [`Undo request DECLINED by opponent.`, ...prev]);
      }
    };

    const unsubUndoResolved = webSocketService.subscribe('UNDO_RESOLVED', handleUndoResolvedEvent);
    const unsubRespondUndo = webSocketService.subscribe('RESPOND_UNDO', handleUndoResolvedEvent);

    const unsubDrawn = webSocketService.subscribe('CARD_DRAWN', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (data.deckCount !== undefined) {
        setOpponentDeckCount(data.deckCount);
      } else {
        setOpponentDeckCount((prev) => Math.max(0, prev - 1));
      }
      setLogMessages((prev) => [`Opponent drew a card from their deck.`, ...prev]);
    });

    const unsubChat = webSocketService.subscribe('CHAT_MESSAGE', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (data.message && data.username) {
        setChatMessages(prev => [...prev, { username: data.username!, message: data.message!, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setUnreadChatCount(prev => prev + 1);
        showNotice(`💬 ${data.username}: ${data.message}`, 'warning');
      }
    });

    // Catch-all subscriber: Any message from opponent clears disconnected overlay
    const unsubAll = webSocketService.subscribe('all', (data: any) => {
      if (!checkFromMe(data) && data.action !== 'OPPONENT_DISCONNECTED' && data.gameAction !== 'OPPONENT_DISCONNECTED') {
        markOpponentActive(data.username);
      }
    });

    // Handle INITIAL SYNC on GAME_START/ROOM_STATE
    const unsubGameStart = webSocketService.subscribe('GAME_START', () => {
      markOpponentActive();
      if (!isRejoin && !savedBoard) {
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
      }
    });

    const unsubRoomState = webSocketService.subscribe('ROOM_STATE', (data: any) => {
      markOpponentActive(data.username);
      if (data?.payload) {
        const p = data.payload;
        if (p.loreP1 !== undefined || p.loreP2 !== undefined) {
          const myLore = playerRole === 'player1' ? (p.loreP1 || 0) : (p.loreP2 || 0);
          const oppLore = playerRole === 'player1' ? (p.loreP2 || 0) : (p.loreP1 || 0);
          const myInk = playerRole === 'player1' ? (p.inkP1 || 0) : (p.inkP2 || 0);
          const oppInk = playerRole === 'player1' ? (p.inkP2 || 0) : (p.inkP1 || 0);
          setPlayerLore(myLore);
          setOpponentLore(oppLore);
          setAvailableInk(myInk);
          setInkwellCapacity(myInk);
          setOpponentInk(oppInk);
          setOpponentInkCapacity(oppInk);
          return;
        }
      }
      if (!isRejoin && !savedBoard) {
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
      }
    });

    return () => {
      unsubMoved();
      unsubActionPlayed();
      unsubAbility();
      unsubExerted();
      unsubInk();
      unsubLore();
      unsubQuest();
      unsubPassed();
      unsubChallenge();
      unsubDisconnect();
      unsubLeft();
      unsubReconnected();
      unsubSyncRequest();
      unsubSyncResponse();
      unsubUndoRequested();
      unsubRequestUndo();
      unsubUndoResolved();
      unsubRespondUndo();
      unsubDrawn();
      unsubChat();
      unsubAll();
      unsubGameStart();
      unsubRoomState();
      unsubGameOver();
      unsubMatchFinished();
      unsubRestart();
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
    };
  }, [matchMode, playerRole, myUsername, roomId, isRejoin, playerLore, opponentLore, availableInk, opponentInk, inkwellCapacity, opponentInkCapacity, isMyTurn, fieldCards, opponentFieldCards]);

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

    captureSnapshot();
    
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
      captureSnapshot();
      const loreGain = card.lore || 1;
      setExertedCards((prev) => ({ ...prev, [card.id]: true }));
      webSocketService.sendAction('CARD_EXERTED', { roomId: roomId || undefined, role: playerRole, cardId: card.id, isExerted: true });

      setPlayerLore((prev) => {
        const next = Math.min(20, prev + loreGain);
        webSocketService.sendAction('LORE_UPDATED', { roomId: roomId || undefined, role: playerRole, loreScore: next });
        webSocketService.sendAction('QUEST_DONE', { roomId: roomId || undefined, role: playerRole, cardId: card.id, loreScore: next });
        if (next >= 20) {
          showNotice(`VICTORY! You reached 20 Lore and won the Illumineer match!`, 'success');
          handleTriggerGameOver('me', { winnerLore: next, loserLore: opponentLore });
        }
        return next;
      });
      setLogMessages((prev) => [`You exerted ${card.name} for ${loreGain} Lore!`, ...prev]);
      showNotice(`${card.name} Quested for +${loreGain} Lore!`, 'success');

      // Check quest-triggered abilities & Support keyword
      const qAbilities = (card.abilities || []).filter(a => /whenever this character quests/i.test(a.text) || /support/i.test(a.name) || /support/i.test(a.text));
      if (qAbilities.length > 0) {
        qAbilities.forEach(ab => {
          triggerAbilityAlert(card, ab.name, ab.text, 'player', 'trigger', '💡 ความสามารถเมื่อทำ Quest ถูกเปิดใช้งาน!');
        });
      }
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

    captureSnapshot();

    const newCap = inkwellCapacity + 1;
    const newAvail = availableInk + 1;
    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setInkwellCapacity(newCap);
    setAvailableInk(newAvail);
    setHasInkedThisTurn(true);
    setSelectedHandCard(null);

    webSocketService.sendAction('INK_PLAYED', { 
      roomId: roomId || undefined,
      role: playerRole,
      cardId: card.id,
      inkCount: newCap,
      availableInk: newAvail,
      payload: {
        cardId: card.id,
        inkCount: newCap,
        availableInk: newAvail,
      }
    });
    setLogMessages((prev) => [`You converted ${card.name} into Inkwell! (Capacity: ${newCap})`, ...prev]);
    showNotice(`Converted "${card.name}" into Inkwell! (+1 Ink Capacity)`, 'success');
    return true;
  };

  const resolveAbilities = (card: LorcanaCard) => {
    const fullDesc = `${card.name} ${(card.abilities || []).map(a => `${a.name} ${a.text}`).join(' ')}`.toLowerCase();

    // 1. KEYWORD NOTIFICATIONS (Trigger visual cue when playing cards with active keywords)
    if (fullDesc.includes('rush') && !card.abilities?.some(a => a.name.toLowerCase().includes('rush'))) {
      triggerAbilityAlert(card, 'Rush (จู่โจมทันที)', 'This character can challenge the turn they\'re played.', 'player', 'keyword', '💡 สามารถสั่ง Challenge โจมตีตัวละครฝ่ายตรงข้ามที่ Exerted ได้ทันทีในเทิร์นนี้');
    }
    if (fullDesc.includes('bodyguard') && !card.abilities?.some(a => a.name.toLowerCase().includes('bodyguard'))) {
      triggerAbilityAlert(card, 'Bodyguard (ผู้คุ้มกัน)', 'An opposing character who challenges must choose a character with Bodyguard if able.', 'player', 'keyword', '💡 คู่แข่งถูกบังคับให้ต้องเลือกโจมตีตัวละครที่มี Bodyguard ก่อนตัวอื่น');
    }
    if (fullDesc.includes('ward') && !card.abilities?.some(a => a.name.toLowerCase().includes('ward'))) {
      triggerAbilityAlert(card, 'Ward (ม่านคุ้มครอง)', 'Opponents can\'t choose this character except to challenge.', 'player', 'keyword', '💡 คู่แข่งไม่สามารถเลือกการ์ดนี้เป็นเป้าหมายของเวทมนตร์หรือความสามารถได้');
    }
    if (fullDesc.includes('evasive') && !card.abilities?.some(a => a.name.toLowerCase().includes('evasive'))) {
      triggerAbilityAlert(card, 'Evasive (หลบหลีก)', 'Only characters with Evasive can challenge this character.', 'player', 'keyword', '💡 เฉพาะตัวละครที่มี Evasive เท่านั้นที่จะ Challenge ตัวนี้ได้');
    }
    const singerMatch = fullDesc.match(/singer (\d+)/);
    if (singerMatch) {
      triggerAbilityAlert(card, `Singer ${singerMatch[1]} (นักร้องระดับสูง)`, `This character counts as cost ${singerMatch[1]} to sing songs.`, 'player', 'keyword', `💡 ตัวละครนี้นับเป็น Cost ${singerMatch[1]} สำหรับการร้องเพลง Song ได้ฟรี`);
    }
    const shiftMatch = fullDesc.match(/shift (\d+)/);
    if (shiftMatch) {
      triggerAbilityAlert(card, `Shift ${shiftMatch[1]} (วิวัฒนาการร่าง)`, `You may pay ${shiftMatch[1]} Ink to play this on top of one of your characters named ${card.name}.`, 'player', 'keyword', `💡 สามารถจ่าย ${shiftMatch[1]} Ink เพื่อลงทับตัวละครชื่อเดียวกันในสนาม`);
    }

    if (!card.abilities || !Array.isArray(card.abilities)) return;

    card.abilities.forEach(ability => {
      const text = (ability.text || '').toLowerCase();
      let isAutoResolved = false;
      let hint: string | undefined = undefined;

      // Draw card ability (e.g. "draw a card", "draw 2 cards")
      const drawMatch = text.match(/draw (\d+) cards/);
      if (drawMatch) {
        const count = parseInt(drawMatch[1]);
        for (let i = 0; i < count; i++) {
          handleDrawCard();
        }
        setLogMessages(logs => [`[Ability: ${ability.name}] Drew ${count} cards!`, ...logs]);
        isAutoResolved = true;
        hint = `จั่วการ์ด ${count} ใบเข้ามือเรียบร้อยแล้ว`;
      } else if (/draw a card/.test(text)) {
        handleDrawCard();
        setLogMessages(logs => [`[Ability: ${ability.name}] Drew 1 card!`, ...logs]);
        isAutoResolved = true;
        hint = 'จั่วการ์ด 1 ใบเข้ามือเรียบร้อยแล้ว';
      }

      // Gain lore
      const loreMatch = text.match(/gain (\d+) lore/);
      if (loreMatch) {
        const gain = parseInt(loreMatch[1]);
        setPlayerLore(prev => {
          const next = Math.min(20, prev + gain);
          webSocketService.sendAction('LORE_UPDATED', { roomId: roomId || undefined, role: playerRole, loreScore: next });
          if (next >= 20) {
            showNotice(`VICTORY! You reached 20 Lore and won the Illumineer match!`, 'success');
            handleTriggerGameOver('me', { winnerLore: next, loserLore: opponentLore });
          }
          return next;
        });
        setLogMessages(logs => [`[Ability: ${ability.name}] Gained ${gain} Lore!`, ...logs]);
        isAutoResolved = true;
        hint = `เพิ่มคะแนน Lore +${gain} แต้มทันที`;
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
        isAutoResolved = true;
        hint = 'ทำลายตัวละครฝ่ายตรงข้ามลงสุสานทันที';
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
        isAutoResolved = true;
        hint = `สร้างความเสียหายหมู่ ${dmg} Damage ให้ตัวละครฝ่ายตรงข้ามทุกคน`;
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
        isAutoResolved = true;
        hint = `หมุน Exert ตัวละครฝ่ายตรงข้าม ${count} ตัวเรียบร้อยแล้ว`;
      }

      // Complex Effects / Actionable Prompts
      let category: 'auto_resolved' | 'keyword' | 'complex_effect' | 'trigger' = isAutoResolved ? 'auto_resolved' : 'trigger';
      if (!isAutoResolved) {
        if (/look at the top (\d+) cards/i.test(text) || /look at the top card/i.test(text)) {
          category = 'complex_effect';
          hint = '💡 ความสามารถเปิดดูการ์ดบนสุดของกอง: คุณสามารถคลิกดูเด็คเพื่อหยิบการ์ดขึ้นมือตามเงื่อนไข';
        } else if (/return (chosen|another) character (to your hand|to their player's hand)/i.test(text) || /bounce/i.test(text)) {
          category = 'complex_effect';
          hint = '💡 ความสามารถ Bounce: เลือกนำตัวละครกลับขึ้นมือเพื่อรับผลคอมโบ';
        } else if (/banish chosen item/i.test(text) || /banish an item/i.test(text)) {
          category = 'complex_effect';
          hint = '💡 ความสามารถ Item Sacrifice: เลือก Banish ไอเทมเพื่อจั่วการ์ดหรือสร้างเอฟเฟกต์';
        } else if (/sing together/i.test(text)) {
          category = 'complex_effect';
          hint = '💡 Sing Together: คุณสามารถเลือก Exert ตัวละครหลายตัวรวมกันเพื่อร้องเพลงนี้ได้ฟรี';
        }
      }

      triggerAbilityAlert(card, ability.name, ability.text, 'player', category, hint);
    });
  };

  // Play Card to Battlefield or Discard
  const handlePlayCard = (card: LorcanaCard) => {
    if (availableInk < card.cost) {
      showNotice(`Not enough Inkwell! Requires ${card.cost} Ink, but you have ${availableInk} ready.`, 'warning');
      return false;
    }

    captureSnapshot();

    // Deduct Ink
    const nextAvailInk = availableInk - card.cost;
    setAvailableInk(nextAvailInk);
    setHandCards((prev) => prev.filter((c) => c.id !== card.id));
    setSelectedHandCard(null);

    const cardType = String(card.type).toLowerCase();
    if (cardType === 'action' || cardType === 'song') {
      // Actions/Songs go to Discard pile
      setDiscardCount((prev) => prev + 1);
      setLogMessages((prev) => [`You played ${card.type.toUpperCase()}: ${card.name}! (Sent to Discard Pile)`, ...prev]);
      showNotice(`Cast Action "${card.name}"! (${card.cost} Ink used, sent to Discard)`, 'success');
      if (matchModeRef.current) {
        webSocketService.sendAction('ACTION_PLAYED' as any, {
          roomId: roomId || undefined,
          role: playerRoleRef.current,
          cardId: card.id,
          cardName: card.name,
          cardType: card.type,
          cost: card.cost,
          availableInk: nextAvailInk,
          payload: {
            card,
            availableInk: nextAvailInk,
            cardName: card.name,
            cardType: card.type,
            cost: card.cost,
          }
        });
      }
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
        availableInk: nextAvailInk,
        payload: { zone: 'field', card: newFieldCard, availableInk: nextAvailInk } 
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
        turnNumber: nextTurn,
        senderInk: availableInk,
        senderInkCapacity: inkwellCapacity,
        senderLore: playerLore,
        senderExerted: exertedCards,
        senderFieldCards: fieldCards,
        payload: {
          turnNumber: nextTurn,
          senderInk: availableInk,
          senderInkCapacity: inkwellCapacity,
          senderLore: playerLore,
          senderExerted: exertedCards,
          senderFieldCards: fieldCards,
        }
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
      
      {/* Ability Trigger & Complex Effect Notification Banner */}
      <AbilityNotificationBanner alerts={abilityAlerts} onDismiss={dismissAbilityAlert} />

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
      <aside className={`hidden md:grid md:w-60 lg:w-72 border-r border-[#30363d] bg-[#141a26] p-3.5 pb-1.5 grid-rows-[auto_1fr_auto] z-20 shrink-0 h-full overflow-hidden transition-colors ${
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
        <div className="flex flex-wrap justify-between items-center gap-y-1.5 w-full z-20 pb-2 border-b border-[#30363d] shrink-0">
          {/* MOBILE COMPACT PILES BAR (visible < md, replaces hidden left sidebar) */}
          <div className="md:hidden flex items-center gap-1.5 w-full order-first">
            <div className="flex-1 flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-[#141a26] border border-[#30363d] text-[10px] font-mono font-bold">
              <span className="text-sky-400">🌊 {inkwellCapacity}</span>
              <span className="text-[#F1F5F9]">🂠 {deckCount}</span>
              <span className="text-rose-400">💀 {discardCount}</span>
              <span className="text-rose-300">OP Lore {opponentLore}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* OPPONENT LORE */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 bg-[#141a26] shadow-sm transition-all duration-300 ${
              opponentLore >= 16
                ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] bg-rose-950/30'
                : 'border-rose-500/30 shadow-rose-950/20'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Sparkles className={`w-3.5 h-3.5 text-rose-400 ${opponentLore >= 16 ? 'animate-spin-slow' : ''}`} />
              </div>
              <div className="flex flex-col items-start min-w-[130px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-cinzel font-bold text-[#94A3B8] uppercase tracking-wider">Opponent Lore</span>
                  {opponentLore >= 16 && (
                    <span className="shimmer-badge badge-shimmer-ruby text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                      DANGER!
                    </span>
                  )}
                </div>
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
                <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#30363d] mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-pink-300 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    style={{ width: `${Math.min(100, (opponentLore / 20) * 100)}%` }}
                  />
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
                <span className="hidden sm:inline text-[9px] font-bold text-[#94A3B8] uppercase">Room:</span>
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-5 md:gap-8 xl:gap-12 w-full h-full max-h-36 sm:max-h-44 md:max-h-52 xl:max-h-56 overflow-y-auto no-scrollbar py-1">
              {opponentFieldCards.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-[#30363d] rounded-xl w-full min-h-[90px] sm:min-h-[140px]">
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
                      onTouchStart={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setPinnedCard(card);
                      }}
                      onClick={() => {
                        if (selectedAttacker) {
                          handleAttackTarget(card);
                        } else {
                          setPinnedCard(card);
                        }
                      }}
                      className={`w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 xl:w-36 xl:h-50 bg-[#141a26] rounded-xl flex items-center justify-center relative overflow-hidden border cursor-pointer ${
                        selectedAttacker
                          ? isOpExerted
                            ? 'border-rose-500 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'border-slate-700 opacity-60 cursor-not-allowed'
                          : isOpExerted
                          ? 'border-[#F59E0B]/60 hover:border-[#F59E0B]'
                          : 'border-[#30363d] hover:border-[#F59E0B]/60'
                      }`}
                    >
                      <img
                        src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                        alt={card.name || 'Disney Lorcana Card'}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                        }}
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

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-5 md:gap-8 xl:gap-12 w-full h-full max-h-40 sm:max-h-48 md:max-h-56 xl:max-h-64 overflow-y-auto no-scrollbar py-1">
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
                      onTouchStart={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setPinnedCard(card);
                    }}
                    onClick={handleCardInteraction}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardInteraction();
                      }
                    }}
                    className={`w-24 h-32 sm:w-32 sm:h-44 md:w-36 md:h-52 xl:w-40 xl:h-56 rounded-xl relative cursor-pointer transition-colors group card-foil-light ${
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
                        src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                        alt={card.name || 'Disney Lorcana Card'}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
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
                          className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-2 sm:p-1.5 rounded-full transition-colors cursor-pointer font-bold flex items-center justify-center shadow-md"
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
        <div className={`w-full flex justify-between items-center z-20 py-2 px-4 border rounded-xl shrink-0 transition-all duration-300 bg-[#141a26] ${
          playerLore >= 16
            ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-r from-[#141a26] via-amber-950/20 to-[#141a26]'
            : 'border-[#30363d]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start min-w-[140px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-cinzel font-bold text-[#F59E0B] uppercase tracking-wider">Your Lore Score</span>
                {playerLore >= 16 && (
                  <span className="shimmer-badge badge-shimmer-gold text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    MATCH POINT!
                  </span>
                )}
              </div>
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
              <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#30363d] mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  style={{ width: `${Math.min(100, (playerLore / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* UNDO / RETURN BUTTON */}
            {isMyTurn && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestUndo}
                disabled={!previousSnapshot || undoCountRemaining <= 0 || isUndoPending}
                className="bg-[#141a26] hover:bg-[#1e2638] disabled:opacity-40 disabled:hover:bg-[#141a26] text-[#F59E0B] border border-[#F59E0B]/40 hover:border-[#F59E0B] px-4 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title={
                  !previousSnapshot
                    ? 'No action to undo'
                    : undoCountRemaining <= 0
                    ? 'No undos remaining'
                    : `Request opponent to undo last action (${undoCountRemaining} remaining)`
                }
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>
                  {language === 'th' ? `ขอแก้มือ (${undoCountRemaining})` : `Return (${undoCountRemaining})`}
                </span>
                {isUndoPending && <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping ml-1" />}
              </motion.button>
            )}

            {turnNumber === 1 && isMyTurn && !hasMulliganed && (
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setIsMulliganPhase(true)}
                 className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
               >
                 <RotateCw className="w-3.5 h-3.5" />
                 <span>{language === 'th' ? 'สลับการ์ด' : 'Mulligan'}</span>
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
                      onTouchStart={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setPinnedCard(card);
                    }}
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
                       src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                       alt={card.name || 'Disney Lorcana Card'}
                       className="w-full h-full object-cover rounded-xl"
                       onError={(e) => {
                         (e.currentTarget as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                       }}
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
              className="bg-[#0d1420]/95 backdrop-blur-md border-t border-x border-[#30363d] rounded-t-2xl px-3 sm:px-8 pt-2.5 pb-4 sm:pb-6 flex flex-col items-center w-full sm:w-max sm:min-w-[480px] max-w-[100vw] shadow-2xl relative"
            >
              <div className="text-[10px] font-mono text-[#94A3B8] mb-1.5">
                {language === 'th' ? 'ลากการ์ดขึ้นสู่สนาม หรือคลิกการ์ดเพื่อเปิดเมนูคำสั่ง' : 'Drag card up onto battlefield or click for action menu'}
              </div>

              {/* Hand Cards Stack with Spring & Layout Animation */}
              <motion.div layout className="flex items-end justify-start sm:justify-center -space-x-6 md:-space-x-3 px-2 sm:px-3 py-1 w-full sm:w-auto overflow-x-auto no-scrollbar sm:overflow-visible">
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
                    dragConstraints={{ left: -(typeof window !== 'undefined' ? window.innerWidth : 800) / 2 + 60, right: (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - 60, top: -600, bottom: 300 }}
                    dragSnapToOrigin
                    onDragStart={() => setIsDraggingCard(true)}
                    onMouseEnter={() => setHoveredCard(card)}
                      onTouchStart={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setPinnedCard(card);
                    }}
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
                    className="w-24 h-36 sm:w-28 sm:h-40 md:w-36 md:h-52 rounded-xl relative cursor-grab active:cursor-grabbing border border-[#30363d] hover:border-[#F59E0B] bg-[#141a26] group card-foil-light shrink-0 shadow-lg"
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                        <span className="font-cinzel text-sm font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                        <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                      </div>
                      <img
                        src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                        alt={card.name || 'Disney Lorcana Card'}
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

      {/* PINNED CARD INSPECTOR MODAL (LOCKED / SCROLLABLE WITH CLOSE 'X') */}
      <AnimatePresence>
        {pinnedCard && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed bottom-4 right-4 md:right-6 z-[130] w-[380px] max-w-[calc(100vw-2rem)] bg-[#141a26]/98 backdrop-blur-xl border-2 border-[#F59E0B]/80 rounded-2xl p-4 text-[#F1F5F9] flex flex-col gap-3 pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.9)] ring-1 ring-[#F59E0B]/30"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#F59E0B]">
                <Pin className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                <span>{language === 'th' ? 'รายละเอียดการ์ด' : 'PINNED CARD INSPECTOR'}</span>
              </div>
              <button
                onClick={() => setPinnedCard(null)}
                aria-label="Close pinned card details"
                className="p-1 rounded-lg bg-[#0B0F19] hover:bg-rose-950/50 text-[#94A3B8] hover:text-rose-400 border border-[#30363d] hover:border-rose-500/50 transition-colors cursor-pointer"
                title={language === 'th' ? 'ปิดหน้าต่าง' : 'Close (Esc)'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Main Info */}
            <div className="flex gap-3 items-center">
              <img
                src={pinnedCard.imageUrl || pinnedCard.img}
                alt={pinnedCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                }}
                className="w-18 h-26 object-cover rounded-lg border border-[#30363d] shrink-0 shadow-lg"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {pinnedCard.ink && <InkSymbol ink={pinnedCard.ink} size={18} />}
                  <span className="font-cinzel font-bold text-base text-[#F59E0B] leading-tight truncate">{pinnedCard.name}</span>
                </div>
                {pinnedCard.title && (
                  <span className="text-xs font-mono text-[#94A3B8] truncate leading-tight mt-0.5">{pinnedCard.title}</span>
                )}
                
                {/* Type & Ink badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                  {pinnedCard.type && (
                    <span className="bg-[#1e2638] text-amber-200 px-2 py-0.5 rounded border border-[#30363d]">
                      {language === 'th' ? translateCardType(pinnedCard.type, 'th') : pinnedCard.type}
                    </span>
                  )}
                  {pinnedCard.ink && (
                    <span className="bg-[#0B0F19] text-[#94A3B8] px-2 py-0.5 rounded border border-[#30363d]">
                      {language === 'th' ? translateInkColor(pinnedCard.ink, 'th') : pinnedCard.ink}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[11px] font-mono font-bold">
                  <span className="text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d]">{t.cost}: {pinnedCard.cost}</span>
                  {isCardInkable(pinnedCard) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Droplets className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      {t.inkable}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      {language === 'th' ? 'Non-Ink' : 'Non-Inkable'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0F19] p-2 rounded-lg border border-[#30363d] text-center font-mono">
              <div className="flex items-center justify-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-[#94A3B8] text-[10px] font-bold">{t.strength.slice(0, 3)}:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.strength ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 border-x border-[#30363d]">
                <Shield className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-[#94A3B8] text-[10px] font-bold">{t.willpower.slice(0, 4)}:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.willpower ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-[#94A3B8] text-[10px] font-bold">{t.lore.slice(0, 4)}:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{pinnedCard.lore ?? '-'}</span>
              </div>
            </div>

            {/* Abilities & Text Box (Fully Scrollable) */}
            {pinnedCard.abilities && pinnedCard.abilities.length > 0 && (
              <div className="space-y-2 bg-[#0B0F19] p-2.5 rounded-lg border border-[#30363d] max-h-48 overflow-y-auto select-text pr-1.5 custom-scrollbar">
                <div className="text-[10px] font-cinzel text-[#F59E0B] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>{t.specialAbilities}</span>
                  <span className="text-[#94A3B8] font-mono text-[10px]">({pinnedCard.abilities.length})</span>
                </div>
                {pinnedCard.abilities.map((ab, idx) => (
                  <div key={idx} className="leading-relaxed bg-[#141a26] p-2.5 rounded-lg border border-[#30363d]/60">
                    <div className="font-bold text-xs text-[#F59E0B] mb-0.5">
                      {language === 'th' ? translateAbilityName(ab.name, ab.text, 'th') : translateAbilityName(ab.name, ab.text, 'en')}
                    </div>
                    <div className="text-[#E2E8F0] text-xs font-mono">
                      {language === 'th' ? translateCardAbilityText(ab.text, ab.name, 'th') : translateCardAbilityText(ab.text, ab.name, 'en')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pinnedCard.flavorText && (
              <div className="text-xs font-outfit text-[#94A3B8] italic border-t border-[#30363d]/60 pt-2 leading-relaxed max-h-24 overflow-y-auto select-text">
                "{pinnedCard.flavorText}"
              </div>
            )}

            {/* Action Footer */}
            <div className="flex gap-2 pt-1 border-t border-[#30363d]/50">
              {handCards.some(c => c.id === pinnedCard.id) && (
                <button
                  onClick={() => {
                    const c = handCards.find(card => card.id === pinnedCard.id);
                    if (c) setSelectedHandCard(c);
                    setPinnedCard(null);
                  }}
                  className="flex-1 py-2 px-3 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{language === 'th' ? 'สั่งการการ์ดนี้' : 'Action Menu'}</span>
                </button>
              )}
              <button
                onClick={() => setPinnedCard(null)}
                className="flex-1 py-2 px-3 bg-[#1e2638] hover:bg-[#283248] text-[#94A3B8] hover:text-white font-cinzel font-bold text-xs rounded-lg border border-[#30363d] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOVER CARD INSPECTOR TOOLTIP PANEL (QUICK GLANCE - ONLY WHEN NOT PINNED) */}
      <AnimatePresence>
        {hoveredCard && !pinnedCard && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => setPinnedCard(hoveredCard)}
            className="fixed bottom-4 right-4 md:right-6 z-[110] w-[350px] max-w-[calc(100vw-2rem)] bg-[#141a26]/95 backdrop-blur-md border border-[#30363d] hover:border-[#F59E0B]/70 rounded-xl p-3.5 text-[#F1F5F9] flex flex-col gap-2.5 cursor-pointer shadow-[0_16px_48px_rgba(0,0,0,0.85)] group transition-colors"
          >
            {/* Quick Hint Header */}
            <div className="flex items-center justify-between border-b border-[#30363d]/70 pb-1.5 text-[10px] font-mono text-slate-400">
              <span className="text-[#F59E0B] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                {language === 'th' ? 'ดูรายละเอียดเร็ว' : 'Quick Glance'}
              </span>
              <span className="text-amber-300 font-bold group-hover:text-amber-200 transition-colors flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" /> {language === 'th' ? 'คลิกเพื่อตรึง' : 'Click to Pin'}
              </span>
            </div>

            <div className="flex gap-2.5 items-center">
              <img
                src={hoveredCard.imageUrl || hoveredCard.img}
                alt={hoveredCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Lorcana_Card_Back.png';
                }}
                className="w-16 h-22 object-cover rounded-lg border border-[#30363d] shrink-0 shadow-md"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-cinzel font-bold text-sm text-[#F59E0B] leading-tight truncate">{hoveredCard.name}</span>
                {hoveredCard.title && (
                  <span className="text-[11px] font-mono text-[#94A3B8] truncate leading-tight mt-0.5">{hoveredCard.title}</span>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono font-bold">
                  <span className="text-[#F59E0B] bg-[#0B0F19] px-2 py-0.5 rounded border border-[#30363d]">{t.cost}: {hoveredCard.cost}</span>
                  {isCardInkable(hoveredCard) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Droplets className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                      {t.inkable}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      <XCircle className="w-2.5 h-2.5 text-rose-400" />
                      {language === 'th' ? 'ใส่หมึกไม่ได้' : 'Non-Ink'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#0B0F19] p-1.5 rounded-lg border border-[#30363d] text-center font-mono text-xs">
              <div className="flex items-center justify-center gap-1">
                <Sword className="w-3 h-3 text-[#F59E0B] shrink-0" />
                <span className="text-[#F59E0B] font-bold">{hoveredCard.strength ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 border-x border-[#30363d]">
                <Shield className="w-3 h-3 text-[#F59E0B] shrink-0" />
                <span className="text-[#F59E0B] font-bold">{hoveredCard.willpower ?? '-'}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F59E0B] shrink-0" />
                <span className="text-[#F59E0B] font-bold">{hoveredCard.lore ?? '-'}</span>
              </div>
            </div>

            {/* Abilities Quick Box */}
            {hoveredCard.abilities && hoveredCard.abilities.length > 0 && (
              <div className="space-y-1 bg-[#0B0F19] p-2 rounded-lg border border-[#30363d] max-h-32 overflow-y-auto custom-scrollbar">
                {hoveredCard.abilities.map((ab, idx) => (
                  <div key={idx} className="text-[11px] leading-snug">
                    <span className="font-bold text-[#F59E0B]">
                      {language === 'th' ? translateAbilityName(ab.name, ab.text, 'th') : translateAbilityName(ab.name, ab.text, 'en')}:
                    </span>{' '}
                    <span className="text-[#E2E8F0] font-mono text-[10px]">
                      {language === 'th' ? translateCardAbilityText(ab.text, ab.name, 'th') : translateCardAbilityText(ab.text, ab.name, 'en')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hoveredCard.flavorText && (
              <div className="text-[10px] font-outfit text-[#94A3B8] italic border-t border-[#30363d]/60 pt-1 line-clamp-2">
                "{hoveredCard.flavorText}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAG TO PLAY CONFIRMATION MODAL */}
      <AnimatePresence>
        {dragPendingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(245,158,11,0.3)] flex flex-col items-center gap-4"
            >
              <div className="flex items-center justify-between w-full border-b border-[#30363d] pb-2">
                <span className="font-cinzel text-[#F59E0B] font-bold text-sm">{language === 'th' ? 'เลือกการกระทำ' : 'Choose Action'}</span>
                <button
                  onClick={() => setDragPendingCard(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-3 items-center w-full">
                <img
                  src={dragPendingCard.imageUrl || dragPendingCard.img}
                  alt={dragPendingCard.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-20 object-cover rounded-lg border border-[#30363d] shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-cinzel font-bold text-white text-sm truncate">{dragPendingCard.name}</h4>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">{t.cost}: {dragPendingCard.cost} Ink</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full mt-2">
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
                    <span>{language === 'th' ? 'ใส่เป็นหมึก' : 'Add to Inkwell'}</span>
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
                    if (matchModeRef.current) {
                      webSocketService.sendAction('ACTION_PLAYED' as any, {
                        roomId: roomId || undefined,
                        role: playerRoleRef.current,
                        cardId: selectedHandCard.id,
                        cardName: selectedHandCard.name,
                        cardType: `Song (Sung by ${singer.name})`,
                        cost: 0,
                        availableInk: availableInk,
                        payload: {
                          card: selectedHandCard,
                          availableInk: availableInk,
                          cardName: selectedHandCard.name,
                          cardType: `Song (Sung by ${singer.name})`,
                          cost: 0,
                        }
                      });
                    }
                    resolveAbilities(selectedHandCard);
                  }}
                  disabled={!fieldCards.some(c => !c.isWet && !exertedCards[c.id] && (c.cost || 0) >= selectedHandCard.cost)}
                  className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{language === 'th' ? `ร้องเพลง (ค่าร่าย ${selectedHandCard.cost}+)` : `Sing (Exert cost ${selectedHandCard.cost}+)`}</span>
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
                      ? (language === 'th' ? 'ใส่หมึกไปแล้วในเทิร์นนี้ (ขีดจำกัด 1/1)' : 'Inked this turn (1/1 Limit)')
                      : (language === 'th' ? 'ใส่เป็นหมึก' : 'Add to Inkwell (+1 Ink Capacity)')}
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
                    ? (language === 'th' ? `ต้องการ ${selectedHandCard.cost} หมึก (มี ${availableInk})` : `Requires ${selectedHandCard.cost} Ink (Have ${availableInk})`)
                    : (language === 'th' ? `ลงสู่สนาม (${selectedHandCard.cost} หมึก)` : `Play to Field (${selectedHandCard.cost} Ink)`)}
                </span>
              </button>

              <button
                onClick={() => {
                  setPinnedCard(selectedHandCard);
                  setSelectedHandCard(null);
                }}
                className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#94A3B8] hover:text-white border border-[#30363d] p-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4 text-[#F59E0B]" />
                <span>{language === 'th' ? '🔍 ตรวจสอบรายละเอียดฉบับเต็ม' : '🔍 Inspect Full Details'}</span>
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
            className="fixed inset-y-0 right-0 z-[140] w-72 max-w-[85vw] border-l border-[#30363d] bg-[#141a26] p-4 flex flex-col justify-between shadow-xl lg:relative lg:z-30 lg:shrink-0 lg:max-w-none h-full"
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
              Illuminary Realm Live Sync Active
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

      {/* UNDO / RETURN VOTE PROMPT MODAL (FOR OPPONENT) */}
      <AnimatePresence>
        {incomingUndoRequest && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0B0F19]/85 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col items-center text-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
                <Undo2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-cinzel text-xl font-bold text-[#F1F5F9] mb-1">
                  {language === 'th' ? 'คู่แข่งขออนุญาตย้อนการเล่น' : 'Opponent Requested Undo'}
                </h3>
                <p className="text-sm text-slate-300 font-outfit">
                  {language === 'th'
                    ? `ผู้เล่น "${incomingUndoRequest.requesterUsername}" ขออนุญาตย้อนการเล่นแอคชั่นล่าสุด คุณยินยอมหรือไม่?`
                    : `Player "${incomingUndoRequest.requesterUsername}" wants to undo their last action. Do you accept?`}
                </p>
              </div>

              <div className="w-full bg-[#0B0F19] rounded-xl p-3 border border-[#30363d] flex items-center justify-between text-xs font-mono text-[#F59E0B]">
                <span>{language === 'th' ? 'เวลาในการตัดสินใจ:' : 'Time remaining:'}</span>
                <span className="text-base font-bold px-2 py-0.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/40">
                  {undoVoteTimer}s
                </span>
              </div>

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => handleRespondUndoVote(false)}
                  className="flex-1 py-3 rounded-xl bg-[#0B0F19] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-rose-300 font-cinzel font-bold text-sm transition-all cursor-pointer"
                >
                  {language === 'th' ? '❌ ปฏิเสธ' : '❌ Decline'}
                </button>
                <button
                  onClick={() => handleRespondUndoVote(true)}
                  className="flex-1 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  {language === 'th' ? '✅ ยินยอม' : '✅ Accept'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPPONENT DISCONNECTED OVERLAY (60s GRACE PERIOD) */}
      <AnimatePresence>
        {isOpponentDisconnected && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0B0F19]/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-amber-500/70 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 animate-pulse">
                <WifiOff className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-cinzel text-2xl font-bold text-[#F1F5F9] mb-2">
                  {language === 'th' ? 'คู่แข่งขาดการเชื่อมต่อ' : 'Opponent Disconnected'}
                </h3>
                <p className="text-sm text-slate-300 font-outfit max-w-md">
                  {language === 'th'
                    ? 'สัญญาณเน็ตของคู่แข่งหลุดชั่วคราว ระบบกำลังรอการเชื่อมต่อใหม่เพื่อให้โอกาสกลับเข้าห้อง'
                    : 'Your opponent lost connection. The system is waiting for them to rejoin the match.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 w-full bg-[#0B0F19] rounded-2xl p-4 border border-[#30363d]">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                  {language === 'th' ? 'เวลารอเชื่อมต่อคงเหลือ' : 'Grace Period Remaining'}
                </span>
                <span className="text-3xl font-mono font-black text-[#F59E0B] tracking-wider">
                  {disconnectCountdown}s
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-[#F59E0B] h-full transition-all duration-1000"
                    style={{ width: `${(disconnectCountdown / 60) * 100}%` }}
                  />
                </div>
              </div>

              {disconnectCountdown === 0 && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-xs text-rose-400 font-mono">
                    {language === 'th' ? 'หมดเวลาเชื่อมต่อ คู่แข่งไม่กลับเข้าห้อง' : 'Grace period expired. Opponent did not rejoin.'}
                  </p>
                  {onExitMatch && (
                    <button
                      onClick={onExitMatch}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-cinzel font-bold text-sm transition-all cursor-pointer shadow-lg"
                    >
                      {language === 'th' ? 'ออกจากห้อง' : 'Exit Match'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME OVER / VICTORY / DEFEAT POPUP MODAL */}
      <GameOverModal
        isOpen={!!gameOverData?.isOpen}
        isWinner={!!gameOverData?.isWinner}
        winnerName={gameOverData?.winnerName || myUsername}
        loserName={gameOverData?.loserName || opponentName}
        winnerLore={gameOverData?.winnerLore ?? 20}
        loserLore={gameOverData?.loserLore ?? 0}
        turnNumber={gameOverData?.turnNumber || turnNumber}
        roomId={roomId}
        onPlayAgain={handlePlayAgain}
        onExitMatch={onExitMatch}
      />

      {/* PLAYMAT SKIN SELECTOR MODAL */}
      <PlaymatSelectorModal
        isOpen={isPlaymatModalOpen}
        onClose={() => setIsPlaymatModalOpen(false)}
      />
    </div>
  );
};
