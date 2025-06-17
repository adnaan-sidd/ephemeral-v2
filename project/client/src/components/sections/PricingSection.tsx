import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useLocation } from 'wouter';

// Define a props interface to receive the auth modal control functions
interface PricingSectionProps {
  openAuthModal?: (mode: 'login' | 'register') => void;
}

const pricingTiers = [
  {
    name: "Starter",
    price: 20,
    description: "Perfect for side projects and small teams",
    features: [
      "1,000 build minutes",
      "3 concurrent builds",
      "10 projects",
      "7-day build history",
      "Community support",
      "Standard environments"
    ],
    highlighted: false,
    cta: "Start Free Trial"
  },
  {
    name: "Professional",
    price: 50,
    description: "For growing teams with more demanding needs",
    features: [
      "3,000 build minutes",
      "5 concurrent builds",
      "Unlimited projects",
      "30-day build history",
      "Priority support",
      "Custom environments",
      "Build caching",
      "Advanced analytics"
    ],
    highlighted: true,
    cta: "Start Free Trial"
  },
  {
    name: "Team",
    price: 200,
    description: "For larger teams with complex workflows",
    features: [
      "10,000 build minutes",
      "10 concurrent builds",
      "Unlimited projects",
      "90-day build history",
      "Priority support",
      "Custom environments",
      "Build caching",
      "Advanced analytics",
      "SAML SSO",
      "Dedicated support"
    ],
    highlighted: false,
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: null,
    description: "For organizations with custom requirements",
    features: [
      "Unlimited build minutes",
      "Unlimited concurrent builds",
      "Unlimited projects",
      "1-year build history",
      "24/7 support",
      "Custom environments",
      "Build caching",
      "Advanced analytics",
      "SAML SSO",
      "Dedicated support",
      "Custom integrations",
      "On-premises option",
      "SLA guarantee"
    ],
    highlighted: false,
    cta: "Contact Sales"
  }
];

export default function PricingSection({ openAuthModal }: PricingSectionProps = {}) {
  const [annual, setAnnual] = useState(false);
  const [, setLocation] = useLocation();
  
  // Calculate the discount amount
  const discountPercentage = 20;
  const getDiscountedPrice = (price: number) => {
    return Math.round(price * (1 - discountPercentage / 100) * 12) / 12;
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            No hidden fees or surprises. Choose the plan that works for your team.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`text-sm ${!annual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <label className="mx-4 relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={annual}
                onChange={() => setAnnual(!annual)}
              />
              <motion.div 
                className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-violet-600"
                layout
              />
            </label>
            <span className={`text-sm ${annual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              Annual <span className="text-green-500 ml-1">Save {discountPercentage}%</span>
            </span>
          </div>
        </motion.div>
        
        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border ${
                tier.highlighted 
                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400' 
                : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {tier.highlighted && (
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[40px]">
                  {tier.description}
                </p>
                
                {tier.price ? (
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${annual ? getDiscountedPrice(tier.price) : tier.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        / mo
                      </span>
                    </div>
                    {annual && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Billed annually (${tier.price * 12 * (1 - discountPercentage / 100)}/year)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        Custom
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tailored to your needs
                    </p>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (tier.cta === "Contact Sales") {
                      window.location.href = "mailto:sales@flowforge.dev";
                    } else {
                      if (openAuthModal) {
                        openAuthModal('register');
                      } else {
                        setLocation('/register');
                      }
                    }
                  }}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    tier.highlighted
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tier.cta}
                </motion.button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <ul className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* FAQ link */}
        <div className="text-center mt-12">
          <a 
            href="#faq" 
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center font-medium"
          >
            Have questions? Check our FAQ
          </a>
        </div>
      </div>
    </section>
  );
}
