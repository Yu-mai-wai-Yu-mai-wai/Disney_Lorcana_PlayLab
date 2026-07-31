export type InkColor = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

export type CardType = 'Character' | 'Action' | 'Item' | 'Location';

export interface LorcanaCard {
  id: string;
  name: string;
  title?: string;
  cost: number;
  inkwell: boolean;
  ink: InkColor;
  type: CardType;
  subtypes?: string[];
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Legendary' | 'Enchanted';
  strength?: number;
  willpower?: number;
  lore?: number;
  flavorText?: string;
  imageUrl: string;
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

export interface Deck {
  id: string;
  name: string;
  userId: string;
  cards: DeckItem[];
  totalCards: number;
  createdAt: string;
}
