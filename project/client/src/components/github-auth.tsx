import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Github } from "lucide-react";

interface GitHubAuthProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
}

export default function GitHubAuth({ mode, onSuccess }: GitHubAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGithub } = useAuth();
  const { toast } = useToast();
  const authTitle = mode === 'login' ? 'Sign in with GitHub' : 'Sign up with GitHub';

  const handleGitHubAuth = async () => {
    setIsLoading(true);
    
    try {
      await loginWithGithub();
      // This will redirect to GitHub, so we don't need to call onSuccess
      // or reset isLoading
    } catch (error: any) {
      console.error("GitHub auth error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate with GitHub. Please try again.",
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
          <Github className="mr-2 h-4 w-4" />
        )}
        {authTitle}
      </Button>
    </div>
  );
}
