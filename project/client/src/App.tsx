import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import HomePage from "./pages/HomePage";
import Dashboard from "@/pages/dashboard";
import Documentation from "@/pages/docs";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";
import GitHubCallback from "@/components/GitHubCallback";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import NotificationListener from "@/components/dashboard/notifications/NotificationListener";

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading indicator while checking auth status
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/github/callback" element={<GitHubCallback />} />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/docs" element={<Documentation />} />
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Router>
                <Toaster />
                <NotificationListener>
                  <AppRoutes />
                </NotificationListener>
              </Router>
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
