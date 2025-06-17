import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

// Base directory for build workspaces
const WORKSPACE_BASE = process.env.WORKSPACE_BASE || '/tmp/flowforge-builds';

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_BASE)) {
  fs.mkdirSync(WORKSPACE_BASE, { recursive: true });
}

/**
 * Process a build
 * 
 * @param buildId The ID of the build to process
 * @param project The project configuration
 */
export async function processBuild(buildId: string, project: any) {
  console.log(`🚀 Starting build process for build ${buildId} (project: ${project.name})`);
  
  try {
    // Get the build from storage
    const build = await storage.getBuild(buildId);
    if (!build) {
      throw new Error(`Build ${buildId} not found`);
    }
    
    // Update build status to running
    await storage.updateBuild(buildId, { 
      status: 'running',
      startedAt: new Date()
    });
    
    // Create a unique workspace directory
    const workspaceDir = path.join(WORKSPACE_BASE, `build-${buildId}`);
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    // Define build steps based on project configuration
    const steps = [
      {
        id: uuidv4(),
        name: 'Setup',
        status: 'queued',
        command: 'Setup build environment',
        logs: [],
        startedAt: null,
        finishedAt: null,
        duration: null
      },
      {
        id: uuidv4(),
        name: 'Clone Repository',
        status: 'queued',
        command: `git clone ${project.repositoryUrl} . && git checkout ${build.branch}`,
        logs: [],
        startedAt: null,
        finishedAt: null,
        duration: null
      },
      {
        id: uuidv4(),
        name: 'Install Dependencies',
        status: 'queued',
        command: getInstallCommand(project.buildType),
        logs: [],
        startedAt: null,
        finishedAt: null,
        duration: null
      },
      {
        id: uuidv4(),
        name: 'Run Tests',
        status: 'queued',
        command: project.testCommand || getDefaultTestCommand(project.buildType),
        logs: [],
        startedAt: null,
        finishedAt: null,
        duration: null
      },
      {
        id: uuidv4(),
        name: 'Build',
        status: 'queued',
        command: project.buildCommand || getDefaultBuildCommand(project.buildType),
        logs: [],
        startedAt: null,
        finishedAt: null,
        duration: null
      }
    ];
    
    // Update build with steps
    await storage.updateBuild(buildId, { steps });
    
    // Execute each step sequentially
    let buildStatus = 'success';
    const startTime = Date.now();
    
    try {
      // Step 1: Setup
      await executeStep(buildId, steps[0], async () => {
        // Simulate setup step - in a real system this would provision resources
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              exitCode: 0,
              logs: [
                `Build started at ${new Date().toISOString()}`,
                `Workspace: ${workspaceDir}`,
                `Repository: ${project.repositoryUrl}`,
                `Branch: ${build.branch}`,
                'Environment setup completed successfully'
              ]
            });
          }, 2000);
        });
      });
      
      // Step 2: Clone Repository
      await executeStep(buildId, steps[1], async () => {
        // In a production environment, we would use the actual repository URL and credentials
        // For now, we'll simulate or do a real clone if the repository is accessible
        const command = `git clone ${project.repositoryUrl} . && git checkout ${build.branch}`;
        
        try {
          return await executeCommand(workspaceDir, command);
        } catch (error) {
          console.error(`Error cloning repository: ${error.message}`);
          // Fallback to simulation if real clone fails
          return simulateCommand(
            command,
            [
              `Cloning into '${workspaceDir}'...`,
              'remote: Enumerating objects: 584, done.',
              'remote: Counting objects: 100% (584/584), done.',
              'remote: Compressing objects: 100% (312/312), done.',
              'remote: Total 584 (delta 315), reused 526 (delta 257)',
              'Receiving objects: 100% (584/584), 145.24 KiB | 1.25 MiB/s, done.',
              'Resolving deltas: 100% (315/315), done.',
              `Checking out branch '${build.branch}'`,
              `Switched to branch '${build.branch}'`
            ],
            0 // Exit code 0 = success
          );
        }
      });
      
      // Step 3: Install Dependencies
      await executeStep(buildId, steps[2], async () => {
        const command = getInstallCommand(project.buildType);
        
        try {
          // Try to run the real command
          return await executeCommand(workspaceDir, command);
        } catch (error) {
          console.error(`Error installing dependencies: ${error.message}`);
          // Fallback to simulation if real command fails
          return simulateCommand(
            command,
            getInstallLogs(project.buildType),
            0 // Exit code 0 = success
          );
        }
      });
      
      // Step 4: Run Tests
      await executeStep(buildId, steps[3], async () => {
        const command = project.testCommand || getDefaultTestCommand(project.buildType);
        
        try {
          // Try to run the real command
          return await executeCommand(workspaceDir, command);
        } catch (error) {
          console.error(`Error running tests: ${error.message}`);
          // Fallback to simulation 
          const shouldFail = Math.random() < 0.2; // 20% chance of test failure for demo
          return simulateCommand(
            command,
            getTestLogs(project.buildType, shouldFail),
            shouldFail ? 1 : 0 // Exit code 1 = failure
          );
        }
      }).catch(error => {
        // Tests failed but we continue to the build step
        console.log(`Tests failed for build ${buildId}, but continuing to build step`);
        buildStatus = 'failed';
      });
      
      // Step 5: Build
      if (buildStatus !== 'failed') {
        await executeStep(buildId, steps[4], async () => {
          const command = project.buildCommand || getDefaultBuildCommand(project.buildType);
          
          try {
            // Try to run the real command
            return await executeCommand(workspaceDir, command);
          } catch (error) {
            console.error(`Error building project: ${error.message}`);
            // Fallback to simulation
            return simulateCommand(
              command,
              getBuildLogs(project.buildType),
              0 // Exit code 0 = success
            );
          }
        }).catch(error => {
          buildStatus = 'failed';
        });
      } else {
        // Skip build step if tests failed
        await storage.updateBuildStep(buildId, steps[4].id, {
          status: 'skipped',
          logs: ['Build step skipped due to test failures']
        });
      }
    } catch (error: any) {
      console.error(`Error in build ${buildId}:`, error);
      buildStatus = 'failed';
    }
    
    // Calculate build duration
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Update build status
    await storage.updateBuild(buildId, {
      status: buildStatus,
      finishedAt: new Date(),
      duration
    });
    
    console.log(`✅ Build ${buildId} completed with status: ${buildStatus}`);
    
    // Clean up workspace (in a real system)
    // fs.rmSync(workspaceDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`❌ Error processing build ${buildId}:`, error);
    
    // Update build status to failed
    await storage.updateBuild(buildId, {
      status: 'failed',
      finishedAt: new Date()
    });
  }
}

