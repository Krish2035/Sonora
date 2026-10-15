import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env.js';
import { healthRouter } from './routes/healthRoutes.js';
import { songRouter } from './routes/songRoutes.js';
import { streamRouter } from './routes/streamRoutes.js';
import { playlistRouter } from './routes/playlistRoutes.js';
import { favoriteRouter } from './routes/favoriteRoutes.js';
import { historyRouter } from './routes/historyRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Normalize duplicate slashes in request paths (e.g. //api/songs -> /api/songs)
  app.use((req, res, next) => {
    if (req.url.includes('//')) {
      req.url = req.url.replace(/\/{2,}/g, '/');
    }
    next();
  });

  // CORS configuration supporting production domains, Vercel preview URLs, and local dev
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (
          env.CORS_ORIGIN === '*' ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(requestOrigin) ||
          requestOrigin.includes('vercel.app') ||
          requestOrigin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static route for serving extracted album cover art
  const artPath = path.resolve(env.STORAGE_PATH, 'art');
  app.use('/art', express.static(artPath));

  // REST API Routes
  app.use('/api', healthRouter);
  app.use('/api', songRouter);
  app.use('/api', streamRouter);
  app.use('/api', playlistRouter);
  app.use('/api', favoriteRouter);
  app.use('/api', historyRouter);
  app.use('/api', uploadRouter);

  // Fallback 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
