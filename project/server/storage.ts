import { users, apiKeys, pipelines, usage as usageTable, subscriptions, type User, type InsertUser, type ApiKey, type InsertApiKey, type Pipeline, type InsertPipeline, type InsertUsage, type Usage, projects, type Project, type InsertProject, projectSettings, type ProjectSettings, type InsertProjectSettings, builds, type Build, type InsertBuild, webhookEvents, type WebhookEvent, type InsertWebhookEvent } from "../shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
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
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProjectsByRepositoryId(repositoryId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project settings
  getProjectSettings(projectId: string): Promise<ProjectSettings | undefined>;
  createProjectSettings(settings: InsertProjectSettings): Promise<ProjectSettings>;
  updateProjectSettings(projectId: string, data: Partial<ProjectSettings>): Promise<ProjectSettings>;
  
  // Builds
  getBuild(id: string): Promise<Build | undefined>;
  getProjectBuilds(projectId: string, limit?: number): Promise<Build[]>;
  createBuild(build: InsertBuild): Promise<Build>;
  updateBuild(id: string, data: Partial<Build>): Promise<Build>;
  deleteBuild(id: string): Promise<void>;
  updateBuildStep(buildId: string, stepId: string, data: any): Promise<void>;
  
  // Webhook events
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  updateWebhookEvent(id: string, data: Partial<WebhookEvent>): Promise<WebhookEvent>;
  getUnprocessedWebhookEvents(limit?: number): Promise<WebhookEvent[]>;
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

  // Webhook events
  async createWebhookEvent(eventData: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db
      .insert(webhookEvents)
      .values(eventData)
      .returning();
    return event;
  }

  async getWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, id));
    return event || undefined;
  }

  async updateWebhookEvent(id: string, data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const [event] = await db
      .update(webhookEvents)
      .set(data)
      .where(eq(webhookEvents.id, id))
      .returning();
    return event;
  }

  async getUnprocessedWebhookEvents(limit: number = 50): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.processed, false))
      .orderBy(desc(webhookEvents.createdAt))
      .limit(limit);
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectsByRepositoryId(repositoryId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.repositoryId, repositoryId))
      .orderBy(desc(projects.createdAt));
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db
      .delete(projects)
      .where(eq(projects.id, id));
  }

  // Project settings
  async getProjectSettings(projectId: string): Promise<ProjectSettings | undefined> {
    const [settings] = await db
      .select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId));
    return settings || undefined;
  }

  async createProjectSettings(settingsData: InsertProjectSettings): Promise<ProjectSettings> {
    const [settings] = await db
      .insert(projectSettings)
      .values(settingsData)
      .returning();
    return settings;
  }

  async updateProjectSettings(projectId: string, data: Partial<ProjectSettings>): Promise<ProjectSettings> {
    const [settings] = await db
      .update(projectSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectSettings.projectId, projectId))
      .returning();
    return settings;
  }

  // Builds
  async getBuild(id: string): Promise<Build | undefined> {
    const [build] = await db
      .select()
      .from(builds)
      .where(eq(builds.id, id));
    return build || undefined;
  }

  async getProjectBuilds(projectId: string, limit: number = 20): Promise<Build[]> {
    return await db
      .select()
      .from(builds)
      .where(eq(builds.projectId, projectId))
      .orderBy(desc(builds.createdAt))
      .limit(limit);
  }

  async createBuild(buildData: InsertBuild): Promise<Build> {
    const [build] = await db
      .insert(builds)
      .values(buildData)
      .returning();
    return build;
  }

  async updateBuild(id: string, data: Partial<Build>): Promise<Build> {
    const [build] = await db
      .update(builds)
      .set(data)
      .where(eq(builds.id, id))
      .returning();
    return build;
  }

  async deleteBuild(id: string): Promise<void> {
    await db
      .delete(builds)
      .where(eq(builds.id, id));
  }

  async updateBuildStep(buildId: string, stepId: string, data: any): Promise<void> {
    // Get the current build
    const build = await this.getBuild(buildId);
    if (!build) {
      throw new Error(`Build ${buildId} not found`);
    }
    
    // Update the specified step in the steps array
    const steps = build.steps || [];
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return { ...step, ...data };
      }
      return step;
    });
    
    // Update the build with the modified steps
    await this.updateBuild(buildId, { steps: updatedSteps });
  }
}

export const storage = new DatabaseStorage();
