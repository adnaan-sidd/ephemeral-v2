-- Add projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  repository_url VARCHAR(500) NOT NULL,
  repository_provider VARCHAR(20) NOT NULL, 
  repository_id VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project environment variables table
CREATE TABLE IF NOT EXISTS project_environment_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  auto_deploy_enabled BOOLEAN DEFAULT false,
  build_timeout_minutes INTEGER DEFAULT 30,
  retain_builds_days INTEGER DEFAULT 30,
  webhook_url VARCHAR(500),
  notification_settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_env_vars_project_id ON project_environment_variables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_settings_project_id ON project_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_project_id ON webhook_events(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
