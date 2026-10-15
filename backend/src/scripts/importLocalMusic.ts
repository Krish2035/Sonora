import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { parseAudioMetadata } from '../services/metadataService.js';
import { songRepository } from '../repositories/songRepository.js';
import { pool, testDbConnection } from '../config/database.js';

async function runImporter() {
  console.log('=== Sonora Music Ingestion Pipeline ===');

  // Verify database connection first
  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.error('Cannot connect to PostgreSQL. Please start PostgreSQL before importing.');
    process.exit(1);
  }

  // Determine source folder: default to f:/krish/Music/resources/Music
  const candidatePaths = [
    path.resolve(process.cwd(), '../resources/Music'),
    path.resolve(process.cwd(), 'resources/Music'),
    'F:\\krish\\Music\\resources\\Music',
    'f:/krish/Music/resources/Music',
  ];

  let sourceDir = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      sourceDir = p;
      break;
    }
  }

  if (!sourceDir) {
    console.error('Source music directory [resources/Music] could not be found.');
    process.exit(1);
  }

  console.log(`Scanning audio directory: ${sourceDir}`);

  const targetAudioDir = path.resolve(process.cwd(), 'uploads/audio');
  const targetArtDir = path.resolve(process.cwd(), 'uploads/art');

  await fs.promises.mkdir(targetAudioDir, { recursive: true });
  await fs.promises.mkdir(targetArtDir, { recursive: true });

  const files = await fs.promises.readdir(sourceDir);
  const supportedExts = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);
  const audioFiles = files.filter((f) => supportedExts.has(path.extname(f).toLowerCase()));

  console.log(`Found ${audioFiles.length} audio tracks ready for processing.\n`);

  let importedCount = 0;
  let skippedDuplicates = 0;
  let errorCount = 0;

  for (let i = 0; i < audioFiles.length; i++) {
    const fileName = audioFiles[i];
    const sourceFilePath = path.join(sourceDir, fileName);
    const progress = `[${i + 1}/${audioFiles.length}]`;

    try {
      // 1. Extract metadata
      const meta = await parseAudioMetadata(sourceFilePath, targetArtDir);

      // 2. Duplicate detection check
      const duplicate = await songRepository.findDuplicate(meta.title, meta.duration, meta.fileSize);
      if (duplicate) {
        skippedDuplicates++;
        console.log(`${progress} Skipped duplicate: "${meta.title}" (${fileName})`);
        continue;
      }

      // 3. Copy file to uploads/audio with safe unique identifier
      const ext = path.extname(fileName);
      const safeDiskFileName = `${uuidv4()}${ext}`;
      const destinationPath = path.join(targetAudioDir, safeDiskFileName);

      await fs.promises.copyFile(sourceFilePath, destinationPath);

      // 4. Upsert Artist and Album
      let artistId: string | undefined;
      if (meta.artist && meta.artist !== 'Unknown Artist') {
        artistId = await songRepository.upsertArtist(meta.artist);
      }

      let albumId: string | undefined;
      if (meta.album) {
        albumId = await songRepository.upsertAlbum(meta.album, artistId, meta.year, meta.artworkPath);
      }

      // 5. Insert Song metadata into PostgreSQL
      await songRepository.createSong({
        title: meta.title,
        artistId,
        albumId,
        duration: meta.duration,
        genre: meta.genre,
        trackNumber: meta.trackNumber,
        releaseYear: meta.year,
        filePath: path.join('audio', safeDiskFileName),
        fileName: fileName,
        mimeType: meta.mimeType,
        fileSize: meta.fileSize,
        artworkPath: meta.artworkPath,
      });

      importedCount++;
      console.log(`${progress} Imported: "${meta.title}" - ${meta.artist} [${meta.duration}s]`);
    } catch (err) {
      errorCount++;
      console.error(`${progress} Failed importing "${fileName}":`, (err as Error).message);
    }
  }

  console.log('\n=======================================');
  console.log(`Import Complete!`);
  console.log(`Successfully Imported: ${importedCount}`);
  console.log(`Skipped Duplicates:    ${skippedDuplicates}`);
  console.log(`Failed / Errors:       ${errorCount}`);
  console.log(`Total Processed:       ${audioFiles.length}`);
  console.log('=======================================');

  await pool.end();
}

runImporter().catch((err) => {
  console.error('Fatal importer error:', err);
  process.exit(1);
});
