'use client';

import React from 'react';
import { formatDuration } from '@/lib/formatters';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
  showLabels?: boolean;
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  className = '',
  showLabels = true,
}: ProgressBarProps) {
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  return (
    <div className={`flex items-center gap-2.5 w-full ${className}`}>
      {showLabels && (
        <span className="text-[11px] font-mono text-text-muted w-9 text-right select-none">
          {formatDuration(currentTime)}
        </span>
      )}

      <div className="relative flex-1 flex items-center group h-4 cursor-pointer">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleChange}
          aria-label="Audio progress slider"
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />

        {/* Track Background */}
        <div className="w-full h-1 bg-surface-50 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
          <div
            className="h-full bg-gradient-to-r from-accent to-cyan rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Scrub Handle */}
        <div
          className="absolute w-3 h-3 rounded-full bg-white shadow-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>

      {showLabels && (
        <span className="text-[11px] font-mono text-text-muted w-9 text-left select-none">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}
