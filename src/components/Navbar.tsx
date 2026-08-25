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
    <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 px-2.5 sm:px-4 md:px-6 py-2 shadow-lg">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
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
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0 min-w-0"
        >
          <img
            src="/Logo_cloudgame.png"
            alt="Lorcana PlayLab Cloud Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain rounded-lg border border-[#F59E0B]/40 bg-[#141a26] p-1 shadow-[0_0_12px_rgba(245,158,11,0.15)] group-hover:border-[#F59E0B] transition-colors shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="font-cinzel font-bold text-xs sm:text-sm md:text-base tracking-wider text-[#F1F5F9] whitespace-nowrap">
                LORCANA <span className="foil-text">PLAYLAB</span>
              </h1>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPatchNotes) onOpenPatchNotes();
                }}
                title={t.navPatchNotes}
                className="hidden sm:flex px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-full hover:bg-[#F59E0B] hover:text-black transition-all cursor-pointer items-center gap-0.5 shadow-sm shrink-0"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{APP_VERSION}</span>
              </button>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-widest leading-none">
                {t.navSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Mode Switcher (Visible on xl+ 1280px+ to prevent tablet/iPad landscape overflow) */}
        <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5 bg-[#141a26]/90 p-1 rounded-xl border border-white/10 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className={`flex items-center gap-1.5 px-2 2xl:px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
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
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            title={`Switch Language (Current: ${language.toUpperCase()})`}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-lg bg-[#141a26] border border-white/10 hover:border-[#F59E0B] text-xs font-mono font-bold text-[#F1F5F9] transition-all cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0"
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
            className="hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#141a26] border border-white/10 text-[11px] font-mono text-[#94A3B8] shadow-sm shrink-0"
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
              className="flex items-center gap-1.5 sm:gap-2 bg-[#141a26] border border-white/10 px-2 sm:px-2.5 py-1.5 rounded-lg cursor-pointer hover:border-[#F59E0B] transition-colors shrink-0"
            >
              <div className="w-6 h-6 rounded-md bg-[#F59E0B] flex items-center justify-center font-bold text-xs text-black font-mono shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-[#F1F5F9] leading-tight truncate max-w-[80px]">{user.username}</p>
                <p className="text-[9px] text-[#F59E0B] font-medium leading-tight">{t.navMyDecks}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                aria-label={t.navSignOut}
                className="ml-0.5 p-1 text-[#94A3B8] hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0"
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
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F59E0B] text-black hover:bg-[#D97706] transition-colors cursor-pointer shadow-sm font-cinzel whitespace-nowrap shrink-0"
              title={t.navAccountLogin}
            >
              <User className="w-3.5 h-3.5 text-black shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold">{t.navAccountLogin}</span>
            </button>
          )}

          {/* Mobile & Tablet Menu Toggle Button (Visible on screens < 1280px, including iPad landscape & portrait) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="xl:hidden p-1.5 rounded-lg bg-[#141a26] border border-white/10 text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#F59E0B] transition-colors cursor-pointer shrink-0"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#F59E0B]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden mt-2 pt-2.5 border-t border-white/10 pb-2 space-y-2 animate-fadeIn">
          {/* User Account Quick Card for Mobile/Tablet */}
          {isAuthenticated && user ? (
            <div className="p-2.5 rounded-xl bg-[#141a26] border border-white/10 flex items-center justify-between gap-2">
              <div
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center font-bold text-sm text-black font-mono shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F1F5F9] truncate">{user.username}</p>
                  <p className="text-[10px] text-[#F59E0B] font-medium">{t.navMyDecks} &rarr;</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-medium hover:bg-rose-500/20 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.navSignOut}</span>
              </button>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-gradient-to-r from-[#F59E0B]/15 to-[#F59E0B]/5 border border-[#F59E0B]/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B] flex items-center justify-center text-black">
                  <User className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-[#F1F5F9]">{t.navAccountLogin}</p>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenAuth) onOpenAuth();
                  else setActiveTab('dashboard');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black font-bold text-xs hover:bg-[#D97706] transition-colors"
              >
                {t.navAccountLogin}
              </button>
            </div>
          )}

          {/* Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
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

          {/* Mobile Footer with Patch Notes & Status */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-[#94A3B8] font-mono border-t border-white/5">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onOpenPatchNotes) onOpenPatchNotes();
              }}
              className="flex items-center gap-1 text-[#F59E0B] hover:underline"
            >
              <Tag className="w-3 h-3" />
              <span>Version {APP_VERSION} ({t.navPatchNotes})</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500/80'}`} />
              <span>{wsStatus === 'connected' ? 'Cloud Connected' : t.navServerOnline}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
