import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Card variants using CVA
const cardVariants = cva(
  [
    'card-craft',
    'relative overflow-hidden',
    'transition-all duration-gentle ease-organic',
    'group'
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-surface-primary bg-craft-texture',
          'border-2 border-mahogany-200',
          'shadow-craft-soft hover:shadow-craft-warm',
          'hover:border-copper-300'
        ],
        elevated: [
          'bg-white bg-paper-texture',
          'border-2 border-mahogany-300',
          'shadow-craft-warm hover:shadow-craft-deep',
          'hover:border-gold-400'
        ],
        outlined: [
          'bg-transparent border-2 border-mahogany-400',
          'hover:bg-mahogany-50 hover:border-mahogany-500',
          'shadow-none hover:shadow-craft-soft'
        ],
        filled: [
          'bg-gradient-to-br from-mahogany-50 to-copper-50',
          'border-2 border-mahogany-200',
          'shadow-craft-soft hover:shadow-craft-warm',
          'hover:from-mahogany-100 hover:to-copper-100'
        ],
        leather: [
          'bg-gradient-to-br from-mahogany-100 to-copper-100',
          'bg-leather-texture border-2 border-mahogany-300',
          'shadow-craft-warm hover:shadow-craft-deep',
          'hover:from-mahogany-200 hover:to-copper-200'
        ],
        parchment: [
          'bg-gradient-to-br from-neutral-50 to-gold-50',
          'bg-paper-texture border-2 border-gold-200',
          'shadow-craft-soft hover:shadow-craft-warm',
          'hover:border-gold-300'
        ]
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      shape: {
        rounded: 'rounded-lg',
        organic: 'rounded-organic-craft',
        leaf: 'rounded-organic-leaf',
        square: 'rounded-none',
        pill: 'rounded-3xl'
      },
      interactive: {
        none: '',
        hover: 'hover:-translate-y-1 cursor-pointer',
        press: 'hover:-translate-y-1 active:translate-y-0 active:shadow-craft-soft cursor-pointer',
        float: 'hover:-translate-y-2 hover:rotate-1 cursor-pointer'
      },
      texture: {
        none: '',
        paper: 'bg-paper-texture',
        craft: 'bg-craft-texture',
        leather: 'bg-leather-texture'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
      interactive: 'hover',
      texture: 'craft'
    }
  }
);

// Card component interface
export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  asChild?: boolean;
}

// Main Card component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      interactive,
      texture,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          cardVariants({ variant, size, shape, interactive, texture }),
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Gradient border effect */}
        {variant !== 'outlined' && (
          <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 bg-gradient-to-br from-gold-500 to-copper-500 -z-10 rounded-[inherit] opacity-60" />
        )}
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -z-5 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
        
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  divided?: boolean;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, divided = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          divided && 'pb-4 border-b-2 border-mahogany-200 mb-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Title component
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'heading-craft text-xl font-display font-bold text-text-primary leading-tight tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// Card Description component
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'body-craft text-text-secondary leading-relaxed',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

// Card Content component
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  divided?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, divided = false, justify = 'start', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-4',
          justifyClasses[justify],
          divided && 'pt-4 border-t-2 border-mahogany-200 mt-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Card Badge component (for status indicators)
export interface CardBadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CardBadge = forwardRef<HTMLDivElement, CardBadgeProps>(
  ({ className, children, variant = 'default', position = 'top-right', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-gradient-to-br from-mahogany-500 to-copper-600 text-neutral-50',
      success: 'bg-gradient-to-br from-forest-500 to-forest-600 text-neutral-50',
      warning: 'bg-gradient-to-br from-bronze-500 to-bronze-600 text-neutral-50',
      accent: 'bg-gradient-to-br from-gold-400 to-gold-600 text-mahogany-800'
    };

    const positionClasses = {
      'top-left': 'top-2 left-2',
      'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-right': 'bottom-2 right-2'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-10 px-2 py-1 text-xs font-semibold rounded-full',
          'shadow-craft-soft border-2 border-white/20',
          variantClasses[variant],
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBadge.displayName = 'CardBadge';

// Card Image component
export interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'golden' | 'card';
  objectFit?: 'cover' | 'contain' | 'fill';
}

const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, aspectRatio = 'card', objectFit = 'cover', ...props }, ref) => {
    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      golden: 'aspect-golden',
      card: 'aspect-card'
    };

    const objectFitClasses = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-organic-gentle',
          aspectClasses[aspectRatio],
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full transition-transform duration-gentle group-hover:scale-105',
            objectFitClasses[objectFit]
          )}
        />
        {/* Overlay gradient for better text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-gentle" />
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

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
};
