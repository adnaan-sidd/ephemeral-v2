import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Use existing users table structure (keep it as-is)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 20 }).default('free').notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  company: varchar("company", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// GitHub profile data (separate table to store additional GitHub info)
export const githubProfiles = pgTable("github_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  githubId: varchar("github_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  company: varchar("company", { length: 255 }),
  blog: varchar("blog", { length: 500 }),
  twitterUsername: varchar("twitter_username", { length: 255 }),
  accessToken: varchar("access_token", { length: 500 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Git provider integrations (GitHub for auth + GitLab/Bitbucket for CI/CD)
export const userIntegrations = pgTable("user_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'github', 'gitlab', 'bitbucket'
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  accessToken: varchar("access_token", { length: 500 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: jsonb("scopes").$type<string[]>(),
  providerUsername: varchar("provider_username", { length: 255 }),
  providerEmail: varchar("provider_email", { length: 255 }),
  connectedAt: timestamp("connected_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  plan: varchar("plan", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow()
});

export const usage = pgTable("usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  pipelineRuns: integer("pipeline_runs").default(0),
  computeMinutes: integer("compute_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  repoUrl: varchar("repo_url", { length: 500 }),
  branch: varchar("branch", { length: 100 }).default("main"),
  commands: jsonb("commands"),
  logs: text("logs"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow()
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  repositoryUrl: varchar("repository_url", { length: 500 }).notNull(),
  repositoryProvider: varchar("repository_provider", { length: 20 }).notNull(), // 'github', 'gitlab', 'bitbucket'
  repositoryId: varchar("repository_id", { length: 255 }).notNull(),
  defaultBranch: varchar("default_branch", { length: 100 }).default("main"),
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'paused', 'archived'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Environment variables
export const projectEnvironmentVariables = pgTable("project_environment_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(), // Consider encryption for sensitive values
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Project settings
export const projectSettings = pgTable("project_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  autoDeployEnabled: boolean("auto_deploy_enabled").default(false),
  buildTimeoutMinutes: integer("build_timeout_minutes").default(30),
  retainBuildsDay: integer("retain_builds_days").default(30),
  webhookUrl: varchar("webhook_url", { length: 500 }),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  notificationSettings: jsonb("notification_settings").$type<{
    emailEnabled: boolean;
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Webhook events
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'push', 'pull_request', 'tag'
  provider: varchar("provider", { length: 20 }).notNull(), // 'github', 'gitlab', 'bitbucket'
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Builds table
export const builds = pgTable("builds", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 20 }).default("queued").notNull(), // 'queued', 'running', 'success', 'failed', 'cancelled'
  trigger: varchar("trigger", { length: 20 }).default("manual").notNull(), // 'manual', 'webhook', 'scheduled'
  triggerDetails: jsonb("trigger_details"),
  branch: varchar("branch", { length: 100 }).notNull(),
  commit: varchar("commit", { length: 40 }), // Git commit SHA
  commitMessage: text("commit_message"),
  commitAuthor: varchar("commit_author", { length: 255 }),
  pullRequest: jsonb("pull_request"), // Optional PR details if triggered by a PR
  steps: jsonb("steps").$type<any[]>(), // Build steps with status and logs
  logs: text("logs"), // Full build logs
  artifacts: jsonb("artifacts").$type<string[]>(), // List of artifact URLs
  queuedAt: timestamp("queued_at").defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGithubProfileSchema = createInsertSchema(githubProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertIntegrationSchema = createInsertSchema(userIntegrations).omit({
  id: true,
  connectedAt: true,
  updatedAt: true
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true,
  lastUsedAt: true,
  isActive: true,
  createdAt: true
});

export const insertPipelineSchema = createInsertSchema(pipelines).omit({
  id: true,
  userId: true,
  status: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  createdAt: true
});

export const insertUsageSchema = createInsertSchema(usage).omit({
  id: true,
  createdAt: true
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProjectEnvVarSchema = createInsertSchema(projectEnvironmentVariables).omit({
  id: true,
  createdAt: true
});

export const insertProjectSettingsSchema = createInsertSchema(projectSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true
});

export const insertBuildSchema = createInsertSchema(builds).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Export type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GithubProfile = typeof githubProfiles.$inferSelect;
export type InsertGithubProfile = z.infer<typeof insertGithubProfileSchema>;
export type Integration = typeof userIntegrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Usage = typeof usage.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectEnvVar = typeof projectEnvironmentVariables.$inferSelect;
export type InsertProjectEnvVar = z.infer<typeof insertProjectEnvVarSchema>;
export type ProjectSetting = typeof projectSettings.$inferSelect;
export type InsertProjectSetting = z.infer<typeof insertProjectSettingsSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type Build = typeof builds.$inferSelect;
export type InsertBuild = z.infer<typeof insertBuildSchema>;

// Plan configurations
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    pipelineRuns: 50,
    computeMinutes: 100,
    concurrentBuilds: 1,
    features: ['Basic CI/CD', 'Community Support']
  },
  pro: {
    name: 'Pro',
    price: 29,
    pipelineRuns: 500,
    computeMinutes: 1000,
    concurrentBuilds: 3,
    features: ['Advanced CI/CD', 'Priority Support', 'Custom Environments']
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    pipelineRuns: 2000,
    computeMinutes: 5000,
    concurrentBuilds: 10,
    features: ['Unlimited CI/CD', '24/7 Support', 'Custom Integrations', 'SLA']
  }
} as const;

export type PlanType = keyof typeof PLANS;
