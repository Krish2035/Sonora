'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Music, FileAudio, Disc3 } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  resultTitle?: string;
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

  const handleFiles = (fileList: FileList) => {
    const newItems: UploadItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      newItems.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }
    setItems((prev) => [...prev, ...newItems]);

    // Start uploads sequentially
    newItems.forEach((item) => uploadSingleFile(item));
  };

  const uploadSingleFile = async (item: UploadItem) => {
    const formData = new FormData();
    formData.append('file', item.file);

    setItems((prev) =>
      prev.map((i) => (i.file === item.file ? { ...i, status: 'uploading', progress: 30 } : i))
    );

    try {
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errJson.error || 'Upload failed');
      }

      const data = await res.json();

      setItems((prev) =>
        prev.map((i) =>
          i.file === item.file
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                resultTitle: data.data?.title || item.file.name,
              }
            : i
        )
      );
    } catch (err: unknown) {
      setItems((prev) =>
        prev.map((i) =>
          i.file === item.file
            ? {
                ...i,
                status: 'error',
                errorMessage: (err as Error).message || 'Failed uploading file',
              }
            : i
        )
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-accent" /> Upload Music
        </h1>
        <p className="text-xs text-text-muted">
          Add audio tracks from your PC or mobile device. Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC.
        </p>
      </div>

      {/* Drag & Drop Target Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-surface-50 hover:border-accent/50 hover:bg-surface-100/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-accent/15 border border-accent/25 text-accent-light flex items-center justify-center mx-auto shadow-glow">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">
              Drag & Drop your audio tracks here
            </h3>
            <p className="text-xs text-text-secondary">
              or click anywhere to browse your files
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 border border-surface-50 text-[11px] text-text-muted font-mono">
            <span>MP3 • WAV • M4A • AAC • OGG • FLAC</span>
          </div>
        </div>
      </div>

      {/* Upload Queue Progress */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Upload Queue ({items.length} files)
          </h2>

          <div className="glass-panel rounded-2xl p-2 divide-y divide-surface-50/50">
            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0 text-text-muted border border-surface-50">
                    <FileAudio className="w-5 h-5 text-accent-light" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {item.resultTitle || item.file.name}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                      <span>{formatBytes(item.file.size)}</span>
                      {item.status === 'error' && (
                        <span className="text-red-400 font-medium">({item.errorMessage})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <div className="flex items-center gap-2 text-xs text-accent-light">
                      <Disc3 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Indexed</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Failed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
