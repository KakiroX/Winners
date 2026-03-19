import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { LoginModal, SignupModal } from '@/features/auth';
import { LayoutContent } from './layout-content';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Inhabit | AI-Powered Interior Design',
  description: 'Design your dream home in seconds with generative AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="/pannellum/pannellum.css" />
      </head>
      <body className="min-h-full bg-white text-slate-900">
        <Providers>
          <LayoutContent>
            {children}
          </LayoutContent>
          <LoginModal />
          <SignupModal />
        </Providers>
        <Script src="/pannellum/libpannellum.js" strategy="beforeInteractive" />
        <Script src="/pannellum/pannellum.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
