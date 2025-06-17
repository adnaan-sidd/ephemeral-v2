import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, GitBranch, ExternalLink, 
  Settings, AlertCircle, Play, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import EnvironmentVariables from './EnvironmentVariables';
import WebhookEvents from './WebhookEvents';

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  repositoryProvider: 'github' | 'gitlab' | 'bitbucket';
  repositoryId: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

interface Build {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  commit: {
    hash: string;
    message: string;
    author: string;
    branch: string;
  };
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [buildLoading, setBuildLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (projectId) {
      fetchProject();
      // In a full implementation, we would fetch builds here
      // fetchBuilds();
      
      // For demo purposes, populate with sample builds
      setBuilds([
        {
          id: '1',
          status: 'success',
          commit: {
            hash: 'abc1234',
            message: 'Fix login bug',
            author: 'Jane Doe',
            branch: 'main'
          },
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3500000).toISOString(),
          duration: 100
        },
        {
          id: '2',
          status: 'failed',
          commit: {
            hash: 'def5678',
            message: 'Add new feature',
            author: 'John Smith',
            branch: 'feature/new-ui'
          },
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86350000).toISOString(),
          duration: 50
        },
        {
          id: '3',
          status: 'running',
          commit: {
            hash: 'ghi9012',
            message: 'Update dependencies',
            author: 'Jane Doe',
            branch: 'main'
          },
          startedAt: new Date(Date.now() - 300000).toISOString(),
          completedAt: null,
          duration: null
        }
      ]);
    }
  }, [projectId, token]);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching project",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBuild = async () => {
    setBuildLoading(true);
    try {
      // This would be implemented in a future phase
      // For now, just show a mock success
      setTimeout(() => {
        const newBuild: Build = {
          id: Math.random().toString(36).substring(7),
          status: 'pending',
          commit: {
            hash: Math.random().toString(36).substring(2, 10),
            message: 'Manual build trigger',
            author: 'Current User',
            branch: project?.defaultBranch || 'main'
          },
          startedAt: new Date().toISOString(),
          completedAt: null,
          duration: null
        };
        setBuilds([newBuild, ...builds]);
        toast({
          title: "Build triggered",
          description: "Your build has been queued and will start shortly"
        });
      }, 1500);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error triggering build",
        description: err.message
      });
    } finally {
      setBuildLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return '🐙';
      case 'gitlab':
        return '🦊';
      case 'bitbucket':
        return '🪣';
      default:
        return '📁';
    }
  };

  const getBuildStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Project not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{getProviderIcon(project.repositoryProvider)}</span>
              <span>
                {project.repositoryProvider.charAt(0).toUpperCase() + project.repositoryProvider.slice(1)}
              </span>
              <span>•</span>
              <div className="flex items-center">
                <GitBranch className="h-4 w-4 mr-1" />
                {project.defaultBranch}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => window.open(project.repositoryUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Repository
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/projects/${project.id}/settings`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            onClick={handleTriggerBuild} 
            disabled={buildLoading}
          >
            {buildLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Triggering...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Build
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Project description */}
      {project.description && (
        <p className="text-muted-foreground">{project.description}</p>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="env-vars">Environment Variables</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Builds</CardTitle>
              <CardDescription>
                View and manage your project builds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {builds.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">No builds yet</p>
                  <Button 
                    onClick={handleTriggerBuild} 
                    disabled={buildLoading}
                  >
                    {buildLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Triggering...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Run First Build
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">ID</div>
                    <div className="col-span-3">Commit</div>
                    <div className="col-span-2">Branch</div>
                    <div className="col-span-2">Started</div>
                    <div className="col-span-2">Duration</div>
                  </div>
                  {builds.map((build) => (
                    <div 
                      key={build.id} 
                      className="grid grid-cols-12 p-3 text-sm border-t hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/dashboard/projects/${project.id}/builds/${build.id}`)}
                    >
                      <div className="col-span-1 flex items-center">
                        {getBuildStatusIcon(build.status)}
                      </div>
                      <div className="col-span-2 font-mono text-xs flex items-center">
                        {build.id}
                      </div>
                      <div className="col-span-3 truncate" title={build.commit.message}>
                        <div className="font-mono text-xs">{build.commit.hash.substring(0, 7)}</div>
                        <div className="truncate text-xs text-muted-foreground">{build.commit.message}</div>
                      </div>
                      <div className="col-span-2 flex items-center text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {build.commit.branch}
                      </div>
                      <div className="col-span-2 flex items-center text-xs">
                        {formatDate(build.startedAt)}
                      </div>
                      <div className="col-span-2 flex items-center text-xs">
                        {build.status === 'running' || build.status === 'pending' ? (
                          <span className="text-muted-foreground">In progress</span>
                        ) : build.duration ? (
                          formatDuration(build.duration)
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="env-vars" className="mt-6">
          <EnvironmentVariables projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="webhooks" className="mt-6">
          <WebhookEvents projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
