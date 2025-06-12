import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Trash2, 
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function NotificationsCenter() {
  const { 
    notifications, 
    clearAllNotifications, 
    markAllAsRead, 
    markAsRead, 
    removeNotification 
  } = useNotificationsStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'builds') return notification.type.startsWith('build_');
    if (activeTab === 'system') return notification.type === 'system';
    return true;
  });

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'build_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'build_failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'build_started':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs" 
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={clearAllNotifications}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-2 py-2">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="builds" className="flex-1 text-xs">
                Builds
              </TabsTrigger>
              <TabsTrigger value="system" className="flex-1 text-xs">
                System
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="h-[300px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <Bell className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No notifications to display</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0",
                      !notification.read && "bg-slate-50 dark:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer h-9 justify-center text-sm text-blue-600 dark:text-blue-400">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
