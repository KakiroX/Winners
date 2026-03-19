'use client';

import { useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '../model/useAuthStore';
import { ds } from '@/shared/lib/ds';

export function LoginModal() {
  const { isLoginModalOpen, closeLogin, openSignup, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      setUser(data.user);
      closeLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm relative">
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-px" />

        <div className={`${ds.modal} p-8 space-y-8`}>
          {/* Brand mark */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border border-white/30 rounded flex items-center justify-center">
              <div className="w-3 h-3 border border-white/70 rounded-sm rotate-45" />
            </div>
            <div className="text-center space-y-1.5">
              <p className={ds.label}>Inhabit</p>
              <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none">Welcome back</h2>
              <p className={ds.caption}>Sign in to continue designing</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className={ds.label}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ds.input}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className={ds.label}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={ds.input}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-mono tracking-wide text-center py-2 px-3 bg-red-500/8 border border-red-500/15 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${ds.btnPrimary} py-3.5 disabled:opacity-40`}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Switch */}
          <div className="text-center">
            <button
              onClick={openSignup}
              className="text-xs font-bold tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors"
            >
              No account?{' '}
              <span className="text-white/60 underline underline-offset-4">Sign Up</span>
            </button>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-px" />

        {/* Close */}
        <button
          onClick={closeLogin}
          className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white/70 hover:border-white/30 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
