import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GitBranch, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import AuthModal from "./auth-modal";

export default function Navigation() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, logout } = useAuth();

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
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <GitBranch className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold text-slate-900">FlowForge</span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                    Features
                  </a>
                  <a href="#pricing" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                    Pricing
                  </a>
                  <Link href="/docs" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                    Documentation
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
              <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900">
                Features
              </a>
              <a href="#pricing" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900">
                Pricing
              </a>
              <Link href="/docs" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900">
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