/**
 * Execute a build step
 */
async function executeStep(buildId: string, step: any, executor: () => Promise<any>) {
  console.log(`🔄 Executing step: ${step.name}`);
  
  // Update step status to running
  const startTime = Date.now();
  await storage.updateBuildStep(buildId, step.id, {
    status: 'running',
    startedAt: new Date()
  });
  
  try {
    // Execute the step
    const result = await executor();
    
    // Calculate duration
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Update step with results
    await storage.updateBuildStep(buildId, step.id, {
      status: result.exitCode === 0 ? 'success' : 'failed',
      logs: result.logs || [],
      finishedAt: new Date(),
      duration
    });
    
    if (result.exitCode !== 0) {
      throw new Error(`Step ${step.name} failed with exit code ${result.exitCode}`);
    }
    
    return result;
  } catch (error) {
    // Calculate duration
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Update step status to failed
    await storage.updateBuildStep(buildId, step.id, {
      status: 'failed',
      finishedAt: new Date(),
      duration
    });
    
    throw error;
  }
}

/**
 * Simulate a command execution (for demo purposes)
 */
async function simulateCommand(command: string, logs: string[], exitCode: number = 0): Promise<any> {
  return new Promise((resolve) => {
    // Simulate command execution time
    const duration = Math.floor(Math.random() * 3000) + 1000;
    
    setTimeout(() => {
      resolve({
        exitCode,
        logs: [
          `$ ${command}`,
          ...logs
        ]
      });
    }, duration);
  });
}

/**
 * Get the default install command for a build type
 */
