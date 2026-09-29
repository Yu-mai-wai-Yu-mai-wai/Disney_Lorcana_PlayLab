import type { LorcanaCard } from '../types/lorcana';
export type { LorcanaCard };

export type TurnPhase = 'ready' | 'set' | 'draw' | 'main' | 'end';

export interface InPlayCard {
  instanceId: string;
  card: LorcanaCard;
  isDrying: boolean;
  isExerted: boolean;
  damage: number;
  atLocationId?: string;
  shiftedOn?: InPlayCard[];
}

export interface PlayerState {
  id: string;
  username: string;
  deck: LorcanaCard[];
  hand: LorcanaCard[];
  play: InPlayCard[];
  inkwell: LorcanaCard[];
  availableInk: number;
  discard: LorcanaCard[];
  lore: number;
  hasInkedThisTurn: boolean;
  hasDeckedOut: boolean;
}

export interface GameState {
  turnNumber: number;
  activePlayerId: string;
  phase: TurnPhase;
  players: Record<string, PlayerState>;
  playerOrder: string[];
  winnerId?: string;
  loserId?: string;
  winReason?: string;
  isGameOver: boolean;
  pendingPrompts?: GamePrompt[];
}

export type GameAction =
  | { type: 'START_GAME'; initialDecks: Record<string, LorcanaCard[]>; playerNames?: Record<string, string>; firstPlayerId?: string }
  | { type: 'START_TURN'; playerId: string }
  | { type: 'INK_CARD'; playerId: string; cardId: string }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; targetLocationId?: string }
  | { type: 'QUEST'; playerId: string; instanceId: string }
  | { type: 'CHALLENGE'; playerId: string; attackerInstanceId: string; defenderInstanceId: string }
  | { type: 'PASS_TURN'; playerId: string }
  | { type: 'CONCEDE'; playerId: string }
  | { type: 'RESOLVE_PROMPT'; playerId: string; promptId: string; chosenTargetId?: string; chosenCardId?: string }
  | { type: 'SHIFT_CARD'; playerId: string; cardId: string; targetInstanceId: string }
  | { type: 'MOVE_TO_LOCATION'; playerId: string; characterInstanceId: string; locationInstanceId: string }
  | { type: 'SING_SONG'; playerId: string; cardId: string; singerInstanceIds: string[] }
  | { type: 'USE_ITEM_ABILITY'; playerId: string; itemInstanceId: string; targetInstanceId?: string }
  | { type: 'MANUAL_SET_LORE'; playerId: string; targetPlayerId: string; lore: number }
  | { type: 'MANUAL_SET_DAMAGE'; playerId: string; instanceId: string; damage: number }
  | { type: 'MANUAL_BANISH_CARD'; playerId: string; instanceId: string };

export interface GameEvent {
  type:
    | 'GAME_STARTED'
    | 'TURN_STARTED'
    | 'TURN_ENDED'
    | 'CARD_DRAWN'
    | 'CARD_INKED'
    | 'CARD_PLAYED'
    | 'CARD_EXERTED'
    | 'CARD_READIED'
    | 'CARD_QUESTED'
    | 'CHALLENGE_RESOLVED'
    | 'CARD_BANISHED'
    | 'DAMAGE_DEALT'
    | 'LORE_CHANGED'
    | 'ABILITY_TRIGGERED'
    | 'PROMPT_RESOLVED'
    | 'GAME_WON'
    | 'GAME_LOST'
    | 'ACTION_FAILED';
  playerId: string;
  message: string;
  details?: Record<string, any>;
}

export interface GamePrompt {
  id: string;
  type: 'CHOOSE_TARGET' | 'CHOOSE_CARD' | 'MANUAL_RESOLVE';
  playerId: string;
  message: string;
  validTargetIds?: string[];
  effectPayload?: {
    actionType: string;
    abilityName: string;
    sourceInstanceId?: string;
    sourceCardName?: string;
    effectType: string;
    amount?: number;
    criteria?: any;
  };
}

export interface ActionResult {
  success: boolean;
  state: GameState;
  events: GameEvent[];
  prompts: GamePrompt[];
  error?: string;
}
