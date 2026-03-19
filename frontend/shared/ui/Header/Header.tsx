'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth';

export function Header() {
  const { user, openLogin, openSignup, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.post('/auth/logout').catch(() => {});
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[200] bg-white/80 backdrop-blur-md border-b border-slate-100 h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
             <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">INHABIT</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-wider">
           <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
           <Link href="/designs" className="hover:text-slate-900 transition-colors">Designs</Link>
           <Link href="/walkthrough" className="hover:text-slate-900 transition-colors">360° Studio</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-900">{user.name}</span>
              <button onClick={handleLogout} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <>
              <button onClick={openLogin} className="px-5 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-xl">Sign In</button>
              <button onClick={openSignup} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">Sign Up</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