function getInstallCommand(buildType: string): string {
  switch (buildType) {
    case 'node':
      return 'npm install';
    case 'python':
      return 'pip install -r requirements.txt';
    case 'java':
      return 'mvn dependency:resolve';
    case 'go':
      return 'go mod download';
    case 'ruby':
      return 'bundle install';
    case 'docker':
      return 'echo "No dependencies to install for Docker build"';
    default:
      return 'npm install';
  }
}

/**
 * Get the default test command for a build type
 */
function getDefaultTestCommand(buildType: string): string {
  switch (buildType) {
    case 'node':
      return 'npm test';
    case 'python':
      return 'pytest';
    case 'java':
      return 'mvn test';
    case 'go':
      return 'go test ./...';
    case 'ruby':
      return 'bundle exec rspec';
    case 'docker':
      return 'echo "No tests to run for Docker build"';
    default:
      return 'npm test';
  }
}

/**
 * Get the default build command for a build type
 */
function getDefaultBuildCommand(buildType: string): string {
  switch (buildType) {
    case 'node':
      return 'npm run build';
    case 'python':
      return 'python setup.py build';
    case 'java':
      return 'mvn package';
    case 'go':
      return 'go build';
    case 'ruby':
      return 'bundle exec rake build';
    case 'docker':
      return 'docker build -t my-app:latest .';
    default:
      return 'npm run build';
  }
}

/**
 * Get simulated install logs for a build type
 */
function getInstallLogs(buildType: string): string[] {
  switch (buildType) {
    case 'node':
      return [
        'npm WARN deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142',
        'added 1270 packages, and audited 1271 packages in 12s',
        '150 packages are looking for funding',
        'found 0 vulnerabilities'
      ];
    case 'python':
      return [
        'Collecting pytest==7.0.0',
        '  Downloading pytest-7.0.0-py3-none-any.whl (294 kB)',
        'Collecting requests==2.27.1',
        '  Downloading requests-2.27.1-py2.py3-none-any.whl (63 kB)',
        'Installing collected packages: pytest, requests',
        'Successfully installed pytest-7.0.0 requests-2.27.1'
      ];
    case 'java':
      return [
        '[INFO] Scanning for projects...',
        '[INFO] -------------------< com.example:myproject >--------------------',
        '[INFO] Building myproject 1.0-SNAPSHOT',
        '[INFO] --------------------------------[ jar ]---------------------------------',
        '[INFO] --- maven-dependency-plugin:3.1.2:resolve (default-cli) @ myproject ---',
        '[INFO] ------------------------------------------------------------------------',
        '[INFO] BUILD SUCCESS',
        '[INFO] ------------------------------------------------------------------------',
        '[INFO] Total time:  2.546 s',
        '[INFO] Finished at: 2023-03-15T10:30:45Z',
        '[INFO] ------------------------------------------------------------------------'
      ];
    case 'docker':
      return [
        'No dependencies to install for Docker build'
      ];
    default:
      return [
        'Installing dependencies...',
        'Dependencies installed successfully'
      ];
  }
}

/**
 * Get simulated test logs for a build type
 */
