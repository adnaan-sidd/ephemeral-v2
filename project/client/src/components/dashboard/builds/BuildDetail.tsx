import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  GitCommit,
  User,
  Terminal,
  Copy,
  ArrowLeft,
  StopCircle,
  RotateCw,
  Download
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface BuildStep {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'queued' | 'skipped';
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  command: string;
  logs: string[];
}

interface Build {
  id: string;
  projectId: string;
  projectName: string;
  status: 'success' | 'failed' | 'running' | 'queued' | 'canceled';
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  authorEmail: string;
  duration: number;
  startedAt: string;
  finishedAt: string | null;
  steps: BuildStep[];
}

export default function BuildDetail() {
  const { projectId, buildId } = useParams<{ projectId: string; buildId: string }>();
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [polling, setPolling] = useState(false);
  const [cancelingBuild, setCancelingBuild] = useState(false);
  const [restartingBuild, setRestartingBuild] = useState(false);

  useEffect(() => {
    if (projectId && buildId) {
      fetchBuildDetails();
    }
  }, [projectId, buildId, token]);

  // Auto-polling for running builds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (build?.status === 'running' || build?.status === 'queued') {
      interval = setInterval(() => {
        setPolling(true);
        fetchBuildDetails(false);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [build?.status]);

  // Auto-scroll logs when they update
  useEffect(() => {
    if (autoScroll && logContainerRef.current && activeTab === 'logs') {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [build?.steps, activeStepIndex, activeTab, autoScroll]);

  const fetchBuildDetails = async (showLoadingState = true) => {
    if (!projectId || !buildId || !token) return;

    if (showLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/builds/${buildId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch build details');
      }

      const data = await response.json();
      setBuild(data);
    } catch (err: any) {
      setError(err.message);
      if (showLoadingState) {
        toast({
          variant: "destructive",
          title: "Error fetching build details",
          description: err.message
        });
      }
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  const cancelBuild = async () => {
    if (!projectId || !buildId || !token) return;
    
    setCancelingBuild(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/builds/${buildId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel build');
      }

      toast({
        title: "Build canceled",
        description: "The build has been canceled."
      });
      
      // Refresh build details
      fetchBuildDetails();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error canceling build",
        description: err.message
      });
    } finally {
      setCancelingBuild(false);
    }
  };

  const restartBuild = async () => {
    if (!projectId || !buildId || !token) return;
    
    setRestartingBuild(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/builds/${buildId}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restart build');
      }

      const newBuild = await response.json();
      
      toast({
        title: "Build restarted",
        description: "A new build has been triggered."
      });
      
      // Navigate to the new build
      navigate(`/dashboard/projects/${projectId}/builds/${newBuild.id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error restarting build",
        description: err.message
      });
    } finally {
      setRestartingBuild(false);
    }
  };

  const downloadLogs = () => {
    if (!build) return;
    
    // Combine all logs from all steps
    const allLogs = build.steps.map(step => {
      return `=== ${step.name} ===\n${step.command}\n\n${step.logs.join('\n')}`;
    }).join('\n\n');
    
    // Create a blob and download
    const blob = new Blob([allLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-${build.id}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    if (!build) return;
    
    const step = build.steps[activeStepIndex];
    if (step) {
      navigator.clipboard.writeText(step.logs.join('\n'));
      toast({
        title: "Logs copied",
        description: "The logs have been copied to clipboard."
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'queued':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Queued
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Canceled
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline">
            Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading && !build) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !build) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Build</h2>
        <p className="text-muted-foreground mb-6 text-center">{error}</p>
        <Button onClick={() => fetchBuildDetails()}>Try Again</Button>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Build Not Found</h2>
        <p className="text-muted-foreground mb-6 text-center">The requested build could not be found.</p>
        <Button asChild>
          <Link to={`/dashboard/projects/${projectId}`}>Back to Project</Link>
        </Button>
      </div>
    );
  }

  // Calculate overall progress for running builds
  const calculateProgress = () => {
    if (build.status === 'queued') return 0;
    if (build.status === 'success' || build.status === 'failed' || build.status === 'canceled') return 100;
    
    // For running builds, count completed steps
    const totalSteps = build.steps.length;
    if (totalSteps === 0) return 0;
    
    const completedSteps = build.steps.filter(
      step => step.status === 'success' || step.status === 'failed' || step.status === 'skipped'
    ).length;
    
    // If there's a running step, add partial progress
    const runningStep = build.steps.find(step => step.status === 'running');
    if (runningStep) {
      // Assume running step is 50% complete (simplified)
      return Math.round((completedSteps + 0.5) / totalSteps * 100);
    }
    
    return Math.round(completedSteps / totalSteps * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Project
            </Link>
          </Button>
          {polling ? (
            <div className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Updating...
            </div>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          {(build.status === 'running' || build.status === 'queued') && (
            <Button
              variant="outline"
              size="sm"
              onClick={cancelBuild}
              disabled={cancelingBuild}
            >
              {cancelingBuild ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <StopCircle className="h-4 w-4 mr-1" />
              )}
              Cancel Build
            </Button>
          )}
          {(build.status === 'success' || build.status === 'failed' || build.status === 'canceled') && (
            <Button
              variant="outline"
              size="sm"
              onClick={restartBuild}
              disabled={restartingBuild}
            >
              {restartingBuild ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4 mr-1" />
              )}
              Restart Build
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBuildDetails()}
            disabled={loading || polling}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${(loading || polling) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                Build #{build.id.substring(0, 8)}
                <span className="ml-3">{getStatusBadge(build.status)}</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {build.projectName} • {format(new Date(build.startedAt), 'PPpp')}
              </CardDescription>
            </div>
          </div>
          
          {(build.status === 'running' || build.status === 'queued') && (
            <div className="mt-2">
              <div className="flex justify-between mb-1 text-sm">
                <span>Build progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="steps">Steps</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Commit Information</h3>
                    <div className="bg-muted/50 p-4 rounded-md space-y-2">
                      <div className="flex items-start">
                        <GitCommit className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <div>
                          <div className="font-mono text-xs">{build.commitSha}</div>
                          <div className="mt-1">{build.commitMessage}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div>{build.author}</div>
                          <div className="text-xs text-muted-foreground">{build.authorEmail}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="font-mono text-sm">{build.branch}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Build Information</h3>
                    <div className="bg-muted/50 p-4 rounded-md space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div>{getStatusBadge(build.status)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                          <div>{formatDuration(build.duration)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Started</div>
                          <div>{format(new Date(build.startedAt), 'PPp')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Finished</div>
                          <div>
                            {build.finishedAt 
                              ? format(new Date(build.finishedAt), 'PPp') 
                              : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Build Steps Summary</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <div className="space-y-2">
                    {build.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                        <div className="flex items-center">
                          {getStatusBadge(step.status)}
                          <span className="ml-2">{step.name}</span>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {formatDuration(step.duration)}
                        </div>
                      </div>
                    ))}
                    
                    {build.steps.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No build steps available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="steps" className="space-y-6">
              {build.steps.map((step, index) => (
                <div key={step.id} className="border rounded-md">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusBadge(step.status)}
                      <h3 className="ml-2 font-medium">{step.name}</h3>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {formatDuration(step.duration)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-4">
                    <div className="font-mono text-sm bg-muted p-2 rounded-md mb-4">
                      $ {step.command}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {step.startedAt 
                        ? `Started: ${format(new Date(step.startedAt), 'PPp')}` 
                        : 'Not started yet'}
                      {step.finishedAt && ` • Finished: ${format(new Date(step.finishedAt), 'PPp')}`}
                    </div>
                    
                    <div className="bg-black text-white p-3 rounded-md font-mono text-xs h-40 overflow-auto">
                      {step.logs.length > 0 
                        ? step.logs.map((line, i) => <div key={i}>{line}</div>)
                        : <div className="text-gray-500 italic">No logs available</div>
                      }
                    </div>
                  </div>
                </div>
              ))}
              
              {build.steps.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No build steps available
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <select
                    className="text-sm border rounded-md p-1"
                    value={activeStepIndex}
                    onChange={(e) => setActiveStepIndex(parseInt(e.target.value))}
                  >
                    {build.steps.map((step, index) => (
                      <option key={step.id} value={index}>
                        {step.name} ({step.status})
                      </option>
                    ))}
                  </select>
                  
                  <label className="flex items-center text-sm space-x-1">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto-scroll</span>
                  </label>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyLogs} disabled={build.steps.length === 0}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadLogs} disabled={build.steps.length === 0}>
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </Button>
                </div>
              </div>
              
              <div 
                ref={logContainerRef}
                className="bg-black text-white p-4 rounded-md font-mono text-xs h-[60vh] overflow-auto"
              >
                {build.steps.length > 0 && build.steps[activeStepIndex]?.logs.length > 0 ? (
                  build.steps[activeStepIndex].logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">No logs available</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
