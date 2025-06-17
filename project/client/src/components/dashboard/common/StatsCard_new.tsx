import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { cn } from '../../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  colorScheme?: 'blue' | 'violet' | 'emerald' | 'amber' | 'red' | 'slate';
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  description,
  icon, 
  trend,
  trendDirection = 'neutral',
  isLoading = false,
  colorScheme = 'blue',
  onClick
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <ArrowUp className="h-3 w-3" />;
      case 'down':
        return <ArrowDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600"
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <div className="text-slate-400">
              {icon}
            </div>
          </div>
          
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {value}
            </div>
            
            {(trend || description) && (
              <div className="mt-2 flex items-center space-x-2">
                {trend && (
                  <div className={cn("flex items-center space-x-1 text-sm", getTrendColor())}>
                    {getTrendIcon()}
                    <span>{trend}</span>
                  </div>
                )}
                {description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
