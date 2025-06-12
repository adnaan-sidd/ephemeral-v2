import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface NotificationListenerProps {
  children?: React.ReactNode;
}

export default function NotificationListener({ children }: NotificationListenerProps) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationsStore();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (!isConnected || !user) return;

    // Handle build notifications
    const handleNotification = (notification: any) => {
      // Add to notification store
      addNotification({
        id: crypto.randomUUID(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: new Date(notification.timestamp),
        read: false
      });

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: getToastVariant(notification.type),
      });

      // Indicate new notifications
      setHasNewNotifications(true);
    };

    // Handle system notifications
    const handleSystemNotification = (notification: any) => {
      toast({
        title: 'System Notification',
        description: notification.message,
        variant: getToastVariant(notification.type),
      });
    };

    // Subscribe to notification events
    subscribe('notification', handleNotification);
    subscribe('system', handleSystemNotification);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe('notification', handleNotification);
      unsubscribe('system', handleSystemNotification);
    };
  }, [isConnected, user, addNotification, subscribe, unsubscribe]);

  // Helper to determine toast variant based on notification type
  const getToastVariant = (type: string): 'default' | 'destructive' => {
    switch (type) {
      case 'build_failed':
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Render nothing, this is just a listener component
  return (
    <>
      {children}
      
      {/* Floating notification indicator */}
      <AnimatePresence>
        {hasNewNotifications && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 z-50"
          >
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setHasNewNotifications(false)}
            >
              <Bell className="mr-2 h-4 w-4" />
              <span>New notifications</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
