import React, { useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationsStore } from '@/stores/notificationsStore';

interface RealtimeBuildUpdaterProps {
  projectId?: string;
  children: React.ReactNode;
}

export default function RealtimeBuildUpdater({ projectId, children }: RealtimeBuildUpdaterProps) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationsStore();

  useEffect(() => {
    if (!isConnected) return;

    // Handle build status updates
    const handleBuildUpdate = (buildData: any) => {
      console.log('Build update received:', buildData);
      
      // If we're filtering by project and this update isn't for that project, ignore it
      if (projectId && buildData.projectId !== projectId) return;
      
      // Update the builds list in the cache
      queryClient.setQueryData(['/api/builds'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Check if the build already exists in our cache
        const buildExists = oldData.some((build: any) => build.id === buildData.id);
        
        if (buildExists) {
          // Update the existing build
          return oldData.map((build: any) => 
            build.id === buildData.id ? { ...build, ...buildData } : build
          );
        } else {
          // Add the new build to the list
          return [buildData, ...oldData];
        }
      });
      
      // Also update any query for this specific build
      queryClient.setQueryData([`/api/builds/${buildData.id}`], (oldData: any) => {
        return { ...(oldData || {}), ...buildData };
      });
      
      // Add a notification if the build status changed to completed or failed
      if (buildData.status === 'success') {
        addNotification({
          id: crypto.randomUUID(),
          type: 'build_success',
          title: 'Build Completed Successfully',
          message: `${buildData.projectName} build #${buildData.id} completed in ${formatDuration(buildData.duration)}`,
          timestamp: new Date(),
          read: false,
          link: `/dashboard/builds/${buildData.id}`
        });
      } else if (buildData.status === 'failed') {
        addNotification({
          id: crypto.randomUUID(),
          type: 'build_failed',
          title: 'Build Failed',
          message: `${buildData.projectName} build #${buildData.id} failed after ${formatDuration(buildData.duration)}`,
          timestamp: new Date(),
          read: false,
          link: `/dashboard/builds/${buildData.id}`
        });
      } else if (buildData.status === 'running') {
        addNotification({
          id: crypto.randomUUID(),
          type: 'build_started',
          title: 'Build Started',
          message: `${buildData.projectName} build #${buildData.id} has started`,
          timestamp: new Date(),
          read: false,
          link: `/dashboard/builds/${buildData.id}`
        });
      }
    };

    // Handle project updates
    const handleProjectUpdate = (projectData: any) => {
      console.log('Project update received:', projectData);
      
      // If we're filtering by project and this update isn't for that project, ignore it
      if (projectId && projectData.id !== projectId) return;
      
      // Update the project in the cache
      queryClient.setQueryData(['/api/projects'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((project: any) => 
          project.id === projectData.id ? { ...project, ...projectData } : project
        );
      });
      
      // Also update any query for this specific project
      queryClient.setQueryData([`/api/projects/${projectData.id}`], (oldData: any) => {
        return { ...(oldData || {}), ...projectData };
      });
    };

    // Subscribe to events
    subscribe('build:update', handleBuildUpdate);
    subscribe('project:update', handleProjectUpdate);

    // Cleanup on unmount
    return () => {
      unsubscribe('build:update', handleBuildUpdate);
      unsubscribe('project:update', handleProjectUpdate);
    };
  }, [isConnected, projectId, queryClient, addNotification, subscribe, unsubscribe]);

  // Format duration in milliseconds to human readable format
  const formatDuration = (ms: number): string => {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  // This is just a wrapper component, so return children
  return <>{children}</>;
}
