import { pool } from '../config/database.js';

export interface SongRecord {
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
  created_at: Date;
  updated_at: Date;
}

export class SongRepository {
  /**
   * Find or create artist by name
   */
  async upsertArtist(name: string): Promise<string> {
    const trimmed = name.trim();
    const query = `
      INSERT INTO artists (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;
    const res = await pool.query(query, [trimmed]);
    return res.rows[0].id;
  }

  /**
   * Find or create album by title and artist
   */
  async upsertAlbum(title: string, artistId?: string, year?: number, coverArt?: string): Promise<string> {
    const trimmed = title.trim();
    // Check if album exists with this title and artist
    const checkQuery = `
      SELECT id FROM albums 
      WHERE LOWER(title) = LOWER($1) 
      AND (artist_id = $2 OR ($2 IS NULL AND artist_id IS NULL))
      LIMIT 1;
    `;
    const check = await pool.query(checkQuery, [trimmed, artistId || null]);
    if (check.rows.length > 0) {
      return check.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO albums (title, artist_id, release_year, cover_art_path)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const res = await pool.query(insertQuery, [trimmed, artistId || null, year || null, coverArt || null]);
    return res.rows[0].id;
  }

  /**
   * Check if song with identical title or file already exists
   */
  async findDuplicate(title: string, duration?: number, fileSize?: number): Promise<SongRecord | null> {
    const trimmed = (title || '').trim();
    if (!trimmed) return null;
    const query = `
      SELECT * FROM songs
      WHERE LOWER(TRIM(title)) = LOWER(TRIM($1))
         OR ($2::bigint IS NOT NULL AND file_size = $2)
      LIMIT 1;
    `;
    const res = await pool.query(query, [trimmed, fileSize || null]);
    return res.rows[0] || null;
  }

  /**
   * Create song record
   */
  async createSong(params: {
    title: string;
    artistId?: string;
    albumId?: string;
    duration: number;
    genre?: string;
    trackNumber?: number;
    releaseYear?: number;
    filePath: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    artworkPath?: string;
  }): Promise<SongRecord> {
    const query = `
      INSERT INTO songs (
        title, artist_id, album_id, duration, genre, track_number, release_year,
        file_path, file_name, mime_type, file_size, artwork_path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (LOWER(TRIM(title))) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      params.title,
      params.artistId || null,
      params.albumId || null,
      params.duration,
      params.genre || null,
      params.trackNumber || null,
      params.releaseYear || null,
      params.filePath,
      params.fileName,
      params.mimeType,
      params.fileSize,
      params.artworkPath || null,
    ];

    const res = await pool.query(query, values);
    return res.rows[0];
  }

  /**
   * Get paginated songs with joined artist and album details
   */
  async getSongs(page: number = 1, limit: number = 50): Promise<{ songs: SongRecord[]; total: number }> {
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*) FROM songs');
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        s.*,
        a.name as artist_name,
        al.title as album_title
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const res = await pool.query(query, [limit, offset]);
    return { songs: res.rows, total };
  }

  /**
   * Find song by ID
   */
  async findById(id: string): Promise<SongRecord | null> {
    const query = `
      SELECT 
        s.*,
        a.name as artist_name,
        al.title as album_title
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE s.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  /**
   * Fast full-text / trigram search matching title, artist name, and album title
   */
  async searchSongs(searchTerm: string, limit: number = 50): Promise<SongRecord[]> {
    const pattern = `%${searchTerm.trim()}%`;
    const query = `
      SELECT 
        s.*,
        a.name as artist_name,
        al.title as album_title,
        GREATEST(
          similarity(s.title, $1),
          COALESCE(similarity(a.name, $1), 0),
          COALESCE(similarity(al.title, $1), 0)
        ) as search_rank
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE s.title ILIKE $2
         OR a.name ILIKE $2
         OR al.title ILIKE $2
         OR s.title % $1
      ORDER BY search_rank DESC, s.title ASC
      LIMIT $3;
    `;

    try {
      const res = await pool.query(query, [searchTerm.trim(), pattern, limit]);
      return res.rows;
    } catch {
      // Fallback to simple ILIKE if pg_trgm similarity fails
      const fallbackQuery = `
        SELECT 
          s.*,
          a.name as artist_name,
          al.title as album_title
        FROM songs s
        LEFT JOIN artists a ON s.artist_id = a.id
        LEFT JOIN albums al ON s.album_id = al.id
        WHERE s.title ILIKE $1
           OR a.name ILIKE $1
           OR al.title ILIKE $1
        ORDER BY s.title ASC
        LIMIT $2;
      `;
      const fallbackRes = await pool.query(fallbackQuery, [pattern, limit]);
      return fallbackRes.rows;
    }
  }

  /**
   * Delete song record from database
   */
  async deleteSong(id: string): Promise<SongRecord | null> {
    const query = `DELETE FROM songs WHERE id = $1 RETURNING *;`;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }
}

export const songRepository = new SongRepository();
