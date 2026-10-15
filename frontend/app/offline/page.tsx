'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, HardDrive, Trash2, Play, Shuffle, Music, AlertCircle, Info } from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { usePlayer } from '@/context/PlayerContext';
import { idbAudioStorage } from '@/lib/idbAudioStorage';
import { Song, OfflineSongRecord } from '@/types/music';
import { formatBytes, formatDuration } from '@/lib/formatters';

export default function OfflinePage() {
  const { storageUsage, clearAllOfflineStorage, removeOfflineSong, isOnline } = useOffline();
  const { playSong, toggleShuffle, currentSong, isPlaying } = usePlayer();
  const [offlineRecords, setOfflineRecords] = useState<OfflineSongRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOfflineTracks = async () => {
    setLoading(true);
    try {
      const records = await idbAudioStorage.getAllOfflineSongs();
      setOfflineRecords(records);
    } catch (err) {
      console.error('Failed loading offline songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineTracks();
  }, [storageUsage]);

  const handlePlayAll = () => {
    if (offlineRecords.length > 0) {
      const songList = offlineRecords.map((r) => r.metadata);
      playSong(songList[0], songList);
    }
  };

  const handleShufflePlay = () => {
    if (offlineRecords.length > 0) {
      const songList = offlineRecords.map((r) => r.metadata).sort(() => Math.random() - 0.5);
      playSong(songList[0], songList);
      toggleShuffle();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-50 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
            />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {isOnline ? 'Device Online' : 'Airplane / Offline Mode Active'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <WifiOff className="w-6 h-6 text-emerald-400" /> Downloaded Offline Music
          </h1>
          <p className="text-xs text-text-secondary">
            Songs stored in your device&apos;s browser memory. Accessible anytime, even without an internet connection.
          </p>
        </div>

        {/* Clear Storage */}
        {offlineRecords.length > 0 && (
          <button
            onClick={async () => {
              if (confirm('Clear all offline downloaded audio? The master copies remain safe on the server.')) {
                await clearAllOfflineStorage();
                loadOfflineTracks();
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-red-500/10 text-text-muted hover:text-red-400 text-xs font-medium border border-surface-50 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Downloads
          </button>
        )}
      </div>

      {/* Storage Meter Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                IndexedDB Storage Gauge
              </div>
              <div className="text-2xl font-black text-white">
                {formatBytes(storageUsage.totalBytes)} <span className="text-sm font-normal text-text-muted">used</span>
              </div>
            </div>
          </div>

          {offlineRecords.length > 0 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Play Offline
              </button>
              <button
                onClick={handleShufflePlay}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary text-xs font-semibold border border-surface-50 transition-all active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" /> Shuffle
              </button>
            </div>
          )}
        </div>

        {/* Honest storage explanation */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-100/50 border border-surface-50 text-[11px] text-text-muted">
          <Info className="w-4 h-4 text-cyan flex-shrink-0 mt-0.5" />
          <p>
            Offline songs are securely kept in this browser&apos;s private IndexedDB storage container. Deleting an offline copy here removes it from this device only and will never delete the song from your server library.
          </p>
        </div>
      </div>

      {/* Offline Track List */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center text-text-muted text-xs">
          Scanning device storage...
        </div>
      ) : offlineRecords.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <WifiOff className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Offline Music Downloaded</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Click the download icon next to any song or playlist while online to save it for offline listening.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
          {offlineRecords.map((record, idx) => {
            const song = record.metadata;
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                onClick={() => {
                  const songList = offlineRecords.map((r) => r.metadata);
                  playSong(song, songList);
                }}
                className={`flex items-center justify-between p-3 rounded-xl transition-all group cursor-pointer ${
                  isCurrent ? 'bg-emerald-500/15 border border-emerald-500/25' : 'hover:bg-surface-100/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                  <span className="text-xs font-mono text-text-muted w-6 text-center">
                    {idx + 1}
                  </span>

                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0 flex items-center justify-center relative border border-surface-50">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {song.title}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {song.artist_name || 'Unknown Artist'} • {formatBytes(record.size)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-mono text-text-muted">
                    {formatDuration(song.duration)}
                  </span>

                  <button
                    onClick={async () => {
                      await removeOfflineSong(song.id);
                      loadOfflineTracks();
                    }}
                    title="Remove offline copy from this device"
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
