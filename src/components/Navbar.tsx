import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, User, LogOut, Layers, ShieldCheck, Gamepad2, CloudLightning, BarChart3 } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard';
  setActiveTab: (tab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 glass-nav-header px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo & Lorcana Seal */}
      <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setActiveTab('hub')}>
        <img
          src="/Logo_cloudgame.png"
          alt="Lorcana PlayLab Cloud Logo"
          className="w-11 h-11 object-contain rounded-xl shadow-lg shadow-purple-950/60 group-hover:scale-105 transition-transform border border-amber-400/40 bg-slate-950/80 p-1"
        />

        <div>
          <h1 className="font-cinzel font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-400 drop-shadow">
            LORCANA PLAYLAB
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300/80 font-bold uppercase tracking-widest">
              Digital Card Simulation Lab
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      <nav className="flex items-center gap-2 bg-[#0d1124]/90 p-1.5 rounded-2xl border border-purple-500/20 shadow-inner">
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            activeTab === 'hub'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Home
        </button>

        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            activeTab === 'board'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-purple-300" />
          Playmat Sandbox
        </button>

        <button
          onClick={() => setActiveTab('deckbuilder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            activeTab === 'deckbuilder'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          Deck Builder
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Deck Analytics
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <CloudLightning className="w-4 h-4 text-emerald-400" />
          How to Play
        </button>
      </nav>

      {/* Right Controls: Live Indicator & User Account */}
      <div className="flex items-center gap-3">
        {/* Live Server Connection Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-400">
          <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
          <span>Server Online</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {isAuthenticated && user ? (
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 bg-gradient-to-r from-purple-950/90 to-slate-900/90 border border-purple-500/40 px-3.5 py-1.5 rounded-xl shadow-lg cursor-pointer hover:border-amber-400/60 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center font-black text-xs text-slate-950 shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-extrabold text-white tracking-wide">{user.username}</p>
              <p className="text-[9px] text-amber-400 font-bold">My Decks</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-300 hover:bg-amber-400/20 hover:border-amber-400 transition-all cursor-pointer shadow-md"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Account Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
