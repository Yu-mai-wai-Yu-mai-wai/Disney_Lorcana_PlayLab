import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ActionLogSidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
  logMessages: string[];
}

export const ActionLogSidebar: React.FC<ActionLogSidebarProps> = ({
  isSidebarOpen,
  onClose,
  logMessages,
}) => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-y-0 right-0 z-[140] w-72 max-w-[85vw] border-l border-[#30363d] bg-[#141a26] p-4 flex flex-col justify-between shadow-xl lg:relative lg:z-30 lg:shrink-0 lg:max-w-none h-full"
        >
          <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
            <span className="font-cinzel font-bold text-[#F59E0B] text-xs">Match Action Log</span>
            <button
              onClick={onClose}
              className="p-1 text-[#94A3B8] hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 text-xs font-mono text-[#F1F5F9]">
            {logMessages.map((msg, idx) => (
              <div key={idx} className="bg-[#0B0F19] p-2.5 rounded border border-[#30363d] leading-relaxed">
                {msg}
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono text-[#94A3B8] text-center border-t border-[#30363d] pt-2">
            Illuminary Realm Live Sync Active
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
