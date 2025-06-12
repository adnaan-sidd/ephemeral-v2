// Load environment variables from .env file
import 'dotenv/config';
// Log the environment variables for debugging (comment out in production)
console.log('Environment loaded, DATABASE_URL exists:', !!process.env.DATABASE_URL);
// Import the actual server
import './index.js';
