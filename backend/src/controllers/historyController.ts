import { Request, Response, NextFunction } from 'express';
import { historyRepository } from '../repositories/historyRepository.js';

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const history = await historyRepository.getRecentHistory(limit);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

export async function logPlay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { songId, playedDuration } = req.body;
    if (!songId) {
      res.status(400).json({ success: false, error: 'songId is required' });
      return;
    }
    await historyRepository.logPlay(songId, parseInt(playedDuration, 10) || 0);
    res.json({ success: true, message: 'Play logged' });
  } catch (err) {
    next(err);
  }
}
