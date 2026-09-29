import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import type { LorcanaCard } from '../LorcanaBoard';

export interface HandTrayDockProps {
  isHandOpen: boolean;
  onToggleHand: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  handCards: LorcanaCard[];
  language: string;
  onDragStart: () => void;
  onDragEnd: (card: LorcanaCard, info: any) => void;
  onSelectHandCard: (card: LorcanaCard) => void;
  onInspectCard: (card: LorcanaCard) => void;
  onHoverCard: (card: LorcanaCard | null) => void;
}

export const HandTrayDock: React.FC<HandTrayDockProps> = ({
  isHandOpen,
  onToggleHand,
  onMouseEnter,
  onMouseLeave,
  handCards,
  language,
  onDragStart,
  onDragEnd,
  onSelectHandCard,
  onInspectCard,
  onHoverCard,
}) => {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Transparent padding bridge to prevent mouse leave gap jitter */}
      <div className="absolute -top-4 inset-x-0 h-4 pointer-events-auto" />

      {/* TAB TOGGLE BUTTON */}
      <button
        onClick={onToggleHand}
        className="bg-[#141a26] hover:bg-[#1e2638] text-[#F59E0B] border-t border-x border-[#30363d] rounded-t-xl px-6 py-1.5 font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-2xl z-50"
      >
        <span>
          {language === 'th' ? `การ์ดบนมือ (${handCards.length})` : `Your Hand (${handCards.length})`}
        </span>
        {isHandOpen ? <ChevronDown className="w-4 h-4 text-[#F59E0B]" /> : <ChevronUp className="w-4 h-4 text-[#F59E0B]" />}
      </button>

      {/* EXPANDABLE HAND TRAY */}
      <AnimatePresence>
        {isHandOpen && (
          <motion.div
            initial={{ y: 240, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 240, opacity: 0, transition: { duration: 0.2, delay: 0.15 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-[#0d1420]/95 backdrop-blur-md border-t border-x border-[#30363d] rounded-t-2xl px-3 sm:px-8 pt-2.5 pb-4 sm:pb-6 flex flex-col items-center w-full sm:w-max sm:min-w-[480px] max-w-[100vw] shadow-2xl relative"
          >
            <div className="text-[10px] font-mono text-[#94A3B8] mb-1.5">
              {language === 'th'
                ? 'ลากการ์ดขึ้นสู่สนาม หรือคลิกการ์ดเพื่อเปิดเมนูคำสั่ง'
                : 'Drag card up onto battlefield or click for action menu'}
            </div>

            {/* Hand Cards Stack */}
            <motion.div
              layout
              className="flex items-end justify-start sm:justify-center -space-x-6 md:-space-x-3 px-2 sm:px-3 py-1 w-full sm:w-auto overflow-x-auto no-scrollbar sm:overflow-visible"
            >
              {handCards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  role="button"
                  tabIndex={0}
                  drag
                  dragMomentum={false}
                  dragTransition={{ power: 0.1, timeConstant: 200 }}
                  dragElastic={0.3}
                  dragConstraints={{
                    left: -(typeof window !== 'undefined' ? window.innerWidth : 800) / 2 + 60,
                    right: (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - 60,
                    top: -600,
                    bottom: 300,
                  }}
                  dragSnapToOrigin
                  onDragStart={onDragStart}
                  onMouseEnter={() => onHoverCard(card)}
                  onTouchStart={() => onHoverCard(card)}
                  onMouseLeave={() => onHoverCard(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onInspectCard(card);
                  }}
                  onClick={() => onSelectHandCard(card)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectHandCard(card);
                    }
                  }}
                  onDragEnd={(_, info) => onDragEnd(card, info)}
                  whileHover={{ y: -16, zIndex: 50 }}
                  whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="w-24 h-36 sm:w-28 sm:h-40 md:w-36 md:h-52 rounded-xl relative cursor-grab active:cursor-grabbing border border-[#30363d] hover:border-[#F59E0B] bg-[#141a26] group card-foil-light shrink-0 shadow-lg"
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-[#141a26] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      <span className="font-cinzel text-sm font-bold text-[#F59E0B] line-clamp-2">{card.name}</span>
                      <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5">Image unavailable</span>
                    </div>
                    <img
                      src={card.imageUrl || card.img || '/Lorcana_Card_Back.png'}
                      alt={card.name || 'Disney Lorcana Card'}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover rounded-xl relative z-10"
                    />
                  </div>

                  <div className="absolute top-1.5 left-1.5 bg-[#0B0F19]/90 px-2 py-0.5 rounded border border-[#30363d] text-xs font-mono font-bold text-[#F59E0B] flex items-center gap-1 z-20">
                    <Droplets className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{card.cost}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
