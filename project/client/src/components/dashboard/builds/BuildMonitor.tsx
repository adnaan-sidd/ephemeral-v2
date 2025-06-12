import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/context/WebSocketContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pause, X, AlertTriangle, Clock, CheckCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildMonitorProps {
  buildId: string;
  initialStatus?: BuildStatus;
  onClose?: () => void;
}

export type BuildStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled';

interface BuildStatusUpdate {
  buildId: string;
  status: BuildStatus;
  progress?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
}

export default function BuildMonitor({ buildId, initialStatus = 'queued', onClose }: BuildMonitorProps) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [status, setStatus] = useState<BuildStatus>(initialStatus);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Subscribe to build status updates
  useEffect(() => {
    if (!isConnected || !buildId) return;

    const handleBuildStatusUpdate = (data: BuildStatusUpdate) => {
      if (data.buildId === buildId) {
        setStatus(data.status);
        
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        
        if (data.error) {
          setError(data.error);
        }
        
        if (data.startedAt && status === 'queued') {
          setStartTime(new Date(data.startedAt));
        }
      }
    };

    // Subscribe to build status updates
    subscribe('build:status', handleBuildStatusUpdate);

    return () => {
      unsubscribe('build:status', handleBuildStatusUpdate);
    };
  }, [buildId, subscribe, unsubscribe, isConnected, status]);

  // Update elapsed time ticker
  useEffect(() => {
    if (status !== 'running' || !startTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, startTime]);

  // Format the elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Status color mapping
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-600';
      case 'success': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      case 'canceled': return 'bg-amber-600';
      default: return 'bg-slate-600';
    }
  };

  // Status icon mapping
  const StatusIcon = () => {
    switch (status) {
      case 'running': return <Timer className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'canceled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          className={cn("text-white", getStatusColor())}
          onClick={() => setIsMinimized(false)}
        >
          <StatusIcon />
          <span className="ml-2">Build {status}</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-80 shadow-lg border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <Badge className={cn("mr-2", getStatusColor())}>
                  <StatusIcon />
                  <span className="ml-1 capitalize">{status}</span>
                </Badge>
                <span className="text-sm font-medium">Build #{buildId.slice(0, 8)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsMinimized(true)}
                >
                  <Pause className="h-4 w-4" />
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="p-3">
              {status === 'running' && (
                <>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 mb-3" />
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
                    {!isConnected && (
                      <Badge variant="outline" className="h-5 text-xs bg-red-500/10 text-red-600 border-red-200 dark:border-red-800">
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </>
              )}
              
              {status === 'queued' && (
                <div className="text-center py-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Waiting to start...</span>
                </div>
              )}
              
              {status === 'success' && (
                <div className="text-center py-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">Build completed successfully</span>
                </div>
              )}
              
              {status === 'failed' && (
                <div className="text-center py-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">
                    {error || 'Build failed'}
                  </span>
                </div>
              )}
              
              {status === 'canceled' && (
                <div className="text-center py-2 text-amber-600 dark:text-amber-400">
                  <X className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">Build was canceled</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
