import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "How is FlowForge different from GitHub Actions?",
    answer: "FlowForge provides completely isolated, ephemeral environments for each build, eliminating inconsistent behavior and flaky tests. Unlike GitHub Actions, we offer advanced caching, parallel builds, and enterprise features like SAML SSO and custom infrastructure options. Our platform is also cloud-agnostic, allowing you to run builds on AWS, GCP, or Azure."
  },
  {
    question: "What does 'ephemeral environments' mean?",
    answer: "Ephemeral environments are fresh, isolated environments created for each build and destroyed afterward. This means every build starts with a clean slate, preventing issues caused by leaked state or side effects from previous builds. This approach eliminates the 'works on my machine' problem and ensures consistent, reliable results."
  },
  {
    question: "Can I migrate from my current CI/CD tool?",
    answer: "Yes! We've designed FlowForge to make migration as seamless as possible. Our configuration format is compatible with most popular CI/CD tools, and we provide migration guides for GitHub Actions, CircleCI, Jenkins, and others. Our team can also assist with complex migrations through our professional services."
  },
  {
    question: "Do you support private repositories?",
    answer: "Absolutely. FlowForge securely integrates with private repositories from GitHub, GitLab, and Bitbucket. We use OAuth or deploy keys for authentication and never store your source code longer than necessary to complete builds. All data is encrypted both in transit and at rest."
  },
  {
    question: "What programming languages are supported?",
    answer: "FlowForge supports all major programming languages and frameworks including Node.js, Python, Ruby, Java, Go, .NET, PHP, and more. Our environments can be customized with specific versions and dependencies to match your exact requirements."
  },
  {
    question: "How does pricing work?",
    answer: "Our pricing is based primarily on build minutes consumed, with additional factors like concurrent builds and retention period. You only pay for what you use, and we provide clear usage metrics and cost forecasting tools. All plans include a free monthly allowance of build minutes, and unused minutes do not roll over to the next month."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, all plans include a 14-day free trial with no credit card required. During the trial, you'll have access to all features of the selected plan with a generous allocation of build minutes to thoroughly test the platform with your projects."
  },
  {
    question: "What support options are available?",
    answer: "All paid plans include email support with varying response times based on plan level. The Team and Enterprise plans include priority support with faster SLAs. Enterprise customers receive dedicated support channels including phone support and a named account manager. We also offer comprehensive documentation, tutorials, and a community forum for all users."
  }
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Everything you need to know about FlowForge. Can't find the answer you're looking for? Contact our support team.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full text-left py-4 focus:outline-none"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {faq.question}
                </h3>
                {activeIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-700 dark:text-gray-300 pb-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Still have questions?
          </p>
          <motion.a 
            href="mailto:support@flowforge.dev" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Support
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
