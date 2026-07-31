import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, User, LogOut, Layers, ShieldCheck, Gamepad2, CloudLightning } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: 'board' | 'deckbuilder';
  setActiveTab: (tab: 'board' | 'deckbuilder') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 glass-nav-header px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo & Lorcana Seal */}
      <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setActiveTab('board')}>
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-400 p-0.5 shadow-xl shadow-purple-950/50 group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-[#0b0e1e] rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-950">
            ✓
          </span>
        </div>

        <div>
          <h1 className="font-cinzel font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-400 drop-shadow">
            LORCANA PLAYLAB
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300/80 font-bold uppercase tracking-widest">
              AWS Serverless Architecture
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              Free Tier
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      <nav className="flex items-center gap-2 bg-[#0d1124]/90 p-1.5 rounded-2xl border border-purple-500/20 shadow-inner">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
            activeTab === 'board'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-purple-300" />
          Playground Arena
        </button>

        <button
          onClick={() => setActiveTab('deckbuilder')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
            activeTab === 'deckbuilder'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/80 border border-purple-400/40 scale-105'
              : 'text-slate-400 hover:text-slate-100 hover:bg-purple-950/40'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          Deck Builder (408 Cards)
        </button>
      </nav>

      {/* Cloud Status Badge & User Controls */}
      <div className="flex items-center gap-3.5">
        {/* Live Cloud Ping Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-400">
          <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
          <span>AWS us-east-1</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-950/90 to-slate-900/90 border border-purple-500/40 px-4 py-2 rounded-2xl shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center font-black text-sm text-slate-950 shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-extrabold text-white tracking-wide">{user.username}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3" /> AWS JWT Verified
              </p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <User className="w-4 h-4 text-slate-950" />
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
