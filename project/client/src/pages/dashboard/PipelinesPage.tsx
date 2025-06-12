import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Plus, 
  Search, 
  Filter,
  GitBranch,
  Clock,
  ArrowUpDown,
  Play,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Copy,
  Trash,
  Settings
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import DashboardLayout from '../../components/dashboard/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from '../../components/ui/badge';
import { useWebSocket } from '../../components/dashboard/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// Sample pipelines data
const samplePipelines = [
  {
    id: '1',
    name: 'Frontend CI',
    description: 'CI pipeline for frontend applications',
    projectId: '1',
    projectName: 'Frontend App',
    active: true,
    triggers: ['push', 'pull_request'],
    branches: ['main', 'develop', 'feature/*'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Lint', type: 'script', order: 3 },
      { id: 'step-4', name: 'Test', type: 'script', order: 4 },
      { id: 'step-5', name: 'Build', type: 'script', order: 5 }
    ],
    lastRun: {
      id: 'run-1',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      duration: 145000 // 2m 25s
    },
    createdAt: new Date(Date.now() - 2592000000) // 30 days ago
  },
  {
    id: '2',
    name: 'Frontend CD',
    description: 'CD pipeline for frontend deployment',
    projectId: '1',
    projectName: 'Frontend App',
    active: true,
    triggers: ['tag'],
    branches: ['main'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Build', type: 'script', order: 3 },
      { id: 'step-4', name: 'Deploy to Staging', type: 'deploy', order: 4 },
      { id: 'step-5', name: 'Integration Tests', type: 'test', order: 5 },
      { id: 'step-6', name: 'Deploy to Production', type: 'deploy', order: 6 }
    ],
    lastRun: {
      id: 'run-2',
      status: 'success',
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      duration: 287000 // 4m 47s
    },
    createdAt: new Date(Date.now() - 2592000000) // 30 days ago
  },
  {
    id: '3',
    name: 'API CI',
    description: 'CI pipeline for API service',
    projectId: '2',
    projectName: 'API Service',
    active: true,
    triggers: ['push', 'pull_request'],
    branches: ['main', 'develop', 'feature/*'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Lint', type: 'script', order: 3 },
      { id: 'step-4', name: 'Unit Tests', type: 'script', order: 4 },
      { id: 'step-5', name: 'Integration Tests', type: 'script', order: 5 },
      { id: 'step-6', name: 'Build', type: 'script', order: 6 }
    ],
    lastRun: {
      id: 'run-3',
      status: 'running',
      startedAt: new Date(Date.now() - 300000), // 5 minutes ago
      duration: 300000 // 5m (ongoing)
    },
    createdAt: new Date(Date.now() - 1296000000) // 15 days ago
  },
  {
    id: '4',
    name: 'API CD',
    description: 'CD pipeline for API service deployment',
    projectId: '2',
    projectName: 'API Service',
    active: true,
    triggers: ['tag'],
    branches: ['main'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Build', type: 'script', order: 3 },
      { id: 'step-4', name: 'Deploy to Kubernetes', type: 'deploy', order: 4 },
      { id: 'step-5', name: 'Smoke Tests', type: 'test', order: 5 }
    ],
    lastRun: {
      id: 'run-4',
      status: 'failed',
      startedAt: new Date(Date.now() - 172800000), // 2 days ago
      duration: 134000 // 2m 14s
    },
    createdAt: new Date(Date.now() - 1296000000) // 15 days ago
  },
  {
    id: '5',
    name: 'Backend CI',
    description: 'CI pipeline for backend service',
    projectId: '3',
    projectName: 'Backend Service',
    active: true,
    triggers: ['push', 'pull_request'],
    branches: ['main', 'develop', 'feature/*', 'bugfix/*'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Lint', type: 'script', order: 3 },
      { id: 'step-4', name: 'Unit Tests', type: 'script', order: 4 },
      { id: 'step-5', name: 'Build', type: 'script', order: 5 }
    ],
    lastRun: {
      id: 'run-5',
      status: 'success',
      startedAt: new Date(Date.now() - 43200000), // 12 hours ago
      duration: 197000 // 3m 17s
    },
    createdAt: new Date(Date.now() - 864000000) // 10 days ago
  },
  {
    id: '6',
    name: 'Mobile CI',
    description: 'CI pipeline for mobile applications',
    projectId: '6',
    projectName: 'Mobile App Backend',
    active: false,
    triggers: ['push', 'pull_request'],
    branches: ['main', 'develop'],
    steps: [
      { id: 'step-1', name: 'Checkout', type: 'git', order: 1 },
      { id: 'step-2', name: 'Install Dependencies', type: 'script', order: 2 },
      { id: 'step-3', name: 'Lint', type: 'script', order: 3 },
      { id: 'step-4', name: 'Test', type: 'script', order: 4 },
      { id: 'step-5', name: 'Build Android', type: 'script', order: 5 },
      { id: 'step-6', name: 'Build iOS', type: 'script', order: 6 }
    ],
    lastRun: null,
    createdAt: new Date(Date.now() - 432000000) // 5 days ago
  }
];

