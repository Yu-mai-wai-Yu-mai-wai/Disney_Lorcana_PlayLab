import React from 'react';
import { InkColor } from '../types/lorcana';

interface InkSymbolProps {
  ink: InkColor | string;
  className?: string;
  size?: number;
}

const INK_SYMBOL_MAP: Record<string, string> = {
  Amber: '/SymbolDisneylorcana/Amber.png',
  Amethyst: '/SymbolDisneylorcana/Amethyst.png',
  Emerald: '/SymbolDisneylorcana/Emerald.png',
  Ruby: '/SymbolDisneylorcana/ruby.png',
  Sapphire: '/SymbolDisneylorcana/sapphire.png',
  Steel: '/SymbolDisneylorcana/steel.png',
};

export const InkSymbol: React.FC<InkSymbolProps> = ({ ink, className = '', size = 18 }) => {
  const inkName = (ink || '').trim();
  // Find case-insensitive match e.g. Ruby vs ruby
  const matchedKey = Object.keys(INK_SYMBOL_MAP).find(
    (key) => key.toLowerCase() === inkName.toLowerCase()
  );
  
  const iconUrl = matchedKey ? INK_SYMBOL_MAP[matchedKey] : null;

  if (!iconUrl) return null;

  return (
    <img
      src={iconUrl}
      alt={`${inkName} Symbol`}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-block object-contain drop-shadow ${className}`}
    />
  );
};
