'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth';
import { ds } from '@/shared/lib/ds';

export function Header() {
  const { user, openLogin, openSignup, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await apiClient.post('/auth/logout').catch(() => {});
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/designs', label: 'Designs' },
    { href: '/generate', label: 'Generate' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[200] bg-black/80 backdrop-blur-md border-b border-white/8 h-16">
      <div className={`${ds.container} h-full flex items-center justify-between`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 border border-white/30 rounded flex items-center justify-center group-hover:border-white/60 transition-colors">
            <div className="w-2.5 h-2.5 border border-white rounded-sm rotate-45" />
          </div>
          <span className="text-white text-xs font-black tracking-widest uppercase">Inhabit</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? ds.navLinkActive : ds.navLink}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <span className={ds.caption}>{user.name}</span>
              <button
                onClick={handleLogout}
                className={ds.iconBtn}
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <button onClick={openLogin} className={ds.navLink}>Sign In</button>
              <button onClick={openSignup} className={ds.btnPrimary}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
