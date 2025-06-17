import crypto from 'crypto';
import { Request, Response } from 'express';
import { storage } from './storage';
import buildProcessor from './build-processor';

/**
 * Validates a GitHub webhook signature
 * 
 * @param payload The raw request body
 * @param signature The signature from the X-Hub-Signature-256 header
 * @param secret The webhook secret
 * @returns boolean indicating if the signature is valid
 */
export function validateGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

/**
 * Handle GitHub webhook events
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleGitHubWebhook(req: Request, res: Response) {
  const githubEvent = req.headers['x-github-event'] as string;
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = req.body;
  const rawBody = req.rawBody as string;
  
  console.log(`📩 Received GitHub webhook: ${githubEvent}`);
  
  if (!githubEvent) {
    return res.status(400).json({ error: 'Missing X-GitHub-Event header' });
  }
  
  // Record the webhook event
  try {
    // Try to identify the repository
    const repositoryUrl = payload.repository?.html_url;
    const repositoryId = payload.repository?.id?.toString();
    let projectId = null;
    
    // Find matching project if possible
    if (repositoryId) {
      const projects = await storage.getProjectsByRepositoryId(repositoryId);
      if (projects && projects.length > 0) {
        projectId = projects[0].id;
        
        // Verify webhook signature if webhook secret exists
        const settings = await storage.getProjectSettings(projectId);
        if (settings && settings.webhookSecret && signature && rawBody) {
          const isValid = validateGitHubSignature(rawBody, signature, settings.webhookSecret);
          if (!isValid) {
            console.error('❌ Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
          }
          console.log('✅ Webhook signature verified');
        }
      }
    }
    
    const event = await storage.createWebhookEvent({
      projectId, 
      eventType: githubEvent,
      provider: 'github',
      payload,
      processed: false
    });
    
    // Process based on event type
    if (githubEvent === 'ping') {
      console.log('✅ GitHub webhook ping received successfully');
      await storage.updateWebhookEvent(event.id, { processed: true });
      return res.status(200).json({ message: 'Webhook received successfully' });
    }
    
    // Handle push events
    if (githubEvent === 'push') {
      await processPushEvent(event.id, payload);
      return res.status(200).json({ message: 'Push event processing initiated' });
    }
    
    // Handle pull request events
    if (githubEvent === 'pull_request') {
      const action = payload.action;
      if (['opened', 'reopened', 'synchronize'].includes(action)) {
        await processPullRequestEvent(event.id, payload);
        return res.status(200).json({ message: 'Pull request event processing initiated' });
      }
    }
    
    // Other events just acknowledge receipt
    console.log(`👀 Received ${githubEvent} event, no action taken`);
    await storage.updateWebhookEvent(event.id, { processed: true });
    return res.status(200).json({ message: 'Event received, no action taken' });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
}

/**
 * Process a GitHub push event
 * 
 * @param eventId The webhook event ID
 * @param payload The webhook payload
 */
