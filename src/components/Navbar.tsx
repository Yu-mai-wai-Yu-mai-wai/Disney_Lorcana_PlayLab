import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { webSocketService } from '../services/websocket';
import { Sparkles, User, LogOut, Layers, Gamepad2, CloudLightning, BarChart3, Swords, Tag, Globe, Wifi, Menu, X } from 'lucide-react';
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
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>('disconnected');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = webSocketService.onStatusChange((status) => {
      setWsStatus(status);
    });
    return () => unsub();
  }, []);

  const navItems: { id: typeof activeTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'hub', label: t.navHome, icon: Sparkles },
    { id: 'match', label: t.navMatch, icon: Swords },
    { id: 'board', label: t.navSandbox, icon: Gamepad2 },
    { id: 'deckbuilder', label: t.navDeckBuilder, icon: Layers },
    { id: 'analytics', label: t.navAnalytics, icon: BarChart3 },
    { id: 'rules', label: t.navHowToPlay, icon: CloudLightning },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2 shadow-lg">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
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
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
        >
          <img
            src="/Logo_cloudgame.png"
            alt="Lorcana PlayLab Cloud Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg border border-[#F59E0B]/40 bg-[#141a26] p-1 shadow-[0_0_12px_rgba(245,158,11,0.15)] group-hover:border-[#F59E0B] transition-colors"
          />

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-cinzel font-bold text-sm sm:text-base tracking-wider text-[#F1F5F9] whitespace-nowrap">
                LORCANA <span className="foil-text">PLAYLAB</span>
              </h1>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPatchNotes) onOpenPatchNotes();
                }}
                title={t.navPatchNotes}
                className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-full hover:bg-[#F59E0B] hover:text-black transition-all cursor-pointer flex items-center gap-0.5 shadow-sm shrink-0"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{APP_VERSION}</span>
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-widest leading-none">
                {t.navSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Mode Switcher */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-[#141a26]/90 p-1 rounded-xl border border-white/10 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Language Switcher, Live Indicator & User Account */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            title={`Switch Language (Current: ${language.toUpperCase()})`}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#141a26] border border-white/10 hover:border-[#F59E0B] text-xs font-mono font-bold text-[#F1F5F9] transition-all cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Globe className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className={language === 'th' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>TH</span>
            <span className="text-[#4B5563]">|</span>
            <span className={language === 'en' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}>EN</span>
          </button>

          {/* Live Server Connection Indicator */}
          <div
            title={
              wsStatus === 'connected'
                ? 'Realtime Cloud WebSocket: Connected'
                : wsStatus === 'connecting'
                ? 'Realtime Cloud WebSocket: Connecting...'
                : wsStatus === 'reconnecting'
                ? 'Realtime Cloud WebSocket: Reconnecting...'
                : 'Realtime Cloud WebSocket: Ready / Standby'
            }
            className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#141a26] border border-white/10 text-[11px] font-mono text-[#94A3B8] shadow-sm"
          >
            {wsStatus === 'connected' ? (
              <>
                <CloudLightning className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold text-[10px] hidden 2xl:inline">CLOUD SYNC</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
              </>
            ) : wsStatus === 'reconnecting' || wsStatus === 'connecting' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="text-amber-400 font-bold text-[10px] hidden 2xl:inline">SYNCING...</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              </>
            ) : (
              <>
                <CloudLightning className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="text-slate-400 font-bold text-[10px] hidden 2xl:inline">{t.navServerOnline}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 shrink-0" />
              </>
            )}
          </div>

          {/* User Account Login / Profile */}
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
              className="flex items-center gap-2 bg-[#141a26] border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-lg cursor-pointer hover:border-[#F59E0B] transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-[#F59E0B] flex items-center justify-center font-bold text-xs text-black font-mono shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-[#F1F5F9] leading-tight truncate max-w-[90px]">{user.username}</p>
                <p className="text-[9px] text-[#F59E0B] font-medium leading-tight">{t.navMyDecks}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                aria-label={t.navSignOut}
                className="ml-0.5 p-1 text-[#94A3B8] hover:text-rose-400 rounded transition-colors cursor-pointer"
                title={t.navSignOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else setActiveTab('dashboard');
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F59E0B] text-black hover:bg-[#D97706] transition-colors cursor-pointer shadow-sm font-cinzel whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-black shrink-0" />
              <span className="hidden xs:inline">{t.navAccountLogin}</span>
            </button>
          )}

          {/* Mobile / Tablet Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-1.5 rounded-lg bg-[#141a26] border border-white/10 text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#F59E0B] transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 pt-2 border-t border-white/10 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] bg-[#141a26]/70 border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