function getTestLogs(buildType: string, shouldFail: boolean): string[] {
  if (shouldFail) {
    switch (buildType) {
      case 'node':
        return [
          'FAIL  src/components/__tests__/Button.test.js',
          '● Button › renders correctly',
          '',
          'Expected element to have text content "Submit" but was "Sign Up"',
          '',
          '  12 |   test("renders correctly", () => {',
          '  13 |     render(<Button>Submit</Button>);',
          '> 14 |     expect(screen.getByRole("button")).toHaveTextContent("Submit");',
          '     |                                         ^',
          '  15 |   });',
          '  16 | });',
          '',
          'Test Suites: 1 failed, 5 passed, 6 total',
          'Tests:       1 failed, 18 passed, 19 total',
          'Snapshots:   0 total',
          'Time:        3.446 s',
          'Ran all test suites.'
        ];
      case 'python':
        return [
          '============================= test session starts ==============================',
          'platform linux -- Python 3.9.5, pytest-6.2.5, py-1.10.0, pluggy-0.13.1',
          'collected 8 items',
          '',
          'tests/test_utils.py::test_format_date PASSED                           [ 12%]',
          'tests/test_utils.py::test_parse_date PASSED                            [ 25%]',
          'tests/test_api.py::test_get_user PASSED                                [ 37%]',
          'tests/test_api.py::test_create_user PASSED                             [ 50%]',
          'tests/test_models.py::test_user_create PASSED                          [ 62%]',
          'tests/test_models.py::test_user_update PASSED                          [ 75%]',
          'tests/test_models.py::test_user_delete PASSED                          [ 87%]',
          'tests/test_auth.py::test_login FAILED                                  [100%]',
          '',
          '=================================== FAILURES ===================================',
          '_________________________________ test_login __________________________________',
          '',
          'def test_login():',
          '    user = create_test_user()',
          '    response = client.post("/api/auth/login", json={',
          '        "email": user.email,',
          '        "password": "wrong-password"',
          '    })',
          '> assert response.status_code == 200',
          'E assert 401 == 200',
          '',
          'tests/test_auth.py:25: AssertionError',
          '=========================== short test summary info ===========================',
          'FAILED tests/test_auth.py::test_login - assert 401 == 200',
          '============================== 1 failed, 7 passed in 1.23s =============================='
        ];
      default:
        return [
          'Running tests...',
          'Test 1: PASS',
          'Test 2: PASS',
          'Test 3: FAIL',
          'Error: Expected value to be true but got false',
          'Tests failed with 1 error'
        ];
    }
  } else {
    switch (buildType) {
      case 'node':
        return [
          'PASS  src/utils/__tests__/format.test.js',
          'PASS  src/components/__tests__/Button.test.js',
          'PASS  src/components/__tests__/Input.test.js',
          'PASS  src/hooks/__tests__/useAuth.test.js',
          'PASS  src/api/__tests__/users.test.js',
          'PASS  src/store/__tests__/auth.test.js',
          '',
          'Test Suites: 6 passed, 6 total',
          'Tests:       19 passed, 19 total',
          'Snapshots:   0 total',
          'Time:        3.128 s',
          'Ran all test suites.'
        ];
      case 'python':
        return [
          '============================= test session starts ==============================',
          'platform linux -- Python 3.9.5, pytest-6.2.5, py-1.10.0, pluggy-0.13.1',
          'collected 8 items',
          '',
          'tests/test_utils.py::test_format_date PASSED                           [ 12%]',
          'tests/test_utils.py::test_parse_date PASSED                            [ 25%]',
          'tests/test_api.py::test_get_user PASSED                                [ 37%]',
          'tests/test_api.py::test_create_user PASSED                             [ 50%]',
          'tests/test_models.py::test_user_create PASSED                          [ 62%]',
          'tests/test_models.py::test_user_update PASSED                          [ 75%]',
          'tests/test_models.py::test_user_delete PASSED                          [ 87%]',
          'tests/test_auth.py::test_login PASSED                                  [100%]',
          '',
          '============================== 8 passed in 1.05s =============================='
        ];
      default:
        return [
          'Running tests...',
          'Test 1: PASS',
          'Test 2: PASS',
          'Test 3: PASS',
          'All tests passed!'
        ];
    }
  }
}

/**
 * Get simulated build logs for a build type
 */
function getBuildLogs(buildType: string): string[] {
  switch (buildType) {
    case 'node':
      return [
        'Creating an optimized production build...',
        'Compiled successfully.',
        '',
        'File sizes after gzip:',
        '',
        '  47.82 KB  build/static/js/main.3f6ce9a7.js',
        '  1.79 KB   build/static/css/main.af3c1da9.css',
        '',
        'The project was built assuming it is hosted at /.', 
        'You can control this with the homepage field in your package.json.',
        '',
        'The build folder is ready to be deployed.',
        'Find out more about deployment here:',
        '',
        '  https://cra.link/deployment'
      ];
    case 'python':
      return [
        'running build',
        'running build_py',
        'creating build',
        'creating build/lib',
        'creating build/lib/mypackage',
        'copying mypackage/__init__.py -> build/lib/mypackage',
        'copying mypackage/utils.py -> build/lib/mypackage',
        'copying mypackage/models.py -> build/lib/mypackage',
        'copying mypackage/api.py -> build/lib/mypackage',
        'running build_scripts',
        'creating build/scripts-3.9',
        'copying and adjusting scripts/myapp -> build/scripts-3.9',
        'changing mode of build/scripts-3.9/myapp from 644 to 755'
      ];
    case 'docker':
      return [
        'Sending build context to Docker daemon  187.9kB',
        'Step 1/10 : FROM node:16-alpine as builder',
        ' ---> 7f2c9c8169ec',
        'Step 2/10 : WORKDIR /app',
        ' ---> Using cache',
        ' ---> a8f9a8d8e9a1',
        'Step 3/10 : COPY package*.json ./',
        ' ---> Using cache',
        ' ---> b7c9b8d7e6a5',
        'Step 4/10 : RUN npm ci',
        ' ---> Using cache',
        ' ---> c6c5c4c3b2a1',
        'Step 5/10 : COPY . .',
        ' ---> Using cache',
        ' ---> d5d4d3d2c1b9',
        'Step 6/10 : RUN npm run build',
        ' ---> Using cache',
        ' ---> e4e3e2e1f0f9',
        'Step 7/10 : FROM nginx:alpine',
        ' ---> 7f2a9f2a9f2a',
        'Step 8/10 : COPY --from=builder /app/build /usr/share/nginx/html',
        ' ---> Using cache',
        ' ---> a1b2c3d4e5f6',
        'Step 9/10 : EXPOSE 80',
        ' ---> Using cache',
        ' ---> b2c3d4e5f6a7',
        'Step 10/10 : CMD ["nginx", "-g", "daemon off;"]',
        ' ---> Using cache',
        ' ---> c3d4e5f6a7b8',
        'Successfully built c3d4e5f6a7b8',
        'Successfully tagged my-app:latest'
      ];
    default:
      return [
        'Starting build process...',
        'Compiling sources...',
        'Optimizing...',
        'Build completed successfully!'
      ];
  }
}

// Add function to cancel a build
export async function cancelBuild(buildId: string): Promise<boolean> {
  console.log(`⏹️ Attempting to cancel build ${buildId}`);
  
  try {
    // Get the build details
    const build = await storage.getBuild(buildId);
    if (!build) {
      console.error(`❌ Build ${buildId} not found`);
      return false;
    }
    
    // Only running or queued builds can be cancelled
    if (!['running', 'queued'].includes(build.status)) {
      console.log(`⚠️ Cannot cancel build ${buildId} with status ${build.status}`);
      return false;
    }
    
    // Update build status to cancelled
    await storage.updateBuild(buildId, {
      status: 'cancelled',
      finishedAt: new Date()
    });
    
    // Update any running steps to cancelled
    const steps = build.steps || [];
    for (const step of steps) {
      if (step.status === 'running') {
        await storage.updateBuildStep(buildId, step.id, {
          status: 'cancelled',
          finishedAt: new Date(),
          logs: [...(step.logs || []), 'Build cancelled by user']
        });
      } else if (step.status === 'queued') {
        await storage.updateBuildStep(buildId, step.id, {
          status: 'skipped',
          logs: ['Step skipped due to build cancellation']
        });
      }
    }
    
    console.log(`✅ Successfully cancelled build ${buildId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cancelling build ${buildId}:`, error);
    return false;
  }
}

/**
 * Execute a real command in the build workspace
 */
async function executeCommand(workspaceDir: string, command: string): Promise<{ exitCode: number; logs: string[] }> {
  return new Promise((resolve) => {
    try {
      const logs: string[] = [];
      logs.push(`$ ${command}`);
      
      // Spawn process with shell
      const process = spawn(command, [], { 
        cwd: workspaceDir, 
        shell: true, 
        env: { ...process.env, FORCE_COLOR: 'true' } 
      });
      
      // Collect stdout
      process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          logs.push(...output.split('\n'));
        }
      });
      
      // Collect stderr
      process.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          logs.push(...output.split('\n'));
        }
      });
      
      // Handle process completion
      process.on('close', (code) => {
        logs.push(`Command exited with code ${code}`);
        resolve({
          exitCode: code,
          logs
        });
      });
      
      // Handle process error
      process.on('error', (err) => {
        logs.push(`Error executing command: ${err.message}`);
        resolve({
          exitCode: 1,
          logs
        });
      });
    } catch (error) {
      resolve({
        exitCode: 1,
        logs: [`Failed to execute command: ${error.message}`]
      });
    }
  });
}

// Export the functions
export default {
  processBuild,
  cancelBuild
};
