import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Clipboard, Pause, Play, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface LiveLogViewerProps {
  buildId: string;
  initialLogs?: string;
  status?: 'running' | 'success' | 'failed' | 'queued' | 'canceled';
}

export default function LiveLogViewer({ buildId, initialLogs = '', status = 'running' }: LiveLogViewerProps) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [logs, setLogs] = useState(initialLogs);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isLiveRef = useRef(status === 'running');

  // Filter logs by type (errors, warnings, etc.)
  const filterLogs = (logText: string) => {
    if (filterLevel === 'all') return logText;
    
    const lines = logText.split('\n');
    const filteredLines = lines.filter(line => {
      if (filterLevel === 'error' && (line.includes('ERROR') || line.includes('error:'))) {
        return true;
      }
      if (filterLevel === 'warning' && (line.includes('WARN') || line.includes('warning:'))) {
        return true;
      }
      if (filterLevel === 'info' && line.includes('INFO')) {
        return true;
      }
      return false;
    });
    
    return filteredLines.join('\n');
  };

  // Handle auto-scrolling
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Subscribe to log updates for this build
  useEffect(() => {
    if (!isConnected || !buildId) return;

    const handleLogUpdate = (data: { buildId: string, logs: string }) => {
      if (data.buildId === buildId) {
        setLogs(prev => prev + data.logs);
      }
    };

    const handleBuildStatusChange = (data: { buildId: string, status: string }) => {
      if (data.buildId === buildId && data.status !== 'running') {
        isLiveRef.current = false;
      }
    };

    // Subscribe to log updates and build status changes
    subscribe('build:logs', handleLogUpdate);
    subscribe('build:status', handleBuildStatusChange);

    return () => {
      unsubscribe('build:logs', handleLogUpdate);
      unsubscribe('build:status', handleBuildStatusChange);
    };
  }, [buildId, subscribe, unsubscribe, isConnected]);

  // Handle copy logs to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs).then(() => {
      toast({
        title: 'Copied!',
        description: 'Build logs copied to clipboard',
      });
    });
  };

  // Handle download logs
  const downloadLogs = () => {
    const element = document.createElement('a');
    const file = new Blob([logs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `build-${buildId}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Format logs for display
  const formatLogs = (logText: string) => {
    return logText.split('\n').map((line, i) => {
      // Apply syntax highlighting for different log levels
      let className = 'text-slate-300';
      
      if (line.includes('ERROR') || line.includes('error:')) {
        className = 'text-red-400';
      } else if (line.includes('WARN') || line.includes('warning:')) {
        className = 'text-yellow-400';
      } else if (line.includes('INFO')) {
        className = 'text-blue-400';
      } else if (line.includes('SUCCESS')) {
        className = 'text-green-400';
      }
      
      return (
        <div key={i} className={className}>
          {line || ' '}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full rounded-lg border bg-slate-950 text-slate-50 border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 p-3">
        <div className="flex items-center">
          <h3 className="text-sm font-medium">Build Logs</h3>
          {isLiveRef.current && isConnected && (
            <Badge variant="outline" className="ml-2 bg-green-900/20 text-green-400 border-green-800">
              Live
            </Badge>
          )}
          {!isConnected && isLiveRef.current && (
            <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-800">
              Disconnected
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-slate-50">
                <Filter size={14} className="mr-1" />
                Filter
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterLevel('all')} className={filterLevel === 'all' ? 'bg-slate-800' : ''}>
                All logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('error')} className={filterLevel === 'error' ? 'bg-slate-800' : ''}>
                Errors only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('warning')} className={filterLevel === 'warning' ? 'bg-slate-800' : ''}>
                Warnings only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('info')} className={filterLevel === 'info' ? 'bg-slate-800' : ''}>
                Info only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 hover:text-slate-50"
            title={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? <Pause size={14} /> : <Play size={14} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 hover:text-slate-50"
            title="Copy logs"
            onClick={copyToClipboard}
          >
            <Clipboard size={14} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 hover:text-slate-50"
            title="Download logs"
            onClick={downloadLogs}
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-slate-900 border-b border-slate-800 rounded-none p-0">
          <TabsTrigger 
            value="all" 
            className={cn(
              "rounded-none text-xs py-2 px-4 data-[state=active]:bg-slate-950",
              "data-[state=active]:shadow-none border-r border-slate-800"
            )}
          >
            All Logs
          </TabsTrigger>
          <TabsTrigger 
            value="steps" 
            className={cn(
              "rounded-none text-xs py-2 px-4 data-[state=active]:bg-slate-950",
              "data-[state=active]:shadow-none"
            )}
          >
            Steps
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 p-0 m-0 overflow-hidden">
          <div 
            ref={logContainerRef} 
            className="h-full overflow-auto p-4 font-mono text-xs whitespace-pre"
          >
            {logs ? formatLogs(filterLogs(logs)) : (
              <div className="text-slate-500">No logs available yet...</div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="steps" className="flex-1 p-0 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            {logs ? (
              <div className="space-y-4">
                {/* Extract and display build steps */}
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="flex items-center">
                    <Badge className="bg-green-600 hover:bg-green-600">Success</Badge>
                    <span className="ml-2 font-medium">Clone repository</span>
                    <span className="ml-auto text-xs text-slate-500">2.3s</span>
                  </div>
                </div>
                
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="flex items-center">
                    <Badge className="bg-green-600 hover:bg-green-600">Success</Badge>
                    <span className="ml-2 font-medium">Install dependencies</span>
                    <span className="ml-auto text-xs text-slate-500">35.7s</span>
                  </div>
                </div>
                
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="flex items-center">
                    <Badge className="bg-amber-600 hover:bg-amber-600">Running</Badge>
                    <span className="ml-2 font-medium">Run tests</span>
                    <span className="ml-auto text-xs text-slate-500">In progress</span>
                  </div>
                </div>
                
                <div className="rounded bg-slate-900 p-3 border border-slate-800">
                  <div className="flex items-center">
                    <Badge className="bg-slate-600 hover:bg-slate-600">Pending</Badge>
                    <span className="ml-2 font-medium">Build application</span>
                    <span className="ml-auto text-xs text-slate-500">--</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500">No steps available yet...</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
