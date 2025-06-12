import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, Key, ServerCog, Code, AlertTriangle } from "lucide-react";
import Navigation from "@/components/navigation";
import { useLocation } from "wouter";

export default function Documentation() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-slate-900">API Documentation</h1>
            <p className="text-slate-600">Complete guide to integrating FlowForge into your workflow</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              <a href="#quickstart" className="bg-primary/5 text-primary group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <Rocket className="text-primary mr-3 h-4 w-4" />
                Quick Start
              </a>
              <a href="#authentication" className="text-slate-600 hover:bg-slate-50 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <Key className="text-slate-400 mr-3 h-4 w-4" />
                Authentication
              </a>
              <a href="#pipelines" className="text-slate-600 hover:bg-slate-50 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <ServerCog className="text-slate-400 mr-3 h-4 w-4" />
                Pipelines API
              </a>
              <a href="#examples" className="text-slate-600 hover:bg-slate-50 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
                <Code className="text-slate-400 mr-3 h-4 w-4" />
                Examples
              </a>
            </nav>
          </div>

          {/* Documentation Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-slate max-w-none">
              {/* Quick Start */}
              <section id="quickstart" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Start</h2>
                <p className="text-slate-600 mb-6">Get up and running with FlowForge in under 5 minutes.</p>
                
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Step 1: Get Your API Key</h3>
                    <p className="text-slate-600 mb-4">First, create an account and generate an API key from your dashboard.</p>
                    <Button onClick={() => setLocation('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Step 2: Create Your First Pipeline</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/your-username/your-repo",
    "branch": "main",
    "commands": [
      "npm install",
      "npm test",
      "npm run build"
    ]
  }'`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Step 3: Check Pipeline Status</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.flowforge.dev/v1/pipelines/{pipeline_id}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Authentication */}
              <section id="authentication" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
                <p className="text-slate-600 mb-6">FlowForge uses API keys for authentication. Include your API key in the Authorization header.</p>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <AlertTriangle className="text-amber-500 mt-1 mr-3 h-5 w-5" />
                    <div>
                      <h4 className="text-amber-800 font-semibold">Keep your API keys secure</h4>
                      <p className="text-amber-700 text-sm">Never expose your API keys in client-side code or public repositories.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto mb-6">
                  <pre className="text-green-400 text-sm">
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                  </pre>
                </div>
              </section>

              {/* Pipelines API */}
              <section id="pipelines" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Pipelines API</h2>
                <p className="text-slate-600 mb-6">The core API for creating and managing CI/CD pipelines.</p>

                <div className="space-y-8">
                  {/* POST /v1/pipelines */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default">POST</Badge>
                        <code className="text-sm font-mono">/v1/pipelines</code>
                      </div>
                      <p className="text-slate-600 mb-4">Create and execute a new pipeline.</p>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Request Body</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "repo_url": "string (required)",
  "branch": "string (default: main)",
  "commands": ["string array (required)"],
  "environment": {
    "NODE_VERSION": "18",
    "CUSTOM_VAR": "value"
  }
}`}</code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "status": "pending",
  "repo_url": "https://github.com/user/repo",
  "branch": "main",
  "created_at": "2024-01-15T10:30:00Z"
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GET /v1/pipelines/{id} */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm font-mono">/v1/pipelines/{`{id}`}</code>
                      </div>
                      <p className="text-slate-600 mb-4">Get the status and details of a specific pipeline.</p>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "status": "completed", // pending, running, completed, failed
  "repo_url": "https://github.com/user/repo",
  "branch": "main",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:33:24Z",
  "duration": 204 // seconds
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GET /v1/pipelines/{id}/logs */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm font-mono">/v1/pipelines/{`{id}`}/logs</code>
                      </div>
                      <p className="text-slate-600 mb-4">Get the logs for a specific pipeline.</p>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "logs": "🔧 Setting up ephemeral environment...\\n📦 Cloning repository..."
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Examples */}
              <section id="examples" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Examples</h2>
                <p className="text-slate-600 mb-6">Common use cases and example implementations.</p>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Node.js Project</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-node-app",
    "branch": "main",
    "commands": [
      "npm ci",
      "npm run test",
      "npm run build",
      "npm run lint"
    ]
  }'`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Python Project</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-python-app",
    "branch": "develop",
    "commands": [
      "pip install -r requirements.txt",
      "python -m pytest tests/",
      "python -m black --check .",
      "python -m mypy src/"
    ]
  }'`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Docker Build</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-docker-app",
    "branch": "main",
    "commands": [
      "docker build -t my-app:latest .",
      "docker run --rm my-app:latest npm test"
    ]
  }'`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
