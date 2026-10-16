'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Database, 
  HardDrive, 
  Music, 
  Sparkles, 
  Disc3,
  Play,
  Layers,
  Zap,
  ArrowRight,
  Heart,
  ListMusic,
  WifiOff
} from 'lucide-react';
import { Song } from '@/types/music';
import { SongRow } from '@/components/songs/SongRow';
import { usePlayer } from '@/context/PlayerContext';
import { useOffline } from '@/context/OfflineContext';
import { deduplicateSongsByTitle } from '@/lib/formatters';

interface BackendHealth {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    database: string;
    storage: string;
  };
}

export default function Home() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [recentHistory, setRecentHistory] = useState<Song[]>([]);
  const [totalSongs, setTotalSongs] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();
  const { storageUsage } = useOffline();
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  useEffect(() => {
    async function loadData() {
      try {
        const [healthRes, songsRes, favRes, histRes] = await Promise.all([
          fetch(`${apiUrl}/api/health`),
          fetch(`${apiUrl}/api/songs?limit=15`),
          fetch(`${apiUrl}/api/favorites`),
          fetch(`${apiUrl}/api/history?limit=6`),
        ]);

        if (healthRes.ok) {
          const hData = await healthRes.json();
          setHealth(hData);
        }

        if (songsRes.ok) {
          const sData = await songsRes.json();
          if (sData.success) {
            setSongs(deduplicateSongsByTitle(sData.data));
            setTotalSongs(sData.pagination.total);
          }
        }

        if (favRes.ok) {
          const fData = await favRes.json();
          if (fData.favoriteIds) setFavoriteIds(fData.favoriteIds);
        }

        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.data) setRecentHistory(deduplicateSongsByTitle(histData.data));
        }
      } catch (err) {
        console.warn('Backend not yet reachable:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [apiUrl]);

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

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Hero Ingestion & Architecture Banner */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent-light text-xs font-semibold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-cyan" />
              Low Load Architecture Verified
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Welcome to Sonora Music
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl leading-relaxed">
              Your 793 mobile tracks stream seamlessly with <strong>HTTP 206 Range requests</strong>. PostgreSQL stores strictly lightweight metadata to guarantee lightning-fast browsing and zero RAM overload.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface-200/90 px-5 py-3.5 rounded-2xl border border-surface-50 shadow-lg flex-shrink-0">
            <div>
              <div className="text-3xl font-black text-white">{totalSongs}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Indexed in DB</div>
            </div>
            <div className="w-px h-10 bg-surface-50" />
            <div>
              <div className="text-3xl font-black text-cyan">793</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">In resources</div>
            </div>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10">
          <Link
            href="/library"
            className="p-3.5 rounded-2xl bg-surface-100/60 hover:bg-surface-100 border border-surface-50 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent-light group-hover:scale-105 transition-transform">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Library</div>
              <div className="text-[10px] text-text-muted">{totalSongs} songs</div>
            </div>
          </Link>

          <Link
            href="/favorites"
            className="p-3.5 rounded-2xl bg-surface-100/60 hover:bg-surface-100 border border-surface-50 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Favorites</div>
              <div className="text-[10px] text-text-muted">{favoriteIds.length} favorited</div>
            </div>
          </Link>

          <Link
            href="/playlists"
            className="p-3.5 rounded-2xl bg-surface-100/60 hover:bg-surface-100 border border-surface-50 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan/20 flex items-center justify-center text-cyan group-hover:scale-105 transition-transform">
              <ListMusic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Playlists</div>
              <div className="text-[10px] text-text-muted">Custom mixes</div>
            </div>
          </Link>

          <Link
            href="/offline"
            className="p-3.5 rounded-2xl bg-surface-100/60 hover:bg-surface-100 border border-surface-50 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Offline Music</div>
              <div className="text-[10px] text-text-muted">{storageUsage.count} saved</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Recently Played Section (if any) */}
      {recentHistory.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" /> Recently Played
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentHistory.map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song, recentHistory)}
                className="glass-panel p-3 rounded-2xl hover:bg-surface-100 transition-all group cursor-pointer border border-white/5 space-y-2.5"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-surface-100 relative border border-surface-50 flex items-center justify-center">
                  {song.artwork_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${apiUrl}${song.artwork_path}`}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Music className="w-6 h-6 text-text-muted" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white shadow-glow">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate group-hover:text-accent-light transition-colors">
                    {song.title}
                  </div>
                  <div className="text-[11px] text-text-muted truncate">
                    {song.artist_name || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Library Preview Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-white">Your Songs</h2>
          </div>
          <Link
            href="/library"
            className="text-xs font-semibold text-accent-light hover:text-white flex items-center gap-1 transition-colors"
          >
            View All {totalSongs} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
            <Disc3 className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Connecting to your personal music cloud...</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center mx-auto text-accent">
              <Disc3 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Your Database is Ready for Tracks</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Run the ingestion command below to load all 793 tracks from <code className="text-accent-light">resources/Music</code>:
              </p>
            </div>
            <div className="inline-block bg-surface-300 border border-surface-50 px-4 py-2 rounded-xl text-xs font-mono text-cyan">
              npm run music:import
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                contextQueue={songs}
                isFavorited={favoriteIds.includes(song.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
