import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Inhabit',
  description: 'Describe your space. Get a floor plan in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="/pannellum/pannellum.css" />
      </head>
      <body className="min-h-full bg-white text-slate-900">
        <Providers>{children}</Providers>
        <Script src="/pannellum/libpannellum.js" strategy="beforeInteractive" />
        <Script src="/pannellum/pannellum.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
