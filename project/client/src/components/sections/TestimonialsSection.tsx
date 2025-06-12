import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { flowForgeImages } from '../../utils/images';
import { companyLogos } from '../../utils/images';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Lead Developer",
    company: "TechCorp",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    testimonial: "FlowForge cut our deployment time in half. The ephemeral environments eliminated our flaky test issues completely.",
    stars: 5
  },
  {
    name: "Mike Rodriguez",
    role: "DevOps Engineer",
    company: "StartupXYZ",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    testimonial: "Finally, a CI/CD platform that just works. No more debugging mysterious failures. The logs are clear and the UI is intuitive.",
    stars: 5
  },
  {
    name: "Jennifer Park",
    role: "CTO",
    company: "InnovateLabs",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    testimonial: "The pricing is transparent and the performance is incredible. Best investment we've made. Our team productivity increased by 30%.",
    stars: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 relative">
      {/* Background with image and overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={flowForgeImages.testimonials} 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90" />
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
            Trusted by Development Teams
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Join thousands of developers who've transformed their CI/CD pipelines with FlowForge.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative"
            >
              <div className="absolute -top-6 right-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white p-3 rounded-lg shadow-lg">
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.testimonial}"
              </p>
              
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20"
        >
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
            Trusted by companies worldwide
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center justify-center">
            {companyLogos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex justify-center p-4"
              >
                <img 
                  src={logo.url} 
                  alt={logo.name} 
                  className="h-8 object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
