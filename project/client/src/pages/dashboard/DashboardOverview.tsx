import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  Package, 
  TrendingUp,
  AlertCircle,
  Zap,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/dashboard/common/StatsCard";
import DashboardChart from "@/components/dashboard/common/DashboardChart";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalBuilds: number;
  successRate: number;
  buildMinutesUsed: number;
  buildMinutesLimit: number;
  activeProjects: number;
  avgBuildTime: number;
}

interface RecentBuild {
  id: string;
  projectName: string;
  status: 'success' | 'failed' | 'running' | 'queued';
  branch: string;
  duration: number;
  startedAt: string;
  commitMessage: string;
}

export default function DashboardOverview() {
  const { user, token } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json() as DashboardStats;
    },
    enabled: !!token
  });

  const { data: recentBuilds, isLoading: buildsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-builds'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-builds?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch recent builds');
      return response.json() as RecentBuild[];
    },
    enabled: !!token
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['/api/dashboard/build-activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/build-activity?days=30', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch build activity');
      return response.json();
    },
    enabled: !!token
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { color: 'bg-emerald-500', text: 'Success' },
      failed: { color: 'bg-red-500', text: 'Failed' },
      running: { color: 'bg-blue-500', text: 'Running' },
      queued: { color: 'bg-amber-500', text: 'Queued' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || 'Developer'}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Here's an overview of your CI/CD pipeline activity.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Total Builds"
          value={stats?.totalBuilds || 0}
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          trend={"+12%"}
          trendDirection="up"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          trend={"+2.5%"}
          trendDirection="up"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Build Minutes"
          value={`${stats?.buildMinutesUsed || 0}/${stats?.buildMinutesLimit || 0}`}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          trend={`${Math.round(((stats?.buildMinutesUsed || 0) / (stats?.buildMinutesLimit || 1)) * 100)}% used`}
          trendDirection="neutral"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={<Package className="h-5 w-5 text-violet-500" />}
          trend="+3 this month"
          trendDirection="up"
          isLoading={statsLoading}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Build Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Build Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardChart 
                data={chartData || []} 
                dataKeys={[
                  { key: 'builds', name: 'Builds', color: '#3B82F6' },
                  { key: 'successes', name: 'Successful', color: '#10B981' },
                  { key: 'failures', name: 'Failed', color: '#EF4444' }
                ]}
                type="line"
                xAxisKey="date"
                isLoading={chartLoading}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Builds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Recent Builds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {buildsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  ))
                ) : recentBuilds?.length ? (
                  recentBuilds.map((build) => (
                    <div key={build.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(build.status)}
                        <div>
                          <p className="font-medium text-sm">{build.projectName}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-48">
                            {build.commitMessage}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDistanceToNow(new Date(build.startedAt), { addSuffix: true })}
                        </p>
                        {build.duration > 0 && (
                          <p className="text-xs text-slate-500">
                            {Math.round(build.duration / 1000)}s
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent builds found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Status & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* System Status */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Build Runners</span>
                <Badge className="bg-emerald-500 text-white">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge className="bg-emerald-500 text-white">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhook Delivery</span>
                <Badge className="bg-emerald-500 text-white">Operational</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Package className="h-6 w-6 text-blue-500 mb-2" />
                <h3 className="font-medium">New Project</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect a repository
                </p>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Zap className="h-6 w-6 text-amber-500 mb-2" />
                <h3 className="font-medium">Trigger Build</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Run a new build
                </p>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
