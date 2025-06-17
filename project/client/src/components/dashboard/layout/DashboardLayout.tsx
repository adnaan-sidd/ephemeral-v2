import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useWebSocket } from '@/context/WebSocketContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isConnected } = useWebSocket();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '80px' }}
      >
        <Header 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          isConnected={isConnected} 
        />

        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto p-4 md:p-6 pt-20"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
