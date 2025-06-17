import { motion } from 'framer-motion';
import { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import PricingSection from '../components/sections/PricingSection';
import FAQSection from '../components/sections/FAQSection';
import CTASection from '../components/sections/CTASection';
import Footer from '../components/sections/Footer';
import AuthModal from '../components/auth-modal';

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 min-h-screen"
    >
      <Header openAuthModal={openAuthModal} />
      <HeroSection openAuthModal={openAuthModal} />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection openAuthModal={openAuthModal} />
      <FAQSection />
      <CTASection openAuthModal={openAuthModal} />
      <Footer />
      
      {/* Global Auth Modal */}
      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </motion.div>
  );
}
