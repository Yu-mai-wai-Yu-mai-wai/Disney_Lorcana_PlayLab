import React from 'react';
import { webSocketService } from '../../services/websocket';
import { apiService } from '../../services/api';
import { translateCardAbilityText, translateAbilityName } from '../../utils/cardTranslator';
import type { AbilityAlert } from '../AbilityNotificationBanner';
import type { LorcanaCard, SavedBoardState } from '../LorcanaBoard';

export interface UseLorcanaWebSocketOptions {
  matchMode: boolean;
  roomId?: string;
  playerRole?: 'player1' | 'player2';
  myUsername: string;
  opponentName: string;
  isRejoin: boolean;
  token: string | null;
  savedBoard: SavedBoardState | null;
  boardStateRef: React.MutableRefObject<any>;
  turnNumberRef: React.MutableRefObject<number>;
  playerRoleRef: React.MutableRefObject<'player1' | 'player2' | undefined>;
  awaitingSyncRef: React.MutableRefObject<boolean>;
  disconnectTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  undoTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  matchReportedRef: React.MutableRefObject<boolean>;

  playerLore: number;
  opponentLore: number;
  fieldCards: LorcanaCard[];

  setPlayerLore: React.Dispatch<React.SetStateAction<number>>;
  setOpponentLore: React.Dispatch<React.SetStateAction<number>>;
  setAvailableInk: React.Dispatch<React.SetStateAction<number>>;
  setInkwellCapacity: React.Dispatch<React.SetStateAction<number>>;
  setOpponentInk: React.Dispatch<React.SetStateAction<number>>;
  setOpponentInkCapacity: React.Dispatch<React.SetStateAction<number>>;
  setTurnNumber: React.Dispatch<React.SetStateAction<number>>;
  setIsMyTurn: React.Dispatch<React.SetStateAction<boolean>>;
  setOpponentFieldCards: React.Dispatch<React.SetStateAction<LorcanaCard[]>>;
  setFieldCards: React.Dispatch<React.SetStateAction<LorcanaCard[]>>;
  setDamage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setOpponentExerted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpponentDeckCount: React.Dispatch<React.SetStateAction<number>>;
  setOpponentDiscardCount: React.Dispatch<React.SetStateAction<number>>;
  setDiscardCount: React.Dispatch<React.SetStateAction<number>>;
  setAbilityAlerts: React.Dispatch<React.SetStateAction<AbilityAlert[]>>;
  setLogMessages: React.Dispatch<React.SetStateAction<string[]>>;
  setGameOverData: React.Dispatch<React.SetStateAction<any>>;
  setOpponentName: React.Dispatch<React.SetStateAction<string>>;
  setIsOpponentDisconnected: React.Dispatch<React.SetStateAction<boolean>>;
  setDisconnectCountdown: React.Dispatch<React.SetStateAction<number>>;
  setOpponentLeftName: React.Dispatch<React.SetStateAction<string | null>>;
  setIncomingUndoRequest: React.Dispatch<React.SetStateAction<any>>;
  setUndoVoteTimer: React.Dispatch<React.SetStateAction<number>>;
  setIsUndoPending: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviousSnapshot: React.Dispatch<React.SetStateAction<any>>;
  setUndoCountRemaining: React.Dispatch<React.SetStateAction<number>>;
  setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;

  showNotice: (msg: string, type: 'success' | 'warning' | 'error') => void;
  resetGameBoard: () => void;
  handleStartTurn: (syncedTurnNumber?: number) => void;
  applySnapshot: (snap: any, isSelfRestoring?: boolean) => void;
  handleRespondUndoVote: (accept: boolean) => void;
}

