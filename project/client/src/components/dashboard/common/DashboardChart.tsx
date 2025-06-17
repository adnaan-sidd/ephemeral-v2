import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

interface DashboardChartProps {
  title?: string;
  description?: string;
  data: any[];
  dataKeys?: {
    key: string;
    name: string;
    color: string;
  }[];
  timeRange?: '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
  type?: 'line' | 'area' | 'bar';
  xAxisKey?: string;
  yAxisFormatter?: (value: number) => string;
  showTimeRangeControls?: boolean;
  height?: number;
  className?: string;
  isLoading?: boolean;
}

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

export default function DashboardChart({
  title,
  description,
  data,
  dataKeys = [],
  timeRange = '30d',
  onTimeRangeChange,
  type = 'line',
  xAxisKey = 'date',
  yAxisFormatter,
  showTimeRangeControls = true,
  height = 300,
  className,
  isLoading = false
}: DashboardChartProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Auto-generate dataKeys if not provided
  const effectiveDataKeys = dataKeys.length > 0 ? dataKeys : 
    data.length > 0 ? Object.keys(data[0])
      .filter(key => key !== xAxisKey && typeof data[0][key] === 'number')
      .map((key, index) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 5]
      })) : [];

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded w-full h-full"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Chart will appear when data is available</p>
        </div>
      </div>
    );
  }
  
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={yAxisFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              align="right" 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            {effectiveDataKeys.map((dataKey, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={dataKey.key}
                name={dataKey.name}
                stroke={dataKey.color}
                strokeWidth={2}
                dot={{ r: 3, fill: dataKey.color, strokeWidth: 1 }}
                activeDot={{ r: 5, fill: dataKey.color, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={yAxisFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              align="right" 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            {effectiveDataKeys.map((dataKey, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={dataKey.key}
                name={dataKey.name}
                stroke={dataKey.color}
                fill={dataKey.color}
                fillOpacity={0.2}
                strokeWidth={2}
                activeDot={{ r: 5, fill: dataKey.color, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={yAxisFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              align="right" 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            {effectiveDataKeys.map((dataKey, index) => (
              <Bar
                key={index}
                dataKey={dataKey.key}
                name={dataKey.name}
                fill={dataKey.color}
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
            ))}
          </BarChart>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription>
                {description}
              </CardDescription>
            )}
          </div>
          
          {showTimeRangeControls && onTimeRangeChange && (
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange('7d')}
              >
                7d
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange('30d')}
              >
                30d
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange('90d')}
              >
                90d
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
