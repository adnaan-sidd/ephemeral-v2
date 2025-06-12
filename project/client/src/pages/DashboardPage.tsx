import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Clock, 
  Play, 
  Zap, 
  BarChart, 
  Plus,
  MoreVertical,
  ChevronRight,
  RefreshCw,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import DashboardLayout from '../dashboard/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import StatsCard from '../dashboard/common/StatsCard';
import BuildsTable from '../dashboard/builds/BuildsTable';
import { useWebSocket } from '../dashboard/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';

// Simulate API data
const sampleBuilds = [
  {
    id: '1',
    projectId: '1',
    projectName: 'Frontend App',
    status: 'success',
    branch: 'main',
    commitSha: 'a1b2c3d4e5f6g7h8i9j0',
    commitMessage: 'Update header component with new design',
    author: 'Sarah Chen',
    duration: 145000, // 2m 25s
    startedAt: new Date(Date.now() - 3600000), // 1 hour ago
    finishedAt: new Date(Date.now() - 3455000) // 57.5 minutes ago
  },
  {
    id: '2',
    projectId: '2',
    projectName: 'API Service',
    status: 'running',
    branch: 'feature/auth-improvements',
    commitSha: 'b2c3d4e5f6g7h8i9j0k1',
    commitMessage: 'Implement OAuth2 flow',
    author: 'John Doe',
    duration: 60000, // 1m (running)
    startedAt: new Date(Date.now() - 60000), // 1 minute ago
    finishedAt: null
  },
  {
    id: '3',
    projectId: '1',
    projectName: 'Frontend App',
    status: 'failed',
    branch: 'bugfix/mobile-layout',
    commitSha: 'c3d4e5f6g7h8i9j0k1l2',
    commitMessage: 'Fix responsive layout on small screens',
    author: 'Sarah Chen',
    duration: 74000, // 1m 14s
    startedAt: new Date(Date.now() - 900000), // 15 minutes ago
    finishedAt: new Date(Date.now() - 826000) // 13.8 minutes ago
  },
  {
    id: '4',
    projectId: '3',
    projectName: 'Backend Service',
    status: 'queued',
    branch: 'main',
    commitSha: 'd4e5f6g7h8i9j0k1l2m3',
    commitMessage: 'Update dependencies',
    author: 'Mike Johnson',
    duration: 0,
    startedAt: new Date(Date.now() - 120000), // 2 minutes ago
    finishedAt: null
  },
  {
    id: '5',
    projectId: '2',
    projectName: 'API Service',
    status: 'success',
    branch: 'main',
    commitSha: 'e5f6g7h8i9j0k1l2m3n4',
    commitMessage: 'Add rate limiting to public endpoints',
    author: 'John Doe',
    duration: 187000, // 3m 7s
    startedAt: new Date(Date.now() - 7200000), // 2 hours ago
    finishedAt: new Date(Date.now() - 7013000) // 1 hour 57 minutes ago
  }
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { socket, connected } = useWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Listen for real-time build updates
  useEffect(() => {
    if (!socket) return;

    const handleBuildUpdate = (build: any) => {
      console.log('Build update received:', build);
      // In a real app, this would update the query cache or trigger a refetch
    };

    socket.on('build:update', handleBuildUpdate);

    return () => {
      socket.off('build:update', handleBuildUpdate);
    };
  }, [socket]);

  // Queries
  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/user/usage'],
    queryFn: async () => {
      // Simulate API call
      return {
        current: {
          pipelineRuns: 45,
          computeMinutes: 128,
        },
        limits: {
          pipelineRuns: 100,
          computeMinutes: 500,
          concurrentBuilds: 2
        }
      };
    },
    enabled: !!token
  });

  const { data: builds, isLoading: isLoadingBuilds, refetch: refetchBuilds } = useQuery({
    queryKey: ['/api/user/builds'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleBuilds;
    },
    enabled: !!token
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchBuilds();
    setIsRefreshing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Welcome and overview */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Here's an overview of your CI/CD pipelines
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pipeline Runs"
          value={isLoadingUsage ? '-' : `${usage?.current.pipelineRuns || 0} / ${usage?.limits.pipelineRuns || 0}`}
          description="This month"
          icon={<Play size={20} />}
          loading={isLoadingUsage}
          colorScheme="blue"
        />
        <StatsCard
          title="Compute Minutes"
          value={isLoadingUsage ? '-' : `${usage?.current.computeMinutes || 0} min`}
          description={`${usage?.limits.computeMinutes || 0} minutes limit`}
          icon={<Clock size={20} />}
          loading={isLoadingUsage}
          colorScheme="amber"
        />
        <StatsCard
          title="Success Rate"
          value="94.7%"
          change={{ value: 2.3, trend: 'up' }}
          icon={<BarChart size={20} />}
          colorScheme="emerald"
        />
        <StatsCard
          title="Avg Duration"
          value="2m 43s"
          change={{ value: 12, trend: 'down' }}
          icon={<Zap size={20} />}
          colorScheme="violet"
        />
      </div>

      {/* Recent Builds */}
      <div className="mb-8">
        <BuildsTable 
          builds={builds || []} 
          isLoading={isLoadingBuilds || isRefreshing} 
          onRefresh={handleRefresh}
        />
      </div>

      {/* Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              onClick={() => setLocation('/dashboard/projects/new')}
            >
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setLocation('/dashboard/pipelines')}
            >
              <LayoutGrid size={16} className="mr-2" />
              Manage Pipelines
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setLocation('/dashboard/analytics')}
            >
              <BarChart size={16} className="mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current status of FlowForge services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Build Executor</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Operational</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100 dark:bg-slate-700" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API Services</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Operational</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100 dark:bg-slate-700" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Artifact Storage</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Degraded Performance</span>
              </div>
              <Progress value={65} className="h-2 bg-slate-100 dark:bg-slate-700" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Authentication</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Operational</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100 dark:bg-slate-700" />
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatDistanceToNow(new Date(Date.now() - 300000), { addSuffix: true })}
            </p>
            <Button variant="ghost" size="sm" className="ml-auto">
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
