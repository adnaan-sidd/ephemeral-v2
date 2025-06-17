import { pgTable, unique, uuid, varchar, timestamp, foreignKey, boolean, jsonb, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	plan: varchar({ length: 20 }).default('free').notNull(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	company: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	keyHash: varchar("key_hash", { length: 255 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const pipelines = pgTable("pipelines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	status: varchar({ length: 20 }).default('pending'),
	repoUrl: varchar("repo_url", { length: 500 }),
	branch: varchar({ length: 100 }).default('main'),
	commands: jsonb(),
	logs: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	duration: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "pipelines_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	plan: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('active'),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const usage = pgTable("usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	month: varchar({ length: 7 }).notNull(),
	pipelineRuns: integer("pipeline_runs").default(0),
	computeMinutes: integer("compute_minutes").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "usage_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
