import { Request, Response, NextFunction } from 'express';
import { favoriteRepository } from '../repositories/favoriteRepository.js';

export async function getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const favorites = await favoriteRepository.getFavorites();
    const ids = await favoriteRepository.getFavoriteIds();
    res.json({ success: true, data: favorites, favoriteIds: ids });
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { songId } = req.params;
    await favoriteRepository.addFavorite(songId);
    res.json({ success: true, message: 'Song favorited' });
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { songId } = req.params;
    await favoriteRepository.removeFavorite(songId);
    res.json({ success: true, message: 'Song removed from favorites' });
  } catch (err) {
    next(err);
  }
}
