import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema, insertPipelineSchema, PLANS, PlanType } from "@shared/schema";
import { z } from "zod";
import { setupSocketIO } from "./socket";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars";
const API_KEY_SALT = process.env.API_KEY_SALT || "your-api-key-salt-for-hashing";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil",
});

// Auth middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
      const { email, password, plan = 'free', company } = req.body;
      
      // Validate input
      const userData = insertUserSchema.parse({ email, passwordHash: '', plan, company });
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Create user
        const user = await storage.createUser({
          ...userData,
          passwordHash
        });
        
        // Generate JWT
        const token = jwt.sign(
          { id: user.id, email: user.email, plan: user.plan },
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
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, plan: user.plan },
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
  
  // User routes
  app.get("/api/user/profile", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        plan: user.plan,
        company: user.company
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // API Keys routes
  app.get("/api/user/api-keys", authenticateJWT, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeysByUserId(req.user.id);
      
      // Don't return the actual key hash, just metadata
      const safeApiKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        createdAt: key.createdAt,
        // Show partial key for identification
        partialKey: `ff_${key.keyHash.slice(0, 4)}••••••••••••••••••••••••••••${key.keyHash.slice(-4)}`
      }));
      
      res.json(safeApiKeys);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/user/api-keys", authenticateJWT, async (req, res) => {
    try {
      const { name } = req.body;
      
      // Generate API key
      const apiKey = `ff_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHmac('sha256', API_KEY_SALT).update(apiKey).digest('hex');
      
      const newApiKey = await storage.createApiKey({
        userId: req.user.id,
        name,
        keyHash
      });
      
      res.json({
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Only return the actual key on creation
        createdAt: newApiKey.createdAt
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/user/api-keys/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApiKey(id, req.user.id);
      res.json({ message: 'API key deleted' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Usage routes
  app.get("/api/user/usage", authenticateJWT, async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usage = await storage.getUserUsage(req.user.id, currentMonth);
      const user = await storage.getUser(req.user.id);
      const planLimits = PLANS[user!.plan as PlanType];
      
      res.json({
        current: usage || { pipelineRuns: 0, computeMinutes: 0 },
        limits: {
          pipelineRuns: planLimits.pipelineRuns,
          computeMinutes: planLimits.computeMinutes,
          concurrentBuilds: planLimits.concurrentBuilds
        },
        plan: user!.plan
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Billing routes
  app.get("/api/billing/plans", (req, res) => {
    res.json(PLANS);
  });
  
  app.post("/api/billing/create-checkout-session", authenticateJWT, async (req, res) => {
    try {
      const { plan } = req.body;
      
      if (!PLANS[plan as PlanType]) {
        return res.status(400).json({ message: 'Invalid plan' });
      }
      
      if (plan === 'free') {
        return res.status(400).json({ message: 'Cannot create checkout for free plan' });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `FlowForge ${PLANS[plan as PlanType].name} Plan`,
            },
            unit_amount: PLANS[plan as PlanType].price * 100,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard?payment=cancel`,
        metadata: {
          userId: user.id,
          plan: plan
        }
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Pipeline API (Public API for customers)
  app.post("/api/v1/pipelines", authenticateAPIKey, async (req, res) => {
    try {
      const pipelineData = insertPipelineSchema.parse(req.body);
      
      // Check usage limits
      const currentMonth = new Date().toISOString().slice(0, 7);
      const userUsage = await storage.getUserUsage(req.user.id, currentMonth);
      const planLimits = PLANS[req.user.plan as PlanType];
      
      if (userUsage && userUsage.pipelineRuns && userUsage.pipelineRuns >= planLimits.pipelineRuns) {
        return res.status(429).json({ 
          message: 'Pipeline run limit exceeded for current plan',
          limit: planLimits.pipelineRuns,
          current: userUsage.pipelineRuns
        });
      }
      
      // Create pipeline
      const pipeline = await storage.createPipeline({
        ...pipelineData,
        userId: req.user.id
      });
      
      // Track usage
      await storage.trackUsage(req.user.id, currentMonth, { pipelineRuns: 1 });
      
      // Start pipeline execution (simplified)
      executePipeline(pipeline.id, pipelineData);
      
      res.status(201).json({
        id: pipeline.id,
        status: pipeline.status,
        repoUrl: pipeline.repoUrl,
        branch: pipeline.branch,
        createdAt: pipeline.createdAt
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/v1/pipelines/:id", authenticateAPIKey, async (req, res) => {
    try {
      const { id } = req.params;
      const pipeline = await storage.getPipeline(id);
      
      if (!pipeline || pipeline.userId !== req.user.id) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }
      
      res.json({
        id: pipeline.id,
        status: pipeline.status,
        repoUrl: pipeline.repoUrl,
        branch: pipeline.branch,
        startedAt: pipeline.startedAt,
        completedAt: pipeline.completedAt,
        duration: pipeline.duration,
        createdAt: pipeline.createdAt
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/v1/pipelines/:id/logs", authenticateAPIKey, async (req, res) => {
    try {
      const { id } = req.params;
      const pipeline = await storage.getPipeline(id);
      
      if (!pipeline || pipeline.userId !== req.user.id) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }
      
      res.json({
        id: pipeline.id,
        logs: pipeline.logs || 'No logs available yet'
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Get user pipelines for dashboard
  app.get("/api/user/pipelines", authenticateJWT, async (req, res) => {
    try {
      const pipelines = await storage.getUserPipelines(req.user.id);
      res.json(pipelines);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Test pipeline endpoint for authenticated users
  app.post("/api/user/test-pipeline", authenticateJWT, async (req, res) => {
    try {
      const pipelineData = insertPipelineSchema.parse(req.body);
      
      // Check usage limits
      const currentMonth = new Date().toISOString().slice(0, 7);
      const userUsage = await storage.getUserUsage(req.user.id, currentMonth);
      const planLimits = PLANS[req.user.plan as PlanType];
      
      if (userUsage && userUsage.pipelineRuns && userUsage.pipelineRuns >= planLimits.pipelineRuns) {
        return res.status(429).json({ message: `Monthly pipeline limit reached (${planLimits.pipelineRuns}). Please upgrade your plan.` });
      }
      
      // Create pipeline
      const pipeline = await storage.createPipeline({
        ...pipelineData,
        userId: req.user.id
      });
      
      // Track usage
      await storage.trackUsage(req.user.id, currentMonth, { pipelineRuns: 1 });
      
      // Start pipeline execution
      executePipeline(pipeline.id, pipelineData);
      
      res.json({
        id: pipeline.id,
        status: pipeline.status
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  const httpServer = createServer(app);
  
  // Setup Socket.io server
  const socketIO = setupSocketIO(httpServer);
// Simplified pipeline execution
async function executePipeline(pipelineId: string, pipelineData: any) {
  try {
    // Get pipeline record to access user ID
    const pipeline = await storage.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }
    
    // Update status to running
    await storage.updatePipelineStatus(pipelineId, 'running', new Date());
    
    // Emit initial status update
    socketIO.emitBuildStatus(pipelineId, {
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString()
    });
    
    // Simulate build process (in real implementation, this would use Docker)
    const logs = [
      `[${new Date().toISOString()}] 🔧 Setting up ephemeral environment...`,
      `[${new Date().toISOString()}] 📦 Cloning repository: ${pipelineData.repoUrl}`,
      `[${new Date().toISOString()}] 🌿 Checking out branch: ${pipelineData.branch}`,
      `[${new Date().toISOString()}] ⚡ Starting build process...`
    ];
    
    // Emit initial logs
    socketIO.emitBuildLogs(pipelineId, logs.join('\n') + '\n');
    
    // Calculate total steps for progress tracking
    const totalSteps = (pipelineData.commands || []).length;
    let completedSteps = 0;
    
    for (const command of pipelineData.commands || []) {
      const commandStartLog = `[${new Date().toISOString()}] $ ${command}`;
      logs.push(commandStartLog);
      
      // Emit log update in real-time
      socketIO.emitBuildLogs(pipelineId, commandStartLog + '\n');
      
      // Simulate command execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const commandCompleteLog = `[${new Date().toISOString()}] ✅ Command completed successfully`;
      logs.push(commandCompleteLog);
      
      // Emit log update in real-time
      socketIO.emitBuildLogs(pipelineId, commandCompleteLog + '\n');
      
      // Update progress
      completedSteps++;
      const progress = Math.round((completedSteps / totalSteps) * 100);
      
      // Emit progress update
      socketIO.emitBuildStatus(pipelineId, {
        status: 'running',
        progress
      });
    }
    
    const completionLogs = [
      `[${new Date().toISOString()}] 🎉 Build completed successfully!`,
      `[${new Date().toISOString()}] 🧹 Cleaning up ephemeral environment...`
    ];
    
    logs.push(...completionLogs);
    
    // Emit final logs
    socketIO.emitBuildLogs(pipelineId, completionLogs.join('\n') + '\n');
    
    const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
    const finishedAt = new Date();
    
    // Update pipeline as completed
    await storage.updatePipelineStatus(
      pipelineId, 
      'completed', 
      new Date(), 
      finishedAt, 
      duration,
      logs.join('\n')
    );
    
    // Emit final status update
    socketIO.emitBuildStatus(pipelineId, {
      status: 'success',
      progress: 100,
      finishedAt: finishedAt.toISOString(),
      duration
    });
    
    // Emit user notification
    socketIO.emitNotification(pipeline.userId, {
      type: 'build_success',
      title: 'Build completed successfully',
      message: `Build #${pipelineId} completed in ${Math.floor(duration / 60)}m ${duration % 60}s`,
      timestamp: new Date().toISOString()
    });
    
    // Track compute usage (simplified)
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const computeMinutes = Math.ceil(duration / 60);
      await storage.trackUsage(pipeline.userId, currentMonth, { computeMinutes });
    } catch (usageError) {
      console.error('Usage tracking failed:', usageError);
      // Continue pipeline execution even if usage tracking fails
    }
    
  } catch (error) {
    console.error('Pipeline execution failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update pipeline as failed
    await storage.updatePipelineStatus(
      pipelineId, 
      'failed', 
      new Date(), 
      new Date(), 
      0,
      `Pipeline failed: ${errorMessage}`
    );
    
    // Emit failure status update
    socketIO.emitBuildStatus(pipelineId, {
      status: 'failed',
      error: errorMessage,
      finishedAt: new Date().toISOString()
    });
    
    // Emit error logs
    socketIO.emitBuildLogs(pipelineId, `[${new Date().toISOString()}] ❌ Pipeline failed: ${errorMessage}\n`);
    
    // Emit user notification
    if (pipeline) {
      socketIO.emitNotification(pipeline.userId, {
        type: 'build_failed',
        title: 'Build failed',
        message: `Build #${pipelineId} failed: ${errorMessage}`,
        timestamp: new Date().toISOString()
      });
    }
  }
}     new Date(), 
      0,
      `Pipeline failed: ${error}`
    );
  }
}
