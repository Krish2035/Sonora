import { Request, Response, NextFunction } from 'express';
import { songRepository } from '../repositories/songRepository.js';

export async function getSongs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const result = await songRepository.getSongs(page, limit);

    res.json({
      success: true,
      data: result.songs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSongById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const song = await songRepository.findById(id);

    if (!song) {
      res.status(404).json({
        success: false,
        error: 'Song not found',
      });
      return;
    }

    res.json({
      success: true,
      data: song,
    });
  } catch (error) {
    next(error);
  }
}

export async function searchSongs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      res.json({ success: true, data: [] });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 50;
    const results = await songRepository.searchSongs(q, limit);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSong(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await songRepository.deleteSong(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Song not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Song removed from library',
    });
  } catch (error) {
    next(error);
  }
}
