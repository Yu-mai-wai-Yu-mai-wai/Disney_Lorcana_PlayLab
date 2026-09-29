import type { GameState, LorcanaCard, InPlayCard } from './types';
import { parseCardKeywords } from './keywords';

/**
 * Checks if a Lorcana card is inkable according to official rules.
 * Strictly checks the inkwell icon / isInkable flag without fallback to true.
 */
export function isCardInkable(card?: LorcanaCard | null): boolean {
  if (!card) return false;
  if (card.inkwell !== undefined) return Boolean(card.inkwell);
  if (card.isInkable !== undefined) return Boolean(card.isInkable);
  return false;
}

export function canInkCard(
  state: GameState,
  playerId: string,
  cardId: string
): { allowed: boolean; reason?: string; card?: LorcanaCard } {
  if (state.isGameOver) return { allowed: false, reason: 'Game is already over' };
  if (state.activePlayerId !== playerId) return { allowed: false, reason: 'Not your turn' };
  if (state.phase !== 'main') return { allowed: false, reason: 'Can only ink during main phase' };

  const player = state.players[playerId];
  if (!player) return { allowed: false, reason: 'Player not found' };

  if (player.hasInkedThisTurn) {
    return { allowed: false, reason: 'You have already inked this turn (max 1 per turn)' };
  }

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return { allowed: false, reason: 'Card not found in hand' };

  if (!isCardInkable(card)) {
    return { allowed: false, reason: `${card.name} is not inkable (no inkwell icon)` };
  }

  return { allowed: true, card };
}

export function canPlayCard(
  state: GameState,
  playerId: string,
  cardId: string
): { allowed: boolean; reason?: string; card?: LorcanaCard } {
  if (state.isGameOver) return { allowed: false, reason: 'Game is already over' };
  if (state.activePlayerId !== playerId) return { allowed: false, reason: 'Not your turn' };
  if (state.phase !== 'main') return { allowed: false, reason: 'Can only play cards during main phase' };

  const player = state.players[playerId];
  if (!player) return { allowed: false, reason: 'Player not found' };

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return { allowed: false, reason: 'Card not found in hand' };

  const cost = card.cost || 0;
  if (player.availableInk < cost) {
    return {
      allowed: false,
      reason: `Cannot play ${card.name}: insufficient ink (needs ${cost}, available ${player.availableInk})`,
    };
  }

  return { allowed: true, card };
}

export function canQuest(
  state: GameState,
  playerId: string,
  instanceId: string
): { allowed: boolean; reason?: string; card?: InPlayCard } {
  if (state.isGameOver) return { allowed: false, reason: 'Game is already over' };
  if (state.activePlayerId !== playerId) return { allowed: false, reason: 'Not your turn' };
  if (state.phase !== 'main') return { allowed: false, reason: 'Can only quest during main phase' };

  const player = state.players[playerId];
  if (!player) return { allowed: false, reason: 'Player not found' };

  const inPlay = player.play.find((c) => c.instanceId === instanceId);
  if (!inPlay) return { allowed: false, reason: 'Character not found on field' };

  if (inPlay.card.type !== 'Character') {
    return { allowed: false, reason: 'Only characters can quest' };
  }

  if (inPlay.isDrying) {
    return { allowed: false, reason: `${inPlay.card.name} was played this turn (ink is drying)` };
  }

  if (inPlay.isExerted) {
    return { allowed: false, reason: `${inPlay.card.name} is already exerted` };
  }

  const kw = parseCardKeywords(inPlay.card);
  if (kw.reckless) {
    return { allowed: false, reason: `${inPlay.card.name} has Reckless and cannot quest` };
  }

  return { allowed: true, card: inPlay };
}

export function canChallenge(
  state: GameState,
  playerId: string,
  attackerInstanceId: string,
  defenderInstanceId: string
): {
  allowed: boolean;
  reason?: string;
  attacker?: InPlayCard;
  defender?: InPlayCard;
  opponentId?: string;
} {
  if (state.isGameOver) return { allowed: false, reason: 'Game is already over' };
  if (state.activePlayerId !== playerId) return { allowed: false, reason: 'Not your turn' };
  if (state.phase !== 'main') return { allowed: false, reason: 'Can only challenge during main phase' };

  const player = state.players[playerId];
  if (!player) return { allowed: false, reason: 'Player not found' };

  const attacker = player.play.find((c) => c.instanceId === attackerInstanceId);
  if (!attacker) return { allowed: false, reason: 'Attacking character not found' };

  const attackerKw = parseCardKeywords(attacker.card);

  // Rush allows challenging on the turn played (waives drying for challenge only)
  if (attacker.isDrying && !attackerKw.rush) {
    return { allowed: false, reason: `${attacker.card.name} was played this turn (ink drying)` };
  }

  if (attacker.isExerted) {
    return { allowed: false, reason: `Cannot challenge: attacker is already exerted` };
  }

  // Find opponent who owns defender
  const opponentId = Object.keys(state.players).find((id) => id !== playerId);
  if (!opponentId) return { allowed: false, reason: 'Opponent not found' };

  const opponent = state.players[opponentId];
  const defender = opponent.play.find((c) => c.instanceId === defenderInstanceId);
  if (!defender) return { allowed: false, reason: 'Defending card not found' };

  if (!defender.isExerted) {
    return { allowed: false, reason: 'You can only challenge exerted characters or locations' };
  }

  const defenderKw = parseCardKeywords(defender.card);

  // Evasive Check: Only characters with Evasive or Alert can challenge Evasive characters
  if (defenderKw.evasive && !attackerKw.evasive && !attackerKw.alert) {
    return {
      allowed: false,
      reason: `Cannot challenge ${defender.card.name}: defender has Evasive and attacker does not have Evasive or Alert`,
    };
  }

  // Bodyguard Check: If opponent has any exerted character with Bodyguard that can be challenged,
  // the attacker must choose one of the Bodyguard characters if able.
  if (!defenderKw.bodyguard) {
    const hasExertedBodyguard = opponent.play.some((c) => {
      if (!c.isExerted) return false;
      const kw = parseCardKeywords(c.card);
      if (!kw.bodyguard) return false;
      // If the bodyguard also has Evasive, attacker must be able to challenge it
      if (kw.evasive && !attackerKw.evasive && !attackerKw.alert) return false;
      return true;
    });

    if (hasExertedBodyguard) {
      return {
        allowed: false,
        reason: 'Must challenge a character with Bodyguard',
      };
    }
  }

  return { allowed: true, attacker, defender, opponentId };
}
