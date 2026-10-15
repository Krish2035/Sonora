import * as mm from 'music-metadata';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre?: string;
  year?: number;
  trackNumber?: number;
  artworkPath?: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Cleans messy download tags from track titles and artist names
 * e.g., "Song Name (PagalWorld.com) (1).mp3" -> "Song Name"
 */
export function cleanTitle(rawTitle: string): string {
  let cleaned = rawTitle
    .replace(/\s*\([^)]*(?:pagal|download|dj|remix|mp3|320kbps|128kbps|ringtone|sensongs|mobcup|audio)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*(?:pagal|download|dj|remix|mp3|320kbps|128kbps|ringtone|sensongs|mobcup|audio)[^\]]*\]/gi, '')
    .replace(/_\d+Kbps/gi, '')
    .replace(/\(\d+\)/g, '') // remove duplicated markers like (1), (2)
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || rawTitle.trim();
}

/**
 * Extracts comprehensive ID3 metadata and embedded cover artwork
 */
export async function parseAudioMetadata(
  filePath: string,
  artOutputDir: string
): Promise<ExtractedMetadata> {
  const stat = await fs.promises.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let mimeType = 'audio/mpeg';
  if (ext === '.m4a' || ext === '.aac') mimeType = 'audio/mp4';
  else if (ext === '.wav') mimeType = 'audio/wav';
  else if (ext === '.ogg') mimeType = 'audio/ogg';

  let metadata: mm.IAudioMetadata | null = null;
  try {
    metadata = await mm.parseFile(filePath, { duration: true });
  } catch (err) {
    console.warn(`Could not parse ID3 tags for ${path.basename(filePath)}, using fallback file attributes:`, (err as Error).message);
  }

  const rawFilename = path.basename(filePath, ext);

  // Derive title
  const rawTitle = metadata?.common.title || rawFilename;
  const title = cleanTitle(rawTitle);

  // Derive artist
  const rawArtist = metadata?.common.artist || metadata?.common.albumartist || 'Unknown Artist';
  const artist = cleanTitle(rawArtist);

  // Derive album
  const album = metadata?.common.album ? cleanTitle(metadata.common.album) : 'Single';

  const duration = metadata?.format.duration ? Math.round(metadata.format.duration * 100) / 100 : 0;
  const year = metadata?.common.year || undefined;
  const genre = metadata?.common.genre && metadata.common.genre.length > 0 ? metadata.common.genre[0] : undefined;
  const trackNumber = metadata?.common.track?.no || undefined;

  // Extract embedded artwork if present
  let artworkPath: string | undefined;
  if (metadata?.common.picture && metadata.common.picture.length > 0) {
    const pic = metadata.common.picture[0];
    const hash = crypto.createHash('md5').update(pic.data).digest('hex');
    const picExt = pic.format.includes('png') ? '.png' : '.jpg';
    const artFilename = `${hash}${picExt}`;
    const fullArtPath = path.join(artOutputDir, artFilename);

    if (!fs.existsSync(fullArtPath)) {
      await fs.promises.mkdir(artOutputDir, { recursive: true });
      await fs.promises.writeFile(fullArtPath, pic.data);
    }
    artworkPath = `/art/${artFilename}`;
  }

  return {
    title,
    artist,
    album,
    duration,
    genre,
    year,
    trackNumber,
    artworkPath,
    mimeType,
    fileSize: stat.size,
  };
}
