import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { flowForgeImages } from '../../utils/images';
import { useLocation } from 'wouter';

// Define a props interface to receive the auth modal control functions
interface CTASectionProps {
  openAuthModal?: (mode: 'login' | 'register') => void;
}

export default function CTASection({ openAuthModal }: CTASectionProps = {}) {
  const [, setLocation] = useLocation();

  return (
    <section className="py-20 relative">
      {/* Background with image and overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={flowForgeImages.cta} 
          alt="CI/CD Pipeline" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-violet-900/90" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Ship Faster?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers already using FlowForge to build, test, and deploy with confidence.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openAuthModal ? openAuthModal('register') : setLocation('/register')}
            className="px-8 py-4 bg-white text-blue-900 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center mx-auto"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.button>
          
          <p className="text-blue-200 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>

        {/* Animated particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 50 - 25],
                x: [0, Math.random() * 50 - 25],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
