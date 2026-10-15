'use client';

import React, { useEffect, useState } from 'react';
import { Settings, HardDrive, Wifi, Smartphone, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { formatBytes } from '@/lib/formatters';

export default function SettingsPage() {
  const { storageUsage, clearAllOfflineStorage, isOnline } = useOffline();
  const [swRegistered, setSwRegistered] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwRegistered(!!reg);
      });
    }
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1 border-b border-surface-50 pb-5">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-accent" /> Settings & Diagnostics
        </h1>
        <p className="text-xs text-text-muted">
          Manage your personal music cloud connection, offline cache, and PWA configuration
        </p>
      </div>

      <div className="space-y-4">
        {/* Offline Storage Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent-light flex items-center justify-center border border-accent/25">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Browser Offline Storage</h2>
              <p className="text-xs text-text-muted">IndexedDB audio blob persistence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-100/50 p-4 rounded-xl border border-surface-50">
            <div>
              <span className="text-[11px] text-text-muted block">Total Offline Songs</span>
              <span className="text-xl font-black text-white">{storageUsage.count} tracks</span>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Disk Space Used</span>
              <span className="text-xl font-black text-cyan">{formatBytes(storageUsage.totalBytes)}</span>
            </div>
          </div>

          <button
            onClick={async () => {
              if (confirm('Clear all offline downloaded audio tracks from this device?')) {
                await clearAllOfflineStorage();
              }
            }}
            disabled={storageUsage.count === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All Downloaded Audio
          </button>
        </div>

        {/* Network & Backend Server Config */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center border border-cyan/25">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">API Server Connection</h2>
              <p className="text-xs text-text-muted">Node.js Express & PostgreSQL endpoint</p>
            </div>
          </div>

          <div className="bg-surface-100/50 p-4 rounded-xl border border-surface-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Backend URL:</span>
              <span className="font-mono text-white">{apiUrl}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Network Status:</span>
              <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? 'Online • Ready to Stream' : 'Offline • Local Audio Only'}
              </span>
            </div>
          </div>
        </div>

        {/* PWA & Service Worker */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Progressive Web App (PWA)</h2>
              <p className="text-xs text-text-muted">Offline app shell and installability</p>
            </div>
          </div>

          <div className="bg-surface-100/50 p-4 rounded-xl border border-surface-50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Service Worker Status:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {swRegistered ? 'Active & Intercepting Shell' : 'Initializing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Web App Manifest:</span>
              <span className="font-mono text-white">/manifest.json</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
