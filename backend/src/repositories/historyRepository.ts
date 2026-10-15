import { pool } from '../config/database.js';
import { SongRecord } from './songRepository.js';

export interface HistoryRecord {
  id: string;
  song_id: string;
  played_duration: number;
  played_at: Date;
  song?: SongRecord;
}

export class HistoryRepository {
  /**
   * Log playback history, avoiding spam if the same song was played in the last 2 minutes
   */
  async logPlay(songId: string, playedDuration: number): Promise<void> {
    const recentCheck = `
      SELECT id FROM play_history
      WHERE song_id = $1 
      AND played_at > (CURRENT_TIMESTAMP - INTERVAL '2 minutes')
      LIMIT 1;
    `;
    const check = await pool.query(recentCheck, [songId]);
    if (check.rows.length > 0) {
      // Update the existing recent record rather than creating clutter
      await pool.query(
        'UPDATE play_history SET played_duration = $1, played_at = CURRENT_TIMESTAMP WHERE id = $2',
        [playedDuration, check.rows[0].id]
      );
      return;
    }

    const insertQuery = `
      INSERT INTO play_history (song_id, played_duration)
      VALUES ($1, $2);
    `;
    await pool.query(insertQuery, [songId, playedDuration]);
  }

  async getRecentHistory(limit: number = 30): Promise<SongRecord[]> {
    const query = `
      SELECT DISTINCT ON (s.id)
        s.*,
        a.name as artist_name,
        al.title as album_title,
        ph.played_at
      FROM play_history ph
      JOIN songs s ON ph.song_id = s.id
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      ORDER BY s.id, ph.played_at DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    // Sort final distinct rows by played_at desc
    return res.rows.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
  }
}

export const historyRepository = new HistoryRepository();
