import { Router } from 'express';
import { getSongs, getSongById, searchSongs, deleteSong } from '../controllers/songController.js';

export const songRouter = Router();

songRouter.get('/songs', getSongs);
songRouter.get('/songs/search', searchSongs);
songRouter.get('/songs/:id', getSongById);
songRouter.delete('/songs/:id', deleteSong);
