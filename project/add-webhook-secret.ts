import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Read database URL from environment
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('Using database connection string (masked): ', 
  connectionString.replace(/:[^:]*@/, ':****@'));

const sql = postgres(connectionString);
const db = drizzle(sql);

async function addWebhookSecretColumn() {
  try {
    console.log('Adding webhook_secret column to project_settings table...');
    
    // Check if column exists first
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_settings' 
      AND column_name = 'webhook_secret'
    `;
    
    const columnExists = await sql`${checkColumnSQL}`;
    
    if (columnExists.length === 0) {
      // Column doesn't exist, add it
      const alterTableSQL = `
        ALTER TABLE project_settings 
        ADD COLUMN webhook_secret varchar(255)
      `;
      
      await sql`${alterTableSQL}`;
      console.log('Column webhook_secret added successfully!');
    } else {
      console.log('Column webhook_secret already exists, skipping...');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

addWebhookSecretColumn();
