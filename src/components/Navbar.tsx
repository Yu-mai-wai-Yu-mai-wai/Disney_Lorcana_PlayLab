import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, User, LogOut, Layers, ShieldCheck, Gamepad2 } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: 'board' | 'deckbuilder';
  setActiveTab: (tab: 'board' | 'deckbuilder') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 glass-nav px-6 py-3.5 flex items-center justify-between shadow-xl">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('board')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-amber-500 to-indigo-600 p-0.5 shadow-lg magic-glow-amethyst">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300">
            Lorcana PlayLab
          </h1>
          <p className="text-[10px] text-purple-300/70 font-semibold tracking-wider uppercase">
            100% AWS Serverless Cloud
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'board'
              ? 'bg-purple-600/90 text-white shadow-md shadow-purple-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Playground Board
        </button>

        <button
          onClick={() => setActiveTab('deckbuilder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'deckbuilder'
              ? 'bg-purple-600/90 text-white shadow-md shadow-purple-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Deck Builder (408 Cards)
        </button>
      </nav>

      {/* User Actions & Auth Status */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-purple-500/30 px-3.5 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center font-bold text-xs text-white shadow">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">{user.username}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> AWS JWT Active
              </p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <User className="w-4 h-4" />
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
