import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Download, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

interface BillingData {
  currentPlan: {
    name: string;
    price: number;
    features: string[];
    billing: 'monthly' | 'yearly';
  };
  usage: {
    buildMinutes: number;
    buildMinutesLimit: number;
    projects: number;
    projectsLimit: number;
    users: number;
    usersLimit: number;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: 'card';
    last4: string;
    brand: string;
    isDefault: boolean;
  }>;
}

export default function BillingPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: billing, isLoading } = useQuery({
    queryKey: ['/api/billing'],
    queryFn: async () => {
      const response = await fetch('/api/billing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch billing data');
      return response.json() as BillingData;
    },
    enabled: !!token
  });

  const usagePercentage = billing?.usage ? 
    Math.round((billing.usage.buildMinutes / billing.usage.buildMinutesLimit) * 100) : 0;

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { color: 'bg-emerald-500', text: 'Paid' },
      pending: { color: 'bg-amber-500', text: 'Pending' },
      failed: { color: 'bg-red-500', text: 'Failed' }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge className={`${statusConfig.color} text-white`}>
        {statusConfig.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your subscription, view usage, and download invoices.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{billing?.currentPlan.name || 'Pro Plan'}</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        ${billing?.currentPlan.price || 29}/{billing?.currentPlan.billing || 'month'}
                      </p>
                    </div>
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="font-semibold">{billing?.usage.buildMinutesLimit || 2000}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Build Minutes</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <Package className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                      <p className="font-semibold">{billing?.usage.projectsLimit || 'Unlimited'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Projects</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <Package className="h-6 w-6 mx-auto mb-2 text-violet-500" />
                      <p className="font-semibold">{billing?.usage.usersLimit || 10}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Team Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Usage Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Build Minutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{billing?.usage.buildMinutes || 0} used</span>
                      <span>{billing?.usage.buildMinutesLimit || 2000} total</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {usagePercentage}% of monthly limit used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-500">
                      {billing?.usage.projects || 0}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      of {billing?.usage.projectsLimit || 'unlimited'} projects
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-violet-500">
                      {billing?.usage.users || 1}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      of {billing?.usage.usersLimit || 10} members
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Usage Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Detailed usage analytics and forecasting will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-500" />
                  Invoice History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billing?.invoices?.length ? (
                    billing.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(invoice.date), 'MMMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Invoice #{invoice.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">${invoice.amount}</p>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <CreditCard className="h-8 w-8 mx-auto mb-2" />
                      <p>No invoices found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billing?.paymentMethods?.length ? (
                    billing.paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium">
                              {method.brand.toUpperCase()} •••• {method.last4}
                            </p>
                            {method.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Remove</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <CreditCard className="h-8 w-8 mx-auto mb-2" />
                      <p>No payment methods found</p>
                      <Button className="mt-4">Add Payment Method</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
