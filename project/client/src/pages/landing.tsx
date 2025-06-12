import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Rocket, Code, Zap, Check } from "lucide-react";
import Navigation from "@/components/navigation";
import AuthModal from "@/components/auth-modal";
import { PLANS } from "@shared/schema";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleSelectPlan = (plan: string) => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Fresh Isolated Environments
              <span className="text-primary block">for Every Build</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              API-first ephemeral CI/CD pipelines that create clean, isolated environments for every build. 
              No more contaminated builds or environment drift.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                Start Free - 50 Builds
              </Button>
              <Button variant="outline" size="lg" onClick={() => setLocation('/docs')}>
                View Documentation
              </Button>
            </div>
            
            {/* Code Example */}
            <div className="mt-12 bg-slate-900 rounded-xl p-6 text-left max-w-2xl mx-auto">
              <div className="flex items-center mb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-slate-400 ml-4 text-sm">API Example</span>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto">
                <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main", 
    "commands": ["npm install", "npm test", "npm run build"]
  }'`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose FlowForge?</h2>
            <p className="text-xl text-slate-600">Built for modern development teams who need reliability and speed</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Rocket className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Ephemeral Environments</h3>
                <p className="text-slate-600">
                  Every build gets a fresh, isolated container. No more contaminated builds or environment drift issues.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Code className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">API-First Design</h3>
                <p className="text-slate-600">
                  Simple REST API that integrates with any workflow. Perfect for GitOps and custom automation.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Lightning Fast</h3>
                <p className="text-slate-600">
                  Serverless architecture means instant scaling and sub-second pipeline start times.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600">Start free, scale as you grow. No hidden fees or surprises.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(PLANS).map(([key, plan]) => (
              <Card key={key} className={key === 'pro' ? 'border-2 border-primary relative' : ''}>
                {key === 'pro' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-600">/month</span>
                    </div>
                    
                    <ul className="text-left space-y-3 mb-8">
                      <li className="flex items-center text-slate-600">
                        <Check className="text-green-500 w-5 h-5 mr-3" />
                        {plan.pipelineRuns} pipeline runs/month
                      </li>
                      <li className="flex items-center text-slate-600">
                        <Check className="text-green-500 w-5 h-5 mr-3" />
                        {plan.computeMinutes} compute minutes
                      </li>
                      <li className="flex items-center text-slate-600">
                        <Check className="text-green-500 w-5 h-5 mr-3" />
                        {plan.concurrentBuilds} concurrent build{plan.concurrentBuilds > 1 ? 's' : ''}
                      </li>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-slate-600">
                          <Check className="text-green-500 w-5 h-5 mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={key === 'pro' ? 'w-full' : 'w-full'} 
                      variant={key === 'pro' ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(key)}
                    >
                      {key === 'free' ? 'Get Started Free' : 
                       key === 'enterprise' ? 'Contact Sales' : 'Start Pro Trial'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
