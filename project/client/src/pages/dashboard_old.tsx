import DashboardLayout from "@/components/dashboard/layout/DashboardLayout";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
      }));
      
      // Store the full key in local memory for this session
      queryClient.setQueryData(['/api/user/api-keys'], (oldData: any) => {
        if (!oldData) return [{ 
          ...data, 
          fullKey: data.key,
          partialKey: data.key.substring(0, 6) + '••••••••••••••••••••••••••••' + data.key.substring(data.key.length - 4)
        }];
        
        return [
          { 
            ...data, 
            fullKey: data.key,
            partialKey: data.key.substring(0, 6) + '••••••••••••••••••••••••••••' + data.key.substring(data.key.length - 4)
          },
          ...oldData
        ];
      });
      
      // Show toast with copy button
      toast({
        title: "API Key Created",
        description: (
          <div className="mt-2">
            <p className="mb-2">Your new API key has been generated. Copy it now as it won't be shown again.</p>
            <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded font-mono text-sm overflow-auto">
              <code className="flex-1">{data.key}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(data.key)}
                className="h-8 px-2 text-slate-600"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ),
        duration: 10000, // Show for 10 seconds to give time to copy
      });
      
      setNewApiKeyName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/user/api-keys/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently revoked.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest('POST', '/api/billing/create-checkout-session', { plan });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }
    createApiKeyMutation.mutate(newApiKeyName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };
  
  const toggleApiKeyVisibility = (id: string, fullKey?: string) => {
    // If we don't have the full key, we can't show it
    if (!fullKey) {
      toast({
        title: "Unable to show full API key",
        description: "For security reasons, the full API key is only available right after creation.",
        variant: "destructive"
      });
      return;
    }
    
    setVisibleApiKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTestPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pipelineForm.repoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a repository URL.",
        variant: "destructive",
      });
      return;
    }
    
    const commands = pipelineForm.commands
      .split('\n')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd);
    
    if (commands.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one command.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingPipeline(true);
    
    try {
      const response = await fetch('/api/user/test-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repoUrl: pipelineForm.repoUrl,
          branch: pipelineForm.branch,
          commands
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create pipeline');
      }
      
      const data = await response.json();
      
      toast({
        title: "Pipeline Created",
        description: `Pipeline ID: ${data.id} has been created and is now running.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/pipelines'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPipeline(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-500';
      case 'failed':
      case 'error':
        return 'bg-red-500';
      case 'running':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'default';
      case 'failed':
      case 'error':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Dashboard Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600">{user.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {user.plan} Plan
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Usage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Pipeline Runs</h3>
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {usage?.current.pipelineRuns || 0}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">
                    of {usage?.limits.pipelineRuns || 0} this month
                  </div>
                  <Progress 
                    value={usage ? (usage.current.pipelineRuns / usage.limits.pipelineRuns) * 100 : 0} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Compute Minutes</h3>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {usage?.current.computeMinutes || 0}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">
                    of {usage?.limits.computeMinutes || 0} this month
                  </div>
                  <Progress 
                    value={usage ? (usage.current.computeMinutes / usage.limits.computeMinutes) * 100 : 0} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Success Rate</h3>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">94.7%</div>
                  <div className="text-sm text-green-600">+2.3% from last month</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600">Avg Duration</h3>
                    <Timer className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">2m 43s</div>
                  <div className="text-sm text-green-600">-12s from last month</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pipelines */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Pipelines</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => document.getElementById('test-pipeline-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="h-4 w-4" /> Test Pipeline
                </Button>
              </CardHeader>
              <CardContent>
                {pipelines && pipelines.length > 0 ? (
                  <div className="space-y-4">
                    {pipelines.slice(0, 10).map((pipeline: any) => (
                      <div key={pipeline.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(pipeline.status)}`} />
                          <div>
                            <div className="font-medium text-slate-900">
                              {pipeline.repoUrl?.split('/').slice(-2).join('/') || 'Unknown repo'}/{pipeline.branch}
                            </div>
                            <div className="text-sm text-slate-500">
                              {pipeline.createdAt ? formatDistanceToNow(new Date(pipeline.createdAt), { addSuffix: true }) : 'Unknown time'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={getStatusBadgeVariant(pipeline.status)}>
                            {pipeline.status}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {pipeline.duration ? `${Math.floor(pipeline.duration / 60)}m ${pipeline.duration % 60}s` : '--'}
                          </span>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No pipelines yet. Create your first pipeline using the API!
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Test Pipeline Form */}
            <Card id="test-pipeline-form">
              <CardHeader>
                <CardTitle>Test Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestPipeline} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input 
                      id="repo-url" 
                      placeholder="https://github.com/username/repo" 
                      value={pipelineForm.repoUrl}
                      onChange={(e) => setPipelineForm(prev => ({ ...prev, repoUrl: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input 
                      id="branch" 
                      placeholder="main" 
                      value={pipelineForm.branch}
                      onChange={(e) => setPipelineForm(prev => ({ ...prev, branch: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="commands">Commands (one per line)</Label>
                    <textarea 
                      id="commands" 
                      rows={5}
                      className="w-full border rounded-md p-2"
                      placeholder="npm install
npm test
npm run build"
                      value={pipelineForm.commands}
                      onChange={(e) => setPipelineForm(prev => ({ ...prev, commands: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                  <Button className="w-full" type="submit" disabled={isSubmittingPipeline}>
                    {isSubmittingPipeline ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running Pipeline...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Run Pipeline
                      </>
                    )}
                  </Button>
                  <div className="text-sm text-slate-500 mt-2">
                    <p>This will count towards your monthly pipeline runs quota. To automate, use the API with your API key.</p>
                    <div className="mt-3 bg-slate-100 p-3 rounded-md font-mono text-xs overflow-auto">
                      <pre>{`curl -X POST https://yourdomain.com/api/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repoUrl": "https://github.com/username/repo",
    "branch": "main", 
    "commands": ["npm install", "npm test", "npm run build"]
  }'`}</pre>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="API key name"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleCreateApiKey} disabled={createApiKeyMutation.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey: any) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{apiKey.name}</div>
                          <div className="text-sm text-slate-500 font-mono flex items-center">
                            {visibleApiKeys[apiKey.id] && apiKey.fullKey ? apiKey.fullKey : apiKey.partialKey}
                          </div>
                          <div className="text-sm text-slate-500">
                            Last used: {apiKey.lastUsedAt ? formatDistanceToNow(new Date(apiKey.lastUsedAt), { addSuffix: true }) : 'Never'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(apiKey.id, apiKey.fullKey)}
                            title={visibleApiKeys[apiKey.id] ? "Hide API key" : "Show API key"}
                          >
                            {visibleApiKeys[apiKey.id] ? (
                              <EyeOff className="h-4 w-4 text-slate-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(visibleApiKeys[apiKey.id] && apiKey.fullKey ? apiKey.fullKey : apiKey.partialKey)}
                            title="Copy API key"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                            disabled={deleteApiKeyMutation.isPending}
                            title="Delete API key"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No API keys yet. Create your first API key to start using FlowForge!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{user.plan} Plan</div>
                        <div className="text-slate-600">
                          ${user.plan === 'free' ? '0' : user.plan === 'pro' ? '29' : '99'}/month
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    {user.plan !== 'enterprise' && (
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => createCheckoutSessionMutation.mutate('pro')}
                          disabled={createCheckoutSessionMutation.isPending || user.plan === 'pro'}
                        >
                          {user.plan === 'free' ? 'Upgrade to Pro' : 'Current Plan'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => createCheckoutSessionMutation.mutate('enterprise')}
                          disabled={createCheckoutSessionMutation.isPending}
                        >
                          Upgrade to Enterprise
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">Pipeline Runs</span>
                      <span className="text-sm text-slate-900">
                        {usage?.current.pipelineRuns || 0} / {usage?.limits.pipelineRuns || 0}
                      </span>
                    </div>
                    <Progress value={usage ? (usage.current.pipelineRuns / usage.limits.pipelineRuns) * 100 : 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">Compute Minutes</span>
                      <span className="text-sm text-slate-900">
                        {usage?.current.computeMinutes || 0} / {usage?.limits.computeMinutes || 0}
                      </span>
                    </div>
                    <Progress value={usage ? (usage.current.computeMinutes / usage.limits.computeMinutes) * 100 : 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">Concurrent Builds</span>
                      <span className="text-sm text-slate-900">
                        1 / {usage?.limits.concurrentBuilds || 1}
                      </span>
                    </div>
                    <Progress value={usage ? (1 / usage.limits.concurrentBuilds) * 100 : 0} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                </div>
                
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={user.company || ''} placeholder="Your company name" />
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Notification Preferences</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-slate-700">Pipeline completion notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-slate-700">Usage limit warnings</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="ml-2 text-sm text-slate-700">Product updates and announcements</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
