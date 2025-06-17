import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read database URL from environment
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  try {
    console.log('Running webhook secret migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0006_add_webhook_secret.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by statement separator and execute each statement
    const statements = migrationSQL.split('-->').map(s => s.split('statement-breakpoint')[0].trim()).filter(s => s);
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        await sql.unsafe(statement);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
