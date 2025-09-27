import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../artisan-craft';

interface HeroSectionProps {
  variant?: 'default' | 'immersive' | 'minimal';
  title: string;
  subtitle?: string;
  description: string;
  primaryAction?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  backgroundImage?: string;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  variant = 'default',
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  backgroundImage,
  className = ''
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  };

  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-craft-gold-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );

  const ParallaxBackground = () => (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-craft-mahogany-50 via-craft-copper-50 to-craft-gold-50"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.5 }}
    />
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'immersive':
        return 'min-h-screen flex items-center justify-center relative overflow-hidden';
      case 'minimal':
        return 'py-16 px-4 text-center';
      default:
        return 'py-20 px-4 text-center relative';
    }
  };

  return (
    <section className={`${getVariantClasses()} ${className}`}>
      {variant === 'immersive' && (
        <>
          <ParallaxBackground />
          <FloatingElements />
        </>
      )}
      
      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {subtitle && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-craft-gold-100 text-craft-gold-800 rounded-full text-sm font-medium mb-6"
            variants={itemVariants}
          >
            <span className="w-2 h-2 bg-craft-gold-500 rounded-full animate-pulse"></span>
            {subtitle}
          </motion.div>
        )}

        <motion.h1
          className={`font-display font-bold text-craft-mahogany-800 mb-6 ${
            variant === 'immersive' 
              ? 'text-6xl md:text-8xl' 
              : variant === 'minimal'
              ? 'text-4xl md:text-5xl'
              : 'text-5xl md:text-7xl'
          }`}
          variants={titleVariants}
        >
          {title.split(' ').map((word, index) => (
            <motion.span
              key={index}
              className={index % 2 === 1 ? 'text-craft-gold-600' : ''}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.68, -0.55, 0.265, 1.55]
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className={`font-body text-craft-copper-700 max-w-4xl mx-auto leading-relaxed mb-10 ${
            variant === 'immersive' 
              ? 'text-xl md:text-2xl' 
              : 'text-lg md:text-xl'
          }`}
          variants={itemVariants}
        >
          {description}
        </motion.p>

        {(primaryAction || secondaryAction) && (
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            {primaryAction && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  shape="wax"
                  className="min-w-48 craft-magnetic"
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.text}
                </Button>
              </motion.div>
            )}
            
            {secondaryAction && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="lg"
                  shape="wax"
                  className="min-w-48 craft-magnetic"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.text}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {variant === 'immersive' && (
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-craft-gold-500 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-craft-gold-500 rounded-full mt-2 animate-pulse"></div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default HeroSection;
