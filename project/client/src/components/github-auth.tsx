import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface GitHubAuthProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
}

export default function GitHubAuth({ mode, onSuccess }: GitHubAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const authTitle = mode === 'login' ? 'Sign in with GitHub' : 'Sign up with GitHub';

  const handleGitHubAuth = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would redirect to GitHub OAuth flow
      // For now, we'll simulate the process
      
      toast({
        title: "GitHub Authentication",
        description: "This is a simulated GitHub auth. In a real app, this would connect to GitHub's OAuth.",
      });
      
      // Wait a bit to simulate the redirect and callback
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("GitHub auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with GitHub. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGitHubAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        )}
        {authTitle}
      </Button>
    </div>
  );
}
