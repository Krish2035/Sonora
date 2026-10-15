import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Neon Tech and cloud PostgreSQL require SSL connections
const requiresSsl =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('sslmode=require') ||
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('render.com') ||
  env.DATABASE_URL.includes('supabase.co');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    console.log(`Database connected successfully at ${res.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
