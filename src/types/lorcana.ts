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
  artist?: string;
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
