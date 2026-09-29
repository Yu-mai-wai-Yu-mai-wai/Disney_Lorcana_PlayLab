import type {
  GameState,
  GameAction,
  ActionResult,
  GameEvent,
  GamePrompt,
  PlayerState,
  LorcanaCard,
  InPlayCard,
} from './types';
import { canInkCard, canPlayCard, canQuest, canChallenge } from './rules';
import { parseCardKeywords, getEffectiveStrength, getEffectiveDamage } from './keywords';
import { parseCardAbilities } from './abilities';

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

let instanceCounter = 0;
function generateInstanceId(cardId: string): string {
  instanceCounter += 1;
  return `inst_${cardId}_${Date.now()}_${instanceCounter}`;
}

export function createInitialPlayerState(id: string, username = ''): PlayerState {
  return {
    id,
    username: username || id,
    deck: [],
    hand: [],
    play: [],
    inkwell: [],
    availableInk: 0,
    discard: [],
    lore: 0,
    hasInkedThisTurn: false,
    hasDeckedOut: false,
  };
}

export function createInitialState(playerIds = ['player1', 'player2']): GameState {
  const players: Record<string, PlayerState> = {};
  for (const id of playerIds) {
    players[id] = createInitialPlayerState(id);
  }

  return {
    turnNumber: 1,
    activePlayerId: playerIds[0] || 'player1',
    phase: 'main',
    players,
    playerOrder: [...playerIds],
    isGameOver: false,
    pendingPrompts: [],
  };
}

function processAbilities(
  state: GameState,
  playerId: string,
  card: LorcanaCard,
  triggerTiming: 'on_play' | 'on_quest',
  events: GameEvent[],
  prompts: GamePrompt[],
  sourceInstanceId?: string
) {
  const opponentId = state.playerOrder.find((id) => id !== playerId);
  const player = state.players[playerId];
  const opponent = opponentId ? state.players[opponentId] : undefined;

  const abilities = parseCardAbilities(card);
  for (const ab of abilities) {
    if (ab.timing !== triggerTiming) continue;

    if (ab.effect.type === 'draw') {
      const count = ab.effect.amount || 1;
      for (let i = 0; i < count; i++) {
        if (player.deck.length > 0) {
          const drawn = player.deck.shift()!;
          player.hand.push(drawn);
          events.push({
            type: 'CARD_DRAWN',
            playerId,
            message: `${player.username} drew a card from ability [${ab.name}].`,
          });
        }
      }
      events.push({
        type: 'ABILITY_TRIGGERED',
        playerId,
        message: `${card.name}'s ability [${ab.name}] triggered: drew ${count} card(s).`,
      });
    } else if (ab.effect.type === 'gain_lore') {
      const gain = ab.effect.amount || 1;
      player.lore += gain;
      events.push({
        type: 'ABILITY_TRIGGERED',
        playerId,
        message: `${card.name}'s ability [${ab.name}] triggered: gained ${gain} lore.`,
      });
      events.push({
        type: 'LORE_CHANGED',
        playerId,
        message: `${player.username}'s lore increased to ${player.lore}.`,
      });
      if (player.lore >= 20) {
        state.isGameOver = true;
        state.winnerId = playerId;
        state.loserId = opponentId;
        state.winReason = `${player.username} reached 20 Lore!`;
      }
    } else if (ab.effect.type === 'lose_lore') {
      if (opponent) {
        const loss = ab.effect.amount || 1;
        opponent.lore = Math.max(0, opponent.lore - loss);
        events.push({
          type: 'ABILITY_TRIGGERED',
          playerId,
          message: `${card.name}'s ability [${ab.name}] triggered: opponent lost ${loss} lore.`,
        });
      }
    } else if (ab.effect.needsTarget) {
      const candidates: { pid: string; card: InPlayCard }[] = [];
      if (ab.effect.targetScope === 'all' || ab.effect.targetScope === 'friendly') {
        player.play.forEach((c) => candidates.push({ pid: playerId, card: c }));
      }
      if (ab.effect.targetScope === 'all' || ab.effect.targetScope === 'opposing') {
        if (opponent) {
          opponent.play.forEach((c) => {
            const kw = parseCardKeywords(c.card);
            if (!kw.ward) {
              candidates.push({ pid: opponent.id, card: c });
            }
          });
        }
      }

      const filtered = candidates.filter(({ card: c }) => {
        if (ab.effect.maxStrength !== undefined && (c.card.strength || 0) > ab.effect.maxStrength) {
          return false;
        }
        if (ab.effect.maxCost !== undefined && (c.card.cost || 0) > ab.effect.maxCost) {
          return false;
        }
        return true;
      });

      const validTargetIds = filtered.map((c) => c.card.instanceId);

      const promptId = `prompt_${Date.now()}_${++instanceCounter}`;
      const prompt: GamePrompt = {
        id: promptId,
        type: 'CHOOSE_TARGET',
        playerId,
        message: `${card.name} [${ab.name}]: choose a target`,
        validTargetIds,
        effectPayload: {
          actionType: 'TRIGGER_ABILITY',
          abilityName: ab.name,
          sourceInstanceId,
          sourceCardName: card.name,
          effectType: ab.effect.type,
          amount: ab.effect.amount,
        },
      };

      prompts.push(prompt);
      if (!state.pendingPrompts) state.pendingPrompts = [];
      state.pendingPrompts.push(prompt);
    }
  }
}

