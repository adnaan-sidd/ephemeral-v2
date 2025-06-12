import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  company: varchar("company", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Usage = typeof usage.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

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
