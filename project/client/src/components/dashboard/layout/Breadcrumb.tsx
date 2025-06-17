import { useLocation } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

export default function Breadcrumb() {
  const [location] = useLocation();
  
  const getBreadcrumbItems = (path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    
    // Always start with Dashboard
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' }
    ];
    
    // If we're at the root dashboard, return just that
    if (segments.length === 1 && segments[0] === 'dashboard') {
      items[0].isActive = true;
      return items;
    }
    
    // Build breadcrumb from segments
    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Skip the first 'dashboard' segment as we already have it
      if (i === 0 && segment === 'dashboard') continue;
      
      // Convert segment to readable label
      let label = segment;
      
      // Handle specific segments
      switch (segment) {
        case 'projects':
          label = 'Projects';
          break;
        case 'builds':
          label = 'Builds';
          break;
        case 'pipelines':
          label = 'Pipelines';
          break;
        case 'analytics':
          label = 'Analytics';
          break;
        case 'billing':
          label = 'Billing';
          break;
        case 'settings':
          label = 'Settings';
          break;
        case 'notifications':
          label = 'Notifications';
          break;
        default:
          // Check if it's a UUID (for detail pages)
          if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            label = 'Details';
          } else {
            // Capitalize first letter
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }
      
      items.push({
        label,
        path: currentPath,
        isActive: i === segments.length - 1
      });
    }
    
    return items;
  };
  
  const breadcrumbItems = getBreadcrumbItems(location);
  
  return (
    <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <motion.div
          key={item.path}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center"
        >
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-slate-400 mx-1" />
          )}
          
          {index === 0 && (
            <Home className="h-4 w-4 text-slate-400 mr-2" />
          )}
          
          {item.isActive ? (
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {item.label}
            </span>
          ) : (
            <a
              href={item.path}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
            >
              {item.label}
            </a>
          )}
        </motion.div>
      ))}
    </nav>
  );
}