export function applyAction(state: GameState, action: GameAction): ActionResult {
  const nextState = cloneState(state);
  const events: GameEvent[] = [];
  const prompts: GamePrompt[] = [];

  switch (action.type) {
    case 'START_GAME': {
      const p1Id = action.firstPlayerId || nextState.playerOrder[0] || 'player1';
      const p2Id = nextState.playerOrder.find((id) => id !== p1Id) || 'player2';

      nextState.playerOrder = [p1Id, p2Id];
      nextState.activePlayerId = p1Id;
      nextState.turnNumber = 1;
      nextState.phase = 'main';
      nextState.isGameOver = false;

      for (const pid of nextState.playerOrder) {
        const rawDeck = action.initialDecks?.[pid] ? [...action.initialDecks[pid]] : [];
        const initialHand = rawDeck.splice(0, 7);
        nextState.players[pid] = {
          ...createInitialPlayerState(pid, action.playerNames?.[pid]),
          deck: rawDeck,
          hand: initialHand,
        };
      }

      events.push({
        type: 'GAME_STARTED',
        playerId: p1Id,
        message: `Match started! ${nextState.players[p1Id]?.username || p1Id} plays first.`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'START_TURN': {
      if (nextState.isGameOver) {
        return { success: false, state, events, prompts, error: 'Game is already over' };
      }

      const activeId = action.playerId || nextState.activePlayerId;
      const player = nextState.players[activeId];
      if (!player) {
        return { success: false, state, events, prompts, error: `Player ${activeId} not found` };
      }

      // Ready step:
      for (const card of player.play) {
        card.isExerted = false;
        card.isDrying = false;
      }
      player.availableInk = player.inkwell.length;
      player.hasInkedThisTurn = false;

      // Draw step:
      // In standard Lorcana, first player skips drawing on turn 1
      const isFirstTurnFirstPlayer = nextState.turnNumber === 1 && activeId === nextState.playerOrder[0];
      if (!isFirstTurnFirstPlayer) {
        if (player.deck.length > 0) {
          const drawn = player.deck.shift()!;
          player.hand.push(drawn);
          events.push({
            type: 'CARD_DRAWN',
            playerId: activeId,
            message: `${player.username} drew a card.`,
          });
        } else {
          // Deck is empty: flagged for loss at end of turn!
          player.hasDeckedOut = true;
          events.push({
            type: 'ACTION_FAILED',
            playerId: activeId,
            message: `${player.username} attempted to draw from an empty deck!`,
          });
        }
      }

      // Location lore step (locations in play grant passive lore automatically every turn)
      for (const inPlay of player.play) {
        if (inPlay.card.type === 'Location') {
          const locLore = inPlay.card.lore || 0;
          if (locLore > 0) {
            player.lore += locLore;
            events.push({
              type: 'LORE_CHANGED',
              playerId: activeId,
              message: `${inPlay.card.name} generated ${locLore} lore. Total: ${player.lore}.`,
            });
            if (player.lore >= 20) {
              nextState.isGameOver = true;
              nextState.winnerId = activeId;
              const opponentId = nextState.playerOrder.find((id) => id !== activeId);
              nextState.loserId = opponentId;
              nextState.winReason = `${player.username} reached 20 Lore from locations!`;
            }
          }
        }
      }

      nextState.phase = 'main';
      events.push({
        type: 'TURN_STARTED',
        playerId: activeId,
        message: `Turn ${nextState.turnNumber}: ${player.username}'s turn started.`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'INK_CARD': {
      const check = canInkCard(nextState, action.playerId, action.cardId);
      if (!check.allowed || !check.card) {
        return { success: false, state, events, prompts, error: check.reason };
      }

      const player = nextState.players[action.playerId];
      const cardIdx = player.hand.findIndex((c) => c.id === action.cardId);
      const [inkedCard] = player.hand.splice(cardIdx, 1);

      player.inkwell.push(inkedCard);
      player.availableInk += 1;
      player.hasInkedThisTurn = true;

      events.push({
        type: 'CARD_INKED',
        playerId: action.playerId,
        message: `${player.username} inked ${inkedCard.name}. Total ink: ${player.inkwell.length}.`,
        details: { cardId: inkedCard.id, cardName: inkedCard.name },
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'PLAY_CARD': {
      const check = canPlayCard(nextState, action.playerId, action.cardId);
      if (!check.allowed || !check.card) {
        return { success: false, state, events, prompts, error: check.reason };
      }

      const player = nextState.players[action.playerId];
      const cardIdx = player.hand.findIndex((c) => c.id === action.cardId);
      const [card] = player.hand.splice(cardIdx, 1);

      const cost = card.cost || 0;
      player.availableInk = Math.max(0, player.availableInk - cost);

      let createdInstanceId: string | undefined;
      if (card.type === 'Character') {
        createdInstanceId = generateInstanceId(card.id);
        const inPlay: InPlayCard = {
          instanceId: createdInstanceId,
          card,
          isDrying: true,
          isExerted: false,
          damage: 0,
        };
        player.play.push(inPlay);
      } else if (card.type === 'Item' || card.type === 'Location') {
        createdInstanceId = generateInstanceId(card.id);
        const inPlay: InPlayCard = {
          instanceId: createdInstanceId,
          card,
          isDrying: false,
          isExerted: false,
          damage: 0,
        };
        player.play.push(inPlay);
      } else {
        // Action / Song: goes straight to discard
        player.discard.push(card);
      }

      events.push({
        type: 'CARD_PLAYED',
        playerId: action.playerId,
        message: `${player.username} played ${card.name} (cost ${cost}).`,
        details: { cardId: card.id, cardName: card.name, cost },
      });

      // Trigger on_play abilities
      processAbilities(nextState, action.playerId, card, 'on_play', events, prompts, createdInstanceId);

      return { success: true, state: nextState, events, prompts };
    }

    case 'QUEST': {
      const check = canQuest(nextState, action.playerId, action.instanceId);
      if (!check.allowed || !check.card) {
        return { success: false, state, events, prompts, error: check.reason };
      }

      const player = nextState.players[action.playerId];
      const inPlay = check.card;
      inPlay.isExerted = true;

      const loreGain = inPlay.card.lore || 0;
      player.lore += loreGain;

      events.push({
        type: 'CARD_QUESTED',
        playerId: action.playerId,
        message: `${player.username} quested with ${inPlay.card.name} for ${loreGain} lore. Total: ${player.lore}.`,
        details: { instanceId: inPlay.instanceId, loreGain },
      });

      // Trigger on_quest abilities
      processAbilities(nextState, action.playerId, inPlay.card, 'on_quest', events, prompts, inPlay.instanceId);

      // Victory Condition: Reached 20 lore
      if (player.lore >= 20) {
        nextState.isGameOver = true;
        nextState.winnerId = action.playerId;
        const opponentId = nextState.playerOrder.find((id) => id !== action.playerId);
        nextState.loserId = opponentId;
        nextState.winReason = `${player.username} reached 20 Lore!`;

        events.push({
          type: 'GAME_WON',
          playerId: action.playerId,
          message: `${player.username} won the match with ${player.lore} Lore!`,
        });
      }

      return { success: true, state: nextState, events, prompts };
    }

    case 'CHALLENGE': {
      const check = canChallenge(
        nextState,
        action.playerId,
        action.attackerInstanceId,
        action.defenderInstanceId
      );
      if (!check.allowed || !check.attacker || !check.defender || !check.opponentId) {
        return { success: false, state, events, prompts, error: check.reason };
      }

      const attacker = check.attacker;
      const defender = check.defender;
      const attackerOwner = nextState.players[action.playerId];
      const defenderOwner = nextState.players[check.opponentId];

      attacker.isExerted = true;

      const attackerKw = parseCardKeywords(attacker.card);
      const defenderKw = parseCardKeywords(defender.card);

      const attackerStrength = getEffectiveStrength(attacker.card, true);
      const defenderStrength = getEffectiveStrength(defender.card, false);

      const damageToAttacker = getEffectiveDamage(defenderStrength, attackerKw.resist);
      const damageToDefender = getEffectiveDamage(attackerStrength, defenderKw.resist);

      attacker.damage += damageToAttacker;
      defender.damage += damageToDefender;

      events.push({
        type: 'CHALLENGE_RESOLVED',
        playerId: action.playerId,
        message: `${attacker.card.name} challenged ${defender.card.name}!`,
        details: {
          attackerInstanceId: attacker.instanceId,
          defenderInstanceId: defender.instanceId,
          attackerDamageTaken: damageToAttacker,
          defenderDamageTaken: damageToDefender,
        },
      });

      // Check banishment: damage >= willpower
      const attackerWillpower = attacker.card.willpower || 0;
      const defenderWillpower = defender.card.willpower || 0;

      if (attacker.damage >= attackerWillpower) {
        attackerOwner.play = attackerOwner.play.filter((c) => c.instanceId !== attacker.instanceId);
        attackerOwner.discard.push(attacker.card);
        events.push({
          type: 'CARD_BANISHED',
          playerId: action.playerId,
          message: `${attacker.card.name} was banished in challenge!`,
        });
      }

      if (defender.damage >= defenderWillpower) {
        defenderOwner.play = defenderOwner.play.filter((c) => c.instanceId !== defender.instanceId);
        defenderOwner.discard.push(defender.card);
        events.push({
          type: 'CARD_BANISHED',
          playerId: check.opponentId,
          message: `${defender.card.name} was banished in challenge!`,
        });
      }

      return { success: true, state: nextState, events, prompts };
    }

    case 'PASS_TURN': {
      if (nextState.isGameOver) {
        return { success: false, state, events, prompts, error: 'Game is already over' };
      }

      const currentActiveId = nextState.activePlayerId;
      const currentPlayer = nextState.players[currentActiveId];

      // Reckless check: Cannot end turn if ready Reckless character has legal challenge targets
      const opponentId = nextState.playerOrder.find((id) => id !== currentActiveId);
      const opponent = opponentId ? nextState.players[opponentId] : undefined;

      if (currentPlayer && opponent) {
        for (const character of currentPlayer.play) {
          if (!character.isExerted && !character.isDrying) {
            const kw = parseCardKeywords(character.card);
            if (kw.reckless) {
              const hasLegalTarget = opponent.play.some((oppCard) => {
                const check = canChallenge(nextState, currentActiveId, character.instanceId, oppCard.instanceId);
                return check.allowed;
              });
              if (hasLegalTarget) {
                return {
                  success: false,
                  state,
                  events,
                  prompts,
                  error: `Cannot end turn: ${character.card.name} has Reckless and must challenge`,
                };
              }
            }
          }
        }
      }

      // End of turn evaluation: Deck-out check!
      if (currentPlayer?.hasDeckedOut) {
        nextState.isGameOver = true;
        nextState.loserId = currentActiveId;
        nextState.winnerId = opponentId;
        nextState.winReason = `${currentPlayer.username} deck empty at end of turn (deck-out rule)`;

        events.push({
          type: 'GAME_LOST',
          playerId: currentActiveId,
          message: `${currentPlayer.username} lost due to empty deck at end of turn!`,
        });
        return { success: true, state: nextState, events, prompts };
      }

      events.push({
        type: 'TURN_ENDED',
        playerId: currentActiveId,
        message: `${currentPlayer?.username || currentActiveId}'s turn ended.`,
      });

      // Cycle next player
      const nextIdx = (nextState.playerOrder.indexOf(currentActiveId) + 1) % nextState.playerOrder.length;
      const nextPlayerId = nextState.playerOrder[nextIdx];
      nextState.activePlayerId = nextPlayerId;
      nextState.turnNumber += 1;

      // Automatically execute START_TURN for next player
      return applyAction(nextState, { type: 'START_TURN', playerId: nextPlayerId });
    }

    case 'RESOLVE_PROMPT': {
      if (nextState.isGameOver) {
        return { success: false, state, events, prompts, error: 'Game is already over' };
      }

      if (!nextState.pendingPrompts || nextState.pendingPrompts.length === 0) {
        return { success: false, state, events, prompts, error: 'No pending prompts found' };
      }

      const promptIdx = nextState.pendingPrompts.findIndex((p) => p.id === action.promptId);
      if (promptIdx === -1) {
        return { success: false, state, events, prompts, error: `Prompt ${action.promptId} not found` };
      }

      const [prompt] = nextState.pendingPrompts.splice(promptIdx, 1);
      const chosenTargetId = action.chosenTargetId;

      if (!chosenTargetId || !prompt.validTargetIds?.includes(chosenTargetId)) {
        return { success: false, state, events, prompts, error: 'Invalid target selected' };
      }

      // Locate target across all players
      let targetPlayerId: string | undefined;
      let targetCard: InPlayCard | undefined;
      for (const pid of Object.keys(nextState.players)) {
        const found = nextState.players[pid].play.find((c) => c.instanceId === chosenTargetId);
        if (found) {
          targetPlayerId = pid;
          targetCard = found;
          break;
        }
      }

      if (!targetPlayerId || !targetCard) {
        return { success: false, state, events, prompts, error: 'Target card not found in play' };
      }

      const targetOwner = nextState.players[targetPlayerId];
      const targetKw = parseCardKeywords(targetCard.card);

      // Vanish keyword rule: When this character is chosen by an opponent as part of an effect, banish them!
      const isOpponentChoice = targetPlayerId !== action.playerId;
      if (isOpponentChoice && targetKw.vanish) {
        targetOwner.play = targetOwner.play.filter((c) => c.instanceId !== targetCard.instanceId);
        targetOwner.discard.push(targetCard.card);
        events.push({
          type: 'CARD_BANISHED',
          playerId: targetPlayerId,
          message: `${targetCard.card.name} vanished when chosen by opponent!`,
        });
      } else {
        const effectType = prompt.effectPayload?.effectType;
        const amount = prompt.effectPayload?.amount || 1;

        if (effectType === 'banish_chosen') {
          targetOwner.play = targetOwner.play.filter((c) => c.instanceId !== targetCard.instanceId);
          targetOwner.discard.push(targetCard.card);
          events.push({
            type: 'CARD_BANISHED',
            playerId: targetPlayerId,
            message: `${targetCard.card.name} was banished by ${prompt.effectPayload?.abilityName || 'ability'}!`,
          });
        } else if (effectType === 'deal_damage') {
          targetCard.damage += amount;
          events.push({
            type: 'DAMAGE_DEALT',
            playerId: targetPlayerId,
            message: `${targetCard.card.name} took ${amount} damage from ${prompt.effectPayload?.abilityName || 'ability'}.`,
          });
          if (targetCard.damage >= (targetCard.card.willpower || 0)) {
            targetOwner.play = targetOwner.play.filter((c) => c.instanceId !== targetCard.instanceId);
            targetOwner.discard.push(targetCard.card);
            events.push({
              type: 'CARD_BANISHED',
              playerId: targetPlayerId,
              message: `${targetCard.card.name} was banished due to damage!`,
            });
          }
        } else if (effectType === 'remove_damage') {
          targetCard.damage = Math.max(0, targetCard.damage - amount);
          events.push({
            type: 'ABILITY_TRIGGERED',
            playerId: action.playerId,
            message: `Removed ${amount} damage from ${targetCard.card.name}.`,
          });
        } else if (effectType === 'exert_chosen') {
          targetCard.isExerted = true;
          events.push({
            type: 'CARD_EXERTED',
            playerId: targetPlayerId,
            message: `${targetCard.card.name} was exerted by ability.`,
          });
        } else if (effectType === 'ready_chosen') {
          targetCard.isExerted = false;
          events.push({
            type: 'CARD_READIED',
            playerId: targetPlayerId,
            message: `${targetCard.card.name} was readied by ability.`,
          });
        } else if (effectType === 'return_to_hand') {
          targetOwner.play = targetOwner.play.filter((c) => c.instanceId !== targetCard.instanceId);
          targetOwner.hand.push(targetCard.card);
          events.push({
            type: 'ABILITY_TRIGGERED',
            playerId: targetPlayerId,
            message: `${targetCard.card.name} returned to hand.`,
          });
        }
      }

      events.push({
        type: 'PROMPT_RESOLVED',
        playerId: action.playerId,
        message: `Resolved prompt for ${prompt.effectPayload?.abilityName || 'ability'}.`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'SHIFT_CARD': {
      if (nextState.isGameOver) return { success: false, state, events, prompts, error: 'Game is already over' };
      if (nextState.activePlayerId !== action.playerId) return { success: false, state, events, prompts, error: 'Not your turn' };
      if (nextState.phase !== 'main') return { success: false, state, events, prompts, error: 'Can only shift during main phase' };

      const player = nextState.players[action.playerId];
      const cardIdx = player.hand.findIndex((c) => c.id === action.cardId);
      if (cardIdx === -1) return { success: false, state, events, prompts, error: 'Shift card not found in hand' };
      const card = player.hand[cardIdx];

      const targetIdx = player.play.findIndex((c) => c.instanceId === action.targetInstanceId);
      if (targetIdx === -1) return { success: false, state, events, prompts, error: 'Target character not found in play' };
      const target = player.play[targetIdx];

      const kw = parseCardKeywords(card);
      if (!kw.shift) return { success: false, state, events, prompts, error: `${card.name} does not have Shift` };

      // Name check (or universal shift): base name must match
      if (kw.shift.variant !== 'universal' && target.card.name.toLowerCase() !== card.name.toLowerCase()) {
        return { success: false, state, events, prompts, error: `Cannot shift: ${card.name} must be played on ${card.name}` };
      }

      if (player.availableInk < kw.shift.cost) {
        return { success: false, state, events, prompts, error: `Insufficient ink to shift (needs ${kw.shift.cost}, available ${player.availableInk})` };
      }

      player.availableInk -= kw.shift.cost;
      player.hand.splice(cardIdx, 1);

      const shiftedCard: InPlayCard = {
        instanceId: generateInstanceId(card.id),
        card,
        isDrying: target.isDrying,
        isExerted: target.isExerted,
        damage: target.damage,
        atLocationId: target.atLocationId,
        shiftedOn: [target, ...(target.shiftedOn || [])],
      };

      player.play.splice(targetIdx, 1, shiftedCard);

      events.push({
        type: 'CARD_PLAYED',
        playerId: action.playerId,
        message: `${player.username} shifted ${card.name} (${card.title || ''}) onto ${target.card.name} for ${kw.shift.cost} ink.`,
        details: { cardId: card.id, shiftCost: kw.shift.cost, targetInstanceId: target.instanceId },
      });

      processAbilities(nextState, action.playerId, card, 'on_play', events, prompts, shiftedCard.instanceId);

      return { success: true, state: nextState, events, prompts };
    }

    case 'MOVE_TO_LOCATION': {
      if (nextState.isGameOver) return { success: false, state, events, prompts, error: 'Game is already over' };
      if (nextState.activePlayerId !== action.playerId) return { success: false, state, events, prompts, error: 'Not your turn' };
      if (nextState.phase !== 'main') return { success: false, state, events, prompts, error: 'Can only move during main phase' };

      const player = nextState.players[action.playerId];
      const char = player.play.find((c) => c.instanceId === action.characterInstanceId);
      if (!char || char.card.type !== 'Character') return { success: false, state, events, prompts, error: 'Character not found' };

      const loc = player.play.find((c) => c.instanceId === action.locationInstanceId);
      if (!loc || loc.card.type !== 'Location') return { success: false, state, events, prompts, error: 'Location not found' };

      const moveCost = loc.card.moveCost !== undefined ? loc.card.moveCost : 1;
      if (player.availableInk < moveCost) {
        return { success: false, state, events, prompts, error: `Insufficient ink to move (needs ${moveCost}, available ${player.availableInk})` };
      }

      player.availableInk -= moveCost;
      char.atLocationId = loc.instanceId;

      events.push({
        type: 'ABILITY_TRIGGERED',
        playerId: action.playerId,
        message: `${char.card.name} moved to ${loc.card.name} for ${moveCost} ink.`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'SING_SONG': {
      if (nextState.isGameOver) return { success: false, state, events, prompts, error: 'Game is already over' };
      if (nextState.activePlayerId !== action.playerId) return { success: false, state, events, prompts, error: 'Not your turn' };
      if (nextState.phase !== 'main') return { success: false, state, events, prompts, error: 'Can only sing during main phase' };

      const player = nextState.players[action.playerId];
      const cardIdx = player.hand.findIndex((c) => c.id === action.cardId);
      if (cardIdx === -1) return { success: false, state, events, prompts, error: 'Song card not found in hand' };
      const song = player.hand[cardIdx];

      if (!action.singerInstanceIds || action.singerInstanceIds.length === 0) {
        return { success: false, state, events, prompts, error: 'No singers selected' };
      }

      const singers: InPlayCard[] = [];
      for (const sId of action.singerInstanceIds) {
        const s = player.play.find((c) => c.instanceId === sId);
        if (!s) return { success: false, state, events, prompts, error: `Singer ${sId} not found on board` };
        if (s.isDrying) return { success: false, state, events, prompts, error: `Singer ${s.card.name} is drying and cannot sing` };
        if (s.isExerted) return { success: false, state, events, prompts, error: `Singer ${s.card.name} is already exerted` };
        singers.push(s);
      }

      const songCost = song.cost || 0;
      let totalSingerPower = 0;
      if (singers.length === 1) {
        const sKw = parseCardKeywords(singers[0].card);
        totalSingerPower = sKw.singer || singers[0].card.cost || 0;
      } else {
        totalSingerPower = singers.reduce((acc, s) => acc + (s.card.cost || 0), 0);
      }

      if (totalSingerPower < songCost) {
        return { success: false, state, events, prompts, error: `Singing power ${totalSingerPower} insufficient for song cost ${songCost}` };
      }

      // Exert all singers
      for (const s of singers) {
        s.isExerted = true;
        events.push({
          type: 'CARD_EXERTED',
          playerId: action.playerId,
          message: `${s.card.name} exerted to sing ${song.name}.`,
        });
      }

      player.hand.splice(cardIdx, 1);
      player.discard.push(song);

      events.push({
        type: 'CARD_PLAYED',
        playerId: action.playerId,
        message: `${player.username} sang ${song.name} (free with singers).`,
        details: { cardId: song.id, cardName: song.name },
      });

      processAbilities(nextState, action.playerId, song, 'on_play', events, prompts);

      return { success: true, state: nextState, events, prompts };
    }

    case 'USE_ITEM_ABILITY': {
      if (nextState.isGameOver) return { success: false, state, events, prompts, error: 'Game is already over' };
      if (nextState.activePlayerId !== action.playerId) return { success: false, state, events, prompts, error: 'Not your turn' };
      if (nextState.phase !== 'main') return { success: false, state, events, prompts, error: 'Can only use abilities during main phase' };

      const player = nextState.players[action.playerId];
      const item = player.play.find((c) => c.instanceId === action.itemInstanceId);
      if (!item || item.card.type !== 'Item') return { success: false, state, events, prompts, error: 'Item not found' };

      // Parse item ability
      const abilities = parseCardAbilities(item.card);
      const ab = abilities[0];
      if (!ab) return { success: false, state, events, prompts, error: 'Item has no abilities' };

      // Check cost requirements: e.g. "⟳, 4 ⬡ — Draw a card."
      const lower = ab.rawText.toLowerCase();
      const inkMatch = lower.match(/(\d+)\s*(?:⬡|ink)/i);
      const inkCost = inkMatch ? parseInt(inkMatch[1], 10) : 0;
      const requiresExert = /⟳|exert/i.test(ab.rawText);

      if (requiresExert && item.isExerted) {
        return { success: false, state, events, prompts, error: `${item.card.name} is already exerted` };
      }

      if (player.availableInk < inkCost) {
        return { success: false, state, events, prompts, error: `Insufficient ink (needs ${inkCost}, available ${player.availableInk})` };
      }

      if (inkCost > 0) player.availableInk -= inkCost;
      if (requiresExert) item.isExerted = true;

      // Execute item effect
      if (ab.effect.type === 'draw') {
        const count = ab.effect.amount || 1;
        for (let i = 0; i < count; i++) {
          if (player.deck.length > 0) {
            player.hand.push(player.deck.shift()!);
          }
        }
        events.push({
          type: 'CARD_DRAWN',
          playerId: action.playerId,
          message: `${player.username} drew ${count} card(s) from ${item.card.name}.`,
        });
      } else if (ab.effect.type === 'remove_damage' && action.targetInstanceId) {
        const target = player.play.find((c) => c.instanceId === action.targetInstanceId);
        if (target) {
          target.damage = Math.max(0, target.damage - (ab.effect.amount || 1));
          events.push({
            type: 'ABILITY_TRIGGERED',
            playerId: action.playerId,
            message: `Removed damage from ${target.card.name}.`,
          });
        }
      }

      events.push({
        type: 'ABILITY_TRIGGERED',
        playerId: action.playerId,
        message: `${player.username} activated ${item.card.name} [${ab.name}].`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'CONCEDE': {
      nextState.isGameOver = true;
      nextState.loserId = action.playerId;
      const opponentId = nextState.playerOrder.find((id) => id !== action.playerId);
      nextState.winnerId = opponentId;
      nextState.winReason = `${nextState.players[action.playerId]?.username || action.playerId} conceded.`;

      events.push({
        type: 'GAME_WON',
        playerId: opponentId || 'opponent',
        message: `${nextState.players[action.playerId]?.username || action.playerId} conceded the match.`,
      });

      return { success: true, state: nextState, events, prompts };
    }

    case 'MANUAL_SET_LORE': {
      const target = nextState.players[action.targetPlayerId];
      if (target) {
        target.lore = Math.max(0, action.lore);
        events.push({
          type: 'LORE_CHANGED',
          playerId: action.targetPlayerId,
          message: `${target.username}'s lore adjusted to ${target.lore}.`,
        });
        if (target.lore >= 20) {
          nextState.isGameOver = true;
          nextState.winnerId = action.targetPlayerId;
          nextState.loserId = nextState.playerOrder.find((id) => id !== action.targetPlayerId);
          nextState.winReason = `${target.username} reached 20 Lore!`;
        }
      }
      return { success: true, state: nextState, events, prompts };
    }

    case 'MANUAL_SET_DAMAGE': {
      for (const pid of Object.keys(nextState.players)) {
        const card = nextState.players[pid].play.find((c) => c.instanceId === action.instanceId);
        if (card) {
          card.damage = Math.max(0, action.damage);
          events.push({
            type: 'DAMAGE_DEALT',
            playerId: pid,
            message: `${card.card.name} damage manually set to ${card.damage}.`,
          });
          break;
        }
      }
      return { success: true, state: nextState, events, prompts };
    }

    case 'MANUAL_BANISH_CARD': {
      for (const pid of Object.keys(nextState.players)) {
        const player = nextState.players[pid];
        const cardIdx = player.play.findIndex((c) => c.instanceId === action.instanceId);
        if (cardIdx !== -1) {
          const [banished] = player.play.splice(cardIdx, 1);
          player.discard.push(banished.card);
          if (banished.shiftedOn && Array.isArray(banished.shiftedOn)) {
            for (const under of banished.shiftedOn) {
              player.discard.push(under.card);
            }
          }
          events.push({
            type: 'CARD_BANISHED',
            playerId: pid,
            message: `${banished.card.name} was manually banished to discard.`,
          });
          break;
        }
      }
      return { success: true, state: nextState, events, prompts };
    }

    default:
      return { success: false, state, events, prompts, error: 'Unknown action' };
  }
}
