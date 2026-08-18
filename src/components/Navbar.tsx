import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { Sparkles, User, LogOut, Layers, Gamepad2, CloudLightning, BarChart3, Swords, Tag, Globe } from 'lucide-react';
import { APP_VERSION } from '../data/patchNotes';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenPatchNotes?: () => void;
  activeTab: 'hub' | 'match' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard';
  setActiveTab: (tab: 'hub' | 'match' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenPatchNotes, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19] border-b border-[#30363d] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      {/* Brand Logo & Lorcana Seal */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setActiveTab('hub')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveTab('hub');
          }
        }}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <img
          src="/Logo_cloudgame.png"
          alt="Lorcana PlayLab Cloud Logo"
          className="w-10 h-10 object-contain rounded-lg border border-[#F59E0B]/40 bg-[#141a26] p-1 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-cinzel font-bold text-lg tracking-wider text-[#F1F5F9]">
              LORCANA <span className="foil-text">PLAYLAB</span>
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPatchNotes) onOpenPatchNotes();
              }}
              title={t.navPatchNotes}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-full hover:bg-[#F59E0B] hover:text-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{APP_VERSION}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-widest">
              {t.navSubtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      <nav className="flex flex-wrap items-center gap-1 bg-[#141a26] p-1 rounded-lg border border-[#30363d]">
        <button
          onClick={() => setActiveTab('hub')}
          aria-label={t.navHome}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'hub'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span className="hidden sm:inline">{t.navHome}</span>
        </button>

        <button
          onClick={() => setActiveTab('match')}
          aria-label={t.navMatch}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'match'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="hidden sm:inline">{t.navMatch}</span>
        </button>

        <button
          onClick={() => setActiveTab('board')}
          aria-label={t.navSandbox}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'board'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="hidden sm:inline">{t.navSandbox}</span>
        </button>

        <button
          onClick={() => setActiveTab('deckbuilder')}
          aria-label={t.navDeckBuilder}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'deckbuilder'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="hidden sm:inline">{t.navDeckBuilder}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          aria-label={t.navAnalytics}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="hidden sm:inline">{t.navAnalytics}</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          aria-label={t.navHowToPlay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'rules'
              ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]'
              : 'text-[#94A3B8] hover:text-[#F1F5F9]'
          }`}
        >
          <CloudLightning className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="hidden sm:inline">{t.navHowToPlay}</span>
        </button>
      </nav>

      {/* Right Controls: Language Switcher, Live Indicator & User Account */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          title={`Switch Language (Current: ${language.toUpperCase()})`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-xs font-mono font-bold text-[#F1F5F9] transition-all cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        >
          <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className={language === 'th' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>TH</span>
          <span className="text-[#4B5563]">|</span>
          <span className={language === 'en' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>EN</span>
        </button>

        {/* Live Server Connection Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141a26] border border-[#30363d] text-[11px] font-medium text-[#94A3B8]">
          <CloudLightning className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{t.navServerOnline}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {isAuthenticated && user ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('dashboard');
              }
            }}
            className="flex items-center gap-2 bg-[#141a26] border border-[#30363d] px-3 py-1.5 rounded-lg cursor-pointer hover:border-[#F59E0B] transition-colors"
          >
            <div className="w-6 h-6 rounded bg-[#F59E0B] flex items-center justify-center font-bold text-xs text-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#F1F5F9]">{user.username}</p>
              <p className="text-[9px] text-[#F59E0B] font-medium">{t.navMyDecks}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              aria-label={t.navSignOut}
              className="ml-1 p-1 text-[#94A3B8] hover:text-rose-400 rounded transition-colors cursor-pointer"
              title={t.navSignOut}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F59E0B] text-black hover:bg-[#D97706] transition-colors cursor-pointer shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-black" />
            <span>{t.navAccountLogin}</span>
          </button>
        )}
      </div>
    </header>
  );
};
