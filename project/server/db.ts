import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Connecting to database with URL (masked):',
  process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));

// Create pool with SSL configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configure SSL to work with various PostgreSQL providers
  ssl: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
