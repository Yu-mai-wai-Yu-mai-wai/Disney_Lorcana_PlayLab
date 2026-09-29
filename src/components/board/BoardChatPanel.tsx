import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send } from 'lucide-react';
import { webSocketService } from '../../services/websocket';

export interface ChatMessage {
  username: string;
  message: string;
  time: string;
}

interface BoardChatPanelProps {
  matchMode: boolean;
  roomId?: string;
  playerRole?: 'player1' | 'player2';
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const BoardChatPanel: React.FC<BoardChatPanelProps> = ({
  matchMode,
  roomId,
  playerRole,
  chatMessages,
  setChatMessages,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState('');

  if (!matchMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    webSocketService.sendChat(text, roomId, playerRole);
    setChatMessages((prev) => [
      ...prev,
      {
        username: 'You',
        message: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 h-80 bg-[#0B0F19] border border-[#30363d] rounded-xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="bg-[#141a26] border-b border-[#30363d] p-3 flex justify-between items-center shrink-0">
              <span className="font-cinzel font-bold text-[#F59E0B] text-sm">Match Chat</span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[#94A3B8] hover:text-rose-400 transition-colors p-1"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.username === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#94A3B8]">{msg.username}</span>
                    <span className="text-[9px] font-mono text-[#94A3B8]/60">{msg.time}</span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm ${
                      msg.username === 'You'
                        ? 'bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/30 rounded-br-none'
                        : 'bg-[#141a26] text-[#F1F5F9] border border-[#30363d] rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-[#30363d] bg-[#141a26] flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#F59E0B]"
              />
              <button
                type="submit"
                className="bg-[#F59E0B] text-black px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-[#FCD34D] transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          setIsChatOpen(!isChatOpen);
          setUnreadCount(0);
        }}
        className="bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B] p-3 rounded-full shadow-lg transition-colors flex items-center justify-center cursor-pointer relative focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label="Open Match Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-[#0B0F19]">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
