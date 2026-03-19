'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/shared/ui/Header';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWalkthrough = pathname?.includes('/walkthrough/');

  return (
    <>
      {!isWalkthrough && <Header />}
      {children}
    </>
  );
}
