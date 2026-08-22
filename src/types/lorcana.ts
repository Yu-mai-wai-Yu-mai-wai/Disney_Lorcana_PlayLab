export type InkColor = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

export type CardType = 'Character' | 'Action' | 'Item' | 'Location';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Legendary' | 'Epic' | 'Enchanted' | 'Iconic' | 'Special' | string;

export interface LorcanaCard {
  id: string;
  cardId?: string;
  baseCardId?: string;
  name: string;
  title?: string;
  cost: number;
  inkwell: boolean;
  isInkable?: boolean;
  ink: InkColor;
  type: CardType;
  subtypes?: string[];
  rarity?: Rarity;
  strength?: number;
  willpower?: number;
  lore?: number;
  flavorText?: string;
  imageUrl: string;
  img?: string;
  artist?: string;
  setCode?: string;
  abilities?: { name: string; text: string }[];
}

export interface UserProfile {
  username: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => void;
}

export interface DeckItem {
  card: LorcanaCard;
  count: number;
}

// ------------------------------------------------------------
// SPRINT 3: AWS WEBSOCKETS REAL-TIME ROOM SYNC TYPES
// ------------------------------------------------------------
export type WebSocketActionType =
  | 'CREATE_ROOM'
  | 'ROOM_CREATED'
  | 'MATCHMAKING_JOIN'
  | 'MATCHMAKING_LEAVE'
  | 'WAITING'
  | 'MATCH_FOUND'
  | 'DECK_SELECTED'
  | 'GAME_START'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'CARD_MOVED'
  | 'CARD_EXERTED'
  | 'INK_PLAYED'
  | 'LORE_UPDATED'
  | 'QUEST_DONE'
  | 'CHALLENGE_DONE'
  | 'TURN_PASSED'
  | 'DICE_CHOICE'
  | 'DICE_ROLLED'
  | 'DICE_REROLL'
  | 'FIRST_PLAYER_CHOSEN'
  | 'GAME_RESTART'
  | 'GAME_OVER'
  | 'MATCH_FINISHED'
  | 'ROOM_STATE'
  | 'ERROR'
  | 'CHAT_MESSAGE'
  | 'CARD_DRAWN'
  | 'REJOIN_ROOM'
  | 'REQUEST_UNDO'
  | 'RESPOND_UNDO'
  | 'UNDO_REQUESTED'
  | 'UNDO_RESOLVED'
  | 'ACTION_PLAYED'
  | 'ABILITY_TRIGGERED'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'OPPONENT_DISCONNECTED'
  | 'REQUEST_STATE_SYNC'
  | 'STATE_SYNC_RESPONSE'
  | 'STATE_SYNC';

export interface MatchPlayer {
  username: string;
  deckId: string;
  deckName: string;
}

export interface RoomPlayer {
  connectionId: string;
  username: string;
  role: 'player1' | 'player2';
  joinedAt: string;
}

export interface RoomStatePayload {
  roomId: string;
  players: RoomPlayer[];
  loreP1: number;
  loreP2: number;
  inkP1: number;
  inkP2: number;
  lastAction?: string;
}

export interface WebSocketMessagePayload {
  action: WebSocketActionType;
  roomId?: string;
  username?: string;
  role?: 'player1' | 'player2';
  cardId?: string;
  cardName?: string;
  cardTitle?: string;
  cardImage?: string;
  inkColor?: string;
  abilityName?: string;
  abilityText?: string;
  thaiText?: string;
  category?: string;
  actionHint?: string;
  cardType?: string;
  cost?: number;
  zone?: string;
  card?: any;
  position?: { x: number; y: number; zone: string };
  isExerted?: boolean;
  loreScore?: number;
  inkCount?: number;
  availableInk?: number;
  deckCount?: number;
  deckId?: string;
  deckName?: string;
  message?: string;
  turnNumber?: number;
  senderInk?: number;
  senderInkCapacity?: number;
  senderLore?: number;
  senderExerted?: Record<string, boolean>;
  senderFieldCards?: any[];
  choice?: 'ODD' | 'EVEN';
  diceValue?: number;
  p1Choice?: 'ODD' | 'EVEN';
  p2Choice?: 'ODD' | 'EVEN';
  firstPlayerRole?: 'player1' | 'player2';
  payload?: any;
  voteAccepted?: boolean;
  requesterUsername?: string;
  requesterRole?: 'player1' | 'player2';
  respondedBy?: string;
  previousState?: any;
  isSelf?: boolean;
  winnerRole?: 'player1' | 'player2';
  winnerName?: string;
  loserRole?: 'player1' | 'player2';
  loserName?: string;
  winnerLore?: number;
  loserLore?: number;
  gameAction?: string;
  realAction?: string;
  type?: string;
}
