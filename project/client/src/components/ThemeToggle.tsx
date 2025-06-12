import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10"></div>; // Placeholder to prevent layout shift
  }

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.button
      onClick={toggleDarkMode}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
      aria-label="Toggle theme"
    >
      <Sun className={`h-5 w-5 text-yellow-500 transition-opacity ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
      <Moon className={`absolute top-2 left-2 h-5 w-5 text-blue-300 transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
    </motion.button>
  );
}
