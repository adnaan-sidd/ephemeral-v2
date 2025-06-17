import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Rocket, Code, Zap, Check, ChevronDown, ChevronRight, Users, Stars, ServerCog, MessageCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import AuthModal from "@/components/auth-modal";
import GitHubAuth from "@/components/github-auth";
import { PLANS } from "@shared/schema";
import { useLocation } from "wouter";
import { 
  FadeIn, 
  SlideIn, 
  ScaleIn, 
  StaggeredChildren, 
  childVariants, 
  ParticleBackground 
} from "@/components/ui/animations";
import { FlowForgeLogo } from "@/components/ui/logo";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };
  
  const handleSignIn = () => {
    setAuthMode('login');
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
      
      {/* Hero Section with Particle Background */}
      <section className="relative bg-white overflow-hidden">
        <ParticleBackground className="opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <FadeIn>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                Fresh Isolated Environments
                <span className="text-primary block">for Every Build</span>
              </h1>
            </FadeIn>
            <SlideIn delay={0.2}>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                API-first ephemeral CI/CD pipelines that create clean, isolated environments for every build. 
                No more contaminated builds or environment drift.
              </p>
            </SlideIn>
            <ScaleIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" onClick={handleGetStarted}>
                    Start Free - 50 Builds
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" onClick={() => setLocation('/docs')}>
                    View Documentation
                  </Button>
                </motion.div>
              </div>
            </ScaleIn>
            
            {/* Code Example */}
            <FadeIn delay={0.6}>
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
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose FlowForge?</h2>
              <p className="text-xl text-slate-600">Built for modern development teams who need reliability and speed</p>
            </div>
          </FadeIn>
          
          <StaggeredChildren>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={childVariants}>
                <Card className="h-full transition-all hover:shadow-lg">
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
              </motion.div>
              
              <motion.div variants={childVariants}>
                <Card className="h-full transition-all hover:shadow-lg">
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
              </motion.div>
              
              <motion.div variants={childVariants}>
                <Card className="h-full transition-all hover:shadow-lg">
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
              </motion.div>
            </div>
          </StaggeredChildren>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">How FlowForge Works</h2>
              <p className="text-xl text-slate-600">Simple, efficient CI/CD workflow in three easy steps</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line between steps */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-primary/30 -translate-y-1/2 z-0"></div>
            
            <FadeIn delay={0.2}>
              <div className="relative z-10">
                <div className="bg-white rounded-full w-16 h-16 mb-6 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <Card className="text-center h-64 flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Connect Repository</h3>
                      <p className="text-slate-600">
                        Link your GitHub repository with a simple API call or use our GitHub integration.
                      </p>
                    </div>
                    <div className="mt-4 text-primary">
                      <GitBranch className="w-10 h-10 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <div className="relative z-10">
                <div className="bg-white rounded-full w-16 h-16 mb-6 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <Card className="text-center h-64 flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Define Pipeline</h3>
                      <p className="text-slate-600">
                        Specify your build commands and environment variables in JSON or YAML format.
                      </p>
                    </div>
                    <div className="mt-4 text-primary">
                      <Code className="w-10 h-10 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.6}>
              <div className="relative z-10">
                <div className="bg-white rounded-full w-16 h-16 mb-6 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <Card className="text-center h-64 flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Monitor Results</h3>
                      <p className="text-slate-600">
                        Get real-time build status updates and detailed logs via API or dashboard.
                      </p>
                    </div>
                    <div className="mt-4 text-primary">
                      <ServerCog className="w-10 h-10 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge className="mb-4">Trusted by Teams</Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">What Our Users Say</h2>
              <p className="text-xl text-slate-600">Join hundreds of development teams already using FlowForge</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0.2}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-500 flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Stars key={i} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    "FlowForge has transformed how we do CI/CD. The isolated environments ensure our tests are consistent and reliable every time."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      AK
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-slate-900">Alex Kim</div>
                      <div className="text-sm text-slate-500">CTO, TechStack Inc.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-500 flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Stars key={i} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    "The API-first approach fits perfectly with our automation workflows. We've integrated FlowForge into our GitHub Actions with just a few lines of code."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      MS
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-slate-900">Maria Santos</div>
                      <div className="text-sm text-slate-500">Lead Developer, Webflow</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            
            <FadeIn delay={0.6}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-500 flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Stars key={i} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    "We reduced our build times by 60% after switching to FlowForge. The serverless architecture scales perfectly with our team's needs."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      JD
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-slate-900">James Dawson</div>
                      <div className="text-sm text-slate-500">Engineering Manager, DataFlow</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
          
          <div className="mt-16 text-center">
            <FadeIn>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://placehold.co/150x60?text=TechCorp" alt="TechCorp" className="h-12" />
                </div>
                <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://placehold.co/150x60?text=Innovate" alt="Innovate" className="h-12" />
                </div>
                <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://placehold.co/150x60?text=DevTeam" alt="DevTeam" className="h-12" />
                </div>
                <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://placehold.co/150x60?text=BuildFast" alt="BuildFast" className="h-12" />
                </div>
                <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://placehold.co/150x60?text=CloudSys" alt="CloudSys" className="h-12" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-slate-600">Start free, scale as you grow. No hidden fees or surprises.</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(PLANS).map(([key, plan], index) => (
              <FadeIn key={key} delay={0.2 * index}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <Card className={`h-full ${key === 'pro' ? 'border-2 border-primary relative' : ''}`}>
                    {key === 'pro' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-8 h-full flex flex-col">
                      <div className="text-center flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                          <span className="text-slate-600">/month</span>
                        </div>
                        
                        <ul className="text-left space-y-3 mb-8">
                          <li className="flex items-center text-slate-600">
                            <Check className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                            {plan.pipelineRuns} pipeline runs/month
                          </li>
                          <li className="flex items-center text-slate-600">
                            <Check className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                            {plan.computeMinutes} compute minutes
                          </li>
                          <li className="flex items-center text-slate-600">
                            <Check className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                            {plan.concurrentBuilds} concurrent build{plan.concurrentBuilds > 1 ? 's' : ''}
                          </li>
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-slate-600">
                              <Check className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          className="w-full" 
                          variant={key === 'pro' ? 'default' : 'outline'}
                          onClick={() => handleSelectPlan(key)}
                        >
                          {key === 'free' ? 'Get Started Free' : 
                          key === 'enterprise' ? 'Contact Sales' : 'Start Pro Trial'}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-slate-600">Everything you need to know about FlowForge</p>
            </div>
          </FadeIn>
          
          <div className="space-y-4">
            <FadeIn delay={0.1}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    How does FlowForge differ from traditional CI/CD solutions?
                  </AccordionTrigger>
                  <AccordionContent>
                    FlowForge creates completely isolated, ephemeral environments for each build, eliminating environment drift and contamination issues. It's API-first design allows easy integration into any workflow, and the serverless architecture ensures near-instant scaling with no infrastructure management.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Can I integrate FlowForge with GitHub?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! FlowForge offers a GitHub integration that automatically triggers builds on commits and pull requests. You can also authenticate with your GitHub account for seamless onboarding.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    What programming languages and frameworks are supported?
                  </AccordionTrigger>
                  <AccordionContent>
                    FlowForge supports any language or framework that can run in a container. This includes Node.js, Python, Ruby, Go, Java, .NET, PHP, and many others. You can even use Docker multi-stage builds for more complex workflows.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    How secure is FlowForge?
                  </AccordionTrigger>
                  <AccordionContent>
                    Security is our top priority. Each build runs in an isolated container with no access to other environments. We use encryption for all data in transit and at rest. API keys can be scoped to specific permissions, and all access is logged for audit purposes.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeIn>
            
            <FadeIn delay={0.5}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Can I exceed my plan limits if needed?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, you can exceed your plan limits with pay-as-you-go pricing. Additional pipeline runs are charged at $0.05 per run, and additional compute minutes at $0.01 per minute. You'll receive usage alerts when approaching your limits.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeIn>
          </div>
        </div>
      </section>
      
      {/* CTA Section with GitHub Auth */}
      <section id="cta" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 z-0"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-3/5 p-8 md:p-12">
                <FadeIn>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
                  <p className="text-lg text-slate-600 mb-6">
                    Create your free account in seconds and experience the future of CI/CD pipelines.
                  </p>
                </FadeIn>
                
                <FadeIn delay={0.2}>
                  <div className="space-y-4">
                    <GitHubAuth mode="register" onSuccess={() => setLocation('/dashboard')} />
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGetStarted}
                    >
                      Email Sign Up
                    </Button>
                  </div>
                </FadeIn>
              </div>
              
              <div className="md:w-2/5 bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 text-white flex items-center">
                <SlideIn>
                  <div>
                    <div className="flex items-center mb-4">
                      <Users className="h-6 w-6 mr-2" />
                      <span className="text-lg font-semibold">Join 1,000+ developers</span>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Start for free with 50 pipeline runs</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>No credit card required</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Full access to all core features</span>
                      </li>
                    </ul>
                    
                    <div className="text-sm opacity-90">
                      By signing up, you agree to our Terms of Service and Privacy Policy.
                    </div>
                  </div>
                </SlideIn>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
                <FlowForgeLogo variant="white" />
              </div>
              <p className="text-slate-400 mb-4">
                API-first ephemeral CI/CD pipelines for modern development teams.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Changelog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li><a href="/docs" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Legal</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 text-slate-400 text-sm">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>&copy; 2025 FlowForge, Inc. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
