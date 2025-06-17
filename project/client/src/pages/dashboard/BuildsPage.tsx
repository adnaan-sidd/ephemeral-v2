import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import BuildsTable from '@/components/dashboard/builds/BuildsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function BuildsPage() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample builds data - replace with real API call
  const sampleBuilds = [
    {
      id: '1',
      projectId: '1',
      projectName: 'my-awesome-app',
      status: 'success' as const,
      branch: 'main',
      commitSha: 'abc123ef',
      commitMessage: 'Add new feature',
      author: 'john@example.com',
      duration: 120000,
      startedAt: new Date(Date.now() - 3600000),
      finishedAt: new Date(Date.now() - 3480000),
    },
    {
      id: '2',
      projectId: '1',
      projectName: 'my-awesome-app',
      status: 'failed' as const,
      branch: 'feature/auth',
      commitSha: 'def456gh',
      commitMessage: 'Fix authentication bug',
      author: 'jane@example.com',
      duration: 45000,
      startedAt: new Date(Date.now() - 7200000),
      finishedAt: new Date(Date.now() - 7155000),
    },
    {
      id: '3',
      projectId: '2',
      projectName: 'api-service',
      status: 'running' as const,
      branch: 'main',
      commitSha: 'ghi789jk',
      commitMessage: 'Update dependencies',
      author: 'bob@example.com',
      duration: 0,
      startedAt: new Date(Date.now() - 300000),
      finishedAt: null,
    }
  ];

  const { data: builds = sampleBuilds, isLoading } = useQuery({
    queryKey: ['/api/builds'],
    queryFn: async () => {
      const response = await fetch('/api/builds', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch builds');
      return response.json();
    },
    enabled: !!token
  });

  const filteredBuilds = builds.filter(build => {
    const matchesStatus = statusFilter === 'all' || build.status === statusFilter;
    const matchesSearch = !searchQuery || 
      build.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: builds.length,
    success: builds.filter(b => b.status === 'success').length,
    failed: builds.filter(b => b.status === 'failed').length,
    running: builds.filter(b => b.status === 'running').length,
    queued: builds.filter(b => b.status === 'queued').length,
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Builds</h1>
              <p className="text-slate-600 dark:text-slate-400">
                View and manage all builds across your projects.
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="flex items-center gap-2"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </Button>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search builds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </motion.div>

        {/* Builds Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BuildsTable 
            builds={filteredBuilds} 
            isLoading={isLoading} 
            onRefresh={() => {}}
            showFilters={false}
            onBuildClick={(buildId) => setLocation(`/dashboard/builds/${buildId}`)}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
