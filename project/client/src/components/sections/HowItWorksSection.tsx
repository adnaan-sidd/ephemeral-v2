import { motion } from 'framer-motion';
import { Github, GitBranch, Code, CheckCircle } from 'lucide-react';
import { flowForgeImages } from '../../utils/images';
import { Link } from 'wouter';

const steps = [
  {
    number: 1,
    title: "Connect Repository",
    description: "Link your GitHub, GitLab, or Bitbucket repository with a single click. No complex setup required.",
    icon: <Github className="h-10 w-10 text-blue-500" />
  },
  {
    number: 2,
    title: "Configure Pipeline",
    description: "Define your build steps with our simple YAML configuration or use our visual editor to create your pipeline.",
    icon: <Code className="h-10 w-10 text-indigo-500" />
  },
  {
    number: 3,
    title: "Deploy with Confidence",
    description: "Push your code and let FlowForge handle the rest. Each build runs in a fresh environment, eliminating flaky tests.",
    icon: <CheckCircle className="h-10 w-10 text-emerald-500" />
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={flowForgeImages.howItWorks} 
          alt="CI/CD Pipeline" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white to-white/90 dark:from-gray-900 dark:to-gray-900/90" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            Get Started in Minutes
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            FlowForge makes setting up a professional CI/CD pipeline simple and straightforward. No DevOps expertise required.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transform -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative"
              >
                {/* Step number badge */}
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600 text-white h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                  {step.number}
                </div>
                
                <div className="text-center pt-4">
                  <div className="flex justify-center mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>

                {/* Interactive elements for each step */}
                {index === 0 && (
                  <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <Github className="h-4 w-4" />
                      <span>flowforge/web-frontend</span>
                      <GitBranch className="h-4 w-4 ml-2" />
                      <span>main</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Last commit: 2 hours ago
                    </div>
                  </div>
                )}

                {index === 1 && (
                  <div className="mt-6 bg-gray-900 p-3 rounded-lg text-xs font-mono text-green-400 overflow-hidden">
                    <pre>
                      <code>{`version: '1'
pipeline:
  image: node:16
  steps:
    - name: Install
      run: npm ci
    - name: Test
      run: npm test
    - name: Build
      run: npm run build`}</code>
                    </pre>
                  </div>
                )}

                {index === 2 && (
                  <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Build #127 passed</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Deploy to production successful</span>
                      <span className="ml-auto">2 min ago</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Link href="/docs">
            <motion.a 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Documentation
            </motion.a>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
