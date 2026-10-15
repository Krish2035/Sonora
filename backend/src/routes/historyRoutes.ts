import { Router } from 'express';
import { getHistory, logPlay } from '../controllers/historyController.js';

export const historyRouter = Router();

historyRouter.get('/history', getHistory);
historyRouter.post('/history', logPlay);
