'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Song, Playlist } from '@/types/music';
import { idbAudioStorage } from '@/lib/idbAudioStorage';

interface OfflineContextType {
  isOnline: boolean;
  offlineSongIds: Set<string>;
  downloadProgress: Record<string, number>; // 0 to 100 percentage
  isDownloading: Record<string, boolean>;
  storageUsage: { totalBytes: number; count: number };
  refreshOfflineSongs: () => Promise<void>;
  downloadSong: (song: Song) => Promise<boolean>;
  removeOfflineSong: (songId: string) => Promise<void>;
  downloadPlaylist: (playlist: Playlist) => Promise<void>;
  clearAllOfflineStorage: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineSongIds, setOfflineSongIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [storageUsage, setStorageUsage] = useState<{ totalBytes: number; count: number }>({
    totalBytes: 0,
    count: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Monitor Network Status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Offline Songs from IndexedDB
  const refreshOfflineSongs = useCallback(async () => {
    try {
      const offlineTracks = await idbAudioStorage.getAllOfflineSongs();
      setOfflineSongIds(new Set(offlineTracks.map((t) => t.id)));
      const usage = await idbAudioStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.warn('Failed loading offline songs from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshOfflineSongs();
  }, [refreshOfflineSongs]);

  // Download a single song
  const downloadSong = async (song: Song): Promise<boolean> => {
    if (offlineSongIds.has(song.id)) return true;

    setIsDownloading((prev) => ({ ...prev, [song.id]: true }));
    setDownloadProgress((prev) => ({ ...prev, [song.id]: 20 }));

    try {
      // 1. Fetch Audio Blob
      const audioRes = await fetch(`${apiUrl}/api/stream/${song.id}`);
      if (!audioRes.ok) throw new Error(`HTTP ${audioRes.status}`);
      setDownloadProgress((prev) => ({ ...prev, [song.id]: 60 }));
      const audioBlob = await audioRes.blob();

      // 2. Fetch Artwork Blob if available
      let artworkBlob: Blob | undefined;
      if (song.artwork_path) {
        try {
          const artRes = await fetch(`${apiUrl}${song.artwork_path}`);
          if (artRes.ok) {
            artworkBlob = await artRes.blob();
          }
        } catch {
          // Artwork failure is non-fatal
        }
      }

      setDownloadProgress((prev) => ({ ...prev, [song.id]: 85 }));

      // 3. Save into IndexedDB
      await idbAudioStorage.saveSong(song, audioBlob, artworkBlob);

      setOfflineSongIds((prev) => new Set(prev).add(song.id));
      setDownloadProgress((prev) => ({ ...prev, [song.id]: 100 }));
      await refreshOfflineSongs();
      return true;
    } catch (err) {
      console.error(`Download failed for "${song.title}":`, err);
      alert(`Could not download "${song.title}" for offline use. Check your connection.`);
      return false;
    } finally {
      setIsDownloading((prev) => ({ ...prev, [song.id]: false }));
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const copy = { ...prev };
          delete copy[song.id];
          return copy;
        });
      }, 2000);
    }
  };

  // Remove offline copy
  const removeOfflineSong = async (songId: string): Promise<void> => {
    try {
      await idbAudioStorage.deleteSong(songId);
      setOfflineSongIds((prev) => {
        const copy = new Set(prev);
        copy.delete(songId);
        return copy;
      });
      await refreshOfflineSongs();
    } catch (err) {
      console.error('Failed to remove offline copy:', err);
    }
  };

  // Download entire playlist with concurrency limiter (max 2 parallel downloads)
  const downloadPlaylist = async (playlist: Playlist): Promise<void> => {
    if (!playlist.songs || playlist.songs.length === 0) return;

    const songsToDownload = playlist.songs.filter((s) => !offlineSongIds.has(s.id));
    if (songsToDownload.length === 0) return;

    // Concurrency queue
    const queue = [...songsToDownload];
    const workerCount = Math.min(2, queue.length);

    const worker = async () => {
      while (queue.length > 0) {
        const song = queue.shift();
        if (song) {
          await downloadSong(song);
        }
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    await refreshOfflineSongs();
  };

  // Clear all offline storage
  const clearAllOfflineStorage = async (): Promise<void> => {
    await idbAudioStorage.clearAll();
    setOfflineSongIds(new Set());
    await refreshOfflineSongs();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        offlineSongIds,
        downloadProgress,
        isDownloading,
        storageUsage,
        refreshOfflineSongs,
        downloadSong,
        removeOfflineSong,
        downloadPlaylist,
        clearAllOfflineStorage,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
