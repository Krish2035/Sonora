import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineProvider } from '@/context/OfflineContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PersistentPlayer } from '@/components/player/PersistentPlayer';

export const metadata: Metadata = {
  title: 'Sonora | Personal Cloud Music Player',
  description: 'Your personal, cloud-synced, and offline-capable music streaming player.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sonora',
  },
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="h-full bg-background text-text-primary antialiased selection:bg-accent selection:text-white flex overflow-hidden">
        <OfflineProvider>
          <PlayerProvider>
            {/* Desktop Left Sidebar */}
            <Sidebar />

            {/* Main Application Container */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
              <Header />

              {/* Scrollable Page Body with padding for persistent player */}
              <div className="flex-1 overflow-y-auto pb-28 md:pb-24">
                {children}
              </div>

              {/* Mobile Bottom Navigation */}
              <BottomNav />

              {/* Persistent Music Player */}
              <PersistentPlayer />
            </div>
          </PlayerProvider>
        </OfflineProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch((err) => {
                    console.log('SW registration skipped or failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
