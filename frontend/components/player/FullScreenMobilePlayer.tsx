'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useOffline } from '@/context/OfflineContext';
import { 
  ChevronDown, 
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
  Radio
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';

export function FullScreenMobilePlayer() {
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

  // Sync Favorite status with backend
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

  const toggleFavorite = async () => {
    if (!currentSong) return;
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      const method = nextState ? 'POST' : 'DELETE';
      await fetch(`${apiUrl}/api/favorites/${currentSong.id}`, { method });
    } catch {
      setIsFavorited(!nextState); // Rollback
    }
  };

  if (!isExpanded || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col justify-between p-6 md:p-10 select-none animate-slide-up">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse player"
          className="p-2.5 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary transition-colors active:scale-95"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
            Playing From Library
          </span>
          <div className="text-xs font-semibold text-text-secondary truncate max-w-[200px]">
            {currentSong.album_title || 'Sonora Player'}
          </div>
        </div>

        <button
          onClick={() => setIsQueueOpen(true)}
          aria-label="Open queue"
          className="p-2.5 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary transition-colors active:scale-95"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Album Artwork Cover */}
      <div className="my-auto w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-surface-100 shadow-2xl relative border border-white/5 flex items-center justify-center">
        {currentSong.artwork_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${apiUrl}${currentSong.artwork_path}`}
            alt={currentSong.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-surface-50 flex items-center justify-center">
            <Radio className="w-12 h-12 text-accent" />
          </div>
        )}
      </div>

      {/* Song Info & Secondary Actions */}
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-white truncate tracking-tight">
              {currentSong.title}
            </h2>
            <p className="text-sm text-text-secondary truncate mt-0.5">
              {currentSong.artist_name || 'Unknown Artist'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Offline Button */}
            <button
              onClick={() => {
                if (isOffline) {
                  removeOfflineSong(currentSong.id);
                } else {
                  downloadSong(currentSong);
                }
              }}
              aria-label={isOffline ? 'Remove offline copy' : 'Download for offline playback'}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isOffline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-surface-100 text-text-secondary hover:text-white'
              }`}
            >
              {isCurrentlyDownloading ? (
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : isOffline ? (
                <Check className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>

            {/* Favorite Button */}
            <button
              onClick={toggleFavorite}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isFavorited
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                  : 'bg-surface-100 text-text-secondary hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Progress Slider */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          showLabels={true}
        />

        {/* Main Transport Controls */}
        <div className="flex items-center justify-between py-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            className={`p-3 rounded-full transition-colors active:scale-95 ${
              isShuffle ? 'text-accent-light' : 'text-text-muted hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={previousSong}
            aria-label="Previous track"
            className="p-3 text-text-primary hover:text-white active:scale-95 transition-transform"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Play/Pause Main Circle */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-cyan flex items-center justify-center text-white shadow-glow hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextSong}
            aria-label="Next track"
            className="p-3 text-text-primary hover:text-white active:scale-95 transition-transform"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={cycleRepeatMode}
            aria-label={`Cycle repeat mode (currently ${repeatMode})`}
            className={`p-3 rounded-full transition-colors active:scale-95 ${
              repeatMode !== 'none' ? 'text-accent-light' : 'text-text-muted hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume slider for tablet/mobile where supported */}
        <div className="pt-2 flex justify-center">
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}
