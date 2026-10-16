import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseAudioMetadata } from '../services/metadataService.js';
import { songRepository } from '../repositories/songRepository.js';

export async function handleAudioUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No audio file provided' });
    return;
  }

  const tempFilePath = file.path;
  const targetAudioDir = path.resolve(process.cwd(), 'uploads/audio');
  const targetArtDir = path.resolve(process.cwd(), 'uploads/art');

  try {
    await fs.promises.mkdir(targetAudioDir, { recursive: true });
    await fs.promises.mkdir(targetArtDir, { recursive: true });

    // 1. Extract metadata
    const meta = await parseAudioMetadata(tempFilePath, targetArtDir);

    // 2. Duplicate detection check (strictly one copy per song title)
    const duplicate = await songRepository.findDuplicate(meta.title, meta.duration, meta.fileSize);
    if (duplicate) {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch(() => {});
      }
      res.status(409).json({
        success: false,
        error: `Song "${meta.title}" already exists in the library. Only one copy is kept.`,
        data: duplicate,
      });
      return;
    }

    // 3. Move file from temp to uploads/audio
    const ext = path.extname(file.originalname);
    const safeDiskFileName = `${uuidv4()}${ext}`;
    const destinationPath = path.join(targetAudioDir, safeDiskFileName);

    await fs.promises.rename(tempFilePath, destinationPath);

    // 3. Upsert artist & album
    let artistId: string | undefined;
    if (meta.artist && meta.artist !== 'Unknown Artist') {
      artistId = await songRepository.upsertArtist(meta.artist);
    }

    let albumId: string | undefined;
    if (meta.album) {
      albumId = await songRepository.upsertAlbum(meta.album, artistId, meta.year, meta.artworkPath);
    }

    // 4. Save Song record to database
    const newSong = await songRepository.createSong({
      title: meta.title,
      artistId,
      albumId,
      duration: meta.duration,
      genre: meta.genre,
      trackNumber: meta.trackNumber,
      releaseYear: meta.year,
      filePath: path.join('audio', safeDiskFileName),
      fileName: file.originalname,
      mimeType: meta.mimeType || file.mimetype,
      fileSize: meta.fileSize,
      artworkPath: meta.artworkPath,
    });

    res.status(201).json({
      success: true,
      message: 'Track uploaded and indexed successfully',
      data: newSong,
    });
  } catch (err) {
    // Cleanup temp file on error
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
    next(err);
  }
}
