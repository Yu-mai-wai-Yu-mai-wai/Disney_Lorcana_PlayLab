import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { apiService } from '../services/api';
import { Mail, Key, Lock, Cloud, Plus, Edit, Gamepad2, BarChart3, Trash2, UserCheck, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserDashboardProps {
  setActiveTab: (tab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ setActiveTab }) => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();

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
        setSuccess('Registration successful! Please sign in.');
        setMode('login');
      }
    } else {
      const res = await apiService.login(username, password);
      setLoading(false);

      if (res.error || !res.token || !res.user) {
        setError(res.error || 'Authentication failed');
      } else {
        setAuth(res.user, res.token);
        setSuccess('Authenticated successfully!');
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
                <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">Illumineer Account</h2>
                <p className="text-xs text-[#94A3B8]">Sign in to access your cloud saved decks</p>
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
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-[#F59E0B] text-black font-bold' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Register
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
                  Username
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
                    Email Address
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
                  Password
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
                    className="rounded bg-[#0B0F19] border-[#30363d] text-[#F59E0B] w-4 h-4"
                  />
                  <span className="text-xs text-[#94A3B8]">Remember Me</span>
                </label>
                <a href="#" className="text-xs text-[#F59E0B] hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm py-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Sign In to View Decks' : 'Create Account'}</span>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
              <Lock className="w-4 h-4 text-[#F59E0B]" />
              <span>Secured Account Storage</span>
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
                    <h2 className="font-cinzel text-xl font-bold text-[#F1F5F9]">Illumineer Profile</h2>
                    <p className="text-xs text-[#94A3B8]">Account active &amp; synced</p>
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
                      <span>Account Active &amp; Synced</span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full py-2.5 bg-[#0B0F19] hover:bg-rose-950/60 border border-[#30363d] hover:border-rose-500/40 text-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-xs">
                <Lock className="w-4 h-4 text-[#F59E0B]" />
                <span>Secured Account Storage</span>
              </div>
            </div>
          </section>

          {/* Right Column: Deck Library (Span 8) */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#30363d] pb-4">
              <div>
                <h1 className="font-cinzel text-3xl font-bold text-[#F1F5F9] tracking-wide">
                  My Saved Decks
                </h1>
                <p className="text-sm text-[#94A3B8] flex items-center gap-2 mt-1">
                  <Cloud className="w-4 h-4 text-[#F59E0B]" />
                  <span>({savedDecks.length} / 10 Storage Slots Used)</span>
                </p>
              </div>

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                Create New Deck
              </button>
            </div>

            {/* Deck Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-[#141a26] rounded-xl overflow-hidden group flex flex-col h-full border border-[#30363d] hover:border-[#F59E0B] transition-colors"
                >
                  <div className="h-36 relative w-full overflow-hidden border-b border-[#30363d]">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundImage: `url('${deck.bgUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-[#0B0F19]/40" />

                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {Array.from(new Set((deck.cards || []).map((c: any) => c.card?.ink || c.ink).filter(Boolean))).map((ink) => (
                        <span
                          key={ink as string}
                          className="bg-[#0B0F19] border border-[#30363d] text-[#F59E0B] text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                        >
                          {ink as string}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between bg-[#141a26]">
                    <div>
                      <h3 className="font-cinzel text-base font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-[#94A3B8] mt-1.5 mb-4">
                        <span>{deck.cardCount} Cards</span>
                        <span>• {deck.updatedAt}</span>
                      </div>
                    </div>

                    {/* Deck contents — card names + counts from cloud data */}
                    {deck.cards && deck.cards.length > 0 && (
                      <details className="mb-3 bg-[#0B0F19] border border-[#30363d] rounded-lg overflow-hidden">
                        <summary className="px-3 py-2 text-[11px] font-mono text-[#94A3B8] hover:text-[#F59E0B] cursor-pointer select-none">
                          View {deck.cards.length} card types
                        </summary>
                        <div className="max-h-28 overflow-y-auto px-3 pb-2 space-y-1">
                          {deck.cards.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between items-center gap-2 text-[11px]">
                              <span className="text-[#F1F5F9] truncate">
                                {c.card?.name || c.name || 'Card'}
                                {c.card?.cost !== undefined && (
                                  <span className="text-[#F59E0B] ml-1">⚡{c.card.cost}</span>
                                )}
                              </span>
                              <span className="font-mono text-[#94A3B8] shrink-0">×{c.count || 1}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#30363d]">
                      <button
                        onClick={() => setActiveTab('deckbuilder')}
                        className="flex items-center justify-center gap-1.5 bg-[#0B0F19] hover:bg-[#1e2638] text-[#F59E0B] border border-[#F59E0B]/40 rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setActiveTab('board')}
                        className="flex items-center justify-center gap-1.5 bg-[#0B0F19] hover:bg-[#1e2638] text-[#F1F5F9] border border-[#30363d] rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-[#F59E0B]" /> Play
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="flex items-center justify-center gap-1.5 bg-[#0B0F19] hover:bg-[#1e2638] text-[#F1F5F9] border border-[#30363d] rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Stats
                      </button>
                      {confirmDeleteId === deck.id ? (
                        <button
                          onClick={() => handleDeleteDeckClick(deck.id)}
                          aria-label="Confirm Delete deck"
                          className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirm Delete?
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteDeckClick(deck.id)}
                          aria-label="Delete deck"
                          className="flex items-center justify-center gap-1.5 text-rose-400 hover:bg-rose-950/40 border border-[#30363d] rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="bg-[#141a26] rounded-xl overflow-hidden group flex flex-col h-full min-h-[260px] items-center justify-center border-dashed border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer p-6"
              >
                <div className="w-12 h-12 rounded-lg bg-[#0B0F19] flex items-center justify-center mb-3 group-hover:border border-[#F59E0B]">
                  <Plus className="w-6 h-6 text-[#94A3B8] group-hover:text-[#F59E0B] transition-colors" />
                </div>
                <span className="font-cinzel text-sm font-bold text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">
                  New Deck Slot
                </span>
                <span className="font-mono text-xs text-[#94A3B8]/70 mt-1">7 Slots Remaining</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
