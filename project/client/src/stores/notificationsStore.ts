import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: string; // 'build_success', 'build_failed', 'system', etc.
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (notification) => set((state) => {
        // Prevent duplicate notifications (same type and message within 5 seconds)
        const isDuplicate = state.notifications.some(
          n => n.type === notification.type && 
               n.message === notification.message &&
               (new Date().getTime() - new Date(n.timestamp).getTime()) < 5000
        );
        
        if (isDuplicate) return state;
        
        return {
          notifications: [notification, ...state.notifications].slice(0, 50) // Keep only the latest 50
        };
      }),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      clearAllNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'flowforge-notifications',
      partialize: (state) => ({ 
        notifications: state.notifications
      })
    }
  )
);
