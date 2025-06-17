import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Plus, 
  Search, 
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWebSocket } from '@/context/WebSocketContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample project data
const sampleProjects = [
  {
    id: '1',
    name: 'Frontend App',
    description: 'React-based frontend application',
    repository: 'https://github.com/organization/frontend-app',
    branch: 'main',
    provider: 'github',
    status: 'active',
    lastBuild: {
      id: '101',
      status: 'success',
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      finishedAt: new Date(Date.now() - 7100000) // 1 hour 58 minutes ago
    }
  },
  {
    id: '2',
    name: 'API Service',
    description: 'RESTful API service for backend operations',
    repository: 'https://github.com/organization/api-service',
    branch: 'main',
    provider: 'github',
    status: 'active',
    lastBuild: {
      id: '102',
      status: 'running',
      startedAt: new Date(Date.now() - 300000), // 5 minutes ago
      finishedAt: null
    }
  },
  {
    id: '3',
    name: 'Backend Service',
    description: 'Core backend service for data processing',
    repository: 'https://gitlab.com/organization/backend-service',
    branch: 'main',
    provider: 'gitlab',
    status: 'active',
    lastBuild: {
      id: '103',
      status: 'failed',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      finishedAt: new Date(Date.now() - 3500000) // 58 minutes ago
    }
  },
  {
    id: '4',
    name: 'Data Processor',
    description: 'Data analysis and processing service',
    repository: 'https://github.com/organization/data-processor',
    branch: 'develop',
    provider: 'github',
    status: 'inactive',
    lastBuild: {
      id: '104',
      status: 'success',
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      finishedAt: new Date(Date.now() - 86300000) // 23 hours 58 minutes ago
    }
  },
  {
    id: '5',
    name: 'Authentication Service',
    description: 'User authentication and authorization service',
    repository: 'https://bitbucket.org/organization/auth-service',
    branch: 'main',
    provider: 'bitbucket',
    status: 'active',
    lastBuild: {
      id: '105',
      status: 'success',
      startedAt: new Date(Date.now() - 14400000), // 4 hours ago
      finishedAt: new Date(Date.now() - 14300000) // 3 hours 58 minutes ago
    }
  },
  {
    id: '6',
    name: 'Mobile App Backend',
    description: 'Backend services for mobile applications',
    repository: 'https://github.com/organization/mobile-backend',
    branch: 'main',
    provider: 'github',
    status: 'active',
    lastBuild: null
  }
];

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { socket } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Listen for real-time project updates
  useEffect(() => {
    if (!socket) return;

    const handleProjectUpdate = (project: any) => {
      console.log('Project update received:', project);
      // In a real app, this would update the query cache or trigger a refetch
    };

    socket.on('project:update', handleProjectUpdate);

    return () => {
      socket.off('project:update', handleProjectUpdate);
    };
  }, [socket]);

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleProjects;
    },
    enabled: !!token
  });

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesProvider = providerFilter === 'all' || project.provider === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Projects
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage and monitor all your CI/CD projects
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')} className={statusFilter === 'active' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')} className={statusFilter === 'inactive' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                Inactive
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Provider</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setProviderFilter('all')} className={providerFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProviderFilter('github')} className={providerFilter === 'github' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProviderFilter('gitlab')} className={providerFilter === 'gitlab' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                GitLab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProviderFilter('bitbucket')} className={providerFilter === 'bitbucket' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                Bitbucket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="border rounded-md flex">
            <Button 
              variant={viewMode === 'grid' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={() => setLocation('/dashboard/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="h-[220px] bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No projects found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Try adjusting your search or filter criteria
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setProviderFilter('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setLocation(`/dashboard/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/dashboard/projects/${project.id}`)}
                >
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">{project.name}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {project.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.description}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{project.repository}</span>
                      <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{project.branch}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    {project.lastBuild ? (
                      <div className={`text-sm ${
                        project.lastBuild.status === 'success' ? 'text-green-600 dark:text-green-400' :
                        project.lastBuild.status === 'running' ? 'text-blue-600 dark:text-blue-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        Last build: {project.lastBuild.status}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        No builds yet
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/dashboard/projects/${project.id}/build`);
                    }}>
                      Run Build
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