export function useLorcanaWebSocket(options: UseLorcanaWebSocketOptions) {
  const {
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
  } = options;

  // Sync service params on mount / changes
  React.useEffect(() => {
    if (roomId) {
      webSocketService.setRoomId(roomId);
    }
    if (playerRole) {
      webSocketService.setRole(playerRole);
      if (matchMode && !isRejoin) {
        setIsMyTurn(playerRole === 'player1');
      }
    }
    if (myUsername) {
      webSocketService.setUsername(myUsername);
    }

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
  }, [roomId, playerRole, matchMode, isRejoin, myUsername, setIsMyTurn]);

  // Rejoin sync retry
  React.useEffect(() => {
    if (!matchMode || !roomId || !isRejoin) return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (!awaitingSyncRef.current) return clearInterval(timer);
      if (++attempts > 5) {
        awaitingSyncRef.current = false;
        return clearInterval(timer);
      }
      webSocketService.sendAction('REQUEST_STATE_SYNC' as any, {
        roomId,
        role: playerRoleRef.current,
        username: myUsername,
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [matchMode, roomId, isRejoin, myUsername, awaitingSyncRef, playerRoleRef]);

  // Main WebSocket event subscribers
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
      if (data.role && playerRole) {
        return data.role === playerRole;
      }
      if (data.username && myUsername) {
        return data.username.toLowerCase() === myUsername.toLowerCase();
      }
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
          if (!prev.find((c) => c.id === oppCard.id)) {
            return [...prev, oppCard];
          }
          return prev;
        });
        const availInk = p.availableInk !== undefined ? p.availableInk : data.availableInk;
        if (availInk !== undefined) {
          setOpponentInk(availInk);
        }
        setLogMessages((prev) => [`Opponent played Character: ${oppCard.name}! (Ink drying...)`, ...prev]);
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
      setOpponentDiscardCount((prev) => prev + 1);
      const cName = p.cardName || p.card?.name || data.cardName || 'Action/Song';
      const cType = p.cardType || 'Action';
      setLogMessages((prev) => [`Opponent cast ${cType}: ${cName}! (Sent to Discard)`, ...prev]);
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
      const inkCap =
        p.inkCount !== undefined
          ? p.inkCount
          : p.inkwellCapacity !== undefined
          ? p.inkwellCapacity
          : data.inkCount;
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
      const isMeWinner =
        (p.winnerRole && p.winnerRole === playerRole) || (p.winnerName && p.winnerName === myUsername);
      const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
      const wName = p.winnerName || (isMeWinner ? myUsername : opp);
      const lName = p.loserName || (isMeWinner ? opp : myUsername);
      const wLore = p.winnerLore || 20;
      const lLore = p.loserLore !== undefined ? p.loserLore : isMeWinner ? opponentLore : playerLore;

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

      if (isMeWinner && matchMode && token && roomId && !matchReportedRef.current) {
        matchReportedRef.current = true;
        const matchId = `${roomId}-${Math.floor(Date.now() / 1000)}`;
        apiService
          .recordMatch(
            {
              matchId,
              winner: wName,
              loser: lName,
              winnerLore: wLore,
              loserLore: lLore,
              turns: p.turnNumber || turnNumberRef.current,
            },
            token
          )
          .catch((err) => console.error('[Record Match Error]', err));
      }
    });

    const unsubMatchFinished = webSocketService.subscribe('MATCH_FINISHED' as any, (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload || data;
      const isMeWinner =
        (p.winnerRole && p.winnerRole === playerRole) || (p.winnerName && p.winnerName === myUsername);
      const opp = data.username || opponentName || (playerRole === 'player1' ? 'Challenger' : 'Host Illumineer');
      const wName = p.winnerName || (isMeWinner ? myUsername : opp);
      const lName = p.loserName || (isMeWinner ? opp : myUsername);
      const wLore = p.winnerLore || 20;
      const lLore = p.loserLore !== undefined ? p.loserLore : isMeWinner ? opponentLore : playerLore;

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
      setLogMessages((prev) => [`Opponent ended their turn.`, ...prev]);
      setOpponentFieldCards((prev) => prev.map((c) => ({ ...c, isWet: false })));

      const p = data.payload || data;
      if (p.senderInk !== undefined || data.senderInk !== undefined) {
        setOpponentInk(p.senderInk !== undefined ? p.senderInk : data.senderInk);
      }
      if (p.senderInkCapacity !== undefined || data.senderInkCapacity !== undefined) {
        setOpponentInkCapacity(
          p.senderInkCapacity !== undefined ? p.senderInkCapacity : data.senderInkCapacity
        );
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
      handleStartTurn(data.turnNumber || p.turnNumber);
    });

    const unsubChallenge = webSocketService.subscribe('CHALLENGE_DONE', (data) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      const p = data.payload;
      if (!p) return;

      if (p.targetBanished) {
        setFieldCards((prev) => prev.filter((c) => c.id !== p.targetId));
        setDiscardCount((prev) => prev + 1);
        setLogMessages((prev) => [
          `Your ${p.targetName} was banished by opponent's ${p.attackerName}!`,
          ...prev,
        ]);
        showNotice(`Your "${p.targetName}" was banished in challenge!`, 'error');
      } else if (p.targetDamage !== undefined) {
        setDamage((prev) => ({ ...prev, [p.targetId]: p.targetDamage }));
      }

      if (p.attackerBanished) {
        setOpponentFieldCards((prev) => prev.filter((c) => c.id !== p.attackerId));
        setOpponentDiscardCount((prev) => prev + 1);
        setLogMessages((prev) => [
          `Opponent's ${p.attackerName} was banished defending against your card!`,
          ...prev,
        ]);
      } else if (p.attackerDamage !== undefined) {
        setDamage((prev) => ({ ...prev, [p.attackerId]: p.attackerDamage }));
        setOpponentExerted((prev) => ({ ...prev, [p.attackerId]: true }));
      }
    });

    const unsubDisconnect = webSocketService.subscribe('OPPONENT_DISCONNECTED', (data: any) => {
      if (checkFromMe(data)) return;
      showNotice('Opponent disconnected! Grace period started (60s)...', 'warning');
      setIsOpponentDisconnected(true);
      let secondsLeft = 60;
      setDisconnectCountdown(secondsLeft);

      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      disconnectTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setDisconnectCountdown(Math.max(secondsLeft, 0));
        if (secondsLeft <= 0 && disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      }, 1000);
    });

    const unsubLeft = webSocketService.subscribe('OPPONENT_LEFT' as any, (data: any) => {
      if (checkFromMe(data)) return;
      showNotice(`${data.username || 'Opponent'} left the match.`, 'warning');
      setIsOpponentDisconnected(false);
      setDisconnectCountdown(0);
      if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
      setLogMessages((prev) => [`${data.username || 'Opponent'} exited the match.`, ...prev]);
      setOpponentLeftName(data.username || opponentName || 'Opponent');
    });

    const sendStateSnapshot = () => {
      const bs = boardStateRef.current;
      const isP1 = playerRoleRef.current === 'player1';
      webSocketService.sendAction('STATE_SYNC_RESPONSE' as any, {
        roomId,
        role: playerRoleRef.current,
        username: myUsername,
        payload: {
          loreP1: isP1 ? bs.playerLore : bs.opponentLore,
          loreP2: isP1 ? bs.opponentLore : bs.playerLore,
          inkP1: isP1 ? bs.availableInk : bs.opponentInk,
          inkP2: isP1 ? bs.opponentInk : bs.availableInk,
          inkCapP1: isP1 ? bs.inkwellCapacity : bs.opponentInkCapacity,
          inkCapP2: isP1 ? bs.opponentInkCapacity : bs.inkwellCapacity,
          turnNumber: turnNumberRef.current,
          isTurnP1: isP1 ? bs.isMyTurn : !bs.isMyTurn,
          p1FieldCards: isP1 ? bs.fieldCards : bs.opponentFieldCards,
          p2FieldCards: isP1 ? bs.opponentFieldCards : bs.fieldCards,
          damage: bs.damage,
          p1Exerted: isP1 ? bs.exertedCards : bs.opponentExerted,
          p2Exerted: isP1 ? bs.opponentExerted : bs.exertedCards,
        },
      });
    };

    const unsubReconnected = webSocketService.subscribe('PLAYER_RECONNECTED', (data: any) => {
      if (data.isSelf) {
        if (awaitingSyncRef.current) {
          webSocketService.sendAction('REQUEST_STATE_SYNC' as any, {
            roomId,
            role: playerRoleRef.current,
            username: myUsername,
          });
        }
        return;
      }
      markOpponentActive(data.username);
      if (!awaitingSyncRef.current) {
        showNotice(`🎉 ${data.username || 'Opponent'} reconnected to the match!`, 'success');
        setLogMessages((prev) => [`Opponent reconnected to the room. Match resumed.`, ...prev]);
        sendStateSnapshot();
      }
    });

    const unsubSyncRequest = webSocketService.subscribe('REQUEST_STATE_SYNC', (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (awaitingSyncRef.current) return;
      sendStateSnapshot();
    });

    const unsubSyncResponse = webSocketService.subscribe('STATE_SYNC_RESPONSE', (data: any) => {
      if (checkFromMe(data)) return;
      markOpponentActive(data.username);
      if (!awaitingSyncRef.current) return;
      awaitingSyncRef.current = false;
      const p = data.payload || data;
      if (p) {
        const isP1 = playerRoleRef.current === 'player1';
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
        const oppF = isP1 ? p.p2FieldCards || p.fieldCards : p.p1FieldCards || p.opponentFieldCards || p.fieldCards;
        const myF = isP1 ? p.p1FieldCards || p.opponentFieldCards : p.p2FieldCards || p.fieldCards;
        if (oppF && Array.isArray(oppF)) {
          setOpponentFieldCards(oppF);
        }
        if (myF && Array.isArray(myF) && myF.length > 0 && (!fieldCards || fieldCards.length === 0)) {
          setFieldCards(myF);
        }
        if (p.damage) {
          setDamage((prev) => ({ ...prev, ...p.damage }));
        }
        const oppEx = isP1 ? p.p2Exerted || p.exertedCards : p.p1Exerted || p.opponentExerted || p.exertedCards;
        if (oppEx) {
          setOpponentExerted((prev) => ({ ...prev, ...oppEx }));
        }
        showNotice('Game state synced with match server.', 'success');
      }
    });

    const handleUndoRequestedEvent = (data: any) => {
      if (checkFromMe(data)) return;
      const p = data.payload || data;
      const fromUsername = p.requesterUsername || p.username || data.username || data.requesterUsername;

      markOpponentActive(fromUsername);
      setIncomingUndoRequest({
        requesterUsername: fromUsername || 'Opponent',
        previousState: p.previousState || data.previousState,
      });
      let secondsLeft = 15;
      setUndoVoteTimer(secondsLeft);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      undoTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setUndoVoteTimer(Math.max(secondsLeft, 0));
        if (secondsLeft <= 0) {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          handleRespondUndoVote(false);
        }
      }, 1000);
    };

    const unsubUndoRequested = webSocketService.subscribe('UNDO_REQUESTED', handleUndoRequestedEvent);

    const handleUndoResolvedEvent = (data: any) => {
      if (checkFromMe(data)) return;
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
        setPreviousSnapshot(null);
        setUndoCountRemaining((prev) => Math.max(0, prev - 1));
        showNotice('Opponent accepted your undo request! Action reverted.', 'success');
        setLogMessages((prev) => [`Undo request ACCEPTED by opponent. Turn action rolled back.`, ...prev]);
      } else {
        showNotice('Opponent declined your undo request.', 'error');
        setLogMessages((prev) => [`Undo request DECLINED by opponent.`, ...prev]);
      }
    };

    const unsubUndoResolved = webSocketService.subscribe('UNDO_RESOLVED', handleUndoResolvedEvent);

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
        setChatMessages((prev) => [
          ...prev,
          {
            username: data.username!,
            message: data.message!,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setUnreadChatCount((prev) => prev + 1);
        showNotice(`💬 ${data.username}: ${data.message}`, 'warning');
      }
    });

    const unsubAll = webSocketService.subscribe('all', (data: any) => {
      if (!checkFromMe(data) && data.action !== 'OPPONENT_DISCONNECTED' && data.gameAction !== 'OPPONENT_DISCONNECTED') {
        markOpponentActive(data.username);
      }
    });

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
          const myLore = playerRole === 'player1' ? p.loreP1 || 0 : p.loreP2 || 0;
          const oppLore = playerRole === 'player1' ? p.loreP2 || 0 : p.loreP1 || 0;
          const myInk = playerRole === 'player1' ? p.inkP1 || 0 : p.inkP2 || 0;
          const oppInk = playerRole === 'player1' ? p.inkP2 || 0 : p.inkP1 || 0;
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
      unsubUndoResolved();
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
  }, [
    matchMode,
    playerRole,
    myUsername,
    roomId,
    isRejoin,
    opponentName,
    playerLore,
    opponentLore,
    fieldCards,
    token,
    savedBoard,
    boardStateRef,
    turnNumberRef,
    playerRoleRef,
    awaitingSyncRef,
    disconnectTimerRef,
    undoTimerRef,
    matchReportedRef,
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
  ]);
}
