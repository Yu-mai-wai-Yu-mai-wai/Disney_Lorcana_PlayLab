import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { apiService } from '../services/api';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

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
        setSuccess('Registration successful! Switched to Login tab.');
        setMode('login');
      }
    } else {
      const res = await apiService.login(username, password);
      setLoading(false);

      if (res.error || !res.token || !res.user) {
        setError(res.error || 'Authentication failed');
      } else {
        setAuth(res.user, res.token);
        setSuccess('Successfully authenticated via Illuminary Cloud Vault!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Sign In or Register" overlayClassName="bg-[#0B0F19]/80">
      <div className="relative w-full max-w-lg bg-[#141a26] border border-[#30363d] rounded-2xl p-7 md:p-8 shadow-2xl overflow-hidden min-h-[530px] flex flex-col justify-between">
        <div>
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-1.5 rounded-lg hover:bg-[#0B0F19] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-[#0B0F19] border border-[#30363d] mb-3 text-[#F59E0B] shadow-inner">
              <ShieldCheck className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h2 className="text-2xl font-cinzel font-bold text-[#F1F5F9] tracking-wide">
              {mode === 'login' ? 'Welcome Back' : 'Create Lorcana Account'}
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Illuminary Realm Security &amp; Cloud Sync
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#0B0F19] p-1.5 rounded-xl mb-6 border border-[#30363d]">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-[#F59E0B] text-black shadow' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-[#F59E0B] text-black shadow' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. player1"
                  className="w-full bg-[#0B0F19] border border-[#30363d] focus:border-[#F59E0B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F1F5F9] placeholder:text-[#94A3B8]/50 outline-none transition-colors"
                />
              </div>
            </div>

            {mode === 'register' ? (
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player1@lorcana.cloud"
                    className="w-full bg-[#0B0F19] border border-[#30363d] focus:border-[#F59E0B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F1F5F9] placeholder:text-[#94A3B8]/50 outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#0B0F19]/60 border border-[#30363d]/60 flex items-center gap-2.5 text-xs text-[#94A3B8]">
                <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Sign in with your Illumineer credentials to access cloud decks.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0F19] border border-[#30363d] focus:border-[#F59E0B] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F1F5F9] placeholder:text-[#94A3B8]/50 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Connecting to Illuminary Realm...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </div>

        <div className="pt-4 mt-3 border-t border-[#30363d] flex items-center justify-center gap-2 text-[#94A3B8] font-mono text-[11px]">
          <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Protected by Illuminary Arcane Shield</span>
        </div>
      </div>
    </Modal>
  );
};
