import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw, GitCommit, GitPullRequest, GitMerge, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface WebhookEvent {
  id: string;
  projectId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  event: string;
  payload: any;
  processed: boolean;
  error?: string;
  createdAt: string;
}

interface ProjectSettings {
  id: string;
  projectId: string;
  autoDeployEnabled: boolean;
  buildTimeoutMinutes: number;
  retainBuildsDay: number;
  webhookUrl: string;
  notificationSettings: {
    emailEnabled: boolean;
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
  };
}

interface WebhookEventsProps {
  projectId: string;
}

export default function WebhookEvents({ projectId }: WebhookEventsProps) {
  const { token } = useAuth();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhookEvents();
    fetchProjectSettings();
  }, [projectId, token]);

  const fetchWebhookEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/webhook-events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch webhook events');
      }
      
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching webhook events",
        description: err.message
      });
      setLoading(false);
    }
  };

  const fetchProjectSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch project settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      console.error("Error fetching project settings:", err);
      // Don't show this error to the user, as it's not critical for this view
    }
  };

  const getEventIcon = (event: WebhookEvent) => {
    if (event.event === 'push') {
      return <GitCommit className="h-4 w-4 mr-1" />;
    } else if (event.event === 'pull_request') {
      return <GitPullRequest className="h-4 w-4 mr-1" />;
    } else if (event.event === 'merge_request') {
      return <GitMerge className="h-4 w-4 mr-1" />;
    } else {
      return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  const getEventTitle = (event: WebhookEvent) => {
    if (event.event === 'push') {
      const branch = event.payload.ref.replace('refs/heads/', '');
      const shortHash = event.payload.after.substring(0, 7);
      return `Push to ${branch} (${shortHash})`;
    } else if (event.event === 'pull_request') {
      const action = event.payload.action;
      const prNumber = event.payload.pull_request.number;
      const title = event.payload.pull_request.title;
      return `PR #${prNumber} ${action}: ${title}`;
    } else {
      return `${event.event} event`;
    }
  };

  const getEventDescription = (event: WebhookEvent) => {
    if (event.event === 'push') {
      if (event.payload.commits && event.payload.commits.length > 0) {
        const commit = event.payload.commits[0];
        return `${commit.message} - ${commit.author.name}`;
      }
      return 'No commit information';
    } else if (event.event === 'pull_request') {
      const head = event.payload.pull_request.head.ref;
      const base = event.payload.pull_request.base.ref;
      const user = event.payload.pull_request.user.login;
      return `${head} → ${base} by ${user}`;
    } else {
      return JSON.stringify(event.payload).substring(0, 100) + '...';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>
            Monitor incoming webhook events from your repository
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={fetchWebhookEvents}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {settings && (
          <div className="mb-4 p-4 rounded-md bg-muted">
            <p className="text-sm font-medium mb-2">Webhook URL</p>
            <div className="flex items-center">
              <code className="bg-background p-2 rounded text-xs font-mono flex-1 truncate">
                {settings.webhookUrl}
              </code>
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-2 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(settings.webhookUrl);
                  toast({
                    title: "Copied to clipboard",
                    description: "Webhook URL copied to clipboard"
                  });
                }}
              >
                Copy
              </Button>
            </div>
            <div className="mt-2 flex items-center">
              <Badge variant={settings.autoDeployEnabled ? "default" : "outline"}>
                {settings.autoDeployEnabled ? 'Auto-deploy enabled' : 'Auto-deploy disabled'}
              </Badge>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 border rounded-lg bg-muted/50 p-6">
            <p className="text-muted-foreground text-center">
              No webhook events received yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      {getEventIcon(event)}
                      <h3 className="font-medium">{getEventTitle(event)}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getEventDescription(event)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant={event.processed ? "default" : event.error ? "destructive" : "secondary"}>
                      {event.processed ? 'Processed' : event.error ? 'Failed' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                </div>
                {event.error && (
                  <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
                    Error: {event.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
