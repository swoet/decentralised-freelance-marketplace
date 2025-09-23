import React, { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Input variants using CVA
const inputVariants = cva(
  [
    'input-craft',
    'w-full font-body text-base',
    'transition-all duration-gentle ease-organic',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:transition-colors placeholder:duration-gentle'
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-surface-background bg-paper-texture',
          'border-2 border-mahogany-300 text-text-primary',
          'placeholder:text-text-muted',
          'focus:border-gold-500 focus:ring-3 focus:ring-gold-500/20',
          'hover:border-mahogany-400'
        ],
        filled: [
          'bg-mahogany-50 bg-craft-texture',
          'border-2 border-mahogany-200 text-text-primary',
          'placeholder:text-text-muted',
          'focus:border-gold-500 focus:ring-3 focus:ring-gold-500/20 focus:bg-white',
          'hover:border-mahogany-300 hover:bg-mahogany-100'
        ],
        outlined: [
          'bg-transparent border-2 border-mahogany-400',
          'text-text-primary placeholder:text-text-muted',
          'focus:border-gold-500 focus:ring-3 focus:ring-gold-500/20',
          'hover:border-mahogany-500'
        ],
        minimal: [
          'bg-transparent border-0 border-b-2 border-mahogany-300',
          'text-text-primary placeholder:text-text-muted rounded-none',
          'focus:border-gold-500 focus:ring-0',
          'hover:border-mahogany-400'
        ],
        craft: [
          'bg-gradient-to-br from-neutral-50 to-gold-50',
          'bg-leather-texture border-2 border-copper-300',
          'text-text-primary placeholder:text-text-muted',
          'focus:border-gold-500 focus:ring-3 focus:ring-gold-500/20',
          'hover:border-copper-400'
        ]
      },
      size: {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-3 text-base min-h-[44px]',
        lg: 'px-5 py-4 text-lg min-h-[52px]'
      },
      shape: {
        rounded: 'rounded-md',
        organic: 'rounded-organic-craft',
        leaf: 'rounded-organic-leaf',
        pill: 'rounded-full',
        square: 'rounded-none'
      },
      state: {
        default: '',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
        success: 'border-forest-500 focus:border-forest-500 focus:ring-forest-500/20',
        warning: 'border-bronze-500 focus:border-bronze-500 focus:ring-bronze-500/20'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
      state: 'default'
    }
  }
);

// Input component interface
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  fullWidth?: boolean;
}

// Main Input component
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      state,
      label,
      description,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine state based on props
    const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;
    const statusMessage = error || success || warning;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-text-primary',
              'transition-colors duration-gentle',
              isFocused && 'text-gold-600'
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left addon */}
          {leftAddon && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center">
              <div className="px-3 py-2 bg-mahogany-100 border-r-2 border-mahogany-300 rounded-l-[inherit] text-text-secondary text-sm font-medium">
                {leftAddon}
              </div>
            </div>
          )}

          {/* Left icon */}
          {leftIcon && !leftAddon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted transition-colors duration-gentle">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant, size, shape, state: currentState }),
              leftIcon && !leftAddon && 'pl-10',
              rightIcon && !rightAddon && 'pr-10',
              leftAddon && 'pl-20',
              rightAddon && 'pr-20',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && !rightAddon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted transition-colors duration-gentle">
              {rightIcon}
            </div>
          )}

          {/* Right addon */}
          {rightAddon && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center">
              <div className="px-3 py-2 bg-mahogany-100 border-l-2 border-mahogany-300 rounded-r-[inherit] text-text-secondary text-sm font-medium">
                {rightAddon}
              </div>
            </div>
          )}

          {/* Focus ring overlay */}
          {isFocused && (
            <div className="absolute inset-0 rounded-[inherit] ring-3 ring-gold-500/20 pointer-events-none" />
          )}
        </div>

        {/* Description */}
        {description && !statusMessage && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}

        {/* Status message */}
        {statusMessage && (
          <p
            className={cn(
              'text-sm font-medium flex items-center gap-2',
              error && 'text-red-600',
              success && 'text-forest-600',
              warning && 'text-bronze-600'
            )}
          >
            {/* Status icon */}
            {error && (
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {success && (
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {warning && (
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {statusMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      shape,
      state,
      label,
      description,
      error,
      success,
      warning,
      resize = 'vertical',
      fullWidth = true,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;
    const statusMessage = error || success || warning;

    const resizeClasses = {
      none: 'resize-none',
      both: 'resize',
      horizontal: 'resize-x',
      vertical: 'resize-y'
    };

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-text-primary',
              'transition-colors duration-gentle',
              isFocused && 'text-gold-600'
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea container */}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            className={cn(
              inputVariants({ variant, shape, state: currentState }),
              resizeClasses[resize],
              'min-h-[100px]',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Focus ring overlay */}
          {isFocused && (
            <div className="absolute inset-0 rounded-[inherit] ring-3 ring-gold-500/20 pointer-events-none" />
          )}
        </div>

        {/* Description */}
        {description && !statusMessage && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}

        {/* Status message */}
        {statusMessage && (
          <p
            className={cn(
              'text-sm font-medium flex items-center gap-2',
              error && 'text-red-600',
              success && 'text-forest-600',
              warning && 'text-bronze-600'
            )}
          >
            {statusMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Input Group component for related inputs
export interface InputGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const InputGroup = ({
  children,
  orientation = 'vertical',
  spacing = 'md',
  className
}: InputGroupProps) => {
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
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Input, inputVariants };
