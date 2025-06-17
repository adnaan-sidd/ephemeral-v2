import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  GitCommit,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Build {
  id: string;
  projectId: string;
  status: 'success' | 'failed' | 'running' | 'queued' | 'canceled';
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  duration: number;
  startedAt: string;
  finishedAt: string | null;
  logs?: string[];
}

export default function ProjectBuilds() {
  const { projectId } = useParams<{ projectId: string }>();
  const { token } = useAuth();
  const { toast } = useToast();

  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchBuilds();
    }
  }, [projectId, token]);

  const fetchBuilds = async () => {
    if (!projectId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/builds`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch builds');
      }

      const data = await response.json();
      setBuilds(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching builds",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerBuild = async () => {
    if (!projectId || !token) return;

    setTriggering(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/builds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: 'main' // Default to main branch
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to trigger build');
      }

      const newBuild = await response.json();
      
      // Add the new build to the list
      setBuilds(prev => [newBuild, ...prev]);
      
      toast({
        title: "Build triggered successfully",
        description: "A new build has been queued."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error triggering build",
        description: err.message
      });
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'queued':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Queued
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Canceled
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

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Build History</CardTitle>
          <CardDescription>
            View and manage CI/CD builds for this project
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBuilds}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerBuild}
            disabled={triggering}
          >
            {triggering ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Trigger Build
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-4 text-red-800 dark:text-red-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>{error}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No builds found for this project.</p>
            <p className="mt-2">Click "Trigger Build" to start your first build.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Commit</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map((build) => (
                  <TableRow key={build.id}>
                    <TableCell>{getStatusBadge(build.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-mono text-xs">{build.branch}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center max-w-xs">
                              <GitCommit className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="font-mono text-xs truncate">
                                {build.commitSha.substring(0, 7)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">Commit Message:</p>
                            <p className="max-w-xs">{build.commitMessage}</p>
                            <p className="mt-1 font-mono text-xs">{build.commitSha}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{build.author}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              {formatDistanceToNow(new Date(build.startedAt), { addSuffix: true })}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(build.startedAt), 'PPpp')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {build.status === 'running' || build.status === 'queued' ? (
                        <span className="text-muted-foreground italic">In progress</span>
                      ) : (
                        formatDuration(build.duration)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/dashboard/projects/${projectId}/builds/${build.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
