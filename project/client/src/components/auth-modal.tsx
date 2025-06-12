import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { PLANS } from "@shared/schema";
import { useLocation } from "wouter";
import GitHubAuth from "./github-auth";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export default function AuthModal({ open, onOpenChange, mode, onModeChange }: AuthModalProps) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company: '',
    plan: 'free'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account.",
        });
      } else {
        await register(formData.email, formData.password, formData.plan, formData.company);
        toast({
          title: "Account created!",
          description: "Welcome to FlowForge. Your account has been created successfully.",
        });
      }
      
      onOpenChange(false);
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: mode === 'login' ? "Login failed" : "Registration failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGitHubSuccess = () => {
    onOpenChange(false);
    setLocation('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </DialogTitle>
        </DialogHeader>
        
        <GitHubAuth mode={mode} onSuccess={handleGitHubSuccess} />
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-slate-500">Or continue with email</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
            />
          </div>
          
          {mode === 'register' && (
            <>
              <div>
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="plan">Choose Plan</Label>
                <Select value={formData.plan} onValueChange={(value) => handleInputChange('plan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLANS).map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        {plan.name} - ${plan.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        
        <div className="text-center text-sm mt-4">
          <span className="text-slate-600 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            className="text-primary hover:text-primary/80 font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
