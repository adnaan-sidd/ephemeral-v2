import express, { type Express } from "express";
import { createServer, type Server } from "http";
import * as bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import * as crypto from "crypto";
import * as path from "path";
import { storage } from "./storage";
import { insertUserSchema, insertPipelineSchema, PLANS, PlanType, userIntegrations } from "../shared/schema";
import { z } from "zod";
import { githubLogin, githubCallback, authenticateToken } from "./auth";
import { handleGitHubWebhook } from "./webhook-handler";
import buildProcessor from "./build-processor";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars";
const API_KEY_SALT = process.env.API_KEY_SALT || "your-api-key-salt-for-hashing";

// Initialize Stripe
let stripe = null;
try {
  if (!process.env.DISABLE_STRIPE) {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "test_key", {
      apiVersion: "2025-05-28.basil",
    });
  }
} catch (e) {
  console.warn('Stripe initialization failed. Billing features will be disabled.');
}

// Auth middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// API Key middleware
const authenticateAPIKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ message: 'No API key provided' });
  }
  
  try {
    const keyHash = crypto.createHmac('sha256', API_KEY_SALT).update(apiKey).digest('hex');
    const apiKeyRecord = await storage.getApiKeyByHash(keyHash);
    
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    
    // Update last used
    await storage.updateApiKeyLastUsed(apiKeyRecord.id);
    
    const user = await storage.getUser(apiKeyRecord.userId);
    req.user = user;
    req.apiKey = apiKeyRecord;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid API key' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, plan = 'free', company } = req.body;
      
      console.log('🔍 Registration attempt for:', email);
      
      // Validate input
      const userData = insertUserSchema.parse({ email, passwordHash: '', plan, company });
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('❌ Registration failed: User already exists');
        return res.status(400).json({ message: 'User already exists' });
      }
      
      try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Create user
        const user = await storage.createUser({
          ...userData,
          passwordHash,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log('✅ User created successfully:', { id: user.id, email: user.email });
        
        // Generate JWT
        const token = jsonwebtoken.sign(
          { userId: user.id, email: user.email, plan: user.plan },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            plan: user.plan,
            company: user.company
          }
        });
      } catch (dbError: any) {
        console.error("Database error during registration:", dbError);
        return res.status(500).json({ message: 'Database error: ' + dbError.message });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('🔍 Login attempt for:', email);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('❌ Login failed: User not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Handle GitHub-authenticated users
      if (user.passwordHash && user.passwordHash.startsWith('github:')) {
        console.log('❌ Login failed: This is a GitHub account');
        return res.status(401).json({ message: 'This account uses GitHub authentication. Please sign in with GitHub.' });
      }
      
      const isValid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
      if (!isValid) {
        console.log('❌ Login failed: Invalid password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Login successful for user:', { id: user.id, email: user.email });
      
      const token = jsonwebtoken.sign(
        { userId: user.id, email: user.email, plan: user.plan },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          company: user.company
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // GitHub OAuth routes
  app.get("/api/auth/github", githubLogin);
  app.post("/api/auth/github/callback", githubCallback);
  
  // Direct GitHub OAuth callback endpoint
  app.get("/auth/github/callback", (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    console.log('🔍 Direct GitHub callback received:', {
      code: code ? code.substring(0, 8) + '...' : 'undefined',
      state: state ? state.substring(0, 8) + '...' : 'undefined',
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      session: req.session ? 'exists' : 'missing',
      sessionState: req.session?.oauthState || 'not set',
      url: req.url,
      method: req.method
    });
    
    if (!code) {
      console.error('❌ No authorization code provided in direct callback');
      return res.status(400).send(`
        <html><body>
          <h1>Authentication Error</h1>
          <p>No authorization code provided</p>
          <a href="/">Return to homepage</a>
        </body></html>
      `);
    }
    
    // Check if state is missing or doesn't match, but don't fail the authentication
    if (req.session?.oauthState && state && req.session.oauthState !== state) {
      console.warn('⚠️ State mismatch in direct callback:', {
        sessionState: req.session.oauthState,
        providedState: state
      });
      // Don't return error, just log it and continue for now
    }
    
    // Provide a page that will make the API call to the backend
    res.send(`
      <html>
        <head>
          <title>Completing Authentication...</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; 
                  justify-content: center; height: 100vh; flex-direction: column; }
            .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px;
                      border-radius: 50%; border-left-color: #09f; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .message { margin-top: 20px; }
            .error { color: red; margin-top: 16px; }
            .debug { font-size: 12px; margin-top: 20px; color: #666; text-align: center; max-width: 80%; overflow-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <div class="message">Completing your authentication...</div>
          <div id="error" class="error"></div>
          <div id="debug" class="debug"></div>
          
          <script>
            // Add debug info to the page and console
            function logDebug(message) {
              const debugEl = document.getElementById('debug');
              debugEl.innerHTML += message + '<br>';
              console.log(message);
            }
            
            // Function to handle errors
            function handleError(message) {
              document.getElementById('error').textContent = message;
              document.querySelector('.spinner').style.display = 'none';
              document.querySelector('.message').textContent = 'Authentication failed';
              
              // Add a home button
              const homeButton = document.createElement('button');
              homeButton.textContent = 'Return to Home';
              homeButton.style = 'margin-top: 20px; padding: 8px 16px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer;';
              homeButton.onclick = () => { window.location.href = '/'; };
              document.body.appendChild(homeButton);
            }
            
            (async function() {
              try {
                logDebug('Code received: ' + ${JSON.stringify(code ? code.substring(0, 8) + '...' : 'undefined')});
                logDebug('State received: ' + ${JSON.stringify(state ? state.substring(0, 8) + '...' : 'undefined')});
                logDebug('Making request to /api/auth/github/callback');
                
                const response = await fetch('/api/auth/github/callback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    code: ${JSON.stringify(code)}, 
                    state: ${JSON.stringify(state || '')} 
                  })
                });
                
                logDebug('Response status: ' + response.status);
                
                if (!response.ok) {
                  let errorText = '';
                  try {
                    const errorData = await response.json();
                    errorText = errorData.error || 'Server responded with status: ' + response.status;
                  } catch (e) {
                    errorText = await response.text();
                  }
                  logDebug('Error response: ' + errorText);
                  throw new Error(errorText);
                }
                
                const data = await response.json();
                logDebug('Response parsed, success: ' + (data.success ? 'true' : 'false'));
                
                if (data.success) {
                  // Store the token in localStorage
                  localStorage.setItem('auth_token', data.token);
                  logDebug('Token stored in localStorage (length: ' + data.token.length + ')');
                  
                  // Try to detect if we're in an iframe (common in OAuth popup scenarios)
                  if (window.parent !== window) {
                    logDebug('Detected we might be in a popup/iframe, sending message to parent');
                    try {
                      window.parent.postMessage({ type: 'auth-success', token: data.token }, '*');
                    } catch(e) {
                      logDebug('Error posting message: ' + e.message);
                    }
                  }
                  
                  // Short delay to ensure token is saved
                  setTimeout(() => {
                    logDebug('Redirecting to dashboard...');
                    window.location.href = '/dashboard';
                  }, 1000);
                } else {
                  handleError('Authentication failed: ' + (data.error || 'Unknown error'));
                  logDebug('Error details: ' + JSON.stringify(data));
                }
              } catch (error) {
                handleError('Error: ' + error.message);
                logDebug('Exception occurred during authentication process');
                console.error('Error during authentication:', error);
              }
            })();
          </script>
        </body>
      </html>
    `);
  });
  
  // Direct GitHub callback handler without client-side JS
  app.get("/auth/github/callback/direct", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    console.log('🔍 Direct server GitHub callback received:', {
      code: code ? code.substring(0, 8) + '...' : 'undefined',
      state: state ? state.substring(0, 8) + '...' : 'undefined',
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      session: req.session ? 'exists' : 'missing',
      sessionState: req.session?.oauthState || 'not set',
      url: req.url,
      method: req.method
    });
    
    if (!code) {
      return res.status(400).send(`
        <html><body>
          <h1>Authentication Error</h1>
          <p>No authorization code provided</p>
          <a href="/">Return to homepage</a>
        </body></html>
      `);
    }
    
    try {
      // Process GitHub authentication directly on the server
      
      // 1. Exchange code for access token
      console.log('🔄 Exchanging code for access token...');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`❌ GitHub token request failed with status ${tokenResponse.status}:`, errorText);
        throw new Error(`GitHub token request failed with status ${tokenResponse.status}: ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        console.error('❌ Failed to get access token:', tokenData);
        throw new Error('Failed to get access token: ' + (tokenData.error_description || 'Unknown error'));
      }
      
      console.log('✅ Received access token:', tokenData.access_token.substring(0, 5) + '...');
      
      // 2. Get user data from GitHub
      console.log('🔄 Getting user data from GitHub...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error(`❌ GitHub user API request failed with status ${userResponse.status}:`, errorText);
        throw new Error(`GitHub user API request failed with status ${userResponse.status}`);
      }
      
      const githubUser = await userResponse.json();
      console.log('✅ GitHub user data retrieved:', { login: githubUser.login, id: githubUser.id });
      
      // 3. Get email from GitHub
      console.log('🔄 Getting email data from GitHub...');
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error(`❌ GitHub email API request failed with status ${emailResponse.status}:`, errorText);
        throw new Error(`GitHub email API request failed: ${emailResponse.statusText}`);
      }
      
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || githubUser.email;
      
      if (!primaryEmail) {
        console.error('❌ No verified email found in GitHub account');
        throw new Error('No verified email found in GitHub account');
      }
      
      console.log('✅ GitHub email retrieved:', primaryEmail);
      
      // 4. Find or create user
      console.log('🔄 Finding or creating user account...');
      let existingUser = await storage.getUserByEmail(primaryEmail);
      let user;
      
      if (existingUser) {
        // Update existing user
        console.log('✅ Existing user found, updating with GitHub info');
        user = existingUser;
        await storage.updateUser(user.id, {
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          name: githubUser.name || user.name,
          avatarUrl: githubUser.avatar_url || user.avatarUrl,
          passwordHash: `github:${githubUser.id}`, // Ensure we update the passwordHash
        });
      } else {
        // Create new user
        console.log('✅ Creating new user with GitHub info');
        user = await storage.createUser({
          email: primaryEmail,
          passwordHash: `github:${githubUser.id}`,
          plan: 'free',
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
          githubUsername: githubUser.login,
          githubId: githubUser.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // 5. Generate JWT token
      console.log('🔄 Generating JWT token...');
      const token = jsonwebtoken.sign(
        { userId: user.id, email: user.email, plan: user.plan },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // 6. Redirect with success and token
      console.log('✅ Authentication successful, redirecting to dashboard');
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; align-items: center; 
                    justify-content: center; height: 100vh; flex-direction: column; }
              .success { color: green; margin-bottom: 16px; font-size: 24px; }
              .message { color: #374151; margin-bottom: 20px; line-height: 1.5; }
              .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px;
                        border-radius: 50%; border-left-color: #3b82f6; animation: spin 1s linear infinite; 
                        margin: 0 auto 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .debug { font-size: 12px; margin-top: 20px; color: #666; text-align: left; max-width: 90%; 
                      background: #f1f5f9; padding: 12px; border-radius: 4px; overflow: auto; display: none; }
            </style>
          </head>
          <body>
            <h2 class="success">Authentication Successful!</h2>
            <p class="message">You are now logged in as <strong>${primaryEmail}</strong>. You'll be redirected to the dashboard in a moment.</p>
            
            <div class="debug">
              <p>User: ${user.email}</p>
              <p>GitHub Username: ${user.githubUsername || 'N/A'}</p>
              <p>Token length: ${token.length} chars</p>
            </div>
            
            <script>
              // Store token in localStorage
              localStorage.setItem('auth_token', ${JSON.stringify(token)});
              console.log('Auth token stored in localStorage');
              
              // Log debugging info
              const debugInfo = {
                user: {
                  email: ${JSON.stringify(primaryEmail)},
                  name: ${JSON.stringify(githubUser.name || '')},
                  githubUsername: ${JSON.stringify(githubUser.login)}
                },
                tokenStored: true,
                timestamp: new Date().toISOString()
              };
              console.log('Authentication complete:', debugInfo);
              
              // Redirect to dashboard
              setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = '/dashboard';
              }, 1500);
            </script>
          </body>
        </html>
      `);
      
    } catch (error: any) {
      console.error('❌ GitHub direct callback error:', error);
      
      res.status(500).send(`
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              .error { color: red; margin-bottom: 1rem; }
              .debug { background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-top: 2rem; }
              pre { white-space: pre-wrap; overflow-wrap: break-word; }
            </style>
          </head>
          <body>
            <h1 class="error">Authentication Error</h1>
            <p>${error.message || 'An error occurred during authentication'}</p>
            <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #0070f3; color: white; text-decoration: none; border-radius: 4px;">Return to homepage</a>
            
            <div class="debug">
              <h3>Debug Information</h3>
              <pre>${JSON.stringify({
                errorMessage: error.message,
                errorStack: error.stack,
                code: code ? code.substring(0, 8) + '...' : 'undefined',
                state: state ? state.substring(0, 8) + '...' : 'undefined',
                clientId: process.env.GITHUB_CLIENT_ID ? 'set' : 'missing',
                clientSecret: process.env.GITHUB_CLIENT_SECRET ? 'set' : 'missing',
              }, null, 2)}</pre>
            </div>
          </body>
        </html>
      `);
    }
  });
  
  // Enhanced Direct GitHub callback handler
  app.get("/auth/github/callback/enhanced", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    console.log('🔍 Enhanced GitHub callback received:', {
      code: code ? code.substring(0, 8) + '...' : 'undefined',
      state: state ? state.substring(0, 8) + '...' : 'undefined',
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      session: req.session ? 'exists' : 'missing',
      sessionState: req.session?.oauthState || 'not set',
      url: req.url,
      method: req.method
    });
    
    if (!code) {
      console.error('❌ No authorization code provided in enhanced callback');
      return res.status(400).send(`
        <html><body>
          <h1>Authentication Error</h1>
          <p>No authorization code provided</p>
          <a href="/">Return to homepage</a>
        </body></html>
      `);
    }
    
    try {
      // Process GitHub authentication directly
      // 1. Exchange code for token
      console.log('🔄 Exchanging code for token...');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`❌ GitHub token request failed: ${tokenResponse.status}`, errorText);
        throw new Error(`GitHub token request failed with status ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('✅ Token response received:', { 
        hasToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      });
      
      if (!tokenData.access_token) {
        console.error('❌ Failed to get access token:', tokenData);
        throw new Error('Failed to get access token');
      }
      
      // 2. Get user data from GitHub
      console.log('🔄 Getting user data from GitHub...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FlowForge-App',
        },
      });
      
      if (!userResponse.ok) {
        console.error(`❌ GitHub user API request failed: ${userResponse.status}`);
        throw new Error(`GitHub user API request failed with status ${userResponse.status}`);
      }
      
      const githubUser = await userResponse.json();
      console.log('✅ GitHub user data retrieved:', { 
        login: githubUser.login, 
        id: githubUser.id,
        name: githubUser.name || 'not provided'
      });
      
      // 3. Get email from GitHub
      console.log('🔄 Getting user email from GitHub...');
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FlowForge-App',
        },
      });
      
      if (!emailResponse.ok) {
        console.error(`❌ GitHub email API request failed: ${emailResponse.status}`);
        throw new Error(`GitHub email API request failed with status ${emailResponse.status}`);
      }
      
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || githubUser.email;
      
      if (!primaryEmail) {
        console.error('❌ No verified email found in GitHub account');
        throw new Error('No verified email found in GitHub account');
      }
      
      console.log('✅ GitHub email retrieved:', primaryEmail);
      
      // 4. Find or create user
      console.log('🔄 Finding or creating user in database...');
      let existingUser = await storage.getUserByEmail(primaryEmail);
      let user;
      
      if (existingUser) {
        // Update existing user
        console.log('✅ Existing user found:', { id: existingUser.id, email: existingUser.email });
        user = existingUser;
        await storage.updateUser(user.id, {
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          name: githubUser.name || user.name,
          avatarUrl: githubUser.avatar_url || user.avatarUrl,
          updatedAt: new Date()
        });
        console.log('✅ Existing user updated with GitHub info');
      } else {
        // Create new user
        console.log('🔄 Creating new user with GitHub info...');
        user = await storage.createUser({
          email: primaryEmail,
          passwordHash: `github:${githubUser.id}`,
          plan: 'free',
          name: githubUser.name || primaryEmail.split('@')[0],
          avatarUrl: githubUser.avatar_url,
          githubUsername: githubUser.login,
          githubId: githubUser.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('✅ New user created:', { id: user.id, email: user.email });
      }
      
      // 5. Generate JWT token
      const token = jsonwebtoken.sign(
        { userId: user.id, email: user.email, plan: user.plan },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated for user');
      
      // 6. Return success with HTML and JavaScript to store token and redirect
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; 
                    justify-content: center; height: 100vh; flex-direction: column; background: #f7f8fa; }
              .card { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                     padding: 24px; width: 90%; max-width: 400px; text-align: center; }
              .success { color: #16a34a; margin-bottom: 16px; font-size: 24px; }
              .message { color: #374151; margin-bottom: 20px; line-height: 1.5; }
              .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px;
                        border-radius: 50%; border-left-color: #3b82f6; animation: spin 1s linear infinite; 
                        margin: 0 auto 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .debug { font-size: 12px; margin-top: 20px; color: #666; text-align: left; max-width: 90%; 
                      background: #f1f5f9; padding: 12px; border-radius: 4px; overflow: auto; display: none; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2 class="success">Authentication Successful!</h2>
              <p class="message">You are now logged in as <strong>${primaryEmail}</strong>. You'll be redirected to the dashboard in a moment.</p>
            </div>
            
            <script>
              // Store token in localStorage
              localStorage.setItem('auth_token', ${JSON.stringify(token)});
              console.log('Auth token stored in localStorage');
              
              // Log debugging info
              const debugInfo = {
                user: {
                  email: ${JSON.stringify(primaryEmail)},
                  name: ${JSON.stringify(githubUser.name || '')},
                  githubUsername: ${JSON.stringify(githubUser.login)}
                },
                tokenStored: true,
                timestamp: new Date().toISOString()
              };
              console.log('Authentication complete:', debugInfo);
              
              // Redirect to dashboard
              setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = '/dashboard';
              }, 1500);
            </script>
          </body>
        </html>
      `);
      
    } catch (error: any) {
      console.error('❌ GitHub enhanced callback error:', error);
      
      // Return error page with details
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; 
                    justify-content: center; height: 100vh; flex-direction: column; background: #f7f8fa; }
              .card { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                     padding: 24px; width: 90%; max-width: 400px; text-align: center; }
              .error-title { color: #dc2626; margin-bottom: 16px; font-size: 24px; }
              .error-message { color: #374151; margin-bottom: 20px; line-height: 1.5; }
              .button { background: #3b82f6; color: white; border: none; padding: 8px 16px;
                       border-radius: 4px; cursor: pointer; font-size: 14px; }
              .button:hover { background: #2563eb; }
              .details { font-size: 12px; margin-top: 20px; color: #666; text-align: left; max-width: 90%; 
                        background: #f1f5f9; padding: 12px; border-radius: 4px; overflow: auto; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2 class="error-title">Authentication Error</h2>
              <p class="error-message">${error.message || 'An error occurred during authentication'}</p>
              <button class="button" onclick="window.location.href='/'">Return to homepage</button>
              
              <div class="details">
                <p><strong>Error details:</strong></p>
                <pre>${error.stack || error.toString()}</pre>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  });
  
  // GitHub OAuth test page
  app.get("/github-test", (req, res) => {
    res.sendFile(path.join(__dirname, '../client/github-test.html'));
  });

  // User profile endpoint
  app.get("/api/auth/me", authenticateJWT, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      console.log('🔍 Fetching user profile for:', userId);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get GitHub profile if exists
      let githubProfile = null;
      try {
        const [profile] = await db.select().from(userIntegrations)
          .where(and(
            eq(userIntegrations.userId, userId),
            eq(userIntegrations.provider, 'github')
          ));
          
        if (profile) {
          githubProfile = {
            id: profile.id,
            providerUserId: profile.providerUserId,
            providerUsername: profile.providerUsername,
            connected: true
          };
        }
      } catch (err) {
        console.error('Error fetching GitHub profile:', err);
      }
      
      console.log('✅ User profile retrieved successfully');
      
      // Return user data without sensitive information
      res.json({
        id: user.id,
        email: user.email,
        plan: user.plan,
        company: user.company,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        githubProfile
      });
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
  });
  
  // GitHub webhooks
  app.post("/api/webhooks/github", async (req, res) => {
    try {
      await handleGitHubWebhook(req, res);
    } catch (error) {
      console.error('Error handling GitHub webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // GitHub repository listing
  app.get("/api/github/repos", authenticateJWT, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      console.log('🔍 Fetching GitHub repositories for user:', userId);
      
      // Get GitHub integration
      const [integration] = await db.select().from(userIntegrations)
        .where(and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, 'github')
        ));
      
      if (!integration) {
        return res.status(404).json({ message: 'GitHub integration not found. Please connect your GitHub account.' });
      }
      
      // Fetch repositories from GitHub API
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${integration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', response.status, errorText);
        return res.status(response.status).json({ message: 'Failed to fetch repositories from GitHub', error: errorText });
      }
      
      const repositories = await response.json();
      
      // Map to simplified format
      const formattedRepos = repositories.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private,
        owner: {
          id: repo.owner.id,
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url
        },
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        language: repo.language
      }));
      
      res.json(formattedRepos);
    } catch (error: any) {
      console.error('❌ Error fetching GitHub repositories:', error);
      res.status(500).json({ message: 'Failed to fetch GitHub repositories', error: error.message });
    }
  });
  
  // Fetch repositories from GitHub
  app.get("/api/repositories/github", authenticateJWT, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      console.log('🔍 Fetching GitHub repositories for user:', userId);
      
      // Find GitHub integration for user
      const [githubIntegration] = await db.select().from(userIntegrations)
        .where(and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, 'github')
        ));
      
      if (!githubIntegration) {
        console.log('❌ No GitHub integration found for user');
        return res.status(400).json({ message: 'GitHub account not connected. Please connect your GitHub account first.' });
      }
      
      // Fetch repositories using GitHub API
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${githubIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        console.error('❌ GitHub API request failed:', response.status);
        return res.status(response.status).json({ message: 'Failed to fetch repositories from GitHub' });
      }
      
      const repos = await response.json();
      console.log(`✅ Retrieved ${repos.length} GitHub repositories`);
      
      res.json(repos);
    } catch (error: any) {
      console.error('❌ Error fetching GitHub repositories:', error);
      res.status(500).json({ message: 'Failed to fetch repositories', error: error.message });
    }
  });
  
  // Verify repository access
  app.post("/api/repositories/verify-access", authenticateJWT, async (req: any, res: any) => {
    try {
      const { provider, repositoryUrl } = req.body;
      const userId = req.user.userId;
      
      if (!provider || !repositoryUrl) {
        return res.status(400).json({ message: 'Provider and repository URL are required' });
      }
      
      if (provider !== 'github') {
        return res.status(400).json({ message: 'Only GitHub is supported at this time' });
      }
      
      // Find GitHub integration for user
      const [githubIntegration] = await db.select().from(userIntegrations)
        .where(and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, 'github')
        ));
      
      if (!githubIntegration) {
        return res.status(400).json({ message: 'GitHub account not connected' });
      }
      
      // Extract owner and repo from GitHub URL
      const urlParts = repositoryUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];
      
      // Verify access and get default branch
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${githubIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          hasAccess: false, 
          message: 'You do not have access to this repository' 
        });
      }
      
      const repoDetails = await response.json();
      
      res.json({
        hasAccess: true,
        defaultBranch: repoDetails.default_branch || 'main'
      });
    } catch (error: any) {
      console.error('❌ Error verifying repository access:', error);
      res.status(500).json({ 
        hasAccess: false,
        message: 'Failed to verify repository access', 
        error: error.message 
      });
    }
  });
  
  // Project APIs
  app.get("/api/projects", authenticateJWT, async (req: any, res: any) => {
    try {
      console.log('🔍 Fetching projects for user:', req.user.userId);
      const projects = await storage.getProjectsByUserId(req.user.userId);
      res.json(projects);
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
    }
  });
  
  app.post("/api/projects", authenticateJWT, async (req: any, res: any) => {
    try {
      const { name, description, repositoryUrl, repositoryProvider, repositoryId, defaultBranch = 'main' } = req.body;
      
      console.log('🔍 Creating project:', { name, repositoryUrl });
      
      if (!name || !repositoryUrl || !repositoryProvider || !repositoryId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const project = await storage.createProject({
        userId: req.user.userId,
        name,
        description,
        repositoryUrl,
        repositoryProvider,
        repositoryId,
        defaultBranch,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create default project settings
      await storage.createProjectSettings({
        projectId: project.id,
        autoDeployEnabled: true,
        buildTimeoutMinutes: 30,
        retainBuildsDay: 30,
        webhookSecret: crypto.randomBytes(32).toString('hex'),
        notificationSettings: {
          emailEnabled: true,
          notifyOnSuccess: false,
          notifyOnFailure: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Project created successfully:', { id: project.id, name: project.name });
      
      res.status(201).json(project);
    } catch (error: any) {
      console.error('❌ Error creating project:', error);
      res.status(500).json({ message: 'Failed to create project', error: error.message });
    }
  });
  
  app.get("/api/projects/:id", authenticateJWT, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      console.log('🔍 Fetching project details:', id);
      
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      // Get project settings
      const settings = await storage.getProjectSettings(id);
      
      // Get latest builds
      const builds = await storage.getProjectBuilds(id, 5);
      
      res.json({
        ...project,
        settings,
        builds
      });
    } catch (error: any) {
      console.error('❌ Error fetching project details:', error);
      res.status(500).json({ message: 'Failed to fetch project details', error: error.message });
    }
  });
  
  app.put("/api/projects/:id", authenticateJWT, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, description, defaultBranch, status } = req.body;
      
      console.log('🔍 Updating project:', id);
      
      // Check if project exists and user has access
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      // Update project
      const updatedProject = await storage.updateProject(id, {
        name,
        description,
        defaultBranch,
        status,
        updatedAt: new Date()
      });
      
      console.log('✅ Project updated successfully:', { id, name });
      
      res.json(updatedProject);
    } catch (error: any) {
      console.error('❌ Error updating project:', error);
      res.status(500).json({ message: 'Failed to update project', error: error.message });
    }
  });
  
  app.delete("/api/projects/:id", authenticateJWT, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      console.log('🔍 Deleting project:', id);
      
      // Check if project exists and user has access
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      // Delete project
      await storage.deleteProject(id);
      
      console.log('✅ Project deleted successfully:', { id });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Error deleting project:', error);
      res.status(500).json({ message: 'Failed to delete project', error: error.message });
    }
  });
  
  // Project settings
  app.put("/api/projects/:id/settings", authenticateJWT, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { autoDeployEnabled, buildTimeoutMinutes, retainBuildsDay, notificationSettings } = req.body;
      
      console.log('🔍 Updating project settings:', id);
      
      // Check if project exists and user has access
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      // Get existing settings
      let settings = await storage.getProjectSettings(id);
      
      if (settings) {
        // Update existing settings
        settings = await storage.updateProjectSettings(id, {
          autoDeployEnabled,
          buildTimeoutMinutes,
          retainBuildsDay,
          notificationSettings,
          updatedAt: new Date()
        });
      } else {
        // Create new settings
        settings = await storage.createProjectSettings({
          projectId: id,
          autoDeployEnabled: autoDeployEnabled !== undefined ? autoDeployEnabled : true,
          buildTimeoutMinutes: buildTimeoutMinutes || 30,
          retainBuildsDay: retainBuildsDay || 30,
          webhookSecret: crypto.randomBytes(32).toString('hex'),
          notificationSettings: notificationSettings || {
            emailEnabled: true,
            notifyOnSuccess: false,
            notifyOnFailure: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log('✅ Project settings updated successfully:', { id });
      
      res.json(settings);
    } catch (error: any) {
      console.error('❌ Error updating project settings:', error);
      res.status(500).json({ message: 'Failed to update project settings', error: error.message });
    }
  });
  
  // Project webhook
  app.get("/api/projects/:projectId/webhook", authenticateJWT, async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Check if user owns the project
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Get project settings
      const settings = await storage.getProjectSettings(projectId);
      
      const webhookUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/webhooks/github`;
      
      return res.json({
        webhookUrl,
        webhookSecret: settings?.webhookSecret || null,
        hasSecret: !!settings?.webhookSecret
      });
    } catch (error) {
      console.error('Error getting webhook details:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Regenerate webhook secret
  app.post("/api/projects/:projectId/webhook/regenerate-secret", authenticateJWT, async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Check if user owns the project
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Generate new secret token
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      
      // Get project settings
      let settings = await storage.getProjectSettings(projectId);
      
      if (settings) {
        // Update existing settings
        settings = await storage.updateProjectSettings(projectId, {
          webhookSecret
        });
      } else {
        // Create new settings
        settings = await storage.createProjectSettings({
          projectId,
          autoDeployEnabled: false,
          buildTimeoutMinutes: 30,
          retainBuildsDay: 30,
          webhookSecret
        });
      }
      
      const webhookUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/webhooks/github`;
      
      return res.json({
        webhookUrl,
        webhookSecret: settings.webhookSecret
      });
    } catch (error) {
      console.error('Error regenerating webhook secret:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Build APIs
  app.get("/api/projects/:projectId/builds", authenticateJWT, async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      console.log('🔍 Fetching builds for project:', projectId);
      
      // Check if project exists and user has access
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      const builds = await storage.getProjectBuilds(projectId, limit);
      res.json(builds);
    } catch (error: any) {
      console.error('❌ Error fetching builds:', error);
      res.status(500).json({ message: 'Failed to fetch builds', error: error.message });
    }
  });
  
  app.post("/api/projects/:projectId/builds", authenticateJWT, async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const { branch = 'main' } = req.body;
      
      console.log('🔍 Triggering build for project:', projectId, 'branch:', branch);
      
      // Check if project exists and user has access
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      // Create build record
      const build = await storage.createBuild({
        projectId,
        status: 'queued',
        trigger: 'manual',
        triggerDetails: {
          user: req.user.email,
          timestamp: new Date().toISOString()
        },
        branch,
        commit: 'manual-trigger',
        commitMessage: 'Manual build triggered by user',
        commitAuthor: req.user.email,
        queuedAt: new Date()
      });
      
      console.log('✅ Build triggered successfully:', { id: build.id, projectId });
      
      // Process build in background
      buildProcessor.processBuild(build.id, project).catch(err => {
        console.error('❌ Error processing build:', err);
      });
      
      res.status(201).json(build);
    } catch (error: any) {
      console.error('❌ Error triggering build:', error);
      res.status(500).json({ message: 'Failed to trigger build', error: error.message });
    }
  });
  
  app.get("/api/projects/:projectId/builds/:buildId", authenticateJWT, async (req: any, res: any) => {
    try {
      const { projectId, buildId } = req.params;
      console.log('🔍 Fetching build details:', buildId, 'for project:', projectId);
      
      // Check if project exists and user has access
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      const build = await storage.getBuild(buildId);
      
      if (!build || build.projectId !== projectId) {
        return res.status(404).json({ message: 'Build not found' });
      }
      
      res.json(build);
    } catch (error: any) {
      console.error('❌ Error fetching build details:', error);
      res.status(500).json({ message: 'Failed to fetch build details', error: error.message });
    }
  });
  
  app.post("/api/projects/:projectId/builds/:buildId/cancel", authenticateJWT, async (req: any, res: any) => {
    try {
      const { projectId, buildId } = req.params;
      console.log('🔍 Canceling build:', buildId, 'for project:', projectId);
      
      // Check if project exists and user has access
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      const build = await storage.getBuild(buildId);
      
      if (!build || build.projectId !== projectId) {
        return res.status(404).json({ message: 'Build not found' });
      }
      
      // Can only cancel running or queued builds
      if (build.status !== 'running' && build.status !== 'queued') {
        return res.status(400).json({ message: `Cannot cancel build with status: ${build.status}` });
      }
      
      // Use the build processor's cancelBuild function
      const result = await buildProcessor.cancelBuild(buildId);
      
      if (!result) {
        return res.status(400).json({ message: 'Failed to cancel build' });
      }
      
      console.log('✅ Build canceled successfully:', buildId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Error canceling build:', error);
      res.status(500).json({ message: 'Failed to cancel build', error: error.message });
    }
  });
  
  app.post("/api/projects/:projectId/builds/:buildId/restart", authenticateJWT, async (req: any, res: any) => {
    try {
      const { projectId, buildId } = req.params;
      console.log('🔍 Restarting build:', buildId, 'for project:', projectId);
      
      // Check if project exists and user has access
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      
      const originalBuild = await storage.getBuild(buildId);
      
      if (!originalBuild || originalBuild.projectId !== projectId) {
        return res.status(404).json({ message: 'Build not found' });
      }
      
      // Create a new build based on the original
      const newBuild = await storage.createBuild({
        projectId,
        status: 'queued',
        trigger: 'manual',
        triggerDetails: {
          source: 'restart',
          originalBuildId: buildId,
          user: req.user.email,
          timestamp: new Date().toISOString()
        },
        branch: originalBuild.branch,
        commit: originalBuild.commit,
        commitMessage: originalBuild.commitMessage,
        commitAuthor: originalBuild.commitAuthor,
        queuedAt: new Date()
      });
      
      console.log('✅ Build restarted successfully:', { originalBuildId: buildId, newBuildId: newBuild.id });
      
      // Process build in background
      buildProcessor.processBuild(newBuild.id, project).catch(err => {
        console.error('❌ Error processing restarted build:', err);
      });
      
      res.status(201).json(newBuild);
    } catch (error: any) {
      console.error('❌ Error restarting build:', error);
      res.status(500).json({ message: 'Failed to restart build', error: error.message });
    }
  });
  
  // Dashboard stats APIs
  app.get("/api/dashboard/stats", authenticateJWT, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      console.log('🔍 Fetching dashboard stats for user:', userId);
      
      // Get projects count
      const projects = await storage.getProjectsByUserId(userId);
      const projectCount = projects.length;
      
      // Get total builds count and stats
      let totalBuilds = 0;
      let successBuilds = 0;
      let failedBuilds = 0;
      let runningBuilds = 0;
      
      for (const project of projects) {
        const builds = await storage.getProjectBuilds(project.id, 100);
        totalBuilds += builds.length;
        
        for (const build of builds) {
          if (build.status === 'success') successBuilds++;
          else if (build.status === 'failed') failedBuilds++;
          else if (build.status === 'running') runningBuilds++;
        }
      }
      
      res.json({
        projectCount,
        buildStats: {
          total: totalBuilds,
          success: successBuilds,
          failed: failedBuilds,
          running: runningBuilds
        }
      });
    } catch (error: any) {
      console.error('❌ Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
    }
  });
  
  app.get("/api/dashboard/recent-builds", authenticateJWT, async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      console.log('🔍 Fetching recent builds for user:', userId);
      
      const projects = await storage.getProjectsByUserId(userId);
      
      const recentBuilds: any[] = [];
      
      for (const project of projects) {
        const builds = await storage.getProjectBuilds(project.id, 5);
        
        for (const build of builds) {
          recentBuilds.push({
            ...build,
            projectName: project.name
          });
        }
      }
      
      // Sort by created date, most recent first
      recentBuilds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Return only the 10 most recent
      res.json(recentBuilds.slice(0, 10));
    } catch (error: any) {
      console.error('❌ Error fetching recent builds:', error);
      res.status(500).json({ message: 'Failed to fetch recent builds', error: error.message });
    }
  });
  
  // Create and return HTTP server
  const server = createServer(app);
  return server;
}
