import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import Dashboard from "@/pages/dashboard";
import Documentation from "@/pages/docs";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import NotificationListener from "@/components/dashboard/notifications/NotificationListener";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/docs" component={Documentation} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={() => {
        const [, navigate] = useLocation();
        const [showAuthModal, setShowAuthModal] = useState(true);
        
        useEffect(() => {
          if (!showAuthModal) {
            navigate('/');
          }
        }, [showAuthModal, navigate]);
        
        return (
          <>
            <HomePage />
            {showAuthModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Sign In</h2>
                  <LoginForm onClose={() => setShowAuthModal(false)} />
                </div>
              </div>
            )}
          </>
        );
      }} />
      <Route path="/register" component={() => {
        const [, navigate] = useLocation();
        const [showAuthModal, setShowAuthModal] = useState(true);
        
        useEffect(() => {
          if (!showAuthModal) {
            navigate('/');
          }
        }, [showAuthModal, navigate]);
        
        return (
          <>
            <HomePage />
            {showAuthModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Account</h2>
                  <RegisterForm onClose={() => setShowAuthModal(false)} />
                </div>
              </div>
            )}
          </>
        );
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <NotificationListener>
                <Router />
              </NotificationListener>
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} );
}

export default App;
