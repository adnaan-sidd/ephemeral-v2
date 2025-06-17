// GitHub API integration for repository management
import { db } from './db';
import { users, githubProfiles, projects, projectSettings, userIntegrations } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  default_branch: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubWebhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
    secret?: string;
  };
}

// Fetch user's GitHub access token
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  try {
    // First check if we have a GitHub integration
    const integration = await db.select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, userId))
      .where(eq(userIntegrations.provider, 'github'))
      .limit(1);
    
    if (integration.length > 0) {
      return integration[0].accessToken;
    }
    
    // If not, try githubProfiles (from OAuth login)
    const profile = await db.select()
      .from(githubProfiles)
      .where(eq(githubProfiles.userId, userId))
      .limit(1);
    
    if (profile.length > 0) {
      return profile[0].accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting GitHub access token:', error);
    return null;
  }
}

// List user's GitHub repositories
export async function listUserRepositories(userId: string): Promise<GitHubRepository[]> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    // Fetch user repositories with pagination
    const perPage = 100;
    let page = 1;
    let allRepos: GitHubRepository[] = [];
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message}`);
      }
      
      const repos = await response.json() as GitHubRepository[];
      allRepos = [...allRepos, ...repos];
      
      // Check if we have more pages
      if (repos.length < perPage) {
        hasMorePages = false;
      } else {
        page++;
      }
    }
    
    return allRepos;
  } catch (error) {
    console.error('Error listing GitHub repositories:', error);
    throw error;
  }
}

// Get repository details
export async function getRepositoryDetails(userId: string, owner: string, repo: string): Promise<GitHubRepository> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting repository details for ${owner}/${repo}:`, error);
    throw error;
  }
}

// List repository branches
export async function listRepositoryBranches(userId: string, owner: string, repo: string): Promise<GitHubBranch[]> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error listing branches for ${owner}/${repo}:`, error);
    throw error;
  }
}

// Create repository webhook
export async function createRepositoryWebhook(
  userId: string, 
  owner: string, 
  repo: string, 
  webhookUrl: string,
  secret: string
): Promise<GitHubWebhook> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
          secret: secret
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating webhook for ${owner}/${repo}:`, error);
    throw error;
  }
}

// List repository webhooks
export async function listRepositoryWebhooks(userId: string, owner: string, repo: string): Promise<GitHubWebhook[]> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error listing webhooks for ${owner}/${repo}:`, error);
    throw error;
  }
}

// Delete repository webhook
export async function deleteRepositoryWebhook(userId: string, owner: string, repo: string, webhookId: number): Promise<void> {
  try {
    const accessToken = await getGitHubAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No GitHub access token found for user');
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting webhook ${webhookId} for ${owner}/${repo}:`, error);
    throw error;
  }
}
