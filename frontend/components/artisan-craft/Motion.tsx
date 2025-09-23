import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Animation presets for common Artisan Craft motions
export const motionPresets = {
  // Entrance animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 600, easing: 'ease-organic' }
  },
  slideInUp: {
    initial: { opacity: 0, transform: 'translateY(30px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
    transition: { duration: 600, easing: 'ease-organic' }
  },
  slideInDown: {
    initial: { opacity: 0, transform: 'translateY(-30px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
    transition: { duration: 600, easing: 'ease-organic' }
  },
  scaleIn: {
    initial: { opacity: 0, transform: 'scale(0.9)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 400, easing: 'ease-bounce' }
  },
  grow: {
    initial: { opacity: 0, transform: 'scale(0)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 800, easing: 'ease-bounce' }
  },
  
  // Craft-specific animations
  handwrite: {
    initial: { strokeDashoffset: '100%', opacity: 0 },
    animate: { strokeDashoffset: '0%', opacity: 1 },
    transition: { duration: 2000, easing: 'ease-in-out' }
  },
  sway: {
    animate: { transform: 'rotate(-2deg)' },
    transition: { duration: 3000, easing: 'ease-in-out', repeat: 'infinite', direction: 'alternate' }
  },
  shimmer: {
    animate: { transform: 'translateX(100%)' },
    transition: { duration: 2000, easing: 'linear', repeat: 'infinite' }
  },
  
  // Hover animations
  lift: {
    hover: { transform: 'translateY(-4px) scale(1.02)' },
    transition: { duration: 300, easing: 'ease-organic' }
  },
  float: {
    hover: { transform: 'translateY(-8px) rotate(1deg)' },
    transition: { duration: 400, easing: 'ease-organic' }
  },
  
  // Exit animations
  fadeOut: {
    exit: { opacity: 0 },
    transition: { duration: 400, easing: 'ease-organic' }
  },
  slideOutUp: {
    exit: { opacity: 0, transform: 'translateY(-30px)' },
    transition: { duration: 400, easing: 'ease-organic' }
  },
  scaleOut: {
    exit: { opacity: 0, transform: 'scale(0.9)' },
    transition: { duration: 300, easing: 'ease-organic' }
  }
};

// Motion component interface
export interface MotionProps {
  children: ReactNode;
  preset?: keyof typeof motionPresets;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  hover?: Record<string, any>;
  transition?: {
    duration?: number;
    delay?: number;
    easing?: string;
    repeat?: 'infinite' | number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  };
  trigger?: 'mount' | 'viewport' | 'hover' | 'manual';
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

// Main Motion component
export const Motion: React.FC<MotionProps> = ({
  children,
  preset,
  initial,
  animate,
  exit,
  hover,
  transition,
  trigger = 'mount',
  threshold = 0.1,
  className,
  style,
  onAnimationComplete
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Get motion configuration
  const config = preset ? motionPresets[preset] : {};
  const finalInitial = initial || config?.initial || {};
  const finalAnimate = animate || config?.animate || {};
  const finalExit = exit || config?.exit || {};
  const finalHover = hover || config?.hover || {};
  const finalTransition = { ...(config?.transition || {}), ...transition };

  // Intersection Observer for viewport trigger
  useEffect(() => {
    if (trigger !== 'viewport') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [trigger, threshold, hasAnimated]);

  // Determine current animation state
  const shouldAnimate = 
    trigger === 'mount' ||
    (trigger === 'viewport' && isInView) ||
    (trigger === 'hover' && isHovered);

  const currentStyles = shouldAnimate 
    ? { ...finalInitial, ...finalAnimate }
    : finalInitial;

  const hoverStyles = isHovered ? finalHover : {};

  // Convert easing to CSS
  const getEasing = (easing?: string) => {
    const easings: Record<string, string> = {
      'ease-organic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'ease-craft': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      'ease-gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      'ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };
    return easings[easing || 'ease-organic'] || easing || 'ease';
  };

  // Build CSS transition
  const buildTransition = () => {
    const duration = `${finalTransition.duration || 600}ms`;
    const delay = finalTransition.delay ? `${finalTransition.delay}ms` : '0ms';
    const easing = getEasing(finalTransition.easing);
    
    return `all ${duration} ${easing} ${delay}`;
  };

  // Handle animation completion
  useEffect(() => {
    if (shouldAnimate && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, (finalTransition.duration || 600) + (finalTransition.delay || 0));
      
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, finalTransition.duration, finalTransition.delay, onAnimationComplete]);

  return (
    <div
      ref={elementRef}
      className={cn('transition-all', className)}
      style={{
        ...style,
        ...currentStyles,
        ...hoverStyles,
        transition: buildTransition(),
        animationIterationCount: finalTransition.repeat === 'infinite' ? 'infinite' : finalTransition.repeat || 1,
        animationDirection: finalTransition.direction || 'normal'
      }}
      onMouseEnter={() => {
        if (trigger === 'hover' || hover) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (trigger === 'hover' || hover) {
          setIsHovered(false);
        }
      }}
    >
      {children}
    </div>
  );
};

// Stagger container for animating multiple children
export interface StaggerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 100,
  className
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <Motion
          key={index}
          preset="fadeIn"
          transition={{ delay: index * staggerDelay }}
          trigger="viewport"
        >
          {child}
        </Motion>
      ))}
    </div>
  );
};

// Parallax component for scroll-based animations
export interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;

      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(${offset}px)`;
      case 'down':
        return `translateY(${-offset}px)`;
      case 'left':
        return `translateX(${offset}px)`;
      case 'right':
        return `translateX(${-offset}px)`;
      default:
        return `translateY(${offset}px)`;
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: getTransform(),
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
};

// Morphing component for shape transitions
export interface MorphProps {
  children: ReactNode;
  from: string;
  to: string;
  trigger?: 'hover' | 'click' | 'auto';
  duration?: number;
  className?: string;
}

export const Morph: React.FC<MorphProps> = ({
  children,
  from,
  to,
  trigger = 'hover',
  duration = 600,
  className
}) => {
  const [isTransformed, setIsTransformed] = useState(false);

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsTransformed(!isTransformed);
    } else if (trigger === 'hover') {
      setIsTransformed(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsTransformed(false);
    }
  };

  useEffect(() => {
    if (trigger === 'auto') {
      const timer = setTimeout(() => setIsTransformed(true), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div
      className={cn('transition-all ease-organic', className)}
      style={{
        clipPath: isTransformed ? to : from,
        transitionDuration: `${duration}ms`
      }}
      onClick={handleTrigger}
      onMouseEnter={handleTrigger}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

// Handwriting animation component
export interface HandwritingProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const Handwriting: React.FC<HandwritingProps> = ({
  text,
  speed = 50,
  className,
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={cn('font-accent italic', className)}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Craft-specific animation utilities
export const craftAnimations = {
  // Wax seal animation
  sealStamp: (element: HTMLElement) => {
    element.style.transform = 'scale(1.2) rotate(-5deg)';
    element.style.transition = 'transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    setTimeout(() => {
      element.style.transform = 'scale(1) rotate(0deg)';
    }, 150);
  },

  // Paper fold animation
  paperFold: (element: HTMLElement) => {
    element.style.transformOrigin = 'top left';
    element.style.transform = 'perspective(1000px) rotateX(-90deg)';
    element.style.transition = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    setTimeout(() => {
      element.style.transform = 'perspective(1000px) rotateX(0deg)';
    }, 100);
  },

  // Ink drop animation
  inkDrop: (element: HTMLElement) => {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(139, 69, 19, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 600ms ease-out';
    ripple.style.pointerEvents = 'none';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
};

export default Motion;
