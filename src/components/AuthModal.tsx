import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { apiService } from '../services/api';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  if (!isOpen) return null;

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
        setSuccess('Successfully authenticated via AWS Lambda & JWT!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden glass-panel"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 mb-3">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {mode === 'login' ? 'Welcome Back' : 'Create Lorcana Account'}
            </h2>
            <p className="text-xs text-purple-300/70 mt-1">
              AWS Serverless Auth (bcrypt & JWT Security)
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. player1"
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player1@lorcana.cloud"
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Connecting to AWS Lambda...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
