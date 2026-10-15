'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListMusic, Plus, Play, Disc3, Clock } from 'lucide-react';
import { Playlist } from '@/types/music';
import { formatDuration } from '@/lib/formatters';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/playlists`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.data || []);
      }
    } catch (err) {
      console.error('Failed fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTitle.trim(), description: newDescription.trim() }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setIsModalOpen(false);
        fetchPlaylists();
      }
    } catch (err) {
      console.error('Failed creating playlist:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-50 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ListMusic className="w-6 h-6 text-accent" /> Playlists
          </h1>
          <p className="text-xs text-text-muted">
            Curate and download custom song collections for offline listening
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-glow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {/* Playlists Grid */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <Disc3 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading your playlists...</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
          <ListMusic className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Playlists Yet</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Create your first playlist to organize your favorite workout, chill, or coding songs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlists/${pl.id}`}
              className="glass-panel p-5 rounded-2xl hover:bg-surface-100 transition-all group border border-white/5 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent/30 to-cyan/20 border border-accent/20 flex items-center justify-center text-accent-light group-hover:scale-105 transition-transform">
                  <ListMusic className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-glow">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-accent-light transition-colors truncate">
                  {pl.name}
                </h3>
                {pl.description && (
                  <p className="text-xs text-text-muted truncate mt-0.5">{pl.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted font-mono pt-2 border-t border-surface-50">
                <span>{pl.song_count || 0} tracks</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(pl.total_duration || 0)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Create Playlist */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-200 border border-surface-50 rounded-2xl p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create New Playlist</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Playlist Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chill Beats, Late Night Drive..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-100 border border-surface-50 focus:border-accent rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add an optional description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-100 border border-surface-50 focus:border-accent rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-white hover:bg-surface-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-all shadow-glow"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
