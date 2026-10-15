import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';

export const favoriteRouter = Router();

favoriteRouter.get('/favorites', getFavorites);
favoriteRouter.post('/favorites/:songId', addFavorite);
favoriteRouter.delete('/favorites/:songId', removeFavorite);