async function processPushEvent(eventId: string, payload: any) {
  try {
    const repositoryUrl = payload.repository.html_url;
    const repositoryId = payload.repository.id.toString();
    const branch = payload.ref.replace('refs/heads/', '');
    
    console.log(`🔍 Looking for projects with repo ${repositoryUrl} and branch ${branch}`);
    
    // Find matching projects
    const projects = await storage.getProjectsByRepositoryId(repositoryId);
    
    if (!projects || projects.length === 0) {
      console.log(`⚠️ No matching projects found for repository ${repositoryUrl}`);
      await storage.updateWebhookEvent(eventId, { processed: true });
      return;
    }
    
    // Update the webhook event with the first matching project
    await storage.updateWebhookEvent(eventId, { 
      projectId: projects[0].id,
      processed: true 
    });
    
    // For each matching project, check if auto-deploy is enabled for this branch
    for (const project of projects) {
      const settings = await storage.getProjectSettings(project.id);
      
      // Skip if auto-deploy is disabled
      if (!settings || !settings.autoDeployEnabled) {
        console.log(`⏭️ Auto-deploy disabled for project ${project.name}`);
        continue;
      }
      
      // Check if this is the default branch or a configured branch
      const isDefaultBranch = branch === project.defaultBranch;
      if (!isDefaultBranch) {
        console.log(`⏭️ Push to non-default branch ${branch}, skipping build for project ${project.name}`);
        continue;
      }
      
      console.log(`🚀 Triggering build for project ${project.name} (${project.id})`);
      
      // Create a new build
      const build = await storage.createBuild({
        projectId: project.id,
        status: 'queued',
        trigger: 'webhook',
        triggerDetails: {
          event: 'push',
          sender: payload.sender.login,
          commit: payload.after,
          message: payload.head_commit?.message || 'No commit message',
          timestamp: new Date().toISOString()
        },
        branch,
        commit: payload.after,
        commitMessage: payload.head_commit?.message || 'No commit message',
        commitAuthor: payload.head_commit?.author?.name || 'Unknown',
        queuedAt: new Date()
      });
      
      // Start the build process
      await buildProcessor.processBuild(build.id, project);
    }
  } catch (error) {
    console.error('Error processing push event:', error);
    await storage.updateWebhookEvent(eventId, { processed: true, error: error.message });
  }
}

/**
 * Process a GitHub pull request event
 * 
 * @param eventId The webhook event ID
 * @param payload The webhook payload
 */
async function processPullRequestEvent(eventId: string, payload: any) {
  try {
    const repositoryUrl = payload.repository.html_url;
    const repositoryId = payload.repository.id.toString();
    const branch = payload.pull_request.head.ref;
    const action = payload.action;
    
    console.log(`🔍 Processing PR ${action} for ${repositoryUrl}, branch ${branch}`);
    
    // Find matching projects
    const projects = await storage.getProjectsByRepositoryId(repositoryId);
    
    if (!projects || projects.length === 0) {
      console.log(`⚠️ No matching projects found for repository ${repositoryUrl}`);
      await storage.updateWebhookEvent(eventId, { processed: true });
      return;
    }
    
    // Update the webhook event with the first matching project
    await storage.updateWebhookEvent(eventId, { 
      projectId: projects[0].id,
      processed: true 
    });
    
    // For each matching project, check if PR builds are enabled
    for (const project of projects) {
      const settings = await storage.getProjectSettings(project.id);
      
      // Skip if auto-deploy is disabled (PR builds require auto-deploy)
      if (!settings || !settings.autoDeployEnabled) {
        console.log(`⏭️ Auto-deploy disabled for project ${project.name}, skipping PR build`);
        continue;
      }
      
      console.log(`🚀 Triggering PR build for project ${project.name} (${project.id})`);
      
      // Create a new build
      const build = await storage.createBuild({
        projectId: project.id,
        status: 'queued',
        trigger: 'webhook',
        triggerDetails: {
          event: 'pull_request',
          action: payload.action,
          sender: payload.sender.login,
          pullRequest: payload.pull_request.number,
          title: payload.pull_request.title,
          timestamp: new Date().toISOString()
        },
        branch,
        commit: payload.pull_request.head.sha,
        commitMessage: payload.pull_request.title || 'No PR title',
        commitAuthor: payload.pull_request.user.login || 'Unknown',
        pullRequest: {
          id: payload.pull_request.id,
          number: payload.pull_request.number,
          title: payload.pull_request.title,
          baseBranch: payload.pull_request.base.ref,
          headBranch: payload.pull_request.head.ref
        },
        queuedAt: new Date()
      });
      
      // Start the build process
      await buildProcessor.processBuild(build.id, project);
    }
  } catch (error) {
    console.error('Error processing pull request event:', error);
    await storage.updateWebhookEvent(eventId, { processed: true, error: error.message });
  }
}
