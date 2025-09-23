// Artisan Craft Design System - Component Library Index
// Export all components for easy importing

// Core Components
export { Button, ButtonGroup, IconButton, buttonVariants } from './Button';
export type { ButtonProps, ButtonGroupProps, IconButtonProps } from './Button';

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter, 
  CardBadge, 
  CardImage,
  cardVariants 
} from './Card';
export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardDescriptionProps, 
  CardContentProps, 
  CardFooterProps, 
  CardBadgeProps, 
  CardImageProps 
} from './Card';

export { Input, Textarea, InputGroup, inputVariants } from './Input';
export type { InputProps, TextareaProps, InputGroupProps } from './Input';

export { 
  Badge, 
  StatusBadge, 
  NotificationBadge, 
  SkillBadge, 
  BadgeGroup,
  badgeVariants 
} from './Badge';
export type { 
  BadgeProps, 
  StatusBadgeProps, 
  NotificationBadgeProps, 
  SkillBadgeProps, 
  BadgeGroupProps 
} from './Badge';

// Motion Components
export { 
  Motion, 
  Stagger, 
  Parallax, 
  Morph, 
  Handwriting,
  motionPresets,
  craftAnimations
} from './Motion';
export type { 
  MotionProps, 
  StaggerProps, 
  ParallaxProps, 
  MorphProps, 
  HandwritingProps 
} from './Motion';

// Design Tokens (available in CSS variables and Tailwind config)
// Tokens are integrated via tailwind.config.js and CSS custom properties

// Utility functions for the design system
export const craftUtils = {
  // Generate organic border radius
  organicRadius: (base: number = 8) => ({
    borderRadius: `${base * 0.8}rem ${base * 1.2}rem ${base * 0.6}rem ${base * 1.4}rem`
  }),
  
  // Generate craft texture background
  craftTexture: (opacity: number = 0.05) => ({
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='${opacity}'%3E%3Cpolygon fill='%23000' points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`
  }),
  
  // Generate leather texture background
  leatherTexture: (opacity: number = 0.1) => ({
    backgroundImage: `linear-gradient(45deg, rgba(139, 69, 19, ${opacity}) 25%, transparent 25%), linear-gradient(-45deg, rgba(139, 69, 19, ${opacity}) 25%, transparent 25%)`
  }),
  
  // Generate paper texture background
  paperTexture: (opacity: number = 0.02) => ({
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-opacity='${opacity}'%3E%3Crect fill='%23000' width='1' height='1'/%3E%3C/g%3E%3C/svg%3E")`
  }),
  
  // Generate wax seal clip path
  waxSeal: () => ({
    clipPath: 'circle(50% at 50% 50%)'
  }),
  
  // Generate handwritten font stack
  handwrittenFont: () => ({
    fontFamily: '"Crimson Text", "Dancing Script", cursive'
  }),
  
  // Generate craft shadow
  craftShadow: (intensity: 'soft' | 'warm' | 'deep' = 'soft') => {
    const shadows = {
      soft: '0 2px 8px rgba(139, 69, 19, 0.15)',
      warm: '0 4px 12px rgba(210, 105, 30, 0.2)',
      deep: '0 8px 24px rgba(139, 69, 19, 0.25)'
    };
    return { boxShadow: shadows[intensity] };
  }
};

// Theme configuration for easy customization
export const craftTheme = {
  colors: {
    primary: '#8B4513',
    secondary: '#D2691E',
    accent: '#DAA520',
    success: '#228B22',
    warning: '#CD853F',
    background: '#FFF8DC',
    surface: '#F5F5DC'
  },
  
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    body: '"Source Sans Pro", -apple-system, sans-serif',
    accent: '"Crimson Text", Georgia, serif'
  },
  
  spacing: {
    xs: '0.3125rem',  // 5px
    sm: '0.625rem',   // 10px
    md: '0.9375rem',  // 15px
    lg: '1.5625rem',  // 25px
    xl: '2.5rem',     // 40px
    '2xl': '4.0625rem' // 65px
  },
  
  borderRadius: {
    gentle: '0.5rem 1rem 0.5rem 1rem',
    leaf: '1rem 0.5rem 1rem 0.5rem',
    craft: '0.8rem 1.2rem 0.6rem 1.4rem',
    wax: '50% 20% 50% 20%'
  },
  
  animation: {
    duration: {
      fast: '150ms',
      gentle: '400ms',
      normal: '600ms',
      slow: '800ms'
    },
    easing: {
      organic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      craft: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    }
  }
};

// Accessibility helpers
export const a11y = {
  // Screen reader only text
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0'
  },
  
  // Focus visible styles
  focusVisible: {
    outline: '2px solid #DAA520',
    outlineOffset: '2px',
    borderRadius: '0.25rem'
  },
  
  // High contrast mode support
  highContrast: {
    '@media (prefers-contrast: high)': {
      borderWidth: '2px',
      borderStyle: 'solid'
    }
  },
  
  // Reduced motion support
  reducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none'
    }
  }
};

// Performance optimization utilities
export const performance = {
  // Optimize for animations
  willChange: (properties: string[]) => ({
    willChange: properties.join(', ')
  }),
  
  // GPU acceleration
  gpuAcceleration: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    perspective: '1000px'
  },
  
  // Contain layout shifts
  containLayout: {
    contain: 'layout style paint'
  }
};

// Export everything as default for convenience
export default {
  craftUtils,
  craftTheme,
  a11y,
  performance
};
