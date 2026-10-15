import { Request, Response, NextFunction } from 'express';
import { playlistRepository } from '../repositories/playlistRepository.js';

export async function getPlaylists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const playlists = await playlistRepository.getPlaylists();
    res.json({ success: true, data: playlists });
  } catch (err) {
    next(err);
  }
}

export async function createPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'Playlist name is required' });
      return;
    }

    const playlist = await playlistRepository.createPlaylist(name, description);
    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
}

export async function getPlaylistById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const playlist = await playlistRepository.getPlaylistById(id);
    if (!playlist) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }
    res.json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
}

export async function updatePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await playlistRepository.updatePlaylist(id, name, description);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await playlistRepository.deletePlaylist(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    next(err);
  }
}

export async function addSongToPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    if (!songId) {
      res.status(400).json({ success: false, error: 'songId is required' });
      return;
    }
    await playlistRepository.addSongToPlaylist(id, songId);
    res.json({ success: true, message: 'Song added to playlist' });
  } catch (err) {
    next(err);
  }
}

export async function removeSongFromPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, songId } = req.params;
    await playlistRepository.removeSongFromPlaylist(id, songId);
    res.json({ success: true, message: 'Song removed from playlist' });
  } catch (err) {
    next(err);
  }
}

export async function reorderPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { songIds } = req.body;
    if (!Array.isArray(songIds)) {
      res.status(400).json({ success: false, error: 'songIds array is required' });
      return;
    }
    await playlistRepository.reorderPlaylist(id, songIds);
    res.json({ success: true, message: 'Playlist tracks reordered' });
  } catch (err) {
    next(err);
  }
}
