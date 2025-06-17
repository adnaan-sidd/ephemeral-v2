#!/usr/bin/env node
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

// Load environment variables
dotenv.config();

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => readline.question(query, resolve));

async function testWebhook() {
  console.log('🔄 FlowForge Webhook Tester');
  console.log('----------------------------');
  
  // Get webhook URL
  const webhookUrl = await question('Enter webhook URL (e.g., http://localhost:5000/api/webhooks/github/1234): ');
  
  if (!webhookUrl || !webhookUrl.includes('/api/webhooks/')) {
    console.error('❌ Invalid webhook URL format. URL should contain /api/webhooks/');
    readline.close();
    return;
  }
  
  // Determine provider from URL
  let provider = 'unknown';
  if (webhookUrl.includes('/github/')) {
    provider = 'github';
  } else if (webhookUrl.includes('/gitlab/')) {
    provider = 'gitlab';
  } else if (webhookUrl.includes('/bitbucket/')) {
    provider = 'bitbucket';
  }
  
  console.log(`Provider detected: ${provider}`);
  
  // Select event type based on provider
  let eventType = 'push';
  if (provider === 'github') {
    const eventTypeInput = await question('Select event type (1: push, 2: pull_request): ');
    eventType = eventTypeInput === '2' ? 'pull_request' : 'push';
  } else if (provider === 'gitlab') {
    const eventTypeInput = await question('Select event type (1: push, 2: merge_request): ');
    eventType = eventTypeInput === '2' ? 'merge_request' : 'push';
  } else if (provider === 'bitbucket') {
    const eventTypeInput = await question('Select event type (1: push, 2: pullrequest): ');
    eventType = eventTypeInput === '2' ? 'pullrequest' : 'push';
  }
  
  console.log(`Event type selected: ${eventType}`);
  
  // Create mock payload based on provider and event type
  let payload = {};
  let headers = {};
  
  if (provider === 'github') {
    headers['x-github-event'] = eventType;
    
    if (eventType === 'push') {
      payload = {
        ref: 'refs/heads/main',
        after: Math.random().toString(36).substring(2, 10),
        repository: {
          id: 123456,
          name: 'test-repo',
          full_name: 'user/test-repo',
          html_url: 'https://github.com/user/test-repo'
        },
        commits: [
          {
            id: Math.random().toString(36).substring(2, 10),
            message: 'Test commit message',
            author: {
              name: 'Test User',
              email: 'test@example.com'
            },
            timestamp: new Date().toISOString()
          }
        ]
      };
    } else if (eventType === 'pull_request') {
      payload = {
        action: 'opened',
        number: Math.floor(Math.random() * 100),
        pull_request: {
          id: Math.floor(Math.random() * 1000000),
          title: 'Test pull request',
          html_url: 'https://github.com/user/test-repo/pull/1',
          user: {
            login: 'testuser'
          },
          head: {
            ref: 'feature-branch'
          },
          base: {
            ref: 'main'
          }
        },
        repository: {
          id: 123456,
          name: 'test-repo',
          full_name: 'user/test-repo',
          html_url: 'https://github.com/user/test-repo'
        }
      };
    }
  } else if (provider === 'gitlab') {
    headers['x-gitlab-event'] = 'Push Hook';
    
    if (eventType === 'push') {
      payload = {
        object_kind: 'push',
        project_id: 123456,
        project: {
          id: 123456,
          name: 'test-repo',
          path_with_namespace: 'user/test-repo',
          web_url: 'https://gitlab.com/user/test-repo'
        },
        ref: 'refs/heads/main',
        after: Math.random().toString(36).substring(2, 10),
        commits: [
          {
            id: Math.random().toString(36).substring(2, 10),
            message: 'Test commit message',
            author: {
              name: 'Test User',
              email: 'test@example.com'
            },
            timestamp: new Date().toISOString()
          }
        ]
      };
    } else if (eventType === 'merge_request') {
      headers['x-gitlab-event'] = 'Merge Request Hook';
      payload = {
        object_kind: 'merge_request',
        project_id: 123456,
        project: {
          id: 123456,
          name: 'test-repo',
          path_with_namespace: 'user/test-repo',
          web_url: 'https://gitlab.com/user/test-repo'
        },
        object_attributes: {
          id: Math.floor(Math.random() * 1000000),
          title: 'Test merge request',
          source_branch: 'feature-branch',
          target_branch: 'main',
          state: 'opened',
          url: 'https://gitlab.com/user/test-repo/merge_requests/1'
        },
        user: {
          name: 'Test User',
          username: 'testuser'
        }
      };
    }
  } else if (provider === 'bitbucket') {
    headers['x-event-key'] = eventType;
    
    if (eventType === 'push') {
      payload = {
        repository: {
          uuid: Math.random().toString(36).substring(2, 10),
          name: 'test-repo',
          full_name: 'user/test-repo',
          links: {
            html: {
              href: 'https://bitbucket.org/user/test-repo'
            }
          }
        },
        push: {
          changes: [
            {
              new: {
                name: 'main',
                target: {
                  hash: Math.random().toString(36).substring(2, 10),
                  message: 'Test commit message',
                  date: new Date().toISOString(),
                  author: {
                    raw: 'Test User <test@example.com>'
                  }
                }
              }
            }
          ]
        }
      };
    } else if (eventType === 'pullrequest') {
      headers['x-event-key'] = 'pullrequest:created';
      payload = {
        repository: {
          uuid: Math.random().toString(36).substring(2, 10),
          name: 'test-repo',
          full_name: 'user/test-repo',
          links: {
            html: {
              href: 'https://bitbucket.org/user/test-repo'
            }
          }
        },
        pullrequest: {
          id: Math.floor(Math.random() * 100),
          title: 'Test pull request',
          source: {
            branch: {
              name: 'feature-branch'
            }
          },
          destination: {
            branch: {
              name: 'main'
            }
          },
          links: {
            html: {
              href: 'https://bitbucket.org/user/test-repo/pull-requests/1'
            }
          },
          author: {
            display_name: 'Test User',
            nickname: 'testuser'
          }
        }
      };
    }
  }
  
  console.log('Sending webhook payload...');
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', data);
    
    console.log('✅ Webhook test completed successfully');
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
  }
  
  readline.close();
}

testWebhook();
