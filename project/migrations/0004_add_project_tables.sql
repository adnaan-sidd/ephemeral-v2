-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "repository_url" varchar(500) NOT NULL,
  "repository_provider" varchar(20) NOT NULL,
  "repository_id" varchar(255) NOT NULL,
  "default_branch" varchar(100) DEFAULT 'main',
  "status" varchar(20) DEFAULT 'active',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create project_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "project_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "auto_deploy_enabled" boolean DEFAULT false,
  "build_timeout_minutes" integer DEFAULT 30,
  "retain_builds_days" integer DEFAULT 30,
  "webhook_url" varchar(500),
  "webhook_secret" varchar(255),
  "notification_settings" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create builds table if it doesn't exist
CREATE TABLE IF NOT EXISTS "builds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "status" varchar(20) DEFAULT 'queued' NOT NULL,
  "trigger" varchar(20) DEFAULT 'manual' NOT NULL,
  "trigger_details" jsonb,
  "branch" varchar(100) NOT NULL,
  "commit" varchar(40),
  "commit_message" text,
  "commit_author" varchar(255),
  "pull_request" jsonb,
  "steps" jsonb,
  "logs" text,
  "artifacts" jsonb,
  "queued_at" timestamp DEFAULT now(),
  "started_at" timestamp,
  "finished_at" timestamp,
  "duration" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE,
  "event_type" varchar(50) NOT NULL,
  "provider" varchar(20) NOT NULL,
  "payload" jsonb NOT NULL,
  "processed" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
