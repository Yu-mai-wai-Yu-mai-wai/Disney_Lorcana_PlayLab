import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDeckStore } from '../store/useDeckStore';
import { apiService } from '../services/api';
import { Mail, Key, Lock, Cloud, Plus, Edit, Gamepad2, BarChart3, Trash2, ShieldCheck, UserCheck, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserDashboardProps {
  setActiveTab: (tab: 'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ setActiveTab }) => {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { currentDeck, deckName } = useDeckStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sample cloud decks list
  const [savedDecks, setSavedDecks] = useState([
    {
      id: 'deck-1',
      name: 'Ruby/Sapphire Ramp',
      inks: ['Ruby', 'Sapphire'],
      cardCount: 60,
      updatedAt: '2 hours ago',
      bgUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg',
    },
    {
      id: 'deck-2',
      name: 'Steel/Amber Songs',
      inks: ['Steel', 'Amber'],
      cardCount: 60,
      updatedAt: 'Yesterday',
      bgUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg',
    },
    {
      id: 'deck-3',
      name: 'Emerald/Amethyst Evasive',
      inks: ['Emerald', 'Amethyst'],
      cardCount: 60,
      updatedAt: '3 days ago',
      bgUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/40_01dc5bb928054aa2b228f2a1f97910208b36b42b.jpg',
    },
  ]);

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

  const handleDeleteDeck = (id: string) => {
    setSavedDecks((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen text-slate-100 font-outfit select-none pt-24 pb-16 px-6 max-w-7xl mx-auto space-y-8">
      {!isAuthenticated || !user ? (
        /* Unauthenticated View: Centered Login / Register Form */
        <div className="max-w-md mx-auto">
          <div className="glass-panel p-8 rounded-3xl border border-[#ffb95f]/30 shadow-2xl space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-[#ffb95f]/10 border border-[#ffb95f]/40 flex items-center justify-center text-[#ffb95f]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="font-cinzel text-xl font-bold text-white">Illumineer Account</h2>
                <p className="text-xs text-[#c6c6cc]">Sign in to access your cloud saved decks</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#010f1f] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-[#ffb95f] text-slate-950 shadow-md' : 'text-[#c6c6cc] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-[#ffb95f] text-slate-950 shadow-md' : 'text-[#c6c6cc] hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#c6c6cc]">
                  Username
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="scholar@illuminary.cloud"
                    className="w-full bg-[#1c2b3c] text-white font-mono text-xs rounded-xl py-3 pl-10 pr-4 border border-slate-700 focus:border-[#ffb95f] transition-all outline-none"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#c6c6cc]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@illuminary.cloud"
                      className="w-full bg-[#1c2b3c] text-white font-mono text-xs rounded-xl py-3 pl-10 pr-4 border border-slate-700 focus:border-[#ffb95f] transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#c6c6cc]">
                  Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#1c2b3c] text-white font-mono text-xs rounded-xl py-3 pl-10 pr-4 border border-slate-700 focus:border-[#ffb95f] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#1c2b3c] border-slate-700 text-[#ffb95f] w-4 h-4"
                  />
                  <span className="text-xs text-[#c6c6cc]">Remember Me</span>
                </label>
                <a href="#" className="text-xs text-[#ffb95f] hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#F59E0B] text-slate-950 font-cinzel font-black text-sm py-3.5 rounded-xl shimmer hover:bg-[#ffddb8] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-[#F59E0B]/50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Sign In to View Decks' : 'Create Account'}</span>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-[#c6c6cc]/70 font-mono text-xs">
              <Lock className="w-4 h-4 text-[#ffb95f]" />
              <span>Secured Account Storage</span>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated View: 2-Column User Profile & My Saved Decks */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: User Profile Card (Span 4) */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-[#ffb95f]/30 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffb95f]/10 border border-[#ffb95f]/40 flex items-center justify-center text-[#ffb95f]">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-cinzel text-xl font-bold text-white">Illumineer Profile</h2>
                    <p className="text-xs text-[#c6c6cc]">Account active & synced</p>
                  </div>
                </div>

                <div className="space-y-6 text-center py-4">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#ffb95f] to-[#ddb7ff] p-0.5 shadow-xl">
                    <div className="w-full h-full bg-[#051424] rounded-[22px] flex items-center justify-center font-cinzel font-black text-3xl text-[#ffb95f]">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-cinzel font-black text-2xl text-white">{user.username}</h3>
                    <p className="text-xs text-[#c6c6cc] mt-1">{user.email || 'Illumineer Member'}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <UserCheck className="w-4 h-4" />
                      <span>Account Active & Synced</span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full py-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[#c6c6cc]/70 font-mono text-xs">
                <Lock className="w-4 h-4 text-[#ffb95f]" />
                <span>Secured Account Storage</span>
              </div>
            </div>
          </section>

          {/* Right Column: Deck Library (Span 8) */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-cinzel text-3xl md:text-4xl font-black text-white tracking-wide">
                  My Saved Decks
                </h1>
                <p className="text-sm text-[#c6c6cc] flex items-center gap-2 mt-1">
                  <Cloud className="w-4 h-4 text-[#ffb95f]" />
                  <span>({savedDecks.length} / 10 Storage Slots Used)</span>
                </p>
              </div>

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="flex items-center gap-2 bg-transparent border border-[#A855F7] text-white font-cinzel font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#A855F7]/20 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 text-[#A855F7]" />
                Create New Deck
              </button>
            </div>

            {/* Deck Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="glass-panel rounded-2xl overflow-hidden card-hover group flex flex-col h-full border border-[#ffb95f]/20 hover:border-[#ffb95f]/80 shadow-xl"
                >
                  <div className="h-40 relative w-full overflow-hidden border-b border-slate-800">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                      style={{ backgroundImage: `url('${deck.bgUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-[#051424]/40 to-transparent" />

                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {deck.inks.map((ink) => (
                        <span
                          key={ink}
                          className="bg-[#A855F7]/20 border border-[#A855F7] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded backdrop-blur-sm"
                        >
                          {ink}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between bg-[#0d1c2d]/40">
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-[#ffb95f] transition-colors">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-[#c6c6cc] mt-1.5 mb-4">
                        <span>{deck.cardCount} Cards</span>
                        <span>• {deck.updatedAt}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => setActiveTab('deckbuilder')}
                        className="flex items-center justify-center gap-1.5 bg-[#ffb95f]/10 hover:bg-[#ffb95f]/20 text-[#ffb95f] border border-[#ffb95f]/30 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setActiveTab('board')}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-400" /> Play
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Stats
                      </button>
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="flex items-center justify-center gap-1.5 text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setActiveTab('deckbuilder')}
                className="glass-panel rounded-2xl overflow-hidden group flex flex-col h-full min-h-[300px] items-center justify-center border-dashed border-2 border-slate-700 hover:border-[#ffb95f]/60 transition-all bg-[#010f1f]/30 hover:bg-[#0d1c2d]/50 cursor-pointer p-6"
              >
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-[#ffb95f]/20 transition-colors">
                  <Plus className="w-7 h-7 text-slate-400 group-hover:text-[#ffb95f] transition-colors" />
                </div>
                <span className="font-cinzel text-base font-bold text-[#c6c6cc] group-hover:text-white transition-colors">
                  New Deck Slot
                </span>
                <span className="font-mono text-xs text-slate-500 mt-1">7 Slots Remaining</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
