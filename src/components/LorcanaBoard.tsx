import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
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
  Globe,
  LogOut,
} from 'lucide-react';
import { webSocketService } from '../services/websocket';
import { InkSymbol } from './InkSymbol';
import { Modal } from './Modal';
import { DiceDuelModal } from './DiceDuelModal';
import { PlaymatSelectorModal } from './PlaymatSelectorModal';
import { AbilityNotificationBanner, type AbilityAlert } from './AbilityNotificationBanner';
import { GameOverModal } from './GameOverModal';
import { TurnPhaseBar } from './board/TurnPhaseBar';
import { MulliganModal } from './board/MulliganModal';
import { CardInspectModal } from './board/CardInspectModal';
import { HandActionModal } from './board/HandActionModal';
import { BoardChatPanel, type ChatMessage } from './board/BoardChatPanel';
import { ManualResolvePanel } from './board/ManualResolvePanel';
import { TargetPromptModal } from './board/TargetPromptModal';
import { InkwellSidebar } from './board/InkwellSidebar';
import { BoardTopBar } from './board/BoardTopBar';
import { OpponentBattlefield } from './board/OpponentBattlefield';
import { PlayerBattlefield } from './board/PlayerBattlefield';
import { PlayerControlsBar } from './board/PlayerControlsBar';
import { HandTrayDock } from './board/HandTrayDock';
import { ActionLogSidebar } from './board/ActionLogSidebar';
import { OpponentDisconnectOverlay } from './board/OpponentDisconnectOverlay';
import { UndoVoteModal } from './board/UndoVoteModal';
import { useLorcanaWebSocket } from './board/useLorcanaWebSocket';
import { resolveCardAbilities } from './board/abilityResolver';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { apiService } from '../services/api';
import { translateCardAbilityText, translateAbilityName, translateCardType, translateInkColor } from '../utils/cardTranslator';

import { fetchCardPool, fetchFullDataset, enrichCard, STARTER_POOL, type PoolCard } from '../data/cardPool';
import { isCardInkable as engineIsCardInkable, parseCardKeywords, canQuest, canChallenge } from '../game';
import type { GamePrompt } from '../game/types';

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

export const isCardInkable = engineIsCardInkable;

export interface LorcanaBoardProps {
  initialDeck?: any;
  roomId?: string;
  playerRole?: 'player1' | 'player2';
  opponentUsername?: string;
  matchMode?: boolean;
  isRejoin?: boolean;
  onExitMatch?: () => void;
  /** Leave without the confirm dialog (used after the opponent already left) */
  onReturnToLobby?: () => void;
}

