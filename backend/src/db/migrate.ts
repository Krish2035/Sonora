import fs from 'fs';
import path from 'path';
import { pool } from '../config/database.js';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), 'src/db');

async function runMigration() {
  console.log('Running database schema migrations...');
  const schemaPath = path.resolve(currentDir, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Schema migration applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
