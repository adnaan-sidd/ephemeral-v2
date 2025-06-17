-- Add webhookSecret field to project_settings table
ALTER TABLE "project_settings" ADD COLUMN IF NOT EXISTS "webhook_secret" varchar(255);
