export interface Song {
  id: string;
  title: string;
  artist_id?: string;
  artist_name?: string;
  album_id?: string;
  album_title?: string;
  duration: number;
  genre?: string;
  track_number?: number;
  release_year?: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  artwork_path?: string;
  created_at: string;
  updated_at?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_image_path?: string;
  song_count: number;
  total_duration: number;
  songs?: Song[];
  created_at: string;
  updated_at: string;
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface OfflineSongRecord {
  id: string;
  metadata: Song;
  audioBlob: Blob;
  artworkBlob?: Blob;
  downloadedAt: number;
  size: number;
}
