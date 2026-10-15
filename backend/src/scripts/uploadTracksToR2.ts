import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { pool, testDbConnection } from '../config/database.js';
import { env } from '../config/env.js';

async function main() {
  console.log('=== Sonora Cloudflare R2 Music Sync ===');

  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('ERROR: Cloudflare R2 environment variables are missing.');
    console.error('Please configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in backend/.env');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.error('Cannot connect to database.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, title, file_path, file_name, artwork_path FROM songs');
    const songs = res.rows;
    console.log(`Found ${songs.length} indexed songs in database. Starting R2 upload...`);

    const uploadsBase = path.resolve(process.cwd(), 'uploads');
    let uploadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const progress = `[${i + 1}/${songs.length}]`;
      const normalizedKey = song.file_path.replace(/\\/g, '/').replace(/^\/+/, '');
      const localFilePath = path.resolve(uploadsBase, normalizedKey);

      if (!fs.existsSync(localFilePath)) {
        console.warn(`${progress} File not found locally: ${localFilePath}`);
        errorCount++;
        continue;
      }

      // Check if already in R2 to allow resuming safely
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: normalizedKey }));
        skippedCount++;
        console.log(`${progress} Already in R2: "${song.title}"`);
        continue;
      } catch (err: any) {
        // Not in R2, proceed with upload
      }

      try {
        const fileBuffer = fs.readFileSync(localFilePath);
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: normalizedKey,
            Body: fileBuffer,
            ContentType: 'audio/mpeg',
          })
        );

        // Also upload artwork if present
        if (song.artwork_path) {
          const artKey = song.artwork_path.replace(/\\/g, '/').replace(/^\/+/, '');
          const localArtPath = path.resolve(uploadsBase, artKey);
          if (fs.existsSync(localArtPath)) {
            const artBuffer = fs.readFileSync(localArtPath);
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: artKey,
                Body: artBuffer,
                ContentType: 'image/jpeg',
              })
            );
          }
        }

        uploadedCount++;
        console.log(`${progress} Uploaded: "${song.title}" -> R2 (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
      } catch (err: any) {
        errorCount++;
        console.error(`${progress} Failed uploading "${song.title}":`, err.message);
      }
    }

    console.log('\n=== R2 Upload Summary ===');
    console.log(`Total songs: ${songs.length}`);
    console.log(`Uploaded now: ${uploadedCount}`);
    console.log(`Already in R2: ${skippedCount}`);
    console.log(`Errors / Missing: ${errorCount}`);
    console.log('=========================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
