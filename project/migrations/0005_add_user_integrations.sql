-- Create user_integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(50) NOT NULL,
  "provider_user_id" varchar(255) NOT NULL,
  "access_token" varchar(500) NOT NULL,
  "refresh_token" varchar(500),
  "token_expires_at" timestamp,
  "scopes" jsonb,
  "provider_username" varchar(255),
  "provider_email" varchar(255),
  "connected_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
