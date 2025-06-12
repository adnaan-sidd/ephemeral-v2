import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { GitBranch, Clock, Play, Settings, ArrowUpRight, GitHub, GitLab, Gitlab } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../../ui/card';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  repository: {
    url: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
    fullName: string;
  };
  lastBuild: {
    id: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
    branch: string;
    commitSha: string;
    startedAt: Date;
    duration: number;
  } | null;
  successRate: number;
  totalBuilds: number;
  createdAt: Date;
}

interface ProjectCardProps {
  project: Project;
  onBuildNow?: (projectId: string) => void;
  isLoading?: boolean;
}

export default function ProjectCard({ project, onBuildNow, isLoading = false }: ProjectCardProps) {
  const [, setLocation] = useLocation();
  
  // Get repository provider icon
  const getProviderIcon = () => {
    switch (project.repository.provider) {
      case 'github':
        return <GitHub size={16} />;
      case 'gitlab':
        return <GitLab size={16} />;
      case 'bitbucket':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.89 3.82843C2.48 3.41843 2.68 2.78843 3.23 2.71843C3.48 2.68843 3.73 2.66843 3.99 2.66843H20.01C20.27 2.66843 20.52 2.68843 20.77 2.71843C21.32 2.78843 21.52 3.41843 21.11 3.82843L12.73 12.2084C12.33 12.6084 11.67 12.6084 11.27 12.2084L2.89 3.82843Z" fill="currentColor" />
            <path d="M12 21.3384C11.967 21.3384 11.934 21.337 11.901 21.3344C11.7089 21.3204 11.5294 21.2347 11.39 21.0984L3.82 13.5284C3.65974 13.3681 3.56916 13.1474 3.57 12.9184V5.12843C3.57 4.74843 3.94 4.46843 4.32 4.56843C4.64 4.64843 4.97 4.69843 5.31 4.69843H18.69C19.03 4.69843 19.36 4.64843 19.68 4.56843C20.06 4.46843 20.43 4.74843 20.43 5.12843V12.9184C20.4308 13.1474 20.3403 13.3681 20.18 13.5284L12.61 21.0984C12.4706 21.2347 12.2911 21.3204 12.099 21.3344C12.066 21.337 12.033 21.3384 12 21.3384Z" fill="currentColor" />
            <path d="M16.5 9.03857C16.743 9.03857 16.95 8.83157 16.95 8.58857C16.95 8.34557 16.743 8.13857 16.5 8.13857C16.257 8.13857 16.05 8.34557 16.05 8.58857C16.05 8.83157 16.257 9.03857 16.5 9.03857Z" fill="white" />
            <path d="M7.5 9.03857C7.743 9.03857 7.95 8.83157 7.95 8.58857C7.95 8.34557 7.743 8.13857 7.5 8.13857C7.257 8.13857 7.05 8.34557 7.05 8.58857C7.05 8.83157 7.257 9.03857 7.5 9.03857Z" fill="white" />
            <path d="M12 13.6986C12.9 13.6986 13.65 12.9486 13.65 12.0486C13.65 11.1486 12.9 10.3986 12 10.3986C11.1 10.3986 10.35 11.1486 10.35 12.0486C10.35 12.9486 11.1 13.6986 12 13.6986Z" fill="white" />
            <path d="M12 16.4785C9.5 16.4785 7.5 14.8785 7.5 12.8985V9.17847H16.5V12.8985C16.5 14.8785 14.5 16.4785 12 16.4785Z" fill="white" />
          </svg>
        );
      default:
        return <GitBranch size={16} />;
    }
  };
  
  // Handle status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'queued':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
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

  const handleCardClick = () => {
    setLocation(`/dashboard/projects/${project.id}`);
  };
  
  const handleBuildNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuildNow) {
      onBuildNow(project.id);
    }
  };
  
  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/dashboard/projects/${project.id}/settings`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ y: 0, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card 
        className="h-full border border-slate-200 dark:border-slate-700 hover:shadow-md cursor-pointer transition-all overflow-hidden"
        onClick={handleCardClick}
      >
        {/* Card header with repository info */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-slate-500 dark:text-slate-400">
                {getProviderIcon()}
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]" title={project.name}>
                {project.name}
              </h3>
            </div>
            <div>
              {project.successRate > 0 && (
                <div 
                  className={cn(
                    "text-xs font-medium rounded-full px-2 py-0.5",
                    project.successRate >= 90 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : project.successRate >= 70 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {project.successRate}% success
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1" title={project.repository.fullName}>
            {project.repository.fullName}
          </div>
        </div>
        
        {/* Card content with last build info */}
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
            </div>
          ) : project.lastBuild ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={project.lastBuild.status} />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(project.lastBuild.startedAt, { addSuffix: true })}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <GitBranch size={14} className="text-slate-400" />
                <span>{project.lastBuild.branch}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="font-mono text-xs">{project.lastBuild.commitSha.substring(0, 7)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Clock size={14} className="text-slate-400" />
                <span>
                  {project.lastBuild.duration 
                    ? `${Math.floor(project.lastBuild.duration / 60)}m ${project.lastBuild.duration % 60}s` 
                    : 'In progress...'
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
              <p>No builds yet</p>
              <p className="text-xs mt-1">Click "Build Now" to start your first build</p>
            </div>
          )}
        </CardContent>
        
        {/* Card footer with actions */}
        <CardFooter className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {project.totalBuilds} build{project.totalBuilds !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-700 dark:text-slate-300"
              onClick={handleSettings}
            >
              <Settings size={14} />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleBuildNow}
            >
              <Play size={14} className="mr-1" />
              Build Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
