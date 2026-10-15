'use client';

import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Music, Disc3, Sparkles } from 'lucide-react';
import { Song } from '@/types/music';
import { SongRow } from '@/components/songs/SongRow';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch favorites list
  useEffect(() => {
    fetch(`${apiUrl}/api/favorites`)
      .then((res) => res.json())
      .then((data) => {
        if (data.favoriteIds) setFavoriteIds(data.favoriteIds);
      })
      .catch(() => {});
  }, [apiUrl]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/songs/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
        }
      } catch (err) {
        console.error('Search request failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, apiUrl]);

  const handleFavoriteToggle = async (songId: string) => {
    const isFav = favoriteIds.includes(songId);
    setFavoriteIds((prev) => (isFav ? prev.filter((id) => id !== songId) : [...prev, songId]));

    try {
      await fetch(`${apiUrl}/api/favorites/${songId}`, {
        method: isFav ? 'DELETE' : 'POST',
      });
    } catch {
      // Rollback
      setFavoriteIds((prev) => (isFav ? [...prev, songId] : prev.filter((id) => id !== songId)));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <SearchIcon className="w-6 h-6 text-accent" /> Search Music
        </h1>
        <p className="text-xs text-text-muted">
          Fast PostgreSQL trigram search across titles, artists, and albums
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to? (e.g. Arijit, Believer, Rockstar...)"
          className="w-full bg-surface-100 border border-surface-50 focus:border-accent rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-text-muted focus:outline-none transition-colors shadow-lg"
          autoFocus
        />
        {loading && (
          <Disc3 className="w-5 h-5 text-accent animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {/* Results */}
      {query.trim() === '' ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto text-accent">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Search Your Cloud Library</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Find any song, artist, or album from your imported 793 mobile tracks instantly.
          </p>
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-text-muted text-xs">
          No songs found matching &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
          {results.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              contextQueue={results}
              isFavorited={favoriteIds.includes(song.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
