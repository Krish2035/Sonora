'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, ListMusic, WifiOff } from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';

const MOBILE_NAV = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Playlists', href: '/playlists', icon: ListMusic },
  { name: 'Offline', href: '/offline', icon: WifiOff },
];

export function BottomNav() {
  const pathname = usePathname();
  const { storageUsage } = useOffline();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-300/95 backdrop-blur-lg border-t border-surface-50 px-2 py-1.5 flex items-center justify-around">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
              isActive ? 'text-accent-light' : 'text-text-muted hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
            {item.href === '/offline' && storageUsage.count > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
