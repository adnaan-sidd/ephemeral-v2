import { relations } from "drizzle-orm/relations";
import { users, apiKeys, pipelines, subscriptions, usage } from "./schema";

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	apiKeys: many(apiKeys),
	pipelines: many(pipelines),
	subscriptions: many(subscriptions),
	usages: many(usage),
}));

export const pipelinesRelations = relations(pipelines, ({one}) => ({
	user: one(users, {
		fields: [pipelines.userId],
		references: [users.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const usageRelations = relations(usage, ({one}) => ({
	user: one(users, {
		fields: [usage.userId],
		references: [users.id]
	}),
}));