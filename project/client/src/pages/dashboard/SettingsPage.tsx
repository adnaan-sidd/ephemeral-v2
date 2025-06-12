import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard,
  Key,
  Shield,
  Globe,
  Github,
  Gitlab,
  Save,
  AlertTriangle,
  RefreshCw,
  Trash
} from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import DashboardLayout from '../../components/dashboard/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '../../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

// Sample user profile data
const sampleUserProfile = {
  id: 'user-1',
  email: 'sarah.chen@example.com',
  name: 'Sarah Chen',
  avatar: 'https://i.pravatar.cc/150?img=36',
  role: 'Admin',
  company: 'TechCorp Inc.',
  title: 'Senior Developer',
  timezone: 'America/New_York',
  createdAt: new Date(Date.now() - 31536000000), // 1 year ago
  twoFactorEnabled: true,
  notifications: {
    email: {
      buildSuccess: false,
      buildFailure: true,
      mention: true,
      weeklyDigest: true
    },
    web: {
      buildSuccess: true,
      buildFailure: true,
      mention: true,
      weeklyDigest: false
    }
  },
  tokens: [
    {
      id: 'token-1',
      name: 'Development API Token',
      lastUsed: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(Date.now() - 2592000000), // 30 days ago
      scopes: ['read:builds', 'write:builds', 'read:projects']
    },
    {
      id: 'token-2',
      name: 'CI Integration',
      lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
      createdAt: new Date(Date.now() - 7776000000), // 90 days ago
      scopes: ['read:builds', 'read:projects', 'read:pipelines']
    }
  ],
  integrations: {
    github: {
      connected: true,
      username: 'sarahc',
      installationId: 'gh-install-123',
      scopes: ['repo', 'user:email']
    },
    gitlab: {
      connected: false
    },
    bitbucket: {
      connected: false
    }
  }
};

// Sample billing data
const sampleBillingData = {
  plan: 'Team',
  status: 'active',
  seats: {
    used: 8,
    total: 10
  },
  nextBillingDate: new Date(Date.now() + 1209600000), // 14 days from now
  paymentMethod: {
    type: 'card',
    last4: '4242',
    expiry: '04/25',
    brand: 'visa'
  },
  billingAddress: {
    name: 'Sarah Chen',
    company: 'TechCorp Inc.',
    street: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94107',
    country: 'United States'
  },
  usage: {
    buildMinutes: {
      used: 1250,
      included: 2000
    },
    concurrentBuilds: {
      used: 2,
      included: 4
    },
    storage: {
      used: 15,
      included: 50
    }
  },
  invoices: [
    {
      id: 'inv-1',
      date: new Date(Date.now() - 2592000000), // 30 days ago
      amount: 50,
      status: 'paid',
      url: '#'
    },
    {
      id: 'inv-2',
      date: new Date(Date.now() - 5184000000), // 60 days ago
      amount: 50,
      status: 'paid',
      url: '#'
    },
    {
      id: 'inv-3',
      date: new Date(Date.now() - 7776000000), // 90 days ago
      amount: 50,
      status: 'paid',
      url: '#'
    }
  ]
};

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleUserProfile;
    },
    enabled: !!token
  });

  // Fetch billing data
  const { data: billing } = useQuery({
    queryKey: ['/api/user/billing'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleBillingData;
    },
    enabled: !!token && activeTab === 'billing'
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In a real app, this would update the profile data
  };

  const handleCreateToken = async () => {
    if (!newTokenName || newTokenScopes.length === 0) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // Simulate token creation
    setNewToken('tkn_' + Math.random().toString(36).substring(2, 15));
  };

  const handleDeleteToken = async (tokenId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In a real app, this would delete the token
  };

  const handleDisconnectIntegration = async (provider: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In a real app, this would disconnect the integration
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Your name" 
                        defaultValue={profile.name} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Your email" 
                        defaultValue={profile.email} 
                        disabled 
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Your email address is used for login and notifications
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        placeholder="Your company" 
                        defaultValue={profile.company} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Your job title" 
                        defaultValue={profile.title} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue={profile.timezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Account Deletion</AlertTitle>
                  <AlertDescription>
                    Deleting your account will remove all of your data from our systems. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        placeholder="Type 'delete' to confirm" 
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    placeholder="Your current password" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="Your new password" 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Password must be at least 8 characters and include a number and special character
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm your new password" 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Secure your account with two-factor authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Two-factor authentication</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={profile.twoFactorEnabled}
                    onCheckedChange={() => {}}
                  />
                </div>
                
                {profile.twoFactorEnabled && (
                  <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                    <p className="text-sm font-medium">Two-factor authentication is enabled</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      You are using an authenticator app for two-factor authentication
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Reconfigure 2FA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Manage API tokens for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.tokens.map(token => (
                  <div 
                    key={token.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{token.name}</p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
                        <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Last used: {new Date(token.lastUsed).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {token.scopes.map(scope => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 sm:mt-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-900 hover:border-red-300 dark:hover:border-red-700"
                      onClick={() => handleDeleteToken(token.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                ))}
                
                <Dialog open={showNewTokenDialog} onOpenChange={setShowNewTokenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Key className="h-4 w-4 mr-2" />
                      Create New Token
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Token</DialogTitle>
                      <DialogDescription>
                        Create a new token for programmatic access to the API
                      </DialogDescription>
                    </DialogHeader>
                    
                    {newToken ? (
                      <div className="space-y-4 py-4">
                        <Alert>
                          <AlertTitle>Token created successfully</AlertTitle>
                          <AlertDescription className="text-sm">
                            This token will only be shown once. Make sure to copy it now.
                          </AlertDescription>
                        </Alert>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm break-all">
                          {newToken}
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(newToken);
                          }}>
                            Copy to Clipboard
                          </Button>
                          <Button onClick={() => {
                            setNewToken(null);
                            setNewTokenName('');
                            setNewTokenScopes([]);
                            setShowNewTokenDialog(false);
                          }}>
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="token-name">Token Name</Label>
                            <Input 
                              id="token-name" 
                              placeholder="e.g., CI/CD Integration" 
                              value={newTokenName}
                              onChange={(e) => setNewTokenName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Scopes</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {['read:builds', 'write:builds', 'read:projects', 'write:projects', 'read:pipelines', 'write:pipelines'].map(scope => (
                                <div key={scope} className="flex items-center space-x-2">
                                  <input 
                                    type="checkbox" 
                                    id={`scope-${scope}`}
                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewTokenScopes([...newTokenScopes, scope]);
                                      } else {
                                        setNewTokenScopes(newTokenScopes.filter(s => s !== scope));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`scope-${scope}`} className="text-sm">{scope}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowNewTokenDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateToken} disabled={!newTokenName || newTokenScopes.length === 0}>
                            Create Token
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Build Success</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive an email when a build completes successfully
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.email.buildSuccess} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Build Failure</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive an email when a build fails
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.email.buildFailure} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mentions</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive an email when you're mentioned in a comment
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.email.mention} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a weekly summary of your CI/CD activity
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.email.weeklyDigest} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Web Notifications</CardTitle>
                <CardDescription>
                  Manage your in-app notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Build Success</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a notification when a build completes successfully
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.web.buildSuccess} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Build Failure</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a notification when a build fails
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.web.buildFailure} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mentions</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a notification when you're mentioned in a comment
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.web.mention} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive a weekly summary of your CI/CD activity
                      </p>
                    </div>
                    <Switch 
                      checked={profile.notifications.web.weeklyDigest} 
                      onCheckedChange={() => {}}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Source Control Integrations</CardTitle>
                <CardDescription>
                  Connect to your source control providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* GitHub */}
                  <div className="flex-1 border rounded-lg p-6 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Github className="h-8 w-8 mr-3 text-slate-900 dark:text-white" />
                        <h3 className="text-lg font-medium">GitHub</h3>
                      </div>
                      {profile.integrations.github.connected ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Disconnected</Badge>
                      )}
                    </div>
                    
                    {profile.integrations.github.connected ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Connected Account</p>
                          <p className="font-medium">{profile.integrations.github.username}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Permissions</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.integrations.github.scopes.map(scope => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleDisconnectIntegration('github')}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Connect your GitHub account to set up CI/CD for your repositories.
                        </p>
                        <Button className="w-full">
                          <Github className="h-4 w-4 mr-2" />
                          Connect GitHub
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* GitLab */}
                  <div className="flex-1 border rounded-lg p-6 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Gitlab className="h-8 w-8 mr-3 text-slate-900 dark:text-white" />
                        <h3 className="text-lg font-medium">GitLab</h3>
                      </div>
                      {profile.integrations.gitlab.connected ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Disconnected</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Connect your GitLab account to set up CI/CD for your repositories.
                      </p>
                      <Button className="w-full">
                        <Gitlab className="h-4 w-4 mr-2" />
                        Connect GitLab
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Configure webhooks to receive event notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-4">
                  <p className="font-medium">No webhooks configured</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure webhooks to receive notifications about builds, deployments, and other events.
                  </p>
                </div>
                
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {!billing ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Your current plan and usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <h3 className="text-2xl font-bold">{billing.plan} Plan</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Next billing date: {new Date(billing.nextBillingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button>Upgrade Plan</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Build Minutes
                        </p>
                        <p className="text-lg font-bold">
                          {billing.usage.buildMinutes.used} / {billing.usage.buildMinutes.included}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary rounded-full h-2.5" 
                            style={{ width: `${(billing.usage.buildMinutes.used / billing.usage.buildMinutes.included) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Concurrent Builds
                        </p>
                        <p className="text-lg font-bold">
                          {billing.usage.concurrentBuilds.used} / {billing.usage.concurrentBuilds.included}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary rounded-full h-2.5" 
                            style={{ width: `${(billing.usage.concurrentBuilds.used / billing.usage.concurrentBuilds.included) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Storage (GB)
                        </p>
                        <p className="text-lg font-bold">
                          {billing.usage.storage.used} / {billing.usage.storage.included}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary rounded-full h-2.5" 
                            style={{ width: `${(billing.usage.storage.used / billing.usage.storage.included) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Team Members
                      </p>
                      <p className="text-lg font-bold">
                        {billing.seats.used} / {billing.seats.total} seats used
                      </p>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                        <div 
                          className="bg-primary rounded-full h-2.5" 
                          style={{ width: `${(billing.seats.used / billing.seats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>
                      Manage your payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center">
                        <div className="w-12 h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center mr-4">
                          <span className="text-xs font-bold uppercase">
                            {billing.paymentMethod.brand}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">•••• {billing.paymentMethod.last4}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Expires {billing.paymentMethod.expiry}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                      Your recent invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-4 p-4 font-medium border-b">
                        <div>Date</div>
                        <div>Invoice ID</div>
                        <div>Amount</div>
                        <div className="text-right">Status</div>
                      </div>
                      {billing.invoices.map(invoice => (
                        <div 
                          key={invoice.id} 
                          className="grid grid-cols-4 p-4 text-sm border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div>{new Date(invoice.date).toLocaleDateString()}</div>
                          <div>{invoice.id}</div>
                          <div>${invoice.amount.toFixed(2)}</div>
                          <div className="text-right">
                            <Badge className={`${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
