import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Try to load .env file manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from:', envPath);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
}

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Using fallback for development.");
  // For development, use a fallback connection string from .env if possible
  process.env.DATABASE_URL = "postgresql://postgres:xrmnJfbhzYAYMIspKtDiVgMzwbclEffO@switchback.proxy.rlwy.net:10313/railway";
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
