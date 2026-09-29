import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Droplets, Zap, Eye } from 'lucide-react';
import type { LorcanaCard } from '../LorcanaBoard';
import { Modal } from '../Modal';
import { isCardInkable } from '../../game';

interface HandActionModalProps {
  selectedHandCard: LorcanaCard | null;
  onCloseSelectedHandCard: () => void;
  dragPendingCard: LorcanaCard | null;
  onCloseDragPending: () => void;
  onAddToInkwell: (card: LorcanaCard) => void;
  onPlayCard: (card: LorcanaCard) => void;
  onSingSong: (card: LorcanaCard) => void;
  onInspectCard: (card: LorcanaCard) => void;
  availableInk: number;
  hasInkedThisTurn: boolean;
  fieldCards: LorcanaCard[];
  exertedCards: Record<string, boolean>;
  language: string;
}

export const HandActionModal: React.FC<HandActionModalProps> = ({
  selectedHandCard,
  onCloseSelectedHandCard,
  dragPendingCard,
  onCloseDragPending,
  onAddToInkwell,
  onPlayCard,
  onSingSong,
  onInspectCard,
  availableInk,
  hasInkedThisTurn,
  fieldCards,
  exertedCards,
  language,
}) => {
  return (
    <>
      {/* DRAG TO PLAY CONFIRMATION MODAL */}
      <AnimatePresence>
        {dragPendingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#141a26] border-2 border-[#F59E0B] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(245,158,11,0.3)] flex flex-col items-center gap-4"
            >
              <div className="flex items-center justify-between w-full border-b border-[#30363d] pb-2">
                <span className="font-cinzel text-[#F59E0B] font-bold text-sm">
                  {language === 'th' ? 'เลือกการกระทำ' : 'Choose Action'}
                </span>
                <button
                  onClick={onCloseDragPending}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-3 items-center w-full">
                <img
                  src={dragPendingCard.imageUrl || dragPendingCard.img}
                  alt={dragPendingCard.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-20 object-cover rounded-lg border border-[#30363d] shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-cinzel font-bold text-white text-sm truncate">{dragPendingCard.name}</h4>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">Cost: {dragPendingCard.cost} Ink</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full mt-2">
                {isCardInkable(dragPendingCard) && !hasInkedThisTurn && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const c = dragPendingCard;
                      onCloseDragPending();
                      onAddToInkwell(c);
                    }}
                    className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#F59E0B] border border-[#F59E0B]/50 p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{language === 'th' ? 'ใส่เป็นหมึก' : 'Add to Inkwell'}</span>
                  </motion.button>
                )}

                {availableInk >= dragPendingCard.cost && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const c = dragPendingCard;
                      onCloseDragPending();
                      onPlayCard(c);
                    }}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>
                      {language === 'th'
                        ? `ลงสู่สนาม (${dragPendingCard.cost} Ink)`
                        : `Play to Field (${dragPendingCard.cost} Ink)`}
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CARD CLICK ACTION MODAL */}
      <Modal
        isOpen={!!selectedHandCard}
        onClose={onCloseSelectedHandCard}
        ariaLabel="Card Action"
        overlayClassName="bg-[#0B0F19]/80"
      >
        {selectedHandCard && (
          <div className="relative z-10 max-w-sm w-full bg-[#141a26] border border-[#30363d] rounded-xl p-5 flex flex-col items-center gap-3 text-center">
            <button
              onClick={onCloseSelectedHandCard}
              aria-label="Close"
              className="absolute top-3 right-3 p-1 bg-[#0B0F19] text-[#94A3B8] hover:text-white rounded border border-[#30363d] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-28 h-42 rounded-xl overflow-hidden border border-[#30363d] relative bg-[#0B0F19]">
              <img
                src={selectedHandCard.imageUrl || selectedHandCard.img}
                alt={selectedHandCard.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                className="w-full h-full object-cover relative z-10"
              />
            </div>

            <div className="space-y-0.5">
              <div className="font-cinzel text-base font-bold text-[#F59E0B]">{selectedHandCard.name}</div>
              <div className="text-[11px] font-mono text-[#94A3B8]">{selectedHandCard.title}</div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              {String(selectedHandCard.type).toLowerCase() === 'action' &&
                (selectedHandCard.subtypes?.map((s) => s.toLowerCase()).includes('song') ||
                  selectedHandCard.name.toLowerCase().includes('song')) && (
                  <button
                    onClick={() => onSingSong(selectedHandCard)}
                    disabled={
                      !fieldCards.some(
                        (c) => !c.isWet && !exertedCards[c.id] && (c.cost || 0) >= selectedHandCard.cost
                      )
                    }
                    className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>
                      {language === 'th'
                        ? `ร้องเพลง (ค่าร่าย ${selectedHandCard.cost}+)`
                        : `Sing (Exert cost ${selectedHandCard.cost}+)`}
                    </span>
                  </button>
                )}

              {isCardInkable(selectedHandCard) && (
                <button
                  onClick={() => onAddToInkwell(selectedHandCard)}
                  disabled={hasInkedThisTurn}
                  className="w-full bg-[#141a26] hover:bg-[#1e2638] disabled:opacity-40 text-[#F59E0B] border border-[#F59E0B]/50 p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Droplets className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>
                    {hasInkedThisTurn
                      ? language === 'th'
                        ? 'ใส่หมึกไปแล้วในเทิร์นนี้ (ขีดจำกัด 1/1)'
                        : 'Inked this turn (1/1 Limit)'
                      : language === 'th'
                      ? 'ใส่เป็นหมึก'
                      : 'Add to Inkwell (+1 Ink Capacity)'}
                  </span>
                </button>
              )}

              <button
                onClick={() => onPlayCard(selectedHandCard)}
                disabled={availableInk < selectedHandCard.cost}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-black p-2.5 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>
                  {availableInk < selectedHandCard.cost
                    ? language === 'th'
                      ? `ต้องการ ${selectedHandCard.cost} หมึก (มี ${availableInk})`
                      : `Requires ${selectedHandCard.cost} Ink (Have ${availableInk})`
                    : language === 'th'
                    ? `ลงสู่สนาม (${selectedHandCard.cost} หมึก)`
                    : `Play to Field (${selectedHandCard.cost} Ink)`}
                </span>
              </button>

              <button
                onClick={() => onInspectCard(selectedHandCard)}
                className="w-full bg-[#141a26] hover:bg-[#1e2638] text-[#94A3B8] hover:text-white border border-[#30363d] p-2 rounded-lg font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4 text-[#F59E0B]" />
                <span>{language === 'th' ? '🔍 ตรวจสอบรายละเอียดฉบับเต็ม' : '🔍 Inspect Full Details'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
