export type InkColor = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

export type CardType = 'Character' | 'Action' | 'Item' | 'Location';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Legendary' | 'Epic' | 'Enchanted' | 'Iconic' | 'Special' | string;

export interface LorcanaCard {
  id: string;
  name: string;
  title?: string;
  cost: number;
  inkwell: boolean;
  ink: InkColor;
  type: CardType;
  subtypes?: string[];
  rarity?: Rarity;
  strength?: number;
  willpower?: number;
  lore?: number;
  flavorText?: string;
  imageUrl: string;
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
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'CARD_MOVED'
  | 'CARD_EXERTED'
  | 'INK_PLAYED'
  | 'LORE_UPDATED'
  | 'QUEST_DONE'
  | 'CHALLENGE_DONE'
  | 'TURN_PASSED'
  | 'ROOM_STATE'
  | 'OPPONENT_DISCONNECTED'
  | 'ERROR';

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
  position?: { x: number; y: number; zone: string };
  isExerted?: boolean;
  loreScore?: number;
  inkCount?: number;
  payload?: any;
}
