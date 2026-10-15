'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Library, 
  Heart, 
  ListMusic, 
  WifiOff, 
  UploadCloud, 
  Settings, 
  Radio, 
  HardDrive
} from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { formatBytes } from '@/lib/formatters';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Playlists', href: '/playlists', icon: ListMusic },
  { name: 'Offline Music', href: '/offline', icon: WifiOff },
  { name: 'Upload', href: '/upload', icon: UploadCloud },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { storageUsage, isOnline } = useOffline();

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-surface-300 border-r border-surface-50 p-5 justify-between flex-shrink-0 select-none">
      <div className="space-y-6">
        {/* App Logo */}
        <Link href="/" className="flex items-center gap-3 px-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-cyan flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block">Sonora</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Personal Music Cloud</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent/15 text-accent-light border border-accent/25 shadow-sm'
                    : 'text-text-secondary hover:text-white hover:bg-surface-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-light' : 'text-text-muted'}`} />
                <span>{item.name}</span>
                {item.href === '/offline' && storageUsage.count > 0 && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {storageUsage.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Offline Storage Gauge Widget */}
      <div className="glass-panel p-4 rounded-2xl border border-surface-50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted flex items-center gap-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-accent" />
            Offline Storage
          </span>
          <span className="font-mono text-white text-[11px]">
            {formatBytes(storageUsage.totalBytes)}
          </span>
        </div>

        <div className="w-full h-1.5 bg-surface-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, (storageUsage.count / 50) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>{storageUsage.count} songs saved</span>
          <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
      </div>
    </aside>
  );
}
