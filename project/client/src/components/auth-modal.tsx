import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Github } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export default function AuthModal({ open, onOpenChange, mode, onModeChange }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGithub, error } = useAuth();
  const { toast } = useToast();
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Reset showEmailForm when modal is closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => setShowEmailForm(false), 300);
    }
  }, [open]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGithub();
      // The loginWithGithub function will redirect to GitHub
      // So we don't need to close the modal here
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to connect with GitHub. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'login' ? 'Sign in to FlowForge' : 'Create your FlowForge account'}
          </DialogTitle>
        </DialogHeader>
        
        {showEmailForm ? (
          <div className="py-4">
            <Tabs defaultValue={mode} onValueChange={(val) => onModeChange(val as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onClose={handleCloseModal} />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm onClose={handleCloseModal} />
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowEmailForm(false)} 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to all sign-in options
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' 
                  ? 'Welcome back! Choose how you want to sign in.'
                  : 'Create your FlowForge account to get started.'
                }
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                <span className="inline-flex items-center bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md">
                  <span className="mr-1">✨</span> Recommended: Use GitHub for full access to repositories
                </span>
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              size="lg"
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              <Github className="mr-2 h-4 w-4" />
              {isLoading 
                ? 'Connecting...' 
                : `${mode === 'login' ? 'Sign in' : 'Sign up'} with GitHub`
              }
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or
                </span>
              </div>
            </div>
            
            <Button
              onClick={() => setShowEmailForm(true)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {mode === 'login' ? 'Sign in with Email' : 'Sign up with Email'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>

            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline hover:text-primary">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
