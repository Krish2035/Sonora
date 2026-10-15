'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useOffline } from '@/context/OfflineContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Download, 
  Check, 
  ListMusic, 
  Music,
  Maximize2
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { FullScreenMobilePlayer } from './FullScreenMobilePlayer';
import { QueueDrawer } from './QueueDrawer';

export function PersistentPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isExpanded,
    setIsExpanded,
    setIsQueueOpen,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextSong,
    previousSong,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const { offlineSongIds, downloadSong, removeOfflineSong, isDownloading } = useOffline();
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const isOffline = currentSong ? offlineSongIds.has(currentSong.id) : false;
  const isCurrentlyDownloading = currentSong ? isDownloading[currentSong.id] : false;

  // Sync favorite state
  useEffect(() => {
    if (!currentSong) return;
    fetch(`${apiUrl}/api/favorites`)
      .then((res) => res.json())
      .then((data) => {
        if (data.favoriteIds) {
          setIsFavorited(data.favoriteIds.includes(currentSong.id));
        }
      })
      .catch(() => {});
  }, [currentSong, apiUrl]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSong) return;
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      const method = nextState ? 'POST' : 'DELETE';
      await fetch(`${apiUrl}/api/favorites/${currentSong.id}`, { method });
    } catch {
      setIsFavorited(!nextState);
    }
  };

  const handleOfflineToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSong) return;
    if (isOffline) {
      removeOfflineSong(currentSong.id);
    } else {
      downloadSong(currentSong);
    }
  };

  if (!currentSong) return null;

  return (
    <>
      {/* Full-screen player modal when expanded on mobile/tablet */}
      <FullScreenMobilePlayer />

      {/* Queue Drawer */}
      <QueueDrawer />

      {/* Persistent Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-200/95 backdrop-blur-xl border-t border-surface-50 shadow-player-bar px-4 py-2.5 md:py-3 transition-all">
        {/* Mobile Mini-Player View (< md screens) */}
        <div
          onClick={() => setIsExpanded(true)}
          className="flex md:hidden items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-surface-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-surface-50">
              {currentSong.artwork_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${apiUrl}${currentSong.artwork_path}`}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-5 h-5 text-accent" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{currentSong.title}</span>
                {isOffline && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Offline Ready" />
                )}
              </div>
              <div className="text-xs text-text-muted truncate">
                {currentSong.artist_name || 'Unknown Artist'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={toggleFavorite}
              aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
              className="p-2 text-text-muted hover:text-rose-500"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'text-rose-500 fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-glow ml-1"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Desktop View (>= md screens) */}
        <div className="hidden md:grid grid-cols-3 items-center max-w-7xl mx-auto gap-4">
          {/* Left: Track Information & Action Buttons */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => setIsExpanded(true)}
              className="w-12 h-12 rounded-xl bg-surface-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-surface-50 cursor-pointer group relative"
            >
              {currentSong.artwork_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${apiUrl}${currentSong.artwork_path}`}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-6 h-6 text-accent" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                <span>{currentSong.title}</span>
                {isOffline && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    OFFLINE
                  </span>
                )}
              </div>
              <div className="text-xs text-text-muted truncate">
                {currentSong.artist_name || 'Unknown Artist'} • {currentSong.album_title || 'Single'}
              </div>
            </div>

            {/* Favorite & Download Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={toggleFavorite}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-surface-100 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'text-rose-500 fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleOfflineToggle}
                aria-label={isOffline ? 'Remove offline copy' : 'Download for offline use'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isOffline
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-text-muted hover:text-white hover:bg-surface-100'
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
            </div>
          </div>

          {/* Center: Playback Controls & Progress Bar */}
          <div className="flex flex-col items-center gap-1.5 w-full max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                aria-label="Toggle shuffle"
                className={`p-1.5 rounded-lg transition-colors ${
                  isShuffle ? 'text-accent-light' : 'text-text-muted hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={previousSong}
                aria-label="Previous track"
                className="p-1.5 text-text-secondary hover:text-white active:scale-95 transition-transform"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-cyan flex items-center justify-center text-white shadow-glow hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={nextSong}
                aria-label="Next track"
                className="p-1.5 text-text-secondary hover:text-white active:scale-95 transition-transform"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={cycleRepeatMode}
                aria-label={`Cycle repeat mode (${repeatMode})`}
                className={`p-1.5 rounded-lg transition-colors ${
                  repeatMode !== 'none' ? 'text-accent-light' : 'text-text-muted hover:text-white'
                }`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Scrub Progress Bar */}
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              showLabels={true}
            />
          </div>

          {/* Right: Queue & Volume */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setIsQueueOpen(true)}
              aria-label="View queue"
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-surface-100 transition-colors"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
            />
          </div>
        </div>
      </div>
    </>
  );
}
