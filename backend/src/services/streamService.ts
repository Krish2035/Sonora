import { Response } from 'express';
import { storage } from './storage/index.js';
import path from 'path';

export interface RangeInfo {
  start: number;
  end: number;
  chunkSize: number;
  totalSize: number;
}

/**
 * Parses and validates HTTP Range request headers
 */
export function parseRangeHeader(rangeHeader: string | undefined, totalSize: number): RangeInfo | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const startPart = parts[0]?.trim();
  const endPart = parts[1]?.trim();

  let start = startPart ? parseInt(startPart, 10) : 0;
  let end = endPart ? parseInt(endPart, 10) : totalSize - 1;

  if (isNaN(start) || start < 0) start = 0;
  if (isNaN(end) || end >= totalSize) end = totalSize - 1;
  if (start > end) {
    return null;
  }

  // Cap chunk size to 1MB (1,048,576 bytes) for optimal streaming latency
  const maxChunk = 1024 * 1024;
  if (end - start + 1 > maxChunk) {
    end = start + maxChunk - 1;
  }

  return {
    start,
    end,
    chunkSize: end - start + 1,
    totalSize,
  };
}

/**
 * Streams audio file with HTTP 206 Partial Content support
 */
export async function streamAudioFile(
  relativeFilePath: string,
  mimeType: string,
  rangeHeader: string | undefined,
  res: Response
): Promise<void> {
  const exists = await storage.fileExists(relativeFilePath);
  if (!exists) {
    res.status(404).json({ success: false, error: 'Audio file not found in storage' });
    return;
  }

  const metadata = await storage.getFileMetadata(relativeFilePath);
  const totalSize = metadata.size;

  const range = parseRangeHeader(rangeHeader, totalSize);

  if (!range) {
    // If no range requested, return full content (or 200 with Accept-Ranges)
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': mimeType || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    });
    const fullStream = storage.getReadStream(relativeFilePath);
    fullStream.pipe(res);
    return;
  }

  // 206 Partial Content
  res.writeHead(206, {
    'Content-Range': `bytes ${range.start}-${range.end}/${totalSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': range.chunkSize,
    'Content-Type': mimeType || 'audio/mpeg',
    'Cache-Control': 'public, max-age=3600',
  });

  const stream = storage.getReadStream(relativeFilePath, range.start, range.end);
  stream.on('error', (err) => {
    console.error('Error streaming audio chunk:', err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });

  stream.pipe(res);
}