export const LorcanaBoard: React.FC<LorcanaBoardProps> = ({
  initialDeck,
  roomId,
  playerRole,
  opponentUsername,
  matchMode = false,
  isRejoin = false,
  onExitMatch,
  onReturnToLobby,
}) => {
  const { user, token } = useAuthStore();
  const { t, language, toggleLanguage } = useLanguageStore();
  const { getCurrentPlaymat } = usePlaymatStore();
  const currentPlaymat = getCurrentPlaymat();
  const [isPlaymatModalOpen, setIsPlaymatModalOpen] = useState(false);
  const [isRulesQuickModalOpen, setIsRulesQuickModalOpen] = useState(false);
  const [rulesActiveTab, setRulesActiveTab] = useState<'steps' | 'actions' | 'keywords' | 'win'>('steps');
  const myUsername = user?.username || webSocketService.getUsername() || 'Illumineer';
  const matchReportedRef = useRef(false);

  // Load saved active board state for this room (if available, recent, and explicitly in isRejoin mode)
  const savedBoard: SavedBoardState | null = React.useMemo(() => {
    if (!roomId || !isRejoin) return null;
    try {
      const raw = localStorage.getItem(`lorcana_board_state_${roomId}_${myUsername}`);
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

      if (token && roomId && !matchReportedRef.current) {
        matchReportedRef.current = true;
        const matchId = `${roomId}-${Math.floor(Date.now() / 1000)}`;
        apiService.recordMatch(
          {
            matchId,
            winner: myName,
            loser: oppName,
            winnerLore: Math.max(20, wLore),
            loserLore: lLore,
            turns: turnNumberRef.current,
          },
          token
        ).catch((err) => console.error('[Record Match Error]', err));
      }
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

  const showNotice = (msg: string, type: 'success' | 'warning' | 'error') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // SPRINT 3: AWS WEBSOCKETS REAL-TIME ROOM SYNC STATE

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

  const boardStateRef = useRef({
    playerLore,
    opponentLore,
    availableInk,
    opponentInk,
    inkwellCapacity,
    opponentInkCapacity,
    turnNumber,
    isMyTurn,
    fieldCards,
    opponentFieldCards,
    damage,
    exertedCards,
    opponentExerted,
  });
  boardStateRef.current = {
    playerLore,
    opponentLore,
    availableInk,
    opponentInk,
    inkwellCapacity,
    opponentInkCapacity,
    turnNumber,
    isMyTurn,
    fieldCards,
    opponentFieldCards,
    damage,
    exertedCards,
    opponentExerted,
  };

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
      localStorage.setItem(`lorcana_board_state_${roomId}_${myUsername}`, JSON.stringify(stateToSave));
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
  const [opponentLeftName, setOpponentLeftName] = useState<string | null>(null);
  // Rejoin: our local board may be stale. Until the opponent answers a sync request we neither
  // broadcast our state nor let anyone overwrite theirs with it.
  const awaitingSyncRef = useRef<boolean>(isRejoin);

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
      setPreviousSnapshot(null);
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


  const handleAttackTarget = (target: LorcanaCard) => {
    if (!selectedAttacker) return;
    const attacker = fieldCards.find(c => c.id === selectedAttacker);
    if (!attacker) return;
    
    const attackerKw = parseCardKeywords(attacker);
    const targetKw = parseCardKeywords(target);

    if (attacker.isWet && !attackerKw.rush) {
       showNotice(`${attacker.name} was played this turn! (Ink drying - cannot Challenge until next turn)`, 'warning');
       setSelectedAttacker(null);
       return;
    }

    if (exertedCards[attacker.id]) {
       showNotice(`Cannot challenge: ${attacker.name} is already exerted!`, 'warning');
       setSelectedAttacker(null);
       return;
    }
    
    if (!opponentExerted[target.id]) {
       showNotice(`You can only challenge Exerted characters!`, 'warning');
       return;
    }

    // Evasive restriction
    if (targetKw.evasive && !attackerKw.evasive && !attackerKw.alert) {
       showNotice(`Cannot challenge ${target.name}: target has Evasive and attacker lacks Evasive/Alert!`, 'warning');
       return;
    }

    // Bodyguard restriction
    if (!targetKw.bodyguard) {
       const hasExertedBodyguard = opponentFieldCards.some(c => {
         if (!opponentExerted[c.id]) return false;
         const kw = parseCardKeywords(c);
         if (!kw.bodyguard) return false;
         if (kw.evasive && !attackerKw.evasive && !attackerKw.alert) return false;
         return true;
       });
       if (hasExertedBodyguard) {
         showNotice(`Must challenge an opposing character with Bodyguard!`, 'warning');
         return;
       }
    }

    captureSnapshot();
    
    // Combat strength and Resist calculation
    const rawAttackerStr = (attacker.strength || 0) + attackerKw.challenger;
    const rawDefenderStr = target.strength || 0;

    const damageDealtToAttacker = Math.max(0, rawDefenderStr - attackerKw.resist);
    const damageDealtToTarget = Math.max(0, rawAttackerStr - targetKw.resist);
    
    let newAttackerDamage = (damage[attacker.id] || 0) + damageDealtToAttacker;
    let newTargetDamage = (damage[target.id] || 0) + damageDealtToTarget;
    
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
      showNotice(`"${card.name}" is non-inkable! Only cards with an inkwell icon can be inked.`, 'error');
      return false;
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
    resolveCardAbilities(card, {
      triggerAbilityAlert,
      handleDrawCard,
      setLogMessages,
      setPlayerLore,
      roomId,
      playerRole,
      showNotice,
      handleTriggerGameOver,
      opponentLore,
      setOpponentFieldCards,
      setDamage,
      setOpponentExerted,
      opponentFieldCards,
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
    const canInk = cardInkable && !hasInkedThisTurn;
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

  // Synchronized WebSocket event listeners, auto-sync, and reconnect handling
  useLorcanaWebSocket({
    matchMode,
    roomId,
    playerRole,
    myUsername,
    opponentName,
    isRejoin,
    token,
    savedBoard,
    boardStateRef,
    turnNumberRef,
    playerRoleRef,
    awaitingSyncRef,
    disconnectTimerRef,
    undoTimerRef,
    matchReportedRef,
    playerLore,
    opponentLore,
    fieldCards,
    setPlayerLore,
    setOpponentLore,
    setAvailableInk,
    setInkwellCapacity,
    setOpponentInk,
    setOpponentInkCapacity,
    setTurnNumber,
    setIsMyTurn,
    setOpponentFieldCards,
    setFieldCards,
    setDamage,
    setOpponentExerted,
    setOpponentDeckCount,
    setOpponentDiscardCount,
    setDiscardCount,
    setAbilityAlerts,
    setLogMessages,
    setGameOverData,
    setOpponentName,
    setIsOpponentDisconnected,
    setDisconnectCountdown,
    setOpponentLeftName,
    setIncomingUndoRequest,
    setUndoVoteTimer,
    setIsUndoPending,
    setPreviousSnapshot,
    setUndoCountRemaining,
    setChatMessages,
    setUnreadChatCount,
    showNotice,
    resetGameBoard,
    handleStartTurn,
    applySnapshot,
    handleRespondUndoVote,
  });

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

      {/* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES */}
      <InkwellSidebar
        isDraggingOverInkwell={isDraggingOverInkwell}
        opponentDeckCount={opponentDeckCount}
        opponentDiscardCount={opponentDiscardCount}
        availableInk={availableInk}
        inkwellCapacity={inkwellCapacity}
        hasInkedThisTurn={hasInkedThisTurn}
        deckCount={deckCount}
        discardCount={discardCount}
        onDeckClick={handleDeckClick}
      />

      {/* CENTER PLAY AREA: FIT-IN-SCREEN PLAYFIELD (OVERFLOW-HIDDEN, NO SCROLL) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 p-3 justify-between">
        
        {/* TOP STATUS HEADER BAR */}
        <BoardTopBar
          inkwellCapacity={inkwellCapacity}
          deckCount={deckCount}
          discardCount={discardCount}
          opponentLore={opponentLore}
          opponentInk={opponentInk}
          opponentInkCapacity={opponentInkCapacity}
          turnNumber={turnNumber}
          turnPhase={turnPhase}
          onExitMatch={onExitMatch}
          language={language}
          toggleLanguage={toggleLanguage}
          onOpenPlaymat={() => setIsPlaymatModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

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
          <OpponentBattlefield
            opponentFieldCards={opponentFieldCards}
            matchMode={matchMode}
            opponentExerted={opponentExerted}
            damage={damage}
            selectedAttacker={selectedAttacker}
            onAttackTarget={handleAttackTarget}
            onInspectCard={(c) => setPinnedCard(c)}
            onHoverCard={(c) => setHoveredCard(c)}
          />

          {/* 2. PLAYER BATTLEFIELD ZONE */}
          <PlayerBattlefield
            isDraggingCard={isDraggingCard}
            fieldCards={fieldCards}
            opponentFieldCards={opponentFieldCards}
            exertedCards={exertedCards}
            damage={damage}
            selectedAttacker={selectedAttacker}
            onCardInteraction={(card) => {
              if (card.isWet) {
                showNotice(`"${card.name}" is drying ink (wet). It cannot Quest or Challenge until your next turn.`, 'warning');
                return;
              }
              if (exertedCards[card.id]) {
                showNotice(`"${card.name}" is already exerted (exhausted). It will ready at the start of your turn.`, 'warning');
                return;
              }
              if (selectedAttacker === card.id) {
                setSelectedAttacker(null);
              } else {
                setSelectedAttacker(card.id);
                showNotice(`"${card.name}" selected! Click an exerted opponent character to Challenge, or click ⚡ to Quest.`, 'success');
              }
            }}
            onQuest={handleQuest}
            onSelectAttackerToggle={(cardId) => {
              if (selectedAttacker === cardId) {
                setSelectedAttacker(null);
              } else {
                setSelectedAttacker(cardId);
                showNotice(`Select an exerted opponent's character to challenge!`, 'warning');
              }
            }}
            onInspectCard={(c) => setPinnedCard(c)}
            onHoverCard={(c) => setHoveredCard(c)}
          />
        </div>

        {/* PLAYER LORE & PASS TURN CONTROLS BAR */}
        <PlayerControlsBar
          playerLore={playerLore}
          isMyTurn={isMyTurn}
          previousSnapshot={previousSnapshot}
          undoCountRemaining={undoCountRemaining}
          isUndoPending={isUndoPending}
          onRequestUndo={handleRequestUndo}
          turnNumber={turnNumber}
          hasMulliganed={hasMulliganed}
          onOpenMulligan={() => setIsMulliganPhase(true)}
          matchMode={matchMode}
          onEndTurn={handleEndTurn}
          onStartTurn={() => handleStartTurn()}
          language={language}
          passTurnText={t.passTurn}
          opponentTurnText={t.opponentTurn}
        />

      </div>

      {/* MULLIGAN OVERLAY MODAL */}
      <MulliganModal
        isMulliganPhase={isMulliganPhase}
        handCards={handCards}
        mulliganSelectedIds={mulliganSelectedIds}
        setMulliganSelectedIds={setMulliganSelectedIds}
        onKeepHand={() => {
          setIsMulliganPhase(false);
          setHasMulliganed(true);
          showNotice(language === 'th' ? 'คงการ์ดชุดเดิมบนมือ' : 'Kept original hand', 'success');
        }}
        onConfirmMulligan={handleMulliganConfirm}
        language={language}
      />

      {/* HAND DOCK */}
      <HandTrayDock
        isHandOpen={isHandOpen}
        onToggleHand={() => setIsHandOpen((prev) => !prev)}
        onMouseEnter={handleHandMouseEnter}
        onMouseLeave={handleHandMouseLeave}
        handCards={handCards}
        language={language}
        onDragStart={() => setIsDraggingCard(true)}
        onDragEnd={handleDragEnd}
        onSelectHandCard={(c) => setSelectedHandCard(c)}
        onInspectCard={(c) => setPinnedCard(c)}
        onHoverCard={(c) => setHoveredCard(c)}
      />

      {/* CARD INSPECTOR MODAL & HOVER GLANCE */}
      <CardInspectModal
        pinnedCard={pinnedCard}
        hoveredCard={hoveredCard}
        onClosePinned={() => setPinnedCard(null)}
        onPinHovered={(card) => setPinnedCard(card)}
        onOpenActionMenu={(card) => setSelectedHandCard(card)}
        isCardInHand={handCards.some((c) => c.id === pinnedCard?.id)}
        language={language}
      />

      {/* HAND ACTION & PLAY CONFIRMATION MODALS */}
      <HandActionModal
        selectedHandCard={selectedHandCard}
        onCloseSelectedHandCard={() => setSelectedHandCard(null)}
        dragPendingCard={dragPendingCard}
        onCloseDragPending={() => setDragPendingCard(null)}
        onAddToInkwell={handleAddToInkwell}
        onPlayCard={handlePlayCard}
        onSingSong={(songCard) => {
          const availableSingers = fieldCards.filter(
            (c) => !c.isWet && !exertedCards[c.id] && (c.cost || 0) >= songCard.cost
          );
          if (availableSingers.length === 0) {
            showNotice(
              language === 'th'
                ? `ไม่มีตัวละครพร้อมใช้งานที่มี Cost ${songCard.cost} ขึ้นไปเพื่อร้องเพลงนี้!`
                : `No ready character with cost ${songCard.cost} or more to sing this!`,
              'warning'
            );
            return;
          }
          const singer = availableSingers[0];
          toggleExert(singer.id);
          setHandCards((prev) => prev.filter((c) => c.id !== songCard.id));
          setSelectedHandCard(null);
          setDiscardCount((prev) => prev + 1);
          setLogMessages((prev) => [
            language === 'th'
              ? `คุณร้องเพลง ${songCard.name} โดยใช้ ${singer.name}!`
              : `You sang ${songCard.name} using ${singer.name}!`,
            ...prev,
          ]);
          showNotice(
            language === 'th'
              ? `ร้องเพลง "${songCard.name}" โดย ${singer.name} สำเร็จ!`
              : `Sang "${songCard.name}" using ${singer.name}!`,
            'success'
          );
          if (matchModeRef.current) {
            webSocketService.sendAction('ACTION_PLAYED' as any, {
              roomId: roomId || undefined,
              role: playerRoleRef.current,
              cardId: songCard.id,
              cardName: songCard.name,
              cardType: `Song (Sung by ${singer.name})`,
              cost: 0,
              availableInk,
              payload: {
                card: songCard,
                availableInk,
                cardName: songCard.name,
                cardType: `Song (Sung by ${singer.name})`,
                cost: 0,
              },
            });
          }
          resolveAbilities(songCard);
        }}
        onInspectCard={(card) => {
          setPinnedCard(card);
          setSelectedHandCard(null);
        }}
        availableInk={availableInk}
        hasInkedThisTurn={hasInkedThisTurn}
        fieldCards={fieldCards}
        exertedCards={exertedCards}
        language={language}
      />

      {/* RIGHT SIDEBAR: ACTION LOG */}
      <ActionLogSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        logMessages={logMessages}
      />

      {/* CHAT IN-GAME */}
      <BoardChatPanel
        matchMode={matchMode}
        roomId={roomId}
        playerRole={playerRole}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />

      {/* PRE-MATCH DICE DUEL MODAL (ODD/EVEN & TURN ORDER SELECTION) */}
      <DiceDuelModal
        isOpen={isDiceDuelOpen}
        roomId={roomId}
        myRole={playerRole || 'player1'}
        opponentName={playerRole === 'player1' ? 'Challenger' : 'Host'}
        onDuelFinished={handleDuelFinished}
        isSandbox={!matchMode}
      />

      {/* UNDO VOTE MODAL */}
      <UndoVoteModal
        incomingUndoRequest={incomingUndoRequest}
        undoVoteTimer={undoVoteTimer}
        language={language}
        onRespond={handleRespondUndoVote}
      />

      {/* OPPONENT DISCONNECTED & LEFT OVERLAYS */}
      <OpponentDisconnectOverlay
        isOpponentDisconnected={isOpponentDisconnected}
        disconnectCountdown={disconnectCountdown}
        opponentLeftName={opponentLeftName}
        language={language}
        onExitMatch={onExitMatch}
        onReturnToLobby={onReturnToLobby}
      />

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
