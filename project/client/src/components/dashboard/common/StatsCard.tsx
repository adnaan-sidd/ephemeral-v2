import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { cn } from '../../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  colorScheme?: 'blue' | 'violet' | 'emerald' | 'amber' | 'red' | 'slate';
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  description,
  icon, 
  change, 
  loading = false,
  colorScheme = 'blue',
  onClick
}: StatsCardProps) {
  // Define color schemes
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-800'
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-800'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-800'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-800'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-900/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-100 dark:border-slate-800'
    }
  };
  
  const colors = colorSchemes[colorScheme];
  
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : {}}
      whileTap={onClick ? { y: 0, transition: { duration: 0.2 } } : {}}
      className="h-full"
    >
      <Card 
        className={cn(
          "h-full transition-all border",
          onClick && "cursor-pointer hover:shadow-md"
        )}
        onClick={onClick}
      >
        <CardContent className="pt-6 pb-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className={cn("p-2 rounded-lg", colors.bg)}>
              <div className={colors.text}>{icon}</div>
            </div>
            {change && (
              <div className={cn("flex items-center text-sm font-medium", trendColors[change.trend])}>
                {change.trend === 'up' ? (
                  <ArrowUp size={16} className="mr-1" />
                ) : change.trend === 'down' ? (
                  <ArrowDown size={16} className="mr-1" />
                ) : null}
                {change.value > 0 ? '+' : ''}{change.value}%
              </div>
            )}
          </div>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title}
            </h3>
            {loading ? (
              <div className="mt-1 h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {value}
              </p>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
