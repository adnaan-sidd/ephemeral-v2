// Bitbucket API integration for repository management
import { db } from './db';
import { userIntegrations } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  links: {
    html: { href: string }[];
    self: { href: string }[];
  };
  description: string;
  mainbranch?: {
    name: string;
    type: string;
  };
  is_private: boolean;
  owner: {
    display_name: string;
    uuid: string;
  };
}

export interface BitbucketBranch {
  name: string;
  target: {
    hash: string;
  };
}

export interface BitbucketWebhook {
  uuid: string;
  url: string;
  description: string;
  active: boolean;
  events: string[];
}

// Fetch user's Bitbucket access token
export async function getBitbucketAccessToken(userId: string): Promise<string | null> {
  try {
    const integration = await db.select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, userId))
      .where(eq(userIntegrations.provider, 'bitbucket'))
      .limit(1);
    
    if (integration.length > 0) {
      return integration[0].accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Bitbucket access token:', error);
    return null;
  }
}

// List user's Bitbucket repositories
export async function listUserRepositories(userId: string): Promise<BitbucketRepository[]> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    let allRepos: BitbucketRepository[] = [];
    let url = 'https://api.bitbucket.org/2.0/repositories?role=contributor';
    
    // Handle pagination
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      allRepos = [...allRepos, ...data.values];
      
      // Check if there are more pages
      url = data.next || '';
    }
    
    return allRepos;
  } catch (error) {
    console.error('Error listing Bitbucket repositories:', error);
    throw error;
  }
}

// Get repository details
export async function getRepositoryDetails(userId: string, workspace: string, repoSlug: string): Promise<BitbucketRepository> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting repository details for ${workspace}/${repoSlug}:`, error);
    throw error;
  }
}

// List repository branches
export async function listRepositoryBranches(userId: string, workspace: string, repoSlug: string): Promise<BitbucketBranch[]> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    let allBranches: BitbucketBranch[] = [];
    let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/refs/branches`;
    
    // Handle pagination
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      allBranches = [...allBranches, ...data.values];
      
      // Check if there are more pages
      url = data.next || '';
    }
    
    return allBranches;
  } catch (error) {
    console.error(`Error listing branches for ${workspace}/${repoSlug}:`, error);
    throw error;
  }
}

// Create repository webhook
export async function createRepositoryWebhook(
  userId: string, 
  workspace: string, 
  repoSlug: string, 
  webhookUrl: string,
  description: string = 'FlowForge CI/CD webhook'
): Promise<BitbucketWebhook> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        url: webhookUrl,
        active: true,
        events: [
          'repo:push',
          'pullrequest:created',
          'pullrequest:updated'
        ]
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating webhook for ${workspace}/${repoSlug}:`, error);
    throw error;
  }
}

// List repository webhooks
export async function listRepositoryWebhooks(userId: string, workspace: string, repoSlug: string): Promise<BitbucketWebhook[]> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    let allWebhooks: BitbucketWebhook[] = [];
    let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/hooks`;
    
    // Handle pagination
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      allWebhooks = [...allWebhooks, ...data.values];
      
      // Check if there are more pages
      url = data.next || '';
    }
    
    return allWebhooks;
  } catch (error) {
    console.error(`Error listing webhooks for ${workspace}/${repoSlug}:`, error);
    throw error;
  }
}

// Delete repository webhook
export async function deleteRepositoryWebhook(userId: string, workspace: string, repoSlug: string, webhookUuid: string): Promise<void> {
  try {
    const accessToken = await getBitbucketAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('No Bitbucket access token found for user');
    }
    
    const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bitbucket API error: ${error.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error deleting webhook ${webhookUuid} for ${workspace}/${repoSlug}:`, error);
    throw error;
  }
}
