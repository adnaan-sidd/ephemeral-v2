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

// Helper to create breadcrumb from location
const getBreadcrumb = (location: string) => {
  const parts = location.split('/').filter(Boolean);
  
  // If we're at the root dashboard
  if (parts.length === 1 && parts[0] === 'dashboard') {
    return [{ label: 'Dashboard', path: '/dashboard' }];
  }
  
  return parts.map((part, index) => {
    // Replace IDs with more descriptive labels (this would be improved with actual data)
    const label = part.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      ? 'Detail'
      : part.charAt(0).toUpperCase() + part.slice(1);
    
    // Create the path up to this point
    const path = '/' + parts.slice(0, index + 1).join('/');
    
    return { label, path };
  });
};

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isConnected: boolean;
}

export default function Header({ sidebarOpen, toggleSidebar, isConnected }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  
  // Breadcrumb for navigation
  const breadcrumb = getBreadcrumb(location);
  
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
            className="md:hidden mr-2 p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          {/* Breadcrumb Navigation */}
          <div className="hidden md:block">
            <Breadcrumb />
          </div>
        </div>
            <Menu size={20} />
          </button>
          
          {/* Breadcrumb navigation */}
          <nav className="hidden md:flex items-center space-x-1 text-sm">
            {breadcrumb.map((item, index) => (
              <div key={item.path} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-slate-400 dark:text-slate-600">/</span>
                )}
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation(item.path);
                  }}
                  className={cn(
                    "font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                    index === breadcrumb.length - 1
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {item.label}
                </a>
              </div>
            ))}
          </nav>
        </div>
        
        {/* Center - Search Bar (only on larger screens) */}
        <form 
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-8"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <Input
              type="search"
              placeholder="Search builds, projects, pipelines..."
              className="w-full pl-10 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        {/* Right side - Actions and Profile */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {/* Connection status indicator */}
          <div className="hidden md:flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          
          {/* Quick action button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-700 dark:text-slate-300">
                <Plus size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/dashboard/projects/new')}>
                <Package className="mr-2 h-4 w-4" />
                <span>Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/dashboard/pipelines/new')}>
                <Code className="mr-2 h-4 w-4" />
                <span>Pipeline</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>API Key</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Notifications */}
          <NotificationsCenter />uContent>
          </DropdownMenu>
          
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-slate-700 dark:text-slate-300"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          )}
          
          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-9 px-2">
                <div className="relative">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`}
                    alt={user?.email || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="font-medium text-sm">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'user@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('https://docs.flowforge.dev', '_blank')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Documentation</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('https://discord.gg/flowforge', '_blank')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Discord Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
