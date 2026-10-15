import { Router } from 'express';
import { streamSong } from '../controllers/streamController.js';

export const streamRouter = Router();

streamRouter.get('/stream/:songId', streamSong);
