import { users, apiKeys, pipelines, usage as usageTable, subscriptions, type User, type InsertUser, type ApiKey, type InsertApiKey, type Pipeline, type InsertPipeline, type InsertUsage, type Usage } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // API Keys
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey & { keyHash: string }): Promise<ApiKey>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  deleteApiKey(id: string, userId: string): Promise<void>;
  
  // Pipelines
  createPipeline(pipeline: InsertPipeline & { userId: string }): Promise<Pipeline>;
  getPipeline(id: string): Promise<Pipeline | undefined>;
  getUserPipelines(userId: string): Promise<Pipeline[]>;
  updatePipelineStatus(id: string, status: string, startedAt?: Date, completedAt?: Date, duration?: number, logs?: string): Promise<void>;
  
  // Usage
  getUserUsage(userId: string, month: string): Promise<Usage | undefined>;
  trackUsage(userId: string, month: string, usage: { pipelineRuns?: number; computeMinutes?: number }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // API Keys
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return apiKey || undefined;
  }

  async createApiKey(apiKeyData: InsertApiKey & { keyHash: string }): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(apiKeyData)
      .returning();
    return apiKey;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: string, userId: string): Promise<void> {
    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  }

  // Pipelines
  async createPipeline(pipelineData: InsertPipeline & { userId: string }): Promise<Pipeline> {
    const [pipeline] = await db
      .insert(pipelines)
      .values(pipelineData)
      .returning();
    return pipeline;
  }

  async getPipeline(id: string): Promise<Pipeline | undefined> {
    const [pipeline] = await db.select().from(pipelines).where(eq(pipelines.id, id));
    return pipeline || undefined;
  }

  async getUserPipelines(userId: string): Promise<Pipeline[]> {
    return await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.userId, userId))
      .orderBy(desc(pipelines.createdAt))
      .limit(50);
  }

  async updatePipelineStatus(
    id: string, 
    status: string, 
    startedAt?: Date, 
    completedAt?: Date, 
    duration?: number, 
    logs?: string
  ): Promise<void> {
    const updateData: any = { status };
    if (startedAt) updateData.startedAt = startedAt;
    if (completedAt) updateData.completedAt = completedAt;
    if (duration !== undefined) updateData.duration = duration;
    if (logs) updateData.logs = logs;

    await db
      .update(pipelines)
      .set(updateData)
      .where(eq(pipelines.id, id));
  }

  // Usage
  async getUserUsage(userId: string, month: string): Promise<Usage | undefined> {
    const [userUsage] = await db
      .select()
      .from(usageTable)
      .where(and(eq(usageTable.userId, userId), eq(usageTable.month, month)));
    return userUsage || undefined;
  }

  async trackUsage(userId: string, month: string, usageData: { pipelineRuns?: number; computeMinutes?: number }): Promise<void> {
    const existingUsage = await this.getUserUsage(userId, month);
    
    if (existingUsage) {
      // Update existing usage
      const updateData: any = {};
      if (usageData.pipelineRuns) {
        updateData.pipelineRuns = (existingUsage.pipelineRuns || 0) + usageData.pipelineRuns;
      }
      if (usageData.computeMinutes) {
        updateData.computeMinutes = (existingUsage.computeMinutes || 0) + usageData.computeMinutes;
      }
      
      await db
        .update(usageTable)
        .set(updateData)
        .where(and(eq(usageTable.userId, userId), eq(usageTable.month, month)));
    } else {
      // Create new usage record
      await db
        .insert(usageTable)
        .values({
          userId,
          month,
          pipelineRuns: usageData.pipelineRuns || 0,
          computeMinutes: usageData.computeMinutes || 0
        });
    }
  }
}

export const storage = new DatabaseStorage();
