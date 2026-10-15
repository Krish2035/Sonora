'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Trash2, Music, Play } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

export function QueueDrawer() {
  const {
    queue,
    queueIndex,
    currentSong,
    isQueueOpen,
    setIsQueueOpen,
    playSong,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-surface-200 border-l border-surface-50 flex flex-col shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-50 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Playback Queue</h2>
            <span className="text-xs text-text-muted">({queue.length} tracks)</span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                title="Clear queue"
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Track Section */}
        {currentSong && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-light">
              Now Playing
            </span>
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0 flex items-center justify-center">
                {currentSong.artwork_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${apiUrl}${currentSong.artwork_path}`}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-5 h-5 text-accent-light" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{currentSong.title}</div>
                <div className="text-xs text-text-secondary truncate">
                  {currentSong.artist_name || 'Unknown Artist'}
                </div>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {formatDuration(currentSong.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Next in Queue List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Next Up
          </span>

          {queue.length <= 1 ? (
            <div className="p-8 text-center text-text-muted text-xs">
              Queue is empty. Add songs from your library!
            </div>
          ) : (
            queue.map((song, idx) => {
              const isCurrent = idx === queueIndex;
              if (isCurrent) return null; // Already shown above

              return (
                <div
                  key={`${song.id}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-100 transition-colors group cursor-pointer"
                  onClick={() => playSong(song)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-text-muted w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0 flex items-center justify-center relative">
                      {song.artwork_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${apiUrl}${song.artwork_path}`}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-4 h-4 text-text-muted" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate group-hover:text-accent-light transition-colors">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {song.artist_name || 'Unknown Artist'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-text-muted">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
