'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth';

function AuthInitializerInner() {
  const { setUser, openLogin } = useAuthStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Restore session from httpOnly cookie via /auth/me
    apiClient.get('/auth/me').then(({ data }) => setUser(data)).catch(() => {
      setUser(null);
    });
  }, [setUser]);

  useEffect(() => {
    // Middleware redirects here with ?login=1 when unauthenticated
    if (searchParams.get('login') === '1') {
      openLogin();
    }
  }, [searchParams, openLogin]);

  return null;
}

function AuthInitializer() {
  return (
    <Suspense fallback={null}>
      <AuthInitializerInner />
    </Suspense>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  );
}
