// Project management service
import { db } from './db';
import * as github from './github';
import * as gitlab from './gitlab';
import * as bitbucket from './bitbucket';
import { 
  users, projects, projectSettings, projectEnvironmentVariables, webhookEvents,
  insertProjectSchema, insertProjectSettingsSchema, insertProjectEnvVarSchema 
} from '../shared/schema';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface CreateProjectInput {
  name: string;
  description?: string;
  repositoryUrl: string;
  repositoryProvider: 'github' | 'gitlab' | 'bitbucket';
  repositoryId: string;
  defaultBranch: string;
}

export interface CreateEnvironmentVariableInput {
  projectId: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export interface UpdateProjectSettingsInput {
  projectId: string;
  autoDeployEnabled?: boolean;
  buildTimeoutMinutes?: number;
  retainBuildsDay?: number;
  webhookUrl?: string;
  notificationSettings?: {
    emailEnabled?: boolean;
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    notifyOnSuccess?: boolean;
    notifyOnFailure?: boolean;
  };
}

// Generate a random webhook secret
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Extract owner and repo from GitHub URL
export function extractGitHubInfo(url: string): { owner: string; repo: string } | null {
  const githubRegex = /github\.com\/([^\/]+)\/([^\/\.]+)/;
  const match = url.match(githubRegex);
  
  if (match && match.length >= 3) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  return null;
}

// Extract project ID from GitLab URL
export function extractGitLabInfo(url: string): { projectId: number } | null {
  // For URLs like https://gitlab.com/namespace/project
  const gitlabPathRegex = /gitlab\.com\/([^\/]+)\/([^\/\.]+)/;
  const pathMatch = url.match(gitlabPathRegex);
  
  if (pathMatch && pathMatch.length >= 3) {
    // We don't have a direct ID, but we can use the path to look up the project
    return { projectId: -1 }; // Will need to look up by path later
  }
  
  // For URLs that include the project ID
  const gitlabIdRegex = /gitlab\.com\/projects\/(\d+)/;
  const idMatch = url.match(gitlabIdRegex);
  
  if (idMatch && idMatch.length >= 2) {
    return {
      projectId: parseInt(idMatch[1], 10)
    };
  }
  
  return null;
}

// Extract workspace and repo slug from Bitbucket URL
export function extractBitbucketInfo(url: string): { workspace: string; repoSlug: string } | null {
  const bitbucketRegex = /bitbucket\.org\/([^\/]+)\/([^\/\.]+)/;
  const match = url.match(bitbucketRegex);
  
  if (match && match.length >= 3) {
    return {
      workspace: match[1],
      repoSlug: match[2]
    };
  }
  
  return null;
}

// Create a new project
export async function createProject(userId: string, input: CreateProjectInput) {
  try {
    // Validate input
    const validatedInput = insertProjectSchema.parse({
      ...input,
      userId
    });
    
    // Set up webhook URL
    const webhookSecret = generateWebhookSecret();
    const webhookBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const webhookUrl = `${webhookBaseUrl}/api/webhooks/${input.repositoryProvider}/${webhookSecret}`;
    
    // Create project
    const [project] = await db.insert(projects)
      .values(validatedInput)
      .returning();
    
    // Create default project settings
    await db.insert(projectSettings)
      .values({
        projectId: project.id,
        autoDeployEnabled: true,
        buildTimeoutMinutes: 30,
        retainBuildsDay: 30,
        webhookUrl,
        notificationSettings: {
          emailEnabled: true,
          notifyOnSuccess: false,
          notifyOnFailure: true
        }
      });
    
    // Set up webhook based on provider
    try {
      if (input.repositoryProvider === 'github') {
        const { owner, repo } = extractGitHubInfo(input.repositoryUrl) || {};
        if (owner && repo) {
          await github.createRepositoryWebhook(userId, owner, repo, webhookUrl, webhookSecret);
        }
      } else if (input.repositoryProvider === 'gitlab') {
        const { projectId } = extractGitLabInfo(input.repositoryUrl) || {};
        if (projectId && projectId > 0) {
          await gitlab.createProjectWebhook(userId, projectId, webhookUrl, webhookSecret);
        }
      } else if (input.repositoryProvider === 'bitbucket') {
        const { workspace, repoSlug } = extractBitbucketInfo(input.repositoryUrl) || {};
        if (workspace && repoSlug) {
          await bitbucket.createRepositoryWebhook(userId, workspace, repoSlug, webhookUrl);
        }
      }
    } catch (webhookError) {
      console.error('Error setting up webhook:', webhookError);
      // We don't want to fail project creation if webhook setup fails
      // Just log the error and continue
    }
    
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// Get projects for a user
export async function getUserProjects(userId: string) {
  try {
    return await db.select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
}

// Get project by ID
export async function getProjectById(projectId: string, userId: string) {
  try {
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return project;
  } catch (error) {
    console.error('Error getting project by ID:', error);
    throw error;
  }
}

// Update project
export async function updateProject(projectId: string, userId: string, updates: Partial<CreateProjectInput>) {
  try {
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const [updatedProject] = await db.update(projects)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

// Delete project
export async function deleteProject(projectId: string, userId: string) {
  try {
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Get project settings for webhook info
    const [settings] = await db.select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .limit(1);
    
    // Delete webhooks if needed
    try {
      if (project.repositoryProvider === 'github') {
        const { owner, repo } = extractGitHubInfo(project.repositoryUrl) || {};
        if (owner && repo) {
          const webhooks = await github.listRepositoryWebhooks(userId, owner, repo);
          const webhook = webhooks.find(hook => hook.config.url === settings.webhookUrl);
          if (webhook) {
            await github.deleteRepositoryWebhook(userId, owner, repo, webhook.id);
          }
        }
      } else if (project.repositoryProvider === 'gitlab') {
        const { projectId: gitlabProjectId } = extractGitLabInfo(project.repositoryUrl) || {};
        if (gitlabProjectId && gitlabProjectId > 0) {
          const webhooks = await gitlab.listProjectWebhooks(userId, gitlabProjectId);
          const webhook = webhooks.find(hook => hook.url === settings.webhookUrl);
          if (webhook) {
            await gitlab.deleteProjectWebhook(userId, gitlabProjectId, webhook.id);
          }
        }
      } else if (project.repositoryProvider === 'bitbucket') {
        const { workspace, repoSlug } = extractBitbucketInfo(project.repositoryUrl) || {};
        if (workspace && repoSlug) {
          const webhooks = await bitbucket.listRepositoryWebhooks(userId, workspace, repoSlug);
          const webhook = webhooks.find(hook => hook.url === settings.webhookUrl);
          if (webhook) {
            await bitbucket.deleteRepositoryWebhook(userId, workspace, repoSlug, webhook.uuid);
          }
        }
      }
    } catch (webhookError) {
      console.error('Error cleaning up webhooks:', webhookError);
      // Don't fail project deletion if webhook cleanup fails
    }
    
    // Delete project (cascade will handle related records)
    await db.delete(projects)
      .where(eq(projects.id, projectId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Get project settings
export async function getProjectSettings(projectId: string, userId: string) {
  try {
    // First verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const [settings] = await db.select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, projectId))
      .limit(1);
    
    if (!settings) {
      throw new Error('Project settings not found');
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting project settings:', error);
    throw error;
  }
}

// Update project settings
export async function updateProjectSettings(userId: string, input: UpdateProjectSettingsInput) {
  try {
    // First verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, input.projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const [settings] = await db.select()
      .from(projectSettings)
      .where(eq(projectSettings.projectId, input.projectId))
      .limit(1);
    
    if (!settings) {
      throw new Error('Project settings not found');
    }
    
    // Update settings
    const updates: any = {
      updatedAt: new Date()
    };
    
    if (input.autoDeployEnabled !== undefined) {
      updates.autoDeployEnabled = input.autoDeployEnabled;
    }
    
    if (input.buildTimeoutMinutes !== undefined) {
      updates.buildTimeoutMinutes = input.buildTimeoutMinutes;
    }
    
    if (input.retainBuildsDay !== undefined) {
      updates.retainBuildsDay = input.retainBuildsDay;
    }
    
    if (input.webhookUrl !== undefined) {
      updates.webhookUrl = input.webhookUrl;
    }
    
    if (input.notificationSettings) {
      // Merge with existing settings to avoid overwriting unspecified fields
      updates.notificationSettings = {
        ...settings.notificationSettings,
        ...input.notificationSettings
      };
    }
    
    const [updatedSettings] = await db.update(projectSettings)
      .set(updates)
      .where(eq(projectSettings.projectId, input.projectId))
      .returning();
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating project settings:', error);
    throw error;
  }
}

// Add environment variable
export async function addEnvironmentVariable(userId: string, input: CreateEnvironmentVariableInput) {
  try {
    // First verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, input.projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Check if the key already exists
    const existingVar = await db.select()
      .from(projectEnvironmentVariables)
      .where(and(
        eq(projectEnvironmentVariables.projectId, input.projectId),
        eq(projectEnvironmentVariables.key, input.key)
      ))
      .limit(1);
    
    if (existingVar.length > 0) {
      throw new Error(`Environment variable '${input.key}' already exists for this project`);
    }
    
    // Create environment variable
    const [envVar] = await db.insert(projectEnvironmentVariables)
      .values({
        projectId: input.projectId,
        key: input.key,
        value: input.value,
        isSecret: input.isSecret
      })
      .returning();
    
    return envVar;
  } catch (error) {
    console.error('Error adding environment variable:', error);
    throw error;
  }
}

// Update environment variable
export async function updateEnvironmentVariable(userId: string, envVarId: string, updates: Partial<CreateEnvironmentVariableInput>) {
  try {
    // First get the env var to check project ownership
    const [envVar] = await db.select()
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.id, envVarId))
      .limit(1);
    
    if (!envVar) {
      throw new Error('Environment variable not found');
    }
    
    // Verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, envVar.projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found or unauthorized access');
    }
    
    // Update the env var
    const [updatedEnvVar] = await db.update(projectEnvironmentVariables)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(projectEnvironmentVariables.id, envVarId))
      .returning();
    
    return updatedEnvVar;
  } catch (error) {
    console.error('Error updating environment variable:', error);
    throw error;
  }
}

// Delete environment variable
export async function deleteEnvironmentVariable(userId: string, envVarId: string) {
  try {
    // First get the env var to check project ownership
    const [envVar] = await db.select()
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.id, envVarId))
      .limit(1);
    
    if (!envVar) {
      throw new Error('Environment variable not found');
    }
    
    // Verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, envVar.projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found or unauthorized access');
    }
    
    // Delete the env var
    await db.delete(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.id, envVarId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting environment variable:', error);
    throw error;
  }
}

// Get environment variables for a project
export async function getProjectEnvironmentVariables(projectId: string, userId: string) {
  try {
    // First verify the user owns the project
    const [project] = await db.select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ))
      .limit(1);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const envVars = await db.select()
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.projectId, projectId));
    
    // Mask secret values in the response
    return envVars.map(envVar => ({
      ...envVar,
      value: envVar.isSecret ? '••••••••' : envVar.value
    }));
  } catch (error) {
    console.error('Error getting project environment variables:', error);
    throw error;
  }
}

// Get repositories based on provider
export async function getUserRepositories(userId: string, provider: 'github' | 'gitlab' | 'bitbucket') {
  try {
    if (provider === 'github') {
      return await github.listUserRepositories(userId);
    } else if (provider === 'gitlab') {
      return await gitlab.listUserProjects(userId);
    } else if (provider === 'bitbucket') {
      return await bitbucket.listUserRepositories(userId);
    } else {
      throw new Error('Invalid repository provider');
    }
  } catch (error) {
    console.error(`Error getting ${provider} repositories:`, error);
    throw error;
  }
}

// Verify repository access
export async function verifyRepositoryAccess(
  userId: string, 
  provider: 'github' | 'gitlab' | 'bitbucket',
  repositoryUrl: string
) {
  try {
    if (provider === 'github') {
      const { owner, repo } = extractGitHubInfo(repositoryUrl) || {};
      if (!owner || !repo) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      const repository = await github.getRepositoryDetails(userId, owner, repo);
      return {
        hasAccess: !!repository && (repository.permissions?.admin || repository.permissions?.push),
        defaultBranch: repository.default_branch || 'main'
      };
    } else if (provider === 'gitlab') {
      const { projectId } = extractGitLabInfo(repositoryUrl) || {};
      if (!projectId) {
        throw new Error('Invalid GitLab repository URL');
      }
      
      // For GitLab, we need to search for the project by path if we don't have the ID
      let gitlabProjectId = projectId;
      if (gitlabProjectId === -1) {
        const projects = await gitlab.listUserProjects(userId);
        const matchingProject = projects.find(p => repositoryUrl.includes(p.path_with_namespace));
        if (!matchingProject) {
          throw new Error('GitLab project not found');
        }
        gitlabProjectId = matchingProject.id;
      }
      
      const project = await gitlab.getProjectDetails(userId, gitlabProjectId);
      const accessLevel = project.permissions?.project_access?.access_level || 
                          project.permissions?.group_access?.access_level || 0;
      
      return {
        hasAccess: accessLevel >= 30, // 30 is Developer level which can push
        defaultBranch: project.default_branch || 'main'
      };
    } else if (provider === 'bitbucket') {
      const { workspace, repoSlug } = extractBitbucketInfo(repositoryUrl) || {};
      if (!workspace || !repoSlug) {
        throw new Error('Invalid Bitbucket repository URL');
      }
      
      const repository = await bitbucket.getRepositoryDetails(userId, workspace, repoSlug);
      return {
        hasAccess: !!repository,
        defaultBranch: repository.mainbranch?.name || 'main'
      };
    } else {
      throw new Error('Invalid repository provider');
    }
  } catch (error) {
    console.error(`Error verifying ${provider} repository access:`, error);
    throw error;
  }
}
