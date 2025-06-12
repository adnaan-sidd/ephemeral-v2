import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Settings, 
  Package, 
  Zap, 
  Code, 
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  CreditCard,
  Gauge,
  Plus
} from 'lucide-react';
import { FlowForgeLogo } from '../../ui/logo';
import { useAuth } from '../../../lib/auth';
import { useTheme } from 'next-themes';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ open, toggleSidebar }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: <Gauge size={20} />, 
      path: '/dashboard',
      active: location === '/dashboard'
    },
    { 
      name: 'Projects', 
      icon: <Package size={20} />, 
      path: '/dashboard/projects',
      active: location.startsWith('/dashboard/projects')
    },
    { 
      name: 'Builds', 
      icon: <Zap size={20} />, 
      path: '/dashboard/builds',
      active: location.startsWith('/dashboard/builds')
    },
    { 
      name: 'Pipelines', 
      icon: <Code size={20} />, 
      path: '/dashboard/pipelines',
      active: location.startsWith('/dashboard/pipelines')
    },
    { 
      name: 'Analytics', 
      icon: <BarChart size={20} />, 
      path: '/dashboard/analytics',
      active: location.startsWith('/dashboard/analytics')
    },
    { 
      name: 'Billing', 
      icon: <CreditCard size={20} />, 
      path: '/dashboard/billing',
      active: location.startsWith('/dashboard/billing')
    },
    { 
      name: 'Notifications', 
      icon: <Bell size={20} />, 
      path: '/dashboard/notifications',
      active: location.startsWith('/dashboard/notifications')
    },
    { 
      name: 'Settings', 
      icon: <Settings size={20} />, 
      path: '/dashboard/settings',
      active: location.startsWith('/dashboard/settings')
    },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/');
  };
  
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? 240 : 80 }}
      className={cn(
        "fixed top-0 left-0 z-30 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
        "flex flex-col"
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex-1 flex items-center">
          <FlowForgeLogo variant={theme === 'dark' ? 'white' : 'default'} />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-2 font-semibold text-xl text-slate-900 dark:text-white"
              >
                FlowForge
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      
      {/* Quick actions */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <Button 
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
          size={open ? "default" : "icon"}
          onClick={() => setLocation('/dashboard/projects/new')}
        >
          <Plus size={16} />
          {open && <span>New Project</span>}
        </Button>
      </div>
      
      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.path);
                }}
                className={cn(
                  "flex items-center py-2 px-3 rounded-lg transition-colors",
                  item.active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className={cn("flex items-center", !open && "justify-center")}>
          <div className="relative">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`}
              alt={user?.email || 'User'}
              className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
          </div>
          
          {open && (
            <div className="ml-3 flex-1 overflow-hidden">
              <div className="font-medium text-slate-900 dark:text-white truncate">
                {user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          )}
          
          {open && (
            <button
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
