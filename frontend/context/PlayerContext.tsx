'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Song, RepeatMode } from '@/types/music';
import { idbAudioStorage } from '@/lib/idbAudioStorage';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isExpanded: boolean; // For mobile full-screen sheet
  isQueueOpen: boolean;
  playSong: (song: Song, contextQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Single persistent HTML5 Audio Element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const playLoggedRef = useRef<boolean>(false);
  const currentSongRef = useRef<Song | null>(null);

  // Keep ref synchronized with currentSong state
  currentSongRef.current = currentSong;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Initialize Audio Element ONCE on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Dynamically update duration if audio element reports valid duration
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }

      // Log play history after 10 seconds of listening
      if (audio.currentTime >= 10 && !playLoggedRef.current && currentSongRef.current) {
        playLoggedRef.current = true;
        fetch(`${apiUrl}/api/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: currentSongRef.current.id,
            playedDuration: Math.round(audio.currentTime),
          }),
        }).catch(() => {});
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, [apiUrl]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play a specific track
  const playSong = async (song: Song, contextQueue?: Song[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset play logging flag and reset timers
    playLoggedRef.current = false;
    setCurrentTime(0);

    // Set duration immediately from metadata so progress bar is never 0:00
    const metaDuration = Number(song.duration) || 0;
    setDuration(metaDuration);

    // If new queue provided, set it
    if (contextQueue && contextQueue.length > 0) {
      setOriginalQueue(contextQueue);
      if (isShuffle) {
        const others = contextQueue.filter((s) => s.id !== song.id).sort(() => Math.random() - 0.5);
        setQueue([song, ...others]);
        setQueueIndex(0);
      } else {
        setQueue(contextQueue);
        const idx = contextQueue.findIndex((s) => s.id === song.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      }
    } else if (!queue.some((s) => s.id === song.id)) {
      setQueue((prev) => [...prev, song]);
      setQueueIndex(queue.length);
    } else {
      const idx = queue.findIndex((s) => s.id === song.id);
      setQueueIndex(idx);
    }

    setCurrentSong(song);

    // Revoke previous blob URL if any
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    // Check if song exists in IndexedDB for offline playback
    const offlineRecord = await idbAudioStorage.getSong(song.id);

    if (offlineRecord && offlineRecord.audioBlob) {
      // Play directly from offline IndexedDB blob
      const blobUrl = URL.createObjectURL(offlineRecord.audioBlob);
      activeBlobUrlRef.current = blobUrl;
      audio.src = blobUrl;
    } else {
      // Check if online
      if (!navigator.onLine) {
        alert(`"${song.title}" is not available offline.\nDownload it while you're online to listen without internet.`);
        setIsPlaying(false);
        return;
      }
      // Stream with HTTP 206 Range requests from backend
      audio.src = `${apiUrl}/api/stream/${song.id}`;
    }

    audio.load();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio playback was prevented or interrupted:', err);
      setIsPlaying(false);
    }

    // Configure System Media Session API
    if ('mediaSession' in navigator) {
      const artUrl = song.artwork_path ? `${apiUrl}${song.artwork_path}` : '/icons/icon-512.png';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist_name || 'Unknown Artist',
        album: song.album_title || 'Single',
        artwork: [
          { src: artUrl, sizes: '192x192', type: 'image/png' },
          { src: artUrl, sizes: '512x512', type: 'image/png' },
        ],
      });
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Next song
  const nextSong = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      playSong(queue[nextIndex]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playSong(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, repeatMode]);

  // Previous song logic (> 3s restarts current song, <= 3s goes to previous song)
  const previousSong = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.currentTime > 3.0) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0 && queue[prevIndex]) {
      setQueueIndex(prevIndex);
      playSong(queue[prevIndex]);
    } else {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Stable Shuffle implementation
  const toggleShuffle = () => {
    if (!isShuffle) {
      if (currentSong && queue.length > 0) {
        const others = queue.filter((s) => s.id !== currentSong.id).sort(() => Math.random() - 0.5);
        setQueue([currentSong, ...others]);
        setQueueIndex(0);
      }
      setIsShuffle(true);
    } else {
      if (currentSong && originalQueue.length > 0) {
        setQueue(originalQueue);
        const origIdx = originalQueue.findIndex((s) => s.id === currentSong.id);
        setQueueIndex(origIdx >= 0 ? origIdx : 0);
      }
      setIsShuffle(false);
    }
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  // Queue manipulation
  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
    setOriginalQueue((prev) => [...prev, song]);
  };

  const playNextInQueue = (song: Song) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  };

  // Handle track ending
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextSong();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [nextSong]);

  // Media Session action handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => previousSong());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [nextSong]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        isShuffle,
        repeatMode,
        isExpanded,
        isQueueOpen,
        playSong,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        nextSong,
        previousSong,
        toggleShuffle,
        cycleRepeatMode,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        setIsExpanded,
        setIsQueueOpen,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
