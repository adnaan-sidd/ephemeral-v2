import { motion } from 'framer-motion';
import { Zap, Server, DollarSign, Shield, Globe, BarChart } from 'lucide-react';
import { flowForgeImages } from '../../utils/images';

const features = [
  {
    icon: <Zap className="h-8 w-8 text-blue-500" />,
    title: "50% Faster Builds",
    description: "Our optimized infrastructure drastically reduces build times, getting your code to production faster than ever before."
  },
  {
    icon: <Server className="h-8 w-8 text-indigo-500" />,
    title: "Zero Infrastructure",
    description: "No server management or configuration needed. We handle all infrastructure so you can focus on your code."
  },
  {
    icon: <DollarSign className="h-8 w-8 text-emerald-500" />,
    title: "Transparent Pricing",
    description: "Simple, usage-based pricing with no hidden fees. Only pay for what you use, with predictable costs."
  },
  {
    icon: <Shield className="h-8 w-8 text-red-500" />,
    title: "Enterprise Security",
    description: "SOC 2 compliant with encrypted build environments and secure credential management built-in."
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Multi-Cloud Support",
    description: "Run your builds on AWS, GCP, or Azure. Seamlessly integrate with your existing cloud infrastructure."
  },
  {
    icon: <BarChart className="h-8 w-8 text-amber-500" />,
    title: "Real-time Insights",
    description: "Advanced analytics and reporting to help you optimize build performance and track usage."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={flowForgeImages.features} 
          alt="Abstract background" 
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/50" />
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
            Why Developers Choose FlowForge
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            FlowForge delivers a modern CI/CD experience that eliminates the headaches of traditional pipelines.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg inline-block mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
