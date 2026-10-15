import { pool } from '../config/database.js';
import { SongRecord } from './songRepository.js';

export class FavoriteRepository {
  async getFavorites(): Promise<SongRecord[]> {
    const query = `
      SELECT 
        s.*,
        a.name as artist_name,
        al.title as album_title,
        f.created_at as favorited_at
      FROM favorites f
      JOIN songs s ON f.song_id = s.id
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      ORDER BY f.created_at DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getFavoriteIds(): Promise<string[]> {
    const res = await pool.query('SELECT song_id FROM favorites');
    return res.rows.map((r) => r.song_id);
  }

  async addFavorite(songId: string): Promise<void> {
    const query = `
      INSERT INTO favorites (song_id)
      VALUES ($1)
      ON CONFLICT (song_id) DO NOTHING;
    `;
    await pool.query(query, [songId]);
  }

  async removeFavorite(songId: string): Promise<void> {
    await pool.query('DELETE FROM favorites WHERE song_id = $1', [songId]);
  }

  async isFavorite(songId: string): Promise<boolean> {
    const res = await pool.query('SELECT 1 FROM favorites WHERE song_id = $1', [songId]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const favoriteRepository = new FavoriteRepository();
