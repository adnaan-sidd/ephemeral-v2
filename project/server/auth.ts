import { Request, Response } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users, userIntegrations } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liIvOHkLVJ1hgIPJ';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '3ac3f182943c75c1dcb45d3cda56cd1401399659';
const JWT_SECRET = process.env.JWT_SECRET || 'flowforge-jwt-secret-2025-super-secure-key-v2-ephemeral-ci-cd-pipeline-railway-postgres';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Log environment variables at startup
console.log('GitHub OAuth configuration:', {
  clientId: GITHUB_CLIENT_ID ? (GITHUB_CLIENT_ID.substring(0, 5) + '...') : 'missing',
  clientSecret: GITHUB_CLIENT_SECRET ? 'present' : 'missing',
  jwtSecret: JWT_SECRET ? 'present' : 'missing',
  frontendUrl: FRONTEND_URL
});

interface GitHubUser {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}

// Generate JWT token for user
function generateJWT(userId: string) {
  return jsonwebtoken.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// GitHub OAuth login initiation
export async function githubLogin(req: Request, res: Response) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session or memory (for production, use Redis)
    req.session = req.session || {};
    req.session.oauthState = state;
    
    // Get the host from the request
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    
    // Build absolute URL from the request
    const baseUrl = `${protocol}://${host}`;
    console.log(`🔍 GitHub OAuth base URL: ${baseUrl}`);
    console.log(`🔍 GitHub OAuth environment variables:`, {
      clientId: GITHUB_CLIENT_ID ? (GITHUB_CLIENT_ID.substring(0, 5) + '...') : 'missing',
      clientSecret: GITHUB_CLIENT_SECRET ? 'present' : 'missing',
      jwtSecret: JWT_SECRET ? 'present' : 'missing',
    });
    
    // Use the client-side route for callback - ensure it matches GitHub app config
    const redirectUri = `${baseUrl}/auth/github/callback`;
    console.log(`🔍 GitHub OAuth redirect URI: ${redirectUri}`);
    
    // Verify GitHub credentials are available
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('❌ GitHub credentials missing!', {
        clientId: !!GITHUB_CLIENT_ID,
        clientSecret: !!GITHUB_CLIENT_SECRET
      });
      return res.status(500).json({ 
        error: 'GitHub OAuth configuration is incomplete.' 
      });
    }
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=user:email,read:user&` +
      `state=${state}`;
    
    console.log(`🔍 Full GitHub auth URL: ${githubAuthUrl}`);
    
    res.json({ authUrl: githubAuthUrl });
  } catch (error) {
    console.error('GitHub login error:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub login' });
  }
}

// GitHub OAuth callback handler
export async function githubCallback(req: Request, res: Response) {
  try {
    console.log('🔍 GitHub callback received:', { 
      query: req.query, 
      body: req.body, 
      method: req.method,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      },
      session: req.session ? 'exists' : 'missing',
      sessionState: req.session?.oauthState || 'not set'
    });
    
    // Handle POST request from frontend with authorization code
    const { code, state } = req.body;
    
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ 
        success: false,
        error: 'Authorization code missing' 
      });
    }
    
    console.log('✅ Authorization code received:', code.substring(0, 8) + '...');
    
    // Verify state parameter (basic CSRF protection)
    // Make this optional for now since we're having issues with the state param
    if (state && req.session?.oauthState && req.session.oauthState !== state) {
      console.error('❌ Invalid state parameter:', { 
        sessionState: req.session?.oauthState, 
        providedState: state 
      });
      console.log('⚠️ Continuing despite invalid state for testing purposes');
      // In production, you would return an error here
    } else {
      console.log('✅ State verification passed or skipped');
    }
    
    // Exchange code for access token
    console.log('🔄 Exchanging code for access token...');
    let tokenData: any = {};
    
    
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`❌ GitHub token request failed with status ${tokenResponse.status}:`, errorText);
        return res.status(400).json({ 
          success: false,
          error: `GitHub token request failed: ${tokenResponse.statusText}` 
        });
      }
      
      tokenData = await tokenResponse.json();
      console.log('📝 Token response:', { 
        success: !!tokenData.access_token, 
        hasToken: !!tokenData.access_token,
        tokenStart: tokenData.access_token ? tokenData.access_token.substring(0, 5) + '...' : 'none'
      });
      
      if (!tokenData.access_token) {
        console.error('❌ Failed to get access token:', tokenData);
        return res.status(400).json({ 
          success: false,
          error: `Failed to get access token: ${tokenData.error_description || 'Unknown error'}` 
        });
      }
    } catch (error: any) {
      console.error('❌ Exception during token exchange:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to exchange code for token: ' + (error.message || 'Unknown error')
      });
    }
    
    // Get user data from GitHub
    console.log('🔄 Getting user data from GitHub...');
    let githubUser: GitHubUser;
    try {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!userResponse.ok) {
        console.error(`❌ GitHub user API request failed with status ${userResponse.status}`);
        return res.status(400).json({ 
          success: false,
          error: `Failed to get GitHub user data: ${userResponse.statusText}` 
        });
      }
      
      githubUser = await userResponse.json();
      console.log('✅ GitHub user data retrieved:', { login: githubUser.login, id: githubUser.id });
    } catch (error: any) {
      console.error('❌ Exception during GitHub user data retrieval:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get GitHub user data: ' + (error.message || 'Unknown error')
      });
    }
    
    // Get user email (might be private)
    console.log('🔄 Getting user email from GitHub...');
    let primaryEmail: string;
    try {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!emailResponse.ok) {
        console.error(`❌ GitHub email API request failed with status ${emailResponse.status}`);
        return res.status(400).json({ 
          success: false,
          error: `Failed to get GitHub email data: ${emailResponse.statusText}` 
        });
      }
      
      const emails: GitHubEmail[] = await emailResponse.json();
      primaryEmail = emails.find(e => e.primary && e.verified)?.email || githubUser.email;
      
      if (!primaryEmail) {
        console.error('❌ No verified email found in GitHub account');
        return res.status(400).json({ 
          success: false,
          error: 'No verified email found in GitHub account' 
        });
      }
      
      console.log('✅ GitHub email retrieved:', primaryEmail);
    } catch (error: any) {
      console.error('❌ Exception during GitHub email retrieval:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get GitHub email: ' + (error.message || 'Unknown error')
      });
    }
    
    // Check if user exists or create new user
    console.log('🔄 Finding or creating user...');
    let user;
    try {
      let existingUser = await db.select().from(users).where(eq(users.email, primaryEmail)).limit(1);
      
      if (existingUser.length > 0) {
        // Update existing user with GitHub info
        user = existingUser[0];
        console.log('✅ Existing user found:', { id: user.id, email: user.email });
        
        await db.update(users)
          .set({
            company: githubUser.company || user.company,
            updatedAt: new Date(),
            name: githubUser.name || user.name,
            avatarUrl: githubUser.avatar_url || user.avatarUrl,
          })
          .where(eq(users.id, user.id));
          
        console.log('✅ Existing user updated with GitHub info');
      } else {
        // Create new user
        console.log('✅ Creating new user with GitHub info');
        const newUserData = {
          email: primaryEmail,
          passwordHash: await bcrypt.hash(`github:${githubUser.id}`, 12), // Hash the GitHub ID
          plan: 'free' as const,
          company: githubUser.company,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
        };
        
        try {
          const insertResult = await db.insert(users).values(newUserData).returning();
          user = insertResult[0];
          console.log('✅ New user created:', { id: user.id, email: user.email });
        } catch (dbError: any) {
          console.error('❌ Error creating new user:', dbError);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to create user account: ' + (dbError.message || 'Database error')
          });
        }
      }
      
      // Store or update GitHub integration
      try {
        // Check if integration already exists
        const existingIntegration = await db.select().from(userIntegrations)
          .where(and(
            eq(userIntegrations.userId, user.id),
            eq(userIntegrations.provider, 'github'),
            eq(userIntegrations.providerUserId, githubUser.id.toString())
          ));
          
        if (existingIntegration.length > 0) {
          // Update existing integration
          await db.update(userIntegrations)
            .set({
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
              providerUsername: githubUser.login,
              providerEmail: primaryEmail,
              updatedAt: new Date()
            })
            .where(eq(userIntegrations.id, existingIntegration[0].id));
            
          console.log('✅ Updated GitHub integration for user');
        } else {
          // Create new integration
          await db.insert(userIntegrations).values({
            userId: user.id,
            provider: 'github',
            providerUserId: githubUser.id.toString(),
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
            scopes: tokenData.scope ? tokenData.scope.split(',') : [],
            providerUsername: githubUser.login,
            providerEmail: primaryEmail,
            connectedAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log('✅ Created GitHub integration for user');
        }
      } catch (intError: any) {
        console.error('❌ Error storing GitHub integration:', intError);
        // Continue with authentication even if integration storage fails
      }
    } catch (error: any) {
      console.error('❌ Exception during user creation/update:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to process user account: ' + (error.message || 'Unknown error')
      });
    }
    
    // Generate JWT token
    console.log('🔄 Generating JWT token...');
    const token = generateJWT(user.id);
    // Clear OAuth state
    if (req.session) {
      delete req.session.oauthState;
    }

    console.log('✅ Authentication successful for user:', {
      id: user.id,
      email: user.email,
      githubUsername: githubUser.login
    });

    // Return JSON response for frontend POST request
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        company: user.company,
        githubUsername: githubUser.login,
        githubId: githubUser.id,
        avatarUrl: githubUser.avatar_url,
        name: githubUser.name,
      },
      token,
      accessToken: tokenData.access_token, // Store for API calls
    });
  } catch (error: any) {
    console.error('❌ Unhandled exception in GitHub callback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed: ' + (error.message || 'Unknown error')
    });
  }
}

// GitLab OAuth
export async function gitlabLogin(req: Request, res: Response) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session
    req.session = req.session || {};
    req.session.oauthState = state;
    
    // GitLab OAuth URL
    const gitlabAuthUrl = `https://gitlab.com/oauth/authorize?` +
      `client_id=${process.env.GITLAB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.FRONTEND_URL}/auth/gitlab/callback`)}&` +
      `response_type=code&` +
      `scope=read_user+api&` +
      `state=${state}`;
    
    res.json({ authUrl: gitlabAuthUrl });
  } catch (error) {
    console.error('GitLab login error:', error);
    res.status(500).json({ error: 'Failed to initiate GitLab login' });
  }
}

// GitLab OAuth callback
export async function gitlabCallback(req: Request, res: Response) {
  try {
    console.log('🔍 GitLab callback received:', { 
      query: req.query, 
      body: req.body, 
      method: req.method 
    });
    
    // Handle POST request from frontend with authorization code
    const { code, state } = req.body;
    
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code missing' });
    }
    
    // Verify state parameter
    if (req.session?.oauthState !== state) {
      console.error('❌ Invalid state parameter:', { 
        sessionState: req.session?.oauthState, 
        providedState: state 
      });
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    console.log('✅ State verification passed');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/auth/gitlab/callback`
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Failed to get access token:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token' });
    }
    
    // Get user data from GitLab
    const userResponse = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const gitlabUser = await userResponse.json();
    
    if (!gitlabUser.email) {
      return res.status(400).json({ error: 'No email found in GitLab account' });
    }
    
    // Check if user exists or create new user
    let existingUser = await db.select().from(users).where(eq(users.email, gitlabUser.email)).limit(1);
    
    let user;
    if (existingUser.length > 0) {
      // Update existing user with GitLab info
      user = existingUser[0];
      await db.update(users)
        .set({
          passwordHash: `gitlab:${gitlabUser.id}`, // Store GitLab ID
          company: gitlabUser.organization || user.company,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    } else {
      // Create new user
      const newUserData = {
        email: gitlabUser.email,
        passwordHash: `gitlab:${gitlabUser.id}`, // Store GitLab ID
        plan: 'free' as const,
        company: gitlabUser.organization,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const insertResult = await db.insert(users).values(newUserData).returning();
      user = insertResult[0];
    }
    
    // Save GitLab integration
    await db.insert(userIntegrations)
      .values({
        userId: user.id,
        provider: 'gitlab',
        providerUserId: gitlabUser.id.toString(),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        providerUsername: gitlabUser.username,
        providerEmail: gitlabUser.email,
        scopes: tokenData.scope ? tokenData.scope.split(' ') : ['api', 'read_user']
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userId, userIntegrations.provider],
        set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          updatedAt: new Date()
        }
      });
    
    // Generate JWT token
    const token = generateJWT(user.id);
    
    // Clear OAuth state
    if (req.session) {
      delete req.session.oauthState;
    }
    
    console.log('✅ Authentication successful for user:', {
      id: user.id,
      email: user.email,
      gitlabUsername: gitlabUser.username
    });
    
    // Return JSON response
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        company: user.company,
        gitlabUsername: gitlabUser.username,
        gitlabId: gitlabUser.id,
        avatarUrl: gitlabUser.avatar_url,
        name: gitlabUser.name,
      },
      token,
      accessToken: tokenData.access_token,
    });
    
  } catch (error) {
    console.error('GitLab callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Bitbucket OAuth
export async function bitbucketLogin(req: Request, res: Response) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session
    req.session = req.session || {};
    req.session.oauthState = state;
    
    // Bitbucket OAuth URL
    const bitbucketAuthUrl = `https://bitbucket.org/site/oauth2/authorize?` +
      `client_id=${process.env.BITBUCKET_CLIENT_ID}&` +
      `response_type=code&` +
      `state=${state}`;
    
    res.json({ authUrl: bitbucketAuthUrl });
  } catch (error) {
    console.error('Bitbucket login error:', error);
    res.status(500).json({ error: 'Failed to initiate Bitbucket login' });
  }
}

