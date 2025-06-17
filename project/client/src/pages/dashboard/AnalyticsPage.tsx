import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calendar, 
  Clock, 
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Generate sample data for charts
const generateDailyBuildData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'MMM dd');
    const success = Math.floor(Math.random() * 15) + 5;
    const failed = Math.floor(Math.random() * 5);
    const canceled = Math.floor(Math.random() * 3);
    
    data.push({
      date: formattedDate,
      success,
      failed,
      canceled,
      total: success + failed + canceled
    });
  }
  return data;
};

const generateBuildDurationData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'MMM dd');
    
    data.push({
      date: formattedDate,
      frontend: Math.floor(Math.random() * 240) + 60, // 1-5 mins
      backend: Math.floor(Math.random() * 180) + 120, // 2-5 mins
      mobile: Math.floor(Math.random() * 300) + 180, // 3-8 mins
    });
  }
  return data;
};

const generateComputeUsageData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'MMM dd');
    
    data.push({
      date: formattedDate,
      minutes: Math.floor(Math.random() * 60) + 20, // 20-80 minutes
    });
  }
  return data;
};

const generateSuccessRateData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'MMM dd');
    
    data.push({
      date: formattedDate,
      rate: Math.floor(Math.random() * 15) + 85, // 85-100%
    });
  }
  return data;
};

const generateProjectBreakdownData = () => {
  return [
    { name: 'Frontend App', value: 42 },
    { name: 'API Service', value: 28 },
    { name: 'Backend Service', value: 18 },
    { name: 'Mobile App', value: 12 }
  ];
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md">
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mb-1 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-900 dark:text-white text-sm font-medium mr-2">
              {entry.name}:
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-sm">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
};

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Get data based on time range
  const getDays = () => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  // Queries for chart data
  const { data: buildData, refetch: refetchBuildData } = useQuery({
    queryKey: ['analytics/builds', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateDailyBuildData(getDays());
    },
    enabled: !!token
  });

  const { data: durationData, refetch: refetchDurationData } = useQuery({
    queryKey: ['analytics/duration', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateBuildDurationData(getDays());
    },
    enabled: !!token
  });

  const { data: usageData, refetch: refetchUsageData } = useQuery({
    queryKey: ['analytics/usage', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateComputeUsageData(getDays());
    },
    enabled: !!token
  });

  const { data: successRateData, refetch: refetchSuccessRateData } = useQuery({
    queryKey: ['analytics/success-rate', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateSuccessRateData(getDays());
    },
    enabled: !!token
  });

  const { data: projectBreakdownData } = useQuery({
    queryKey: ['analytics/project-breakdown'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateProjectBreakdownData();
    },
    enabled: !!token
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchBuildData(),
      refetchDurationData(),
      refetchUsageData(),
      refetchSuccessRateData()
    ]);
    setIsRefreshing(false);
  };

  const handleTimeRangeChange = (value: '7d' | '30d' | '90d') => {
    setTimeRange(value);
  };

  if (!user) {
    return null;
  }

  // Colors for charts
  const colors = {
    success: '#22c55e',
    failed: '#ef4444',
    canceled: '#94a3b8',
    frontend: '#3b82f6',
    backend: '#8b5cf6',
    mobile: '#ec4899',
    rate: '#0ea5e9',
    usage: '#f59e0b',
    projects: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#ef4444']
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            CI/CD performance metrics and insights
          </p>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('7d')}
            >
              7 days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('30d')}
            >
              30 days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('90d')}
            >
              90 days
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* Build Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChartIcon className="h-5 w-5 mr-2 text-slate-500" />
                    Build Trends
                  </CardTitle>
                  <CardDescription>
                    Daily build activity for the past {getDays()} days
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={buildData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Bar 
                      dataKey="success" 
                      name="Success" 
                      stackId="a" 
                      fill={colors.success}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="failed" 
                      name="Failed" 
                      stackId="a" 
                      fill={colors.failed}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar 
                      dataKey="canceled" 
                      name="Canceled" 
                      stackId="a" 
                      fill={colors.canceled}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Success Rate Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="h-5 w-5 mr-2 text-slate-500" />
                  Success Rate
                </CardTitle>
                <CardDescription>
                  Daily build success rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={successRateData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        domain={[80, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Success Rate"
                        stroke={colors.rate}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Compute Usage Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-slate-500" />
                  Compute Usage
                </CardTitle>
                <CardDescription>
                  Daily compute minutes consumed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={usageData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => `${value}m`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        name="Compute Minutes"
                        stroke={colors.usage}
                        fill={colors.usage}
                        fillOpacity={0.2}
                        strokeWidth={2}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Build Duration Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-slate-500" />
                  Build Duration
                </CardTitle>
                <CardDescription>
                  Average build duration by project type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={durationData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => `${Math.floor(value / 60)}m ${value % 60}s`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="frontend"
                        name="Frontend"
                        stroke={colors.frontend}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey="backend"
                        name="Backend"
                        stroke={colors.backend}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey="mobile"
                        name="Mobile"
                        stroke={colors.mobile}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Breakdown Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-slate-500" />
                  Project Breakdown
                </CardTitle>
                <CardDescription>
                  Builds by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {projectBreakdownData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors.projects[index % colors.projects.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        iconType="circle" 
                        iconSize={8}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
