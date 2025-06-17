// GitLab API integration for repository management
import { db } from './db';
import { userIntegrations } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  description: string;
  default_branch: string;
  visibility: string;
  namespace: {
    name: string;
    path: string;
  };
  permissions: {
    project_access: {
      access_level: number;
    } | null;
    group_access: {
      access_level: number;
    } | null;
  };
}

export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
  };
  protected: boolean;
  default: boolean;
}

export interface GitLabWebhook {
  id: number;
  url: string;
  push_events: boolean;
  merge_requests_events: boolean;
  tag_push_events: boolean;
  enable_ssl_verification: boolean;
  token: string;
}

// Fetch user's GitLab access token
export async function getGitLabAccessToken(userId: string): Promise<string | null> {
  try {
    const integration = await db.select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, userId))
      .where(eq(userIntegrations.provider, 'gitlab'))
      .limit(1);
    
    if (integration.length > 0) {
      return integration[0].accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting GitLab access token:', error);
    return null;
  }
}

// List user's GitLab projects
export async function listUserProjects(userId: string): Promise<GitLabProject[]> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    // Fetch user projects with pagination
    const perPage = 100;
    let page = 1;
    let allProjects: GitLabProject[] = [];
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await fetch(`https://gitlab.com/api/v4/projects?membership=true&per_page=${perPage}&page=${page}&order_by=updated_at`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitLab API error: ${error.message}`);
      }
      
      const projects = await response.json() as GitLabProject[];
      allProjects = [...allProjects, ...projects];
      
      // Check if we have more pages
      if (projects.length < perPage) {
        hasMorePages = false;
      } else {
        page++;
      }
    }
    
    return allProjects;
  } catch (error) {
    console.error('Error listing GitLab projects:', error);
    throw error;
  }
}

// Get project details
export async function getProjectDetails(userId: string, projectId: number): Promise<GitLabProject> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitLab API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting project details for ${projectId}:`, error);
    throw error;
  }
}

// List project branches
export async function listProjectBranches(userId: string, projectId: number): Promise<GitLabBranch[]> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/repository/branches`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitLab API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error listing branches for project ${projectId}:`, error);
    throw error;
  }
}

// Create project webhook
export async function createProjectWebhook(
  userId: string, 
  projectId: number, 
  webhookUrl: string,
  secret: string
): Promise<GitLabWebhook> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        push_events: true,
        merge_requests_events: true,
        tag_push_events: true,
        enable_ssl_verification: true,
        token: secret
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitLab API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating webhook for project ${projectId}:`, error);
    throw error;
  }
}

// List project webhooks
export async function listProjectWebhooks(userId: string, projectId: number): Promise<GitLabWebhook[]> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitLab API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error listing webhooks for project ${projectId}:`, error);
    throw error;
  }
}

// Delete project webhook
export async function deleteProjectWebhook(userId: string, projectId: number, webhookId: number): Promise<void> {
  try {
    const accessToken = await getGitLabAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitLab access token found for user');
    }
    
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitLab API error: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting webhook ${webhookId} for project ${projectId}:`, error);
    throw error;
  }
}
