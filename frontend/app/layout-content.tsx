'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/shared/ui/Header';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noHeader = ['/', '/features', '/generate', '/plan'].some((p) => pathname === p)
    || pathname?.includes('/walkthrough/');

  return (
    <>
      {!noHeader && <Header />}
      {children}
    </>
  );
}
