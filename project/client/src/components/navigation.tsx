import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import AuthModal from "./auth-modal";
import { FlowForgeLogo } from "@/components/ui/logo";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FlowForgeLogo variant={theme === 'dark' ? 'white' : 'default'} />
                </motion.div>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                    Features
                  </a>
                  <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                    Pricing
                  </a>
                  <Link href="/docs" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                    Documentation
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {mounted && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              )}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleAuthClick('login')}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => handleAuthClick('register')}>
                    Get Started
                  </Button>
                </>
              )}
              
              <button
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Features
              </a>
              <a href="#pricing" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Pricing
              </a>
              <Link href="/docs" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Documentation
              </Link>
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
