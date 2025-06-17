import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Navigation from "@/components/navigation";
import { useAuth } from "@/lib/auth";
import { PLANS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'cancelled' | 'error'>('loading');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');

  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
      return;
    }

    // Check URL parameters for payment status
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('payment');
    
    if (status === 'success') {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated. Welcome to FlowForge Pro!",
      });
    } else if (status === 'cancel') {
      setPaymentStatus('cancelled');
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    } else if (status === 'error') {
      setPaymentStatus('error');
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, token, setLocation, toast]);

  const handlePlanSelection = async (planKey: string) => {
    if (!user || !token) return;
    
    try {
      setPaymentStatus('loading');
      
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planKey })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Razorpay checkout (placeholder for now)
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Invalid checkout session response');
      }
    } catch (error: any) {
      setPaymentStatus('error');
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
              <p className="text-green-700 mb-6">
                Your subscription has been activated. You now have access to all Pro features.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setLocation('/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => setLocation('/docs')}>
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'cancelled':
        return (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-900 mb-2">Payment Cancelled</h2>
              <p className="text-yellow-700 mb-6">
                Your payment was cancelled. You can try again or explore our free plan.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setPaymentStatus('loading')}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Payment Error</h2>
              <p className="text-red-700 mb-6">
                There was an error processing your payment. Please try again or contact support.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setPaymentStatus('loading')}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
              <p className="text-xl text-slate-600">
                Upgrade your FlowForge experience with more builds and advanced features
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(PLANS).filter(([key]) => key !== 'free').map(([key, plan]) => (
                <Card 
                  key={key} 
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    key === 'pro' ? 'border-2 border-primary' : ''
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  {key === 'pro' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-slate-600">/month</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      <li className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        {plan.pipelineRuns.toLocaleString()} pipeline runs/month
                      </li>
                      <li className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        {plan.computeMinutes.toLocaleString()} compute minutes
                      </li>
                      <li className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        {plan.concurrentBuilds} concurrent build{plan.concurrentBuilds > 1 ? 's' : ''}
                      </li>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Separator />
                    
                    <Button 
                      className="w-full"
                      variant={key === selectedPlan ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelection(key);
                      }}
                      disabled={paymentStatus === 'loading'}
                    >
                      {paymentStatus === 'loading' && selectedPlan === key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        key === 'enterprise' ? 'Contact Sales' : `Subscribe to ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">What's included in all paid plans:</h3>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Secure payment processing via Razorpay</li>
                      <li>• 30-day money-back guarantee</li>
                      <li>• Cancel anytime - no long-term commitments</li>
                      <li>• Automatic scaling as your team grows</li>
                      <li>• Priority email support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {renderPaymentStatus()}
      </div>
    </div>
  );
}
