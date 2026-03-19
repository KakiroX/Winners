'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../model/useAuthStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady, openLogin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !user) {
      router.replace('/?login=1');
      openLogin();
    }
  }, [isAuthReady, user, router, openLogin]);

  if (!isAuthReady) return null;
  if (!user) return null;

  return <>{children}</>;
}
