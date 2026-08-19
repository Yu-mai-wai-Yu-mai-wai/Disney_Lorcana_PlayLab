import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { apiService } from '../services/api';
import { translateInkColor } from '../utils/cardTranslator';
import { Mail, Key, Lock, Cloud, Plus, Edit, Gamepad2, BarChart3, Trash2, UserCheck, Sparkles, Loader2, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { DeckViewerModal } from './DeckViewerModal';

interface UserDashboardProps {
  setActiveTab: (tab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ setActiveTab }) => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const { t, language } = useLanguageStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Real decks loaded from AWS DynamoDB via GET /decks (JWT Bearer)
  const [savedDecks, setSavedDecks] = useState<any[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [viewingDeck, setViewingDeck] = useState<any | null>(null);

  // Load real decks from the cloud when authenticated
  const loadUserDecks = React.useCallback(async () => {
    if (!token) return;
    setDecksLoading(true);
    try {
      const res = await apiService.getUserDecks(token);
      const decks = res.decks || [];
      setSavedDecks(
        decks.map((d: any) => ({
          id: d.deckId,
          name: d.name,
          cardCount: d.totalCards || (Array.isArray(d.cards) ? d.cards.reduce((acc: number, c: any) => acc + (c.count || 1), 0) : 0),
          updatedAt: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('en-GB') : '—',
          cards: d.cards || [],
          // First card art as deck cover
          bgUrl:
            d.cards?.[0]?.card?.imageUrl ||
            d.cards?.[0]?.imageUrl ||
            'https://api.lorcana.ravensburger.com/images/en/set1/1_ea50bda8825b4ccdf7e71c7052ee9688f92e75ab.jpg',
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load decks');
    } finally {
      setDecksLoading(false);
    }
  }, [token]);

  // Reload decks whenever auth state changes (login / re-open page)
  React.useEffect(() => {
    if (isAuthenticated && token) {
      loadUserDecks();
    } else {
      setSavedDecks([]);
    }
  }, [isAuthenticated, token, loadUserDecks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'register') {
      const res = await apiService.register(username, email, password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(language === 'th' ? 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' : 'Registration successful! Please sign in.');
        setMode('login');
      }
    } else {
      const res = await apiService.login(username, password);
      setLoading(false);

      if (res.error || !res.token || !res.user) {
        setError(res.error || (language === 'th' ? 'การเข้าสู่ระบบล้มเหลว' : 'Authentication failed'));
      } else {
        setAuth(res.user, res.token);
        setSuccess(language === 'th' ? 'เข้าสู่ระบบสำเร็จ!' : 'Authenticated successfully!');
      }
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDeleteDeckClick = async (id: string) => {
    if (confirmDeleteId === id) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmDeleteId(null);
      // Delete from cloud (DynamoDB) — requires JWT bearer
      if (token) {
        try {
          await apiService.deleteDeck(id, token);
        } catch (e: any) {
          setError(e.message || 'Failed to delete deck from cloud');
        }
      }
      setSavedDecks((prev) => prev.filter((d) => d.id !== id));
    } else {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmDeleteId(id);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen text-[#F1F5F9] font-outfit select-none pt-16 pb-16 px-6 max-w-7xl mx-auto space-y-8 bg-[#0B0F19]">
      {!isAuthenticated || !user ? (
        /* Unauthenticated View: Centered Login / Register Form */
        <div className="max-w-md mx-auto">
          <div className="bg-[#141a26] p-8 rounded-xl border border-[#30363d] space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#30363d]">
              <div className="w-10 h-10 rounded-lg bg-[#0B0F19] border border-[#30363d] flex items-center justify-center text-[#F59E0B]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">{t.accountTitle}</h2>
                <p className="text-xs text-[#94A3B8]">{t.accountSubtitle}</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-[#30363d]">
              <button
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {t.signIn}
              </button>
              <button
                onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {t.register}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                  {t.username}
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="scholar@illuminary.cloud"
                    className="w-full bg-[#0B0F19] text-white font-mono text-xs rounded-lg py-2.5 pl-10 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@illuminary.cloud"
                      className="w-full bg-[#0B0F19] text-white font-mono text-xs rounded-lg py-2.5 pl-10 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                  {t.password}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0B0F19] text-white font-mono text-xs rounded-lg py-2.5 pl-10 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#0B0F19] border-[#30363d] text-[#F59E0B] w-4 h-4 focus:ring-0"
                  />
                  <span className="text-xs text-[#94A3B8] font-mono">{language === 'th' ? 'จดจำการเข้าสู่ระบบ' : 'Remember Session'}</span>
                </label>
                <a href="#" className="text-xs text-[#F59E0B] hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm py-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>{language === 'th' ? 'กำลังดำเนินการ...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? (language === 'th' ? 'เข้าสู่ระบบเพื่อดูเด็ค' : 'Sign In to View Decks') : (language === 'th' ? 'สร้างบัญชีใหม่' : 'Create Account')}</span>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
              <Lock className="w-4 h-4 text-[#F59E0B]" />
              <span>{language === 'th' ? 'ระบบจัดเก็บข้อมูลปลอดภัยบนคลาวด์' : 'Secured Account Storage'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated View: 2-Column User Profile & My Saved Decks */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: User Profile Card (Span 4) */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#141a26] p-8 rounded-xl border border-[#30363d] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#30363d]">
                  <div className="w-10 h-10 rounded-lg bg-[#0B0F19] border border-[#30363d] flex items-center justify-center text-[#F59E0B]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">{t.welcomeBack}</h2>
                    <p className="text-xs text-[#94A3B8]">{language === 'th' ? 'บัญชีพร้อมใช้งานและซิงค์คลาวด์' : 'Account active & synced'}</p>
                  </div>
                </div>

                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-lg bg-[#F59E0B] p-0.5 flex items-center justify-center font-cinzel font-bold text-2xl text-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-cinzel font-bold text-xl text-[#F1F5F9]">{user.username}</h3>
                    <p className="text-xs text-[#94A3B8] mt-1">{user.email || 'Illumineer Member'}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <UserCheck className="w-4 h-4" />
                      <span>{language === 'th' ? 'บัญชีซิงค์คลาวด์เรียบร้อย' : 'Account Active & Synced'}</span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full py-2.5 bg-[#0B0F19] hover:bg-rose-950/60 border border-[#30363d] hover:border-rose-500/40 text-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {t.navSignOut}
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
                <Lock className="w-4 h-4 text-[#F59E0B]" />
                <span>{language === 'th' ? 'ระบบจัดเก็บข้อมูลปลอดภัยบนคลาวด์' : 'Secured Account Storage'}</span>
              </div>
            </div>
          </section>

          {/* Right Column: Deck Library (Span 8) */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#30363d] pb-4">
              <div>
                <h1 className="font-cinzel text-3xl font-bold text-[#F1F5F9] tracking-wide">
                  {t.mySavedDecks}
                </h1>
                <p className="text-sm text-[#94A3B8] flex items-center gap-2 mt-1">
                  <Cloud className="w-4 h-4 text-[#F59E0B]" />
                  <span>({savedDecks.length} / 10 {language === 'th' ? 'ช่องเก็บที่ใช้ไป' : 'Storage Slots Used'})</span>
                </p>
              </div>

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                {t.createNewDeck}
              </button>
            </div>

            {/* Deck Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-[#141a26] rounded-2xl overflow-hidden group flex flex-col h-full border border-[#30363d] hover:border-[#F59E0B] transition-all shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                >
                  <div className="h-44 relative w-full overflow-hidden border-b border-[#30363d] bg-[#0B0F19]">
                    <img
                      src={deck.bgUrl}
                      alt={deck.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg';
                      }}
                      className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141a26] via-transparent to-black/40" />

                    <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10">
                      {Array.from(new Set((deck.cards || []).map((c: any) => c.card?.ink || c.ink).filter(Boolean))).map((ink) => (
                        <span
                          key={ink as string}
                          className="bg-[#0B0F19]/90 backdrop-blur-sm border border-[#30363d] text-[#F59E0B] text-[10px] uppercase font-bold px-2.5 py-1 rounded-md shadow"
                        >
                          {translateInkColor(ink as string, language)}
                        </span>
                      ))}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 z-10">
                      <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-[#F59E0B] transition-colors drop-shadow-md truncate">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-xs text-[#94A3B8] mt-0.5">
                        <span className="text-[#F59E0B] font-bold">{deck.cardCount} {t.cardsCount}</span>
                        <span>• {t.lastUpdated} {deck.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between bg-[#141a26] gap-3">
                    {/* Deck Quick Inspect Button */}
                    <button
                      onClick={() => setViewingDeck(deck)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0B0F19] hover:bg-[#1e2638] border border-[#30363d] hover:border-[#F59E0B] rounded-xl text-xs font-mono font-bold text-[#F59E0B] transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{language === 'th' ? `ดูการ์ดในเด็คทั้งหมด (${deck.cards?.length || 0} แบบ)` : `View All Cards (${deck.cards?.length || 0} types)`}</span>
                    </button>

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]/80">
                      <button
                        onClick={() => setActiveTab('deckbuilder')}
                        className="flex items-center justify-center gap-2 bg-[#0B0F19] hover:bg-[#1e2638] text-[#F59E0B] border border-[#F59E0B]/40 hover:border-[#F59E0B] rounded-xl py-2.5 text-xs font-bold font-cinzel transition-all cursor-pointer shadow-sm"
                      >
                        <Edit className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.editDeck}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('board')}
                        className="flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-xl py-2.5 text-xs font-bold font-cinzel transition-all cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
                      >
                        <Gamepad2 className="w-4 h-4 shrink-0 text-black" />
                        <span className="truncate">{t.playSandbox}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="flex items-center justify-center gap-2 bg-[#0B0F19] hover:bg-[#1e2638] text-[#F1F5F9] border border-[#30363d] hover:border-emerald-500/50 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        <BarChart3 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span className="truncate">{t.deckStats}</span>
                      </button>

                      {confirmDeleteId === deck.id ? (
                        <button
                          onClick={() => handleDeleteDeckClick(deck.id)}
                          aria-label="Confirm Delete deck"
                          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer animate-pulse"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t.deleteDeckConfirm}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteDeckClick(deck.id)}
                          aria-label="Delete deck"
                          className="flex items-center justify-center gap-2 text-rose-400 hover:text-white bg-[#0B0F19] hover:bg-rose-600/80 border border-[#30363d] hover:border-rose-500 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t.deleteDeck}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="bg-[#141a26] rounded-2xl overflow-hidden group flex flex-col h-full min-h-[260px] items-center justify-center border-2 border-dashed border-[#30363d] hover:border-[#F59E0B] transition-all cursor-pointer p-6 hover:bg-[#1a2133]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0B0F19] border border-[#30363d] flex items-center justify-center mb-3 group-hover:border-[#F59E0B] group-hover:scale-110 transition-all shadow-inner">
                  <Plus className="w-7 h-7 text-[#94A3B8] group-hover:text-[#F59E0B] transition-colors" />
                </div>
                <span className="font-cinzel text-base font-bold text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">
                  {t.createNewDeck}
                </span>
                <span className="font-mono text-xs text-[#94A3B8]/70 mt-1.5">{language === 'th' ? `เหลือ ${Math.max(0, 10 - savedDecks.length)} ช่องเก็บเด็ค` : `${Math.max(0, 10 - savedDecks.length)} Slots Remaining`}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Deck Viewer Pop-up Modal */}
      <DeckViewerModal
        isOpen={Boolean(viewingDeck)}
        deck={viewingDeck}
        onClose={() => setViewingDeck(null)}
      />
    </div>
  );
};
