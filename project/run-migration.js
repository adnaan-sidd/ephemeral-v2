import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '0003_add_github_auth.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
