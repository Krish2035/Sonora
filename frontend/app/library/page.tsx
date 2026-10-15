'use client';

import React, { useEffect, useState } from 'react';
import { Library, Play, Shuffle, Disc3 } from 'lucide-react';
import { Song } from '@/types/music';
import { SongRow } from '@/components/songs/SongRow';
import { usePlayer } from '@/context/PlayerContext';

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const { playSong, toggleShuffle } = usePlayer();
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  useEffect(() => {
    async function fetchSongs() {
      setLoading(true);
      try {
        const [songsRes, favRes] = await Promise.all([
          fetch(`${apiUrl}/api/songs?page=${page}&limit=50`),
          fetch(`${apiUrl}/api/favorites`),
        ]);

        if (songsRes.ok) {
          const sData = await songsRes.json();
          if (sData.success) {
            setSongs(sData.data);
            setTotal(sData.pagination.total);
          }
        }

        if (favRes.ok) {
          const fData = await favRes.json();
          if (fData.favoriteIds) setFavoriteIds(fData.favoriteIds);
        }
      } catch (err) {
        console.error('Failed fetching library:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, [page, apiUrl]);

  const handleFavoriteToggle = async (songId: string) => {
    const isFav = favoriteIds.includes(songId);
    setFavoriteIds((prev) => (isFav ? prev.filter((id) => id !== songId) : [...prev, songId]));

    try {
      await fetch(`${apiUrl}/api/favorites/${songId}`, {
        method: isFav ? 'DELETE' : 'POST',
      });
    } catch {
      setFavoriteIds((prev) => (isFav ? [...prev, songId] : prev.filter((id) => id !== songId)));
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
      toggleShuffle();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Library className="w-6 h-6 text-accent" /> Your Music Library
          </h1>
          <p className="text-xs text-text-muted">
            {total} songs synced from your mobile collection & local uploads
          </p>
        </div>

        {/* Quick Action Buttons */}
        {songs.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-glow transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Play All
            </button>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary text-xs font-semibold border border-surface-50 transition-all active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5 text-accent-light" /> Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Song List */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <Disc3 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading your library tracks...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <Library className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">Your Library is Empty</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Run <code className="text-accent-light">npm run music:import</code> to ingest your 793 tracks or use the Upload tab.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={(page - 1) * 50 + idx}
                contextQueue={songs}
                isFavorited={favoriteIds.includes(song.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {total > 50 && (
            <div className="flex items-center justify-between text-xs text-text-muted pt-2">
              <span>
                Showing {(page - 1) * 50 + 1} - {Math.min(page * 50, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="font-mono px-2">Page {page}</span>
                <button
                  disabled={page * 50 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
