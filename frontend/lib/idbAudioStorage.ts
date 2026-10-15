import { get, set, del, keys, createStore } from 'idb-keyval';
import { Song, OfflineSongRecord } from '@/types/music';

// Dedicated IndexedDB custom store for Sonora offline audio binaries
const audioStore = createStore('sonora_audio_db', 'offline_tracks');

export const idbAudioStorage = {
  /**
   * Save an audio track binary blob and metadata into IndexedDB
   */
  async saveSong(song: Song, audioBlob: Blob, artworkBlob?: Blob): Promise<void> {
    const record: OfflineSongRecord = {
      id: song.id,
      metadata: song,
      audioBlob,
      artworkBlob,
      downloadedAt: Date.now(),
      size: audioBlob.size,
    };
    await set(song.id, record, audioStore);
  },

  /**
   * Retrieve offline song record including audio blob
   */
  async getSong(id: string): Promise<OfflineSongRecord | undefined> {
    return await get<OfflineSongRecord>(id, audioStore);
  },

  /**
   * Check if a song is downloaded offline
   */
  async isSongOffline(id: string): Promise<boolean> {
    const record = await get<OfflineSongRecord>(id, audioStore);
    return !!record;
  },

  /**
   * Delete offline copy from IndexedDB
   */
  async deleteSong(id: string): Promise<void> {
    await del(id, audioStore);
  },

  /**
   * Get list of all offline tracks
   */
  async getAllOfflineSongs(): Promise<OfflineSongRecord[]> {
    const allKeys = await keys(audioStore);
    const records: OfflineSongRecord[] = [];
    for (const key of allKeys) {
      const record = await get<OfflineSongRecord>(key, audioStore);
      if (record) {
        records.push(record);
      }
    }
    return records.sort((a, b) => b.downloadedAt - a.downloadedAt);
  },

  /**
   * Calculate total storage size in bytes and track count
   */
  async getStorageUsage(): Promise<{ totalBytes: number; count: number }> {
    const songs = await this.getAllOfflineSongs();
    const totalBytes = songs.reduce((acc, curr) => acc + (curr.size || 0), 0);
    return {
      totalBytes,
      count: songs.length,
    };
  },

  /**
   * Clear all offline cached audio
   */
  async clearAll(): Promise<void> {
    const allKeys = await keys(audioStore);
    for (const key of allKeys) {
      await del(key, audioStore);
    }
  },
};
