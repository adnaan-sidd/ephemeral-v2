import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Menu,
  ChevronDown,
  Moon,
  Sun,
  Github,
  Plus,
  Settings,
  LogOut,
  HelpCircle,
  MessageSquare,
  Package,
  Code,
  User
} from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import NotificationsCenter from '@/components/dashboard/notifications/NotificationsCenter';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isConnected: boolean;
}

export default function Header({ sidebarOpen, toggleSidebar, isConnected }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  // After mounting, we can safely show the theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLogout = () => {
    logout();
    setLocation('/');
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };
  
  return (
    <header className="fixed top-0 right-0 z-20 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Mobile menu button and breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          {/* Breadcrumb Navigation */}
          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>

        {/* Center - Search Bar (only on larger screens) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects, builds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </form>
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className="hidden md:flex items-center space-x-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-red-500"
            )} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setLocation('/dashboard/projects/new')}>
                <Package className="h-4 w-4 mr-2" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/dashboard/pipelines/new')}>
                <Code className="h-4 w-4 mr-2" />
                New Pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <NotificationsCenter />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="hidden md:flex"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="h-3 w-3 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/dashboard/settings')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
