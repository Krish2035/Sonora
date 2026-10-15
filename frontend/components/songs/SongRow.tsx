'use client';

import React, { useState } from 'react';
import { Song } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
import { useOffline } from '@/context/OfflineContext';
import { formatDuration } from '@/lib/formatters';
import { 
  Play, 
  Pause, 
  Heart, 
  Download, 
  Check, 
  MoreVertical, 
  Music, 
  ListPlus, 
  Trash2,
  Radio
} from 'lucide-react';

interface SongRowProps {
  song: Song;
  index: number;
  contextQueue?: Song[];
  isFavorited?: boolean;
  onFavoriteToggle?: (songId: string) => void;
  onRemoveFromPlaylist?: (songId: string) => void;
}

export function SongRow({
  song,
  index,
  contextQueue,
  isFavorited = false,
  onFavoriteToggle,
  onRemoveFromPlaylist,
}: SongRowProps) {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue, playNextInQueue } = usePlayer();
  const { offlineSongIds, downloadSong, removeOfflineSong, isDownloading } = useOffline();
  const [menuOpen, setMenuOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const isCurrent = currentSong?.id === song.id;
  const isOffline = offlineSongIds.has(song.id);
  const isCurrentlyDownloading = isDownloading[song.id];

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, contextQueue);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`flex items-center justify-between p-3 rounded-xl transition-all group cursor-pointer relative ${
        isCurrent ? 'bg-accent/15 border border-accent/25' : 'hover:bg-surface-100/70 border border-transparent'
      }`}
    >
      {/* Left Column: Number / Art / Title / Artist */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
        {/* Track Index or Play Icon */}
        <div className="w-6 text-center flex-shrink-0 flex items-center justify-center">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-1 bg-accent-light rounded-full animate-bounce" style={{ height: '100%' }} />
              <span className="w-1 bg-cyan rounded-full animate-bounce [animation-delay:0.2s]" style={{ height: '70%' }} />
              <span className="w-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" style={{ height: '85%' }} />
            </div>
          ) : (
            <span className="text-xs font-mono text-text-muted group-hover:hidden">{index + 1}</span>
          )}
          <Play className={`w-4 h-4 text-white fill-white hidden ${!isCurrent ? 'group-hover:block' : ''}`} />
        </div>

        {/* Artwork Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0 flex items-center justify-center relative border border-surface-50">
          {song.artwork_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${apiUrl}${song.artwork_path}`}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Radio className="w-4 h-4 text-text-muted group-hover:text-accent-light transition-colors" />
          )}
        </div>

        {/* Track Details */}
        <div className="min-w-0">
          <div
            className={`text-sm font-semibold truncate ${
              isCurrent ? 'text-accent-light' : 'text-white group-hover:text-accent-light'
            } transition-colors`}
          >
            {song.title}
          </div>
          <div className="text-xs text-text-muted truncate">
            {song.artist_name || 'Unknown Artist'} • {song.album_title || 'Single'}
          </div>
        </div>
      </div>

      {/* Right Column: Actions & Duration */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Download Offline Button */}
        <button
          onClick={() => {
            if (isOffline) {
              removeOfflineSong(song.id);
            } else {
              downloadSong(song);
            }
          }}
          title={isOffline ? 'Available offline (Click to remove copy)' : 'Download for offline playback'}
          className={`p-1.5 rounded-lg transition-all ${
            isOffline
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
        >
          {isCurrentlyDownloading ? (
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : isOffline ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Favorite Heart Button */}
        <button
          onClick={() => onFavoriteToggle && onFavoriteToggle(song.id)}
          className={`p-1.5 rounded-lg transition-all ${
            isFavorited
              ? 'text-rose-500'
              : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Duration */}
        <span className="text-xs font-mono text-text-muted w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* More 3-Dot Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-44 rounded-xl bg-surface-100 border border-surface-50 shadow-xl py-1.5 z-30 space-y-0.5 text-xs text-text-secondary"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  playNextInQueue(song);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-50 hover:text-white flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" /> Play Next
              </button>

              <button
                onClick={() => {
                  addToQueue(song);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-50 hover:text-white flex items-center gap-2"
              >
                <ListPlus className="w-3.5 h-3.5" /> Add to Queue
              </button>

              {onRemoveFromPlaylist && (
                <button
                  onClick={() => {
                    onRemoveFromPlaylist(song.id);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove from Playlist
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
