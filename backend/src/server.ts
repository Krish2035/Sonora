import { createApp } from './app.js';
import { env } from './config/env.js';
import { testDbConnection } from './config/database.js';

async function startServer() {
  const app = createApp();

  // Test Database Connection on startup
  console.log(`Starting Music Player Backend in [${env.NODE_ENV}] mode...`);
  await testDbConnection();

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
// Dev server reload trigger

