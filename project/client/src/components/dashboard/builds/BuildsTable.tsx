import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Filter, X, Search, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { cn } from '../../../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { ScrollArea } from '../../ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';

interface Build {
  id: string;
  projectId: string;
  projectName: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  duration: number;
  startedAt: Date;
  finishedAt: Date | null;
}

interface BuildsTableProps {
  builds: Build[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function BuildsTable({ builds, isLoading = false, onRefresh }: BuildsTableProps) {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Apply filters to builds
  const filteredBuilds = builds.filter(build => {
    // Apply status filter
    if (statusFilter.length > 0 && !statusFilter.includes(build.status)) {
      return false;
    }
    
    // Apply project filter
    if (projectFilter && build.projectName.toLowerCase() !== projectFilter.toLowerCase()) {
      return false;
    }
    
    // Apply branch filter
    if (branchFilter && build.branch.toLowerCase() !== branchFilter.toLowerCase()) {
      return false;
    }
    
    // Apply author filter
    if (authorFilter && build.author.toLowerCase() !== authorFilter.toLowerCase()) {
      return false;
    }
    
    // Apply search query (across multiple fields)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        build.projectName.toLowerCase().includes(query) ||
        build.branch.toLowerCase().includes(query) ||
        build.commitMessage.toLowerCase().includes(query) ||
        build.author.toLowerCase().includes(query) ||
        build.commitSha.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Function to clear all filters
  const clearFilters = () => {
    setStatusFilter([]);
    setProjectFilter('');
    setBranchFilter('');
    setDateRange('all');
    setAuthorFilter('');
    setSearchQuery('');
  };
  
  // Format duration nicely
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Get unique values for filters
  const projects = [...new Set(builds.map(build => build.projectName))];
  const branches = [...new Set(builds.map(build => build.branch))];
  const authors = [...new Set(builds.map(build => build.author))];
  
  // Handle status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50';
      case 'queued':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50';
      case 'cancelled':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700';
    }
  };

  // Status Badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const isRunning = status === 'running';
    
    return (
      <Badge 
        className={cn(
          getStatusBadgeStyle(status),
          "flex items-center gap-1 font-medium"
        )}
      >
        {isRunning && (
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse mr-1"></span>
        )}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-4 px-6 flex-row justify-between">
        <CardTitle className="text-xl">Builds</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'list' | 'grid')}>
            <ToggleGroupItem value="list" aria-label="List view" className="px-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view" className="px-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 15C14 14.4477 14.4477 14 15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search builds..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter size={14} className="mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2 min-w-[180px]">
                <div className="space-y-2">
                  {['queued', 'running', 'success', 'failed', 'cancelled'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status}`} 
                        checked={statusFilter.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setStatusFilter([...statusFilter, status]);
                          } else {
                            setStatusFilter(statusFilter.filter(s => s !== status));
                          }
                        }}
                      />
                      <Label htmlFor={`status-${status}`} className="cursor-pointer flex items-center gap-1.5">
                        <StatusBadge status={status} />
                      </Label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(statusFilter.length > 0 || projectFilter || branchFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10"
                onClick={clearFilters}
              >
                <X size={14} className="mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Builds Table */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block p-4">
              <RefreshCw size={40} className="animate-spin text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-4">Loading builds...</p>
          </div>
        ) : filteredBuilds.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">No builds match your filter criteria.</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project / Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBuilds.map((build, index) => (
                  <motion.tr 
                    key={build.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/dashboard/builds/${build.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={build.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {build.projectName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {build.branch}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
                        {build.commitMessage}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {build.commitSha.substring(0, 7)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {build.status === 'queued' ? 'Queued' : formatDuration(build.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(build.startedAt, { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {build.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/dashboard/builds/${build.id}`);
                          }}
                        >
                          <ExternalLink size={14} />
                        </Button>
                        {build.status === 'success' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle artifact download
                            }}
                          >
                            <Download size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredBuilds.map((build, index) => (
              <motion.div
                key={build.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="cursor-pointer"
                onClick={() => setLocation(`/dashboard/builds/${build.id}`)}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={build.status} />
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(build.startedAt, { addSuffix: true })}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {build.projectName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{build.branch}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span className="font-mono">{build.commitSha.substring(0, 7)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {build.commitMessage}
                      </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {build.author}
                      </div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {build.status === 'queued' ? 'Queued' : formatDuration(build.duration)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
