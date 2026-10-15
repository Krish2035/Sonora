import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { pool, testDbConnection } from '../config/database.js';
import { env } from '../config/env.js';

async function main() {
  console.log('=== Sonora Cloud Storage Music Sync (Backblaze B2 / Cloudflare R2) ===');

  const accessKeyId = env.S3_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const bucket = env.S3_BUCKET_NAME || env.R2_BUCKET_NAME;
  let endpoint = env.S3_ENDPOINT;

  if (!endpoint && env.R2_ACCOUNT_ID) {
    endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  if (endpoint && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    endpoint = `https://${endpoint}`;
  }

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('ERROR: S3 / Backblaze B2 configuration is missing.');
    console.error('Please configure S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in backend/.env');
    process.exit(1);
  }

  let region = env.S3_REGION || 'auto';
  if (endpoint.includes('backblazeb2.com')) {
    const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
    if (match && match[1]) {
      region = match[1];
    }
  }

  const s3 = new S3Client({
    region,
    endpoint,
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
  let songs: any[] = [];
  try {
    const res = await client.query('SELECT id, title, file_path, file_name, artwork_path FROM songs');
    songs = res.rows;
    console.log(`Found ${songs.length} indexed songs in database. Starting B2 upload...`);
  } finally {
    client.release();
    await pool.end();
  }

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

  console.log('\n=== B2 Upload Summary ===');
  console.log(`Total songs: ${songs.length}`);
  console.log(`Uploaded now: ${uploadedCount}`);
  console.log(`Already in B2: ${skippedCount}`);
  console.log(`Errors / Missing: ${errorCount}`);
  console.log('=========================\n');
}

main().catch(console.error);
