'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Play, Shuffle, Disc3 } from 'lucide-react';
import { Song } from '@/types/music';
import { SongRow } from '@/components/songs/SongRow';
import { usePlayer } from '@/context/PlayerContext';
import { deduplicateSongsByTitle } from '@/lib/formatters';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { playSong, toggleShuffle } = usePlayer();
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  useEffect(() => {
    async function fetchFavorites() {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/favorites`);
        if (res.ok) {
          const data = await res.json();
          setFavorites(deduplicateSongsByTitle(data.data || []));
        }
      } catch (err) {
        console.error('Failed fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [apiUrl]);

  const handleFavoriteToggle = async (songId: string) => {
    setFavorites((prev) => prev.filter((s) => s.id !== songId));

    try {
      await fetch(`${apiUrl}/api/favorites/${songId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to unfavorite:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Favorites
          </h1>
          <p className="text-xs text-text-muted">
            {favorites.length} tracks you love
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => playSong(favorites[0], favorites)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Play All
            </button>
            <button
              onClick={() => {
                const shuffled = [...favorites].sort(() => Math.random() - 0.5);
                playSong(shuffled[0], shuffled);
                toggleShuffle();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary text-xs font-semibold border border-surface-50 transition-all active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" /> Shuffle
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <Disc3 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading your favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <Heart className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Favorite Songs Yet</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Tap the heart icon next to any song in your library to add it here.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
          {favorites.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              contextQueue={favorites}
              isFavorited={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
