import React from 'react';
import { motion } from 'framer-motion';

interface CraftNexusLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  animated?: boolean;
  className?: string;
}

const CraftNexusLogo: React.FC<CraftNexusLogoProps> = ({
  size = 'md',
  variant = 'full',
  animated = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const LogoIcon = () => (
    <motion.svg
      className={`${sizeClasses[size]} text-craft-gold-500`}
      viewBox="0 0 100 100"
      fill="currentColor"
      initial={animated ? { scale: 0, rotate: -180 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={{ 
        duration: 0.8, 
        ease: [0.68, -0.55, 0.265, 1.55] 
      }}
    >
      {/* Hexagonal Nexus Pattern */}
      <motion.path
        d="M50 10 L75 25 L75 50 L50 65 L25 50 L25 25 Z"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        initial={animated ? { pathLength: 0 } : {}}
        animate={animated ? { pathLength: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.3 }}
      />
      
      {/* Inner Craft Tools */}
      <motion.g
        initial={animated ? { opacity: 0, scale: 0.5 } : {}}
        animate={animated ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {/* Hammer */}
        <path d="M35 35 L45 25 L55 35 L45 45 Z" fill="var(--craft-mahogany-600)" />
        {/* Chisel */}
        <path d="M55 45 L65 35 L65 55 L55 65 Z" fill="var(--craft-copper-500)" />
        {/* Brush */}
        <circle cx="40" cy="60" r="8" fill="var(--craft-gold-600)" />
      </motion.g>
      
      {/* Connection Lines */}
      <motion.g
        stroke="var(--craft-copper-400)"
        strokeWidth="2"
        fill="none"
        initial={animated ? { opacity: 0 } : {}}
        animate={animated ? { opacity: 0.6 } : {}}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <line x1="50" y1="25" x2="50" y2="50" />
        <line x1="37.5" y1="37.5" x2="62.5" y2="62.5" />
        <line x1="62.5" y1="37.5" x2="37.5" y2="62.5" />
      </motion.g>
    </motion.svg>
  );

  const LogoText = () => (
    <motion.div
      className={`font-display font-bold ${textSizeClasses[size]} text-craft-mahogany-800`}
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <span className="text-craft-mahogany-800">Craft</span>
      <span className="text-craft-gold-600">Nexus</span>
    </motion.div>
  );

  const Tagline = () => (
    <motion.div
      className={`font-accent text-craft-copper-600 ${
        size === 'xl' ? 'text-lg' : size === 'lg' ? 'text-base' : 'text-sm'
      }`}
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: 1.4 }}
    >
      Where Artisans Connect
    </motion.div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <LogoText />
        {(size === 'lg' || size === 'xl') && <Tagline />}
      </div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-3 ${className}`}
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      <LogoIcon />
      <div className="flex flex-col">
        <LogoText />
        {(size === 'lg' || size === 'xl') && <Tagline />}
      </div>
    </motion.div>
  );
};

export default CraftNexusLogo;
