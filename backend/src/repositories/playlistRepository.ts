import { pool } from '../config/database.js';
import { SongRecord } from './songRepository.js';

export interface PlaylistRecord {
  id: string;
  name: string;
  description?: string;
  cover_image_path?: string;
  created_at: Date;
  updated_at: Date;
  song_count?: number;
  total_duration?: number;
  songs?: SongRecord[];
}

export class PlaylistRepository {
  async createPlaylist(name: string, description?: string): Promise<PlaylistRecord> {
    const query = `
      INSERT INTO playlists (name, description)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const res = await pool.query(query, [name.trim(), description?.trim() || null]);
    return res.rows[0];
  }

  async getPlaylists(): Promise<PlaylistRecord[]> {
    const query = `
      SELECT 
        p.*,
        COUNT(ps.id)::int as song_count,
        COALESCE(SUM(s.duration), 0)::numeric as total_duration
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      LEFT JOIN songs s ON ps.song_id = s.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getPlaylistById(id: string): Promise<PlaylistRecord | null> {
    const playlistQuery = `
      SELECT * FROM playlists WHERE id = $1;
    `;
    const pRes = await pool.query(playlistQuery, [id]);
    if (pRes.rows.length === 0) return null;

    const playlist = pRes.rows[0];

    const songsQuery = `
      SELECT 
        s.*,
        a.name as artist_name,
        al.title as album_title,
        ps.position,
        ps.added_at
      FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE ps.playlist_id = $1
      ORDER BY ps.position ASC;
    `;

    const sRes = await pool.query(songsQuery, [id]);
    playlist.songs = sRes.rows;
    playlist.song_count = sRes.rows.length;
    playlist.total_duration = sRes.rows.reduce((acc, curr) => acc + Number(curr.duration || 0), 0);

    return playlist;
  }

  async updatePlaylist(id: string, name: string, description?: string): Promise<PlaylistRecord | null> {
    const query = `
      UPDATE playlists
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const res = await pool.query(query, [name.trim(), description?.trim() || null, id]);
    return res.rows[0] || null;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    // Get highest position
    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM playlist_songs WHERE playlist_id = $1',
      [playlistId]
    );
    const nextPos = posRes.rows[0].next_pos;

    const query = `
      INSERT INTO playlist_songs (playlist_id, song_id, position)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(query, [playlistId, songId, nextPos]);
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [playlistId, songId]
    );
  }

  async reorderPlaylist(playlistId: string, songIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < songIds.length; i++) {
        await client.query(
          'UPDATE playlist_songs SET position = $1 WHERE playlist_id = $2 AND song_id = $3',
          [i, playlistId, songIds[i]]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const playlistRepository = new PlaylistRepository();
