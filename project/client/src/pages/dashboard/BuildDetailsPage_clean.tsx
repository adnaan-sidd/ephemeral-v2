import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Clock, GitBranch, User, Calendar, Play, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BuildDetailsPage() {
  const [, params] = useRoute('/dashboard/builds/:id');
  const [, setLocation] = useLocation();
  const buildId = params?.id;

  // Mock build data - this would come from API
  const build = {
    id: buildId || '1',
    status: 'success' as const,
    projectName: 'my-awesome-app',
    branch: 'main',
    commitSha: 'a1b2c3d',
    commitMessage: 'Fix authentication flow and improve UI',
    author: 'John Doe',
    duration: 125000, // milliseconds
    startedAt: new Date(Date.now() - 3600000),
    finishedAt: new Date(Date.now() - 3475000),
    steps: [
      { name: 'Setup', status: 'success', duration: 15000 },
      { name: 'Install Dependencies', status: 'success', duration: 45000 },
      { name: 'Run Tests', status: 'success', duration: 30000 },
      { name: 'Build', status: 'success', duration: 25000 },
      { name: 'Deploy', status: 'success', duration: 10000 }
    ]
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { color: 'bg-emerald-500', text: 'Success' },
      failed: { color: 'bg-red-500', text: 'Failed' },
      running: { color: 'bg-blue-500', text: 'Running' },
      queued: { color: 'bg-amber-500', text: 'Queued' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.queued;
    
    return (
      <Badge className={`${statusConfig.color} text-white`}>
        {statusConfig.text}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/dashboard/builds')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Builds
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Build #{build.id}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {build.projectName} • {build.commitMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(build.status)}
          </div>
        </motion.div>

        {/* Build Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">Branch</span>
              </div>
              <p className="text-lg font-semibold mt-1">{build.branch}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">Author</span>
              </div>
              <p className="text-lg font-semibold mt-1">{build.author}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-lg font-semibold mt-1">{formatDuration(build.duration)}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">Started</span>
              </div>
              <p className="text-lg font-semibold mt-1">
                {build.startedAt.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Build Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="steps" className="space-y-4">
            <TabsList>
              <TabsTrigger value="steps">Build Steps</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="space-y-4">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Pipeline Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {build.steps.map((step, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                          {step.status === 'success' ? (
                            <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                          ) : (
                            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                          )}
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDuration(step.duration)}
                          </span>
                          {getStatusBadge(step.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Build Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                    <div className="space-y-1">
                      <div>$ npm install</div>
                      <div className="text-slate-400">Installing dependencies...</div>
                      <div>✓ Dependencies installed successfully</div>
                      <div>$ npm test</div>
                      <div className="text-slate-400">Running test suite...</div>
                      <div>✓ All tests passed</div>
                      <div>$ npm run build</div>
                      <div className="text-slate-400">Building for production...</div>
                      <div>✓ Build completed successfully</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="artifacts" className="space-y-4">
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Build Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>No artifacts available for this build.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
