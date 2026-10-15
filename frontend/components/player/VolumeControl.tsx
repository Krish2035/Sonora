'use client';

import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const currentLevel = isMuted ? 0 : volume;

  const Icon = currentLevel === 0 ? VolumeX : currentLevel < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
        className="text-text-secondary hover:text-white transition-colors p-1"
      >
        <Icon className="w-4 h-4" />
      </button>

      <div className="relative w-20 h-4 flex items-center cursor-pointer">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={currentLevel}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="Volume slider"
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />

        <div className="w-full h-1 bg-surface-50 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
          <div
            className="h-full bg-text-secondary group-hover:bg-accent-light transition-colors rounded-full"
            style={{ width: `${currentLevel * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
