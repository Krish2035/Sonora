'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Wifi, WifiOff, UploadCloud, Radio } from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';

export function Header() {
  const router = useRouter();
  const { isOnline } = useOffline();

  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-3.5 border-b border-surface-50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
      {/* Mobile Brand Header */}
      <div className="flex md:hidden items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-cyan flex items-center justify-center shadow-glow">
          <Radio className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-black text-white">Sonora</span>
      </div>

      {/* Search Input Bar */}
      <div
        onClick={() => router.push('/search')}
        className="hidden sm:flex items-center gap-2.5 bg-surface-100 hover:bg-surface-50 border border-surface-50 rounded-full px-4 py-2 w-72 lg:w-96 text-xs text-text-muted cursor-pointer transition-colors"
      >
        <Search className="w-4 h-4 text-text-muted" />
        <span>Search title, artist, or album...</span>
      </div>

      {/* Network & Upload Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Online / Offline Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Upload shortcut */}
        <Link
          href="/upload"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/15 hover:bg-accent/25 text-accent-light text-xs font-semibold border border-accent/30 transition-all active:scale-95"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </Link>
      </div>
    </header>
  );
}
