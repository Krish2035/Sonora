import { Router } from 'express';
import {
  getPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
} from '../controllers/playlistController.js';

export const playlistRouter = Router();

playlistRouter.get('/playlists', getPlaylists);
playlistRouter.post('/playlists', createPlaylist);
playlistRouter.get('/playlists/:id', getPlaylistById);
playlistRouter.put('/playlists/:id', updatePlaylist);
playlistRouter.delete('/playlists/:id', deletePlaylist);
playlistRouter.post('/playlists/:id/songs', addSongToPlaylist);
playlistRouter.delete('/playlists/:id/songs/:songId', removeSongFromPlaylist);
playlistRouter.put('/playlists/:id/reorder', reorderPlaylist);
