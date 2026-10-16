import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runDeduplication() {
  console.log('=== Starting Song Deduplication Pipeline ===\n');

  const client = await pool.connect();

  try {
    const initialCountRes = await client.query('SELECT COUNT(*) as count FROM songs');
    const initialCount = parseInt(initialCountRes.rows[0].count, 10);
    console.log(`Initial total songs in database: ${initialCount}`);

    // Find all titles that appear more than once (case-insensitive & trimmed)
    const duplicateTitlesRes = await client.query(`
      SELECT LOWER(TRIM(title)) as norm_title, COUNT(*) as cnt
      FROM songs
      GROUP BY LOWER(TRIM(title))
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC;
    `);

    const duplicateGroups = duplicateTitlesRes.rows;
    console.log(`Found ${duplicateGroups.length} unique titles with multiple copies.\n`);

    let totalRemoved = 0;

    for (const group of duplicateGroups) {
      const normTitle = group.norm_title;

      // Fetch all songs with this normalized title, sorted by best quality/completeness:
      // 1. duration DESC (prefer full song over ringtone/preview snippet)
      // 2. file_size DESC (higher bitrate/quality)
      // 3. artwork_path IS NOT NULL DESC (has cover art)
      // 4. created_at ASC (earliest created)
      const songsRes = await client.query(
        `SELECT id, title, duration, file_size, artwork_path, file_name, created_at
         FROM songs
         WHERE LOWER(TRIM(title)) = $1
         ORDER BY 
           duration DESC,
           file_size DESC,
           (artwork_path IS NOT NULL) DESC,
           created_at ASC`,
        [normTitle]
      );

      const songs = songsRes.rows;
      const keepSong = songs[0];
      const removeSongs = songs.slice(1);
      const removeIds = removeSongs.map((s) => s.id);

      console.log(`\n🎵 Title: "${keepSong.title}" (${songs.length} copies found)`);
      console.log(`   KEEPING: ID ${keepSong.id} | duration: ${keepSong.duration}s | size: ${keepSong.file_size} | file: ${keepSong.file_name}`);

      await client.query('BEGIN');

      try {
        for (const rem of removeSongs) {
          console.log(`   REMOVING: ID ${rem.id} | duration: ${rem.duration}s | size: ${rem.file_size} | file: ${rem.file_name}`);

          // 1. Handle favorites:
          // Check if the duplicate was in favorites
          const favCheck = await client.query('SELECT id FROM favorites WHERE song_id = $1', [rem.id]);
          if (favCheck.rows.length > 0) {
            // Check if keepSong is already favorited
            const keepFavCheck = await client.query('SELECT id FROM favorites WHERE song_id = $1', [keepSong.id]);
            if (keepFavCheck.rows.length > 0) {
              // Already favorited, delete duplicate favorite record
              await client.query('DELETE FROM favorites WHERE song_id = $1', [rem.id]);
            } else {
              // Re-point favorite to keepSong
              await client.query('UPDATE favorites SET song_id = $1 WHERE song_id = $2', [keepSong.id, rem.id]);
            }
          }

          // 2. Handle playlist_songs:
          const plSongs = await client.query('SELECT id, playlist_id FROM playlist_songs WHERE song_id = $1', [rem.id]);
          for (const plRow of plSongs.rows) {
            // Check if keepSong is already in this playlist
            const existingInPl = await client.query(
              'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
              [plRow.playlist_id, keepSong.id]
            );
            if (existingInPl.rows.length > 0) {
              await client.query('DELETE FROM playlist_songs WHERE id = $1', [plRow.id]);
            } else {
              await client.query('UPDATE playlist_songs SET song_id = $1 WHERE id = $2', [keepSong.id, plRow.id]);
            }
          }

          // 3. Handle play_history:
          await client.query('UPDATE play_history SET song_id = $1 WHERE song_id = $2', [keepSong.id, rem.id]);

          // 4. Delete the duplicate song record
          await client.query('DELETE FROM songs WHERE id = $1', [rem.id]);
          totalRemoved++;
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed processing group "${normTitle}":`, err);
        throw err;
      }
    }

    console.log(`\nAll duplicate groups processed! Total duplicate copies removed: ${totalRemoved}`);

    // Create unique index to permanently prevent duplicate titles from being inserted
    console.log('\nCreating UNIQUE index idx_songs_unique_lower_title to enforce 1 copy per title...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_unique_lower_title 
      ON songs (LOWER(TRIM(title)));
    `);
    console.log('Unique index created successfully.');

    // Final count
    const finalCountRes = await client.query('SELECT COUNT(*) as count FROM songs');
    const finalCount = parseInt(finalCountRes.rows[0].count, 10);
    console.log(`\nFinal unique songs in database: ${finalCount} (was ${initialCount}, removed ${totalRemoved})`);

    // Verify 0 duplicates remain
    const verifyRes = await client.query(`
      SELECT LOWER(TRIM(title)) as norm_title, COUNT(*) as cnt
      FROM songs
      GROUP BY LOWER(TRIM(title))
      HAVING COUNT(*) > 1;
    `);

    if (verifyRes.rows.length === 0) {
      console.log('✅ Verification passed: 0 duplicate titles remaining in database.');
    } else {
      console.warn(`⚠️ Warning: ${verifyRes.rows.length} duplicates still detected!`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

runDeduplication().catch((err) => {
  console.error('Fatal deduplication error:', err);
  process.exit(1);
});
