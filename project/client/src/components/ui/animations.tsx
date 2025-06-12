import { motion } from "framer-motion";
import React from "react";

interface AnimationProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = "" }: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({ children, delay = 0, className = "" }: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className = "" }: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredChildren({ children, staggerDelay = 0.1 }: { children: React.ReactNode, staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Animated background with floating particles
export function ParticleBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="relative w-full h-full">
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} />
        ))}
      </div>
    </div>
  );
}

function Particle() {
  const size = Math.random() * 8 + 4; // 4-12px
  const duration = Math.random() * 20 + 10; // 10-30s
  const initialX = Math.random() * 100; // 0-100%
  const initialY = Math.random() * 100; // 0-100%
  const delay = Math.random() * -30; // Negative delay for smoother start
  
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20"
      style={{
        width: size,
        height: size,
        top: `${initialY}%`,
        left: `${initialX}%`,
      }}
      animate={{
        x: [0, Math.random() * 200 - 100],
        y: [0, Math.random() * 200 - 100],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    />
  );
}
