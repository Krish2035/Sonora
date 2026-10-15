import { Request, Response, NextFunction } from 'express';
import { songRepository } from '../repositories/songRepository.js';
import { streamAudioFile } from '../services/streamService.js';

export async function streamSong(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { songId } = req.params;
    const song = await songRepository.findById(songId);

    if (!song) {
      res.status(404).json({ success: false, error: 'Song not found' });
      return;
    }

    const range = req.headers.range;
    await streamAudioFile(song.file_path, song.mime_type, range, res);
  } catch (error) {
    next(error);
  }
}
