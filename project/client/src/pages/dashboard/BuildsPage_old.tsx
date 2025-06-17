import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import DashboardLayout from '../../components/dashboard/layout/DashboardLayout';
import BuildsTable from '../../components/dashboard/builds/BuildsTable';
import RealtimeBuildUpdater from '../../components/dashboard/builds/RealtimeBuildUpdater';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useWebSocket } from '../../components/dashboard/layout/DashboardLayout';

// Sample builds data (same as in DashboardPage)
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
  },
  {
    id: '6',
    projectId: '1',
    projectName: 'Frontend App',
    status: 'success',
    branch: 'feature/dark-mode',
    commitSha: 'f6g7h8i9j0k1l2m3n4o5',
    commitMessage: 'Implement dark mode toggle',
    author: 'Sarah Chen',
    duration: 112000, // 1m 52s
    startedAt: new Date(Date.now() - 86400000), // 1 day ago
    finishedAt: new Date(Date.now() - 86288000) // 23 hours 58 minutes ago
  },
  {
    id: '7',
    projectId: '3',
    projectName: 'Backend Service',
    status: 'canceled',
    branch: 'feature/caching',
    commitSha: 'g7h8i9j0k1l2m3n4o5p6',
    commitMessage: 'Add Redis caching layer',
    author: 'Mike Johnson',
    duration: 32000, // 32s
    startedAt: new Date(Date.now() - 43200000), // 12 hours ago
    finishedAt: new Date(Date.now() - 43168000) // 11 hours 59 minutes ago
  },
  {
    id: '8',
    projectId: '4',
    projectName: 'Data Processor',
    status: 'success',
    branch: 'develop',
    commitSha: 'h8i9j0k1l2m3n4o5p6q7',
    commitMessage: 'Optimize batch processing algorithm',
    author: 'Alex Williams',
    duration: 295000, // 4m 55s
    startedAt: new Date(Date.now() - 172800000), // 2 days ago
    finishedAt: new Date(Date.now() - 172505000) // 1 day 23 hours 55 minutes ago
  }
];

export default function BuildsPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { socket } = useWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Fetch builds
  const { data: builds = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/builds'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleBuilds;
    },
    enabled: !!token
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Get unique projects for filtering
  const projects = [...new Set(builds.map(build => build.projectName))];

  // Filter builds based on filters and search
  const filteredBuilds = builds.filter(build => {
    const matchesStatus = statusFilter === 'all' || build.status === statusFilter;
    const matchesProject = projectFilter === 'all' || build.projectName === projectFilter;
    const matchesSearch = 
      build.commitMessage.toLowerCase().includes(searchTerm.toLowerCase()) || 
      build.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      build.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      build.commitSha.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesProject && matchesSearch;
  });

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Builds
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and manage all builds across your projects
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <Input 
            placeholder="Search builds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-1 items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('success')}>
                Success
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('running')}>
                Running
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                Failed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('queued')}>
                Queued
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('canceled')}>
                Canceled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Project: {projectFilter === 'all' ? 'All' : projectFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setProjectFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.map(project => (
                <DropdownMenuItem key={project} onClick={() => setProjectFilter(project)}>
                  {project}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Builds Table */}
      <BuildsTable 
        builds={filteredBuilds} 
        isLoading={isLoading || isRefreshing} 
        onRefresh={handleRefresh}
        showFilters={false}
        onBuildClick={(buildId) => setLocation(`/dashboard/builds/${buildId}`)}
      />
    </RealtimeBuildUpdater>
    </DashboardLayout>
  );
}

export default BuildsPage;