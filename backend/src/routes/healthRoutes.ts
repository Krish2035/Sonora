import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await pool.query('SELECT 1');
    if (dbRes.rowCount && dbRes.rowCount > 0) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      storage: env.STORAGE_TYPE,
    },
  });
});