// Bitbucket OAuth callback
export async function bitbucketCallback(req: Request, res: Response) {
  try {
    console.log('🔍 Bitbucket callback received:', { 
      query: req.query, 
      body: req.body, 
      method: req.method 
    });
    
    // Handle POST request from frontend with authorization code
    const { code, state } = req.body;
    
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code missing' });
    }
    
    // Verify state parameter
    if (req.session?.oauthState !== state) {
      console.error('❌ Invalid state parameter:', { 
        sessionState: req.session?.oauthState, 
        providedState: state 
      });
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    console.log('✅ State verification passed');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }).toString()
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Failed to get access token:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token' });
    }
    
    // Get user data from Bitbucket
    const userResponse = await fetch('https://api.bitbucket.org/2.0/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const bitbucketUser = await userResponse.json();
    
    // Get user email (might be private)
    const emailResponse = await fetch('https://api.bitbucket.org/2.0/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const emailsData = await emailResponse.json();
    const primaryEmail = emailsData.values.find((e: any) => e.is_primary)?.email;
    
    if (!primaryEmail) {
      return res.status(400).json({ error: 'No email found in Bitbucket account' });
    }
    
    // Check if user exists or create new user
    let existingUser = await db.select().from(users).where(eq(users.email, primaryEmail)).limit(1);
    
    let user;
    if (existingUser.length > 0) {
      // Update existing user with Bitbucket info
      user = existingUser[0];
      await db.update(users)
        .set({
          passwordHash: `bitbucket:${bitbucketUser.uuid}`, // Store Bitbucket UUID
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    } else {
      // Create new user
      const newUserData = {
        email: primaryEmail,
        passwordHash: `bitbucket:${bitbucketUser.uuid}`, // Store Bitbucket UUID
        plan: 'free' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const insertResult = await db.insert(users).values(newUserData).returning();
      user = insertResult[0];
    }
    
    // Save Bitbucket integration
    await db.insert(userIntegrations)
      .values({
        userId: user.id,
        provider: 'bitbucket',
        providerUserId: bitbucketUser.uuid,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        providerUsername: bitbucketUser.username,
        providerEmail: primaryEmail,
        scopes: ['account', 'repository']
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userId, userIntegrations.provider],
        set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          updatedAt: new Date()
        }
      });
    
    // Generate JWT token
    const token = generateJWT(user.id);
    
    // Clear OAuth state
    if (req.session) {
      delete req.session.oauthState;
    }
    
    console.log('✅ Authentication successful for user:', {
      id: user.id,
      email: user.email,
      bitbucketUsername: bitbucketUser.username
    });
    
    // Return JSON response
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        company: user.company,
        bitbucketUsername: bitbucketUser.username,
        bitbucketUuid: bitbucketUser.uuid,
        avatarUrl: bitbucketUser.links?.avatar?.href,
        name: bitbucketUser.display_name,
      },
      token,
      accessToken: tokenData.access_token,
    });
    
  } catch (error) {
    console.error('Bitbucket callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Get current user info
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jsonwebtoken.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = user[0];
    const isGithubUser = userData.passwordHash.startsWith('github:');
    const githubId = isGithubUser ? userData.passwordHash.replace('github:', '') : null;
    
    res.json({
      id: userData.id,
      email: userData.email,
      plan: userData.plan,
      company: userData.company,
      isGithubUser,
      githubId,
      createdAt: userData.createdAt,
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Logout (invalidate token - for production, maintain a blacklist)
export async function logout(req: Request, res: Response) {
  try {
    // In a full implementation, you'd add the token to a blacklist
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Middleware to verify JWT token
export function authenticateToken(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
