import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles
  [
    'btn-craft',
    'relative inline-flex items-center justify-center',
    'font-body font-semibold text-base leading-none',
    'border-none cursor-pointer select-none',
    'transition-all duration-gentle ease-organic',
    'focus:outline-none focus:ring-3 focus:ring-gold-500/30',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'group overflow-hidden'
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-br from-mahogany-600 to-copper-500',
          'text-neutral-50 shadow-craft-soft',
          'hover:shadow-craft-warm hover:from-mahogany-700 hover:to-copper-600',
          'active:shadow-craft-soft'
        ],
        secondary: [
          'bg-gradient-to-br from-neutral-100 to-neutral-200',
          'text-mahogany-700 border-2 border-mahogany-300',
          'hover:from-neutral-200 hover:to-neutral-300 hover:border-mahogany-400',
          'shadow-craft-soft hover:shadow-craft-warm'
        ],
        accent: [
          'bg-gradient-to-br from-gold-400 to-gold-600',
          'text-mahogany-800 shadow-craft-soft',
          'hover:shadow-craft-warm hover:from-gold-500 hover:to-gold-700',
          'active:shadow-craft-soft'
        ],
        success: [
          'bg-gradient-to-br from-forest-500 to-forest-600',
          'text-neutral-50 shadow-craft-soft',
          'hover:shadow-craft-warm hover:from-forest-600 hover:to-forest-700',
          'active:shadow-craft-soft'
        ],
        warning: [
          'bg-gradient-to-br from-bronze-500 to-bronze-600',
          'text-neutral-50 shadow-craft-soft',
          'hover:shadow-craft-warm hover:from-bronze-600 hover:to-bronze-700',
          'active:shadow-craft-soft'
        ],
        ghost: [
          'bg-transparent text-mahogany-600',
          'hover:bg-mahogany-50 hover:text-mahogany-700',
          'border-2 border-transparent hover:border-mahogany-200'
        ],
        link: [
          'bg-transparent text-mahogany-600 underline-offset-4',
          'hover:underline hover:text-mahogany-700',
          'shadow-none hover:shadow-none p-0'
        ]
      },
      size: {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-6 py-3 text-base min-h-[44px]',
        lg: 'px-8 py-4 text-lg min-h-[52px]',
        xl: 'px-10 py-5 text-xl min-h-[60px]',
        icon: 'p-3 min-h-[44px] min-w-[44px]'
      },
      shape: {
        rounded: 'rounded-organic-craft',
        pill: 'rounded-full',
        square: 'rounded-md',
        leaf: 'rounded-organic-leaf',
        wax: 'rounded-organic-wax'
      },
      elevation: {
        flat: 'shadow-none hover:shadow-craft-soft',
        soft: 'shadow-craft-soft hover:shadow-craft-warm',
        medium: 'shadow-craft-warm hover:shadow-craft-deep',
        high: 'shadow-craft-deep hover:shadow-2xl'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'rounded',
      elevation: 'soft'
    }
  }
);

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Button component interface
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

// Main Button component
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      elevation,
      children,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, shape, elevation }),
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        type={type}
        {...props}
      >
        {/* Shimmer effect overlay */}
        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
        
        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <LoadingSpinner size={size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md'} />
              {loadingText && <span>{loadingText}</span>}
            </>
          ) : (
            <>
              {leftIcon && (
                <span className="flex-shrink-0 transition-transform duration-gentle group-hover:scale-110">
                  {leftIcon}
                </span>
              )}
              <span className="transition-transform duration-gentle group-hover:scale-105">
                {children}
              </span>
              {rightIcon && (
                <span className="flex-shrink-0 transition-transform duration-gentle group-hover:scale-110 group-hover:translate-x-0.5">
                  {rightIcon}
                </span>
              )}
            </>
          )}
        </span>
        
        {/* Craft texture overlay */}
        {variant !== 'ghost' && variant !== 'link' && (
          <>
            <span className="absolute top-0.5 left-0.5 right-0.5 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[inherit] pointer-events-none" />
            <span className="absolute inset-0 bg-craft-texture opacity-5 pointer-events-none" />
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button group component for related actions
export interface ButtonGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className
}: ButtonGroupProps) => {
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        spacingClasses[spacing],
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

// Icon button component
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', shape = 'rounded', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size === 'md' ? 'icon' : size}
        shape={shape}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { Button, buttonVariants };
