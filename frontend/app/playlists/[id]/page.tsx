'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Shuffle, 
  Download, 
  Trash2, 
  ListMusic, 
  Clock, 
  Disc3, 
  ArrowLeft 
} from 'lucide-react';
import { Playlist } from '@/types/music';
import { SongRow } from '@/components/songs/SongRow';
import { usePlayer } from '@/context/PlayerContext';
import { useOffline } from '@/context/OfflineContext';
import { formatDuration } from '@/lib/formatters';

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const playlistId = resolvedParams.id;
  const router = useRouter();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const { playSong, toggleShuffle } = usePlayer();
  const { downloadPlaylist } = useOffline();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchPlaylist = async () => {
    try {
      const [plRes, favRes] = await Promise.all([
        fetch(`${apiUrl}/api/playlists/${playlistId}`),
        fetch(`${apiUrl}/api/favorites`),
      ]);

      if (plRes.ok) {
        const plData = await plRes.json();
        setPlaylist(plData.data);
      }

      if (favRes.ok) {
        const fData = await favRes.json();
        if (fData.favoriteIds) setFavoriteIds(fData.favoriteIds);
      }
    } catch (err) {
      console.error('Failed fetching playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/playlists/${playlistId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/playlists');
      }
    } catch (err) {
      console.error('Failed deleting playlist:', err);
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPlaylist();
      }
    } catch (err) {
      console.error('Failed removing track:', err);
    }
  };

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

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Disc3 className="w-8 h-8 text-accent animate-spin mx-auto" />
        <p className="text-xs text-text-muted">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-12 text-center text-text-muted text-xs">
        Playlist not found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/playlists')}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Playlists
      </button>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 glass-panel p-6 rounded-3xl border border-white/5">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-accent to-cyan flex items-center justify-center text-white shadow-glow flex-shrink-0">
          <ListMusic className="w-14 h-14" />
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          <span className="text-[10px] font-semibold tracking-widest text-accent-light uppercase">
            Playlist
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white truncate tracking-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-xs text-text-secondary">{playlist.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-muted font-mono pt-1">
            <span>{playlist.song_count || 0} tracks</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(playlist.total_duration || 0)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap sm:flex-col gap-2.5 w-full sm:w-auto">
          {playlist.songs && playlist.songs.length > 0 && (
            <>
              <button
                onClick={() => playSong(playlist.songs![0], playlist.songs)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-glow transition-all active:scale-95 flex-1 sm:flex-initial"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Play
              </button>

              <button
                onClick={() => {
                  const shuffled = [...playlist.songs!].sort(() => Math.random() - 0.5);
                  playSong(shuffled[0], shuffled);
                  toggleShuffle();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary text-xs font-semibold border border-surface-50 transition-all active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-accent-light" /> Shuffle
              </button>

              <button
                onClick={() => downloadPlaylist(playlist)}
                title="Download all playlist tracks for offline listening"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Download Offline
              </button>
            </>
          )}

          <button
            onClick={handleDeletePlaylist}
            className="p-2 rounded-full text-text-muted hover:text-red-400 hover:bg-surface-100 transition-colors self-end sm:self-center"
            title="Delete Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track List */}
      {!playlist.songs || playlist.songs.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <ListMusic className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">This Playlist is Empty</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Browse your library and add songs to this playlist using the 3-dot menu.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
          {playlist.songs.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              contextQueue={playlist.songs}
              isFavorited={favoriteIds.includes(song.id)}
              onFavoriteToggle={handleFavoriteToggle}
              onRemoveFromPlaylist={handleRemoveTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
}