// Format duration in milliseconds to human readable format
const formatDuration = (ms: number): string => {
  if (!ms) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};

export default function PipelinesPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { socket } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Listen for real-time pipeline updates
  useEffect(() => {
    if (!socket) return;

    const handlePipelineUpdate = (pipeline: any) => {
      console.log('Pipeline update received:', pipeline);
      // In a real app, this would update the query cache or trigger a refetch
    };

    socket.on('pipeline:update', handlePipelineUpdate);

    return () => {
      socket.off('pipeline:update', handlePipelineUpdate);
    };
  }, [socket]);

  // Fetch pipelines
  const { data: pipelines = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/pipelines'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return samplePipelines;
    },
    enabled: !!token
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Get unique projects for filtering
  const projects = [...new Set(pipelines.map(pipeline => pipeline.projectName))];

  // Filter pipelines based on search term and filters
  const filteredPipelines = pipelines.filter(pipeline => {
    const matchesSearch = 
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pipeline.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = activeFilter === null || pipeline.active === activeFilter;
    const matchesProject = projectFilter === 'all' || pipeline.projectName === projectFilter;
    
    return matchesSearch && matchesActive && matchesProject;
  });

  // Further filter based on tab
  const tabFilteredPipelines = filteredPipelines.filter(pipeline => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ci') return pipeline.name.toLowerCase().includes('ci');
    if (activeTab === 'cd') return pipeline.name.toLowerCase().includes('cd');
    return true;
  });

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Pipelines
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage and configure your CI/CD pipelines
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search pipelines..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {activeFilter === null ? 'All Status' : activeFilter ? 'Active' : 'Inactive'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setActiveFilter(null)}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter(true)}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter(false)}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {projectFilter === 'all' ? 'All Projects' : projectFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setProjectFilter('all')}>
                All Projects
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
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button size="sm" onClick={() => setLocation('/dashboard/pipelines/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Pipelines</TabsTrigger>
          <TabsTrigger value="ci">CI Pipelines</TabsTrigger>
          <TabsTrigger value="cd">CD Pipelines</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Pipelines Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : tabFilteredPipelines.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No pipelines found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Try adjusting your search or filter criteria
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setActiveFilter(null);
              setProjectFilter('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabFilteredPipelines.map((pipeline) => (
                  <TableRow 
                    key={pipeline.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setLocation(`/dashboard/pipelines/${pipeline.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-slate-900 dark:text-white font-medium">{pipeline.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{pipeline.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-2"></div>
                        {pipeline.projectName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pipeline.triggers.map((trigger, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pipeline.lastRun ? (
                        <div>
                          <div className="text-sm">
                            {formatDistanceToNow(pipeline.lastRun.startedAt, { addSuffix: true })}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Duration: {formatDuration(pipeline.lastRun.duration)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Never run</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pipeline.active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 dark:text-slate-400">
                          Inactive
                        </Badge>
                      )}
                      {pipeline.lastRun?.status && (
                        <div className="mt-1">
                          <Badge className={`
                            ${pipeline.lastRun.status === 'success' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : pipeline.lastRun.status === 'running'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            } hover:bg-opacity-100
                          `}>
                            {pipeline.lastRun.status === 'success' && 'Success'}
                            {pipeline.lastRun.status === 'running' && 'Running'}
                            {pipeline.lastRun.status === 'failed' && 'Failed'}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/dashboard/pipelines/${pipeline.id}/edit`);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // Duplicate pipeline logic
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/dashboard/pipelines/${pipeline.id}/settings`);
                          }}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Run pipeline logic
                            }}
                            disabled={!pipeline.active}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Run Pipeline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete pipeline logic
                            }}
                            className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
