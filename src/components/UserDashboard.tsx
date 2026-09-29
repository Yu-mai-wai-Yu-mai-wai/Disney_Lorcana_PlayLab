import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { apiService } from '../services/api';
import { translateInkColor } from '../utils/cardTranslator';
import { Mail, Key, Lock, Cloud, Plus, Edit, Gamepad2, BarChart3, Trash2, UserCheck, Sparkles, Loader2, AlertCircle, CheckCircle2, Eye, Palette, ShieldAlert, Trophy, Swords, History } from 'lucide-react';
import { DeckViewerModal } from './DeckViewerModal';
import { PlaymatSelectorModal } from './PlaymatSelectorModal';
import { AdminBillingDashboardModal } from './AdminBillingDashboardModal';
import { usePlaymatStore } from '../store/usePlaymatStore';

interface UserDashboardProps {
  setActiveTab: (tab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ setActiveTab }) => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const { t, language } = useLanguageStore();
  const { getCurrentPlaymat } = usePlaymatStore();
  const currentPlaymat = getCurrentPlaymat();
  const [isPlaymatModalOpen, setIsPlaymatModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  // Match History & Player Stats (T04 Decoupling)
  const [stats, setStats] = useState<{ wins: number; losses: number; games: number } | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'decks' | 'matches' | 'leaderboard'>('decks');

  // Leaderboard & ElastiCache Cache-Aside (T05)
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMeta, setLeaderboardMeta] = useState<{ source?: string; durationMs?: number }>({});

  const loadLeaderboard = React.useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await apiService.getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setLeaderboardMeta({ source: res.source, durationMs: res.durationMs });
    } catch (err: any) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

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

  // Load player stats and match history from DynamoDB
  const loadUserStatsAndMatches = React.useCallback(async () => {
    if (!token || !user?.username) return;
    setMatchesLoading(true);
    try {
      const [statsRes, matchesRes] = await Promise.all([
        apiService.getPlayerStats(user.username),
        apiService.getMatches(token),
      ]);
      if (statsRes?.stats) setStats(statsRes.stats);
      if (matchesRes?.matches) setMatches(matchesRes.matches);
    } catch (err: any) {
      console.error('Failed to load player stats or match history', err);
    } finally {
      setMatchesLoading(false);
    }
  }, [token, user?.username]);

  // Reload decks and stats whenever auth state changes (login / re-open page)
  React.useEffect(() => {
    if (isAuthenticated && token) {
      loadUserDecks();
      loadUserStatsAndMatches();
    } else {
      setSavedDecks([]);
      setStats(null);
      setMatches([]);
    }
  }, [isAuthenticated, token, loadUserDecks, loadUserStatsAndMatches]);

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
    <div className="min-h-screen text-[#F1F5F9] font-outfit select-none pt-16 pb-16 px-6 max-w-7xl mx-auto space-y-8 bg-transparent">
      {!isAuthenticated || !user ? (
        /* Unauthenticated View: Centered Login / Register Form (Matched Large Size) */
        <div className="max-w-xl mx-auto w-full">
          <div className="glass-panel p-8 md:p-10 rounded-2xl shadow-2xl min-h-[580px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 pb-5 border-b border-[#30363d] mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#0B0F19] border border-[#30363d] flex items-center justify-center text-[#F59E0B] shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-cinzel text-2xl font-bold text-[#F1F5F9]">{t.accountTitle}</h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{t.accountSubtitle}</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-[#0B0F19] p-1.5 rounded-xl border border-[#30363d] mb-6">
                <button
                  onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    mode === 'login' ? 'bg-[#F59E0B] text-black font-bold shadow' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {t.signIn}
                </button>
                <button
                  onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    mode === 'register' ? 'bg-[#F59E0B] text-black font-bold shadow' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {t.register}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
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
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="scholar@illuminary.cloud"
                      className="w-full bg-[#0B0F19] text-white font-mono text-sm rounded-xl py-3 pl-11 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
                    />
                  </div>
                </div>

                {mode === 'register' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="scholar@illuminary.cloud"
                        className="w-full bg-[#0B0F19] text-white font-mono text-sm rounded-xl py-3 pl-11 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#0B0F19]/60 border border-[#30363d]/60 flex items-center gap-2.5 text-xs text-[#94A3B8]">
                    <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <span>{language === 'th' ? 'เข้าสู่ระบบเพื่อซิงค์เด็คและบันทึกการแข่งขันบนคลาวด์' : 'Sign in to sync your decks & real-time matches across the cloud.'}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                    {t.password}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0B0F19] text-white font-mono text-sm rounded-xl py-3 pl-11 pr-4 border border-[#30363d] focus:border-[#F59E0B] transition-colors outline-none"
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
                  className="w-full mt-4 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
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
            </div>

            <div className="pt-6 mt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
              <Lock className="w-4 h-4 text-[#F59E0B]" />
              <span>{language === 'th' ? 'ระบบจัดเก็บข้อมูลปลอดภัยบนคลาวด์ Illuminary Vault' : 'Secured Cloud Storage in Illuminary Vault'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated View: 2-Column User Profile & My Saved Decks */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: User Profile Card (Span 4) */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between">
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
                    {user.role === 'admin' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{language === 'th' ? 'ผู้ดูแลระบบ (ADMIN)' : 'ADMINISTRATOR'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                        <UserCheck className="w-4 h-4" />
                        <span>{language === 'th' ? 'บัญชีซิงค์คลาวด์เรียบร้อย' : 'Account Active & Synced'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className={`w-full py-2.5 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        user.role === 'admin'
                          ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 text-black hover:opacity-95 shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:scale-[1.02]'
                          : 'bg-[#0B0F19] hover:bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B] text-[#F59E0B]'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>
                        {user.role === 'admin'
                          ? (language === 'th' ? '🛡️ ดู AWS BUDGET & CLOUD' : '🛡️ VIEW AWS BUDGET & CLOUD')
                          : (language === 'th' ? '🔑 ปลดล็อกสิทธิ์ ADMIN CONSOLE' : '🔑 ACCESS ADMIN CONSOLE')}
                      </span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full py-2.5 bg-[#0B0F19] hover:bg-rose-950/60 border border-[#30363d] hover:border-rose-500/40 text-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {t.navSignOut}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
                <Lock className="w-4 h-4 text-[#F59E0B]" />
                <span>{language === 'th' ? 'ระบบจัดเก็บข้อมูลปลอดภัยบนคลาวด์' : 'Secured Account Storage'}</span>
              </div>
            </div>

            {/* Player Stats Card (T04) */}
            <div className="glass-panel p-6 rounded-2xl border border-[#30363d] relative overflow-hidden shadow-xl" data-testid="player-stats-card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#30363d]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="font-cinzel text-sm font-bold text-[#F1F5F9]">
                    {language === 'th' ? 'สถิติการแข่งขัน' : 'PLAYER STATS'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {stats ? `${stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0}% WIN` : '0% WIN'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#94A3B8] uppercase">{language === 'th' ? 'ชนะ' : 'Wins'}</p>
                  <p className="font-cinzel font-bold text-lg text-emerald-400 mt-0.5">{stats?.wins ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#94A3B8] uppercase">{language === 'th' ? 'แพ้' : 'Losses'}</p>
                  <p className="font-cinzel font-bold text-lg text-rose-400 mt-0.5">{stats?.losses ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#94A3B8] uppercase">{language === 'th' ? 'รวม' : 'Games'}</p>
                  <p className="font-cinzel font-bold text-lg text-[#F59E0B] mt-0.5">{stats?.games ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Playmat Skin Customizer Card */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden shadow-xl">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url(${currentPlaymat.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#30363d]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="font-cinzel text-sm font-bold text-[#F1F5F9]">
                      {language === 'th' ? 'สกินสนามประลอง' : 'PLAYMAT SKIN'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 border border-[#F59E0B]/40 text-[#F59E0B]">
                    {currentPlaymat.tag}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#F59E0B]/50 shrink-0 shadow-md">
                    <img src={currentPlaymat.previewImage} alt={currentPlaymat.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-cinzel text-sm font-bold text-white truncate">
                      {language === 'th' ? currentPlaymat.nameTh : currentPlaymat.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-outfit truncate">
                      {language === 'th' ? currentPlaymat.characterTh : currentPlaymat.character}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPlaymatModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{language === 'th' ? 'เปลี่ยนลาย PLAYMAT' : 'CHANGE PLAYMAT SKIN'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Deck Library (Span 8) */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDashboardTab('decks')}
                  data-testid="tab-decks"
                  className={`font-cinzel text-xl sm:text-2xl font-bold tracking-wide transition-colors cursor-pointer ${
                    dashboardTab === 'decks' ? 'text-[#F59E0B]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {t.mySavedDecks} ({savedDecks.length}/10)
                </button>
                <span className="text-[#30363d] font-thin">|</span>
                <button
                  onClick={() => setDashboardTab('matches')}
                  data-testid="tab-matches"
                  className={`font-cinzel text-xl sm:text-2xl font-bold tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
                    dashboardTab === 'matches' ? 'text-[#F59E0B]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span>{language === 'th' ? 'ประวัติการแข่ง' : 'Match History'}</span>
                  {matches.length > 0 && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                      {matches.length}
                    </span>
                  )}
                </button>
                <span className="text-[#30363d] font-thin">|</span>
                <button
                  onClick={() => {
                    setDashboardTab('leaderboard');
                    loadLeaderboard();
                  }}
                  data-testid="tab-leaderboard"
                  className={`font-cinzel text-xl sm:text-2xl font-bold tracking-wide transition-colors cursor-pointer flex items-center gap-2 ${
                    dashboardTab === 'leaderboard' ? 'text-[#F59E0B]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  <span>{language === 'th' ? 'กระดานผู้นำ' : 'Leaderboard'}</span>
                </button>
              </div>

              {dashboardTab === 'decks' && (
                <button
                  onClick={() => setActiveTab('deckbuilder')}
                  className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-black" />
                  {t.createNewDeck}
                </button>
              )}
            </div>

            {/* Deck Grid */}
            {dashboardTab === 'decks' && (
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
            )}

            {/* Match History List (T04) */}
            {dashboardTab === 'matches' && (
              <div className="flex flex-col gap-3 mt-2" data-testid="match-history-list">
                {matchesLoading ? (
                  <div className="p-12 text-center text-[#94A3B8] flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" />
                    <p className="text-xs font-mono">{language === 'th' ? 'กำลังโหลดประวัติการแข่งขันจาก DynamoDB...' : 'Loading match records from cloud...'}</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-[#141a26]/60 border border-[#30363d] text-center flex flex-col items-center gap-3" data-testid="match-history-empty">
                    <Swords className="w-8 h-8 text-[#94A3B8]" />
                    <h3 className="font-cinzel font-bold text-base text-white">
                      {language === 'th' ? 'ยังไม่มีประวัติการแข่งขัน' : 'No Match History Yet'}
                    </h3>
                    <p className="text-xs text-[#94A3B8] max-w-sm">
                      {language === 'th' ? 'เข้าร่วมประลอง 2 ผู้เล่นใน Game Lobby เพื่อบันทึกประวัติการแข่งขันบน AWS Cloud' : 'Compete in 2-player matches via Game Lobby to log records onto AWS Cloud.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('board')}
                      className="mt-2 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      {language === 'th' ? 'เริ่มเล่นใน LOBBY' : 'PLAY IN LOBBY'}
                    </button>
                  </div>
                ) : (
                  matches.map((m: any, idx: number) => {
                    const isWin = m.result === 'WIN';
                    const dateStr = m.finishedAt ? new Date(m.finishedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';
                    return (
                      <div
                        key={m.matchId || idx}
                        className={`p-4 rounded-2xl bg-[#141a26] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md ${
                          isWin ? 'border-emerald-500/40 hover:border-emerald-500' : 'border-rose-500/40 hover:border-rose-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-cinzel font-bold text-xs shrink-0 ${
                              isWin
                                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                                : 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                            }`}
                          >
                            {isWin ? 'WIN' : 'LOSS'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-cinzel font-bold text-sm text-white">vs. {m.opponent || 'Illumineer'}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0F19] text-[#94A3B8] border border-[#30363d]">
                                {m.turns ? `${m.turns} Turns` : '1 Turn'}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">{dateStr}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Lore Score</span>
                            <span className="font-cinzel font-bold text-sm text-white">
                              <span className={isWin ? 'text-emerald-400' : 'text-slate-300'}>{m.myLore ?? 0}</span>
                              <span className="text-[#94A3B8] mx-1.5">-</span>
                              <span className={!isWin ? 'text-rose-400' : 'text-slate-300'}>{m.opponentLore ?? 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Leaderboard Table (T05 ElastiCache Cache-Aside) */}
            {dashboardTab === 'leaderboard' && (
              <div className="flex flex-col gap-3 mt-2" data-testid="leaderboard-view">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-mono text-[#94A3B8]">
                  <span>
                    {language === 'th' ? 'จัดอันดับผู้เล่นตามจำนวนชัยชนะ (Top Illumineers)' : 'Player rankings sorted by total wins (Top Illumineers)'}
                  </span>
                  {leaderboardMeta.source && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#141a26] border border-[#30363d] text-[#F59E0B] text-[11px]">
                      Source: {leaderboardMeta.source === 'cache' ? 'ElastiCache Redis [HIT]' : 'DynamoDB [MISS]'} {leaderboardMeta.durationMs ? `(${leaderboardMeta.durationMs}ms)` : ''}
                    </span>
                  )}
                </div>

                {leaderboardLoading ? (
                  <div className="p-12 text-center text-[#94A3B8] flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" />
                    <p className="text-xs font-mono">{language === 'th' ? 'กำลังดึงข้อมูลอันดับจาก ElastiCache...' : 'Fetching leaderboard ranking from cloud cache...'}</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-[#141a26]/60 border border-[#30363d] text-center flex flex-col items-center gap-3" data-testid="leaderboard-empty">
                    <Trophy className="w-8 h-8 text-[#94A3B8]" />
                    <h3 className="font-cinzel font-bold text-base text-white">
                      {language === 'th' ? 'ยังไม่มีข้อมูลการจัดอันดับ' : 'No Leaderboard Records Yet'}
                    </h3>
                    <p className="text-xs text-[#94A3B8] max-w-sm">
                      {language === 'th' ? 'แข่งขันให้ชนะในแมตช์ 2 ผู้เล่นเพื่อขึ้นสู่กระดานผู้นำ' : 'Win 2-player matches to claim your spot on the cloud leaderboard.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#30363d] bg-[#141a26]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0B0F19] text-[#94A3B8] border-b border-[#30363d] uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4"># Rank</th>
                          <th className="py-3 px-4">Illumineer</th>
                          <th className="py-3 px-4 text-center">Wins</th>
                          <th className="py-3 px-4 text-center">Losses</th>
                          <th className="py-3 px-4 text-center">Games</th>
                          <th className="py-3 px-4 text-right">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363d]/60">
                        {leaderboard.map((player: any) => {
                          const isTop3 = player.rank <= 3;
                          const rankColor =
                            player.rank === 1
                              ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                              : player.rank === 2
                              ? 'text-slate-300 bg-slate-300/10 border-slate-300/30'
                              : player.rank === 3
                              ? 'text-amber-600 bg-amber-600/10 border-amber-600/30'
                              : 'text-[#94A3B8] bg-[#0B0F19] border-[#30363d]';
                          return (
                            <tr key={player.userId || player.rank} className="hover:bg-[#1e2638]/50 transition-colors">
                              <td className="py-3.5 px-4 font-bold">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs ${rankColor}`}>
                                  {player.rank}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-cinzel font-bold text-white text-sm">
                                <div className="flex items-center gap-2">
                                  <span>{player.userId}</span>
                                  {player.userId === user?.username && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">{player.wins}</td>
                              <td className="py-3.5 px-4 text-center text-rose-400">{player.losses}</td>
                              <td className="py-3.5 px-4 text-center text-[#94A3B8]">{player.games}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-[#F59E0B]">{player.winRate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Deck Viewer Pop-up Modal */}
      <DeckViewerModal
        isOpen={Boolean(viewingDeck)}
        deck={viewingDeck}
        onClose={() => setViewingDeck(null)}
      />

      {/* Playmat Skin Selector Modal */}
      <PlaymatSelectorModal
        isOpen={isPlaymatModalOpen}
        onClose={() => setIsPlaymatModalOpen(false)}
      />

      {/* Admin Cloud & Budget Billing Dashboard Modal */}
      <AdminBillingDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};
