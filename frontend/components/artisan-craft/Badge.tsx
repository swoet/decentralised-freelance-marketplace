import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Badge variants using CVA
const badgeVariants = cva(
  [
    'badge-craft',
    'relative inline-flex items-center justify-center',
    'font-accent font-semibold text-center',
    'transition-all duration-gentle ease-organic',
    'group'
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-br from-gold-500 to-mahogany-600',
          'text-neutral-50 shadow-craft-deep'
        ],
        primary: [
          'bg-gradient-to-br from-mahogany-500 to-copper-600',
          'text-neutral-50 shadow-craft-deep'
        ],
        secondary: [
          'bg-gradient-to-br from-copper-400 to-bronze-500',
          'text-neutral-50 shadow-craft-deep'
        ],
        success: [
          'bg-gradient-to-br from-forest-500 to-forest-600',
          'text-neutral-50 shadow-craft-deep'
        ],
        warning: [
          'bg-gradient-to-br from-bronze-500 to-bronze-600',
          'text-neutral-50 shadow-craft-deep'
        ],
        accent: [
          'bg-gradient-to-br from-gold-400 to-gold-600',
          'text-mahogany-800 shadow-craft-deep'
        ],
        outline: [
          'bg-transparent border-2 border-mahogany-400',
          'text-mahogany-600 shadow-craft-soft',
          'hover:bg-mahogany-50'
        ],
        subtle: [
          'bg-mahogany-100 text-mahogany-700',
          'shadow-craft-soft hover:shadow-craft-warm'
        ]
      },
      size: {
        xs: 'px-2 py-1 min-w-[40px] min-h-[40px] text-xs',
        sm: 'px-3 py-2 min-w-[50px] min-h-[50px] text-sm',
        md: 'px-4 py-2 min-w-[60px] min-h-[60px] text-sm',
        lg: 'px-5 py-3 min-w-[70px] min-h-[70px] text-base',
        xl: 'px-6 py-4 min-w-[80px] min-h-[80px] text-lg'
      },
      shape: {
        circle: 'rounded-full',
        wax: 'rounded-organic-wax',
        organic: 'rounded-organic-craft',
        square: 'rounded-lg',
        shield: 'rounded-t-full rounded-b-lg'
      },
      interactive: {
        none: '',
        hover: 'hover:scale-105 cursor-pointer',
        press: 'hover:scale-105 active:scale-95 cursor-pointer',
        float: 'hover:scale-110 hover:-translate-y-1 cursor-pointer'
      },
      glow: {
        none: '',
        soft: 'hover:shadow-craft-warm',
        medium: 'hover:shadow-craft-deep',
        strong: 'hover:shadow-2xl'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'circle',
      interactive: 'hover',
      glow: 'soft'
    }
  }
);

// Badge component interface
export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
  icon?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

// Main Badge component
const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      interactive,
      glow,
      children,
      icon,
      removable = false,
      onRemove,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          badgeVariants({ variant, size, shape, interactive, glow }),
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Border ring effect */}
        {variant !== 'outline' && (
          <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-copper-500 rounded-[inherit] -z-10 group-hover:border-gold-400 transition-colors duration-gentle" />
        )}
        
        {/* Craft texture overlay */}
        <div className="absolute inset-0 bg-craft-texture opacity-10 rounded-[inherit] pointer-events-none" />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out rounded-[inherit] pointer-events-none" />
        
        {/* Content */}
        <div className="relative flex items-center justify-center gap-1 z-10">
          {icon && (
            <span className="flex-shrink-0 transition-transform duration-gentle group-hover:scale-110">
              {icon}
            </span>
          )}
          <span className="transition-transform duration-gentle group-hover:scale-105">
            {children}
          </span>
          {removable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="ml-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black/20 transition-colors duration-gentle"
              aria-label="Remove badge"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge component for specific status indicators
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'draft';
}

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as const, children: 'Active' },
      inactive: { variant: 'subtle' as const, children: 'Inactive' },
      pending: { variant: 'warning' as const, children: 'Pending' },
      completed: { variant: 'success' as const, children: 'Completed' },
      cancelled: { variant: 'outline' as const, children: 'Cancelled' },
      draft: { variant: 'subtle' as const, children: 'Draft' }
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        {...props}
      >
        {config.children}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Notification Badge component for counts
export interface NotificationBadgeProps extends Omit<BadgeProps, 'children' | 'size'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const NotificationBadge = forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ count, max = 99, showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        size="xs"
        variant="accent"
        shape="circle"
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

NotificationBadge.displayName = 'NotificationBadge';

// Skill Badge component for user skills/tags
export interface SkillBadgeProps extends Omit<BadgeProps, 'variant' | 'shape'> {
  skill: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified?: boolean;
}

export const SkillBadge = forwardRef<HTMLDivElement, SkillBadgeProps>(
  ({ skill, level, verified = false, ...props }, ref) => {
    const levelConfig = {
      beginner: { variant: 'subtle' as const },
      intermediate: { variant: 'secondary' as const },
      advanced: { variant: 'primary' as const },
      expert: { variant: 'accent' as const }
    };

    const config = level ? levelConfig[level] : { variant: 'default' as const };

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        shape="organic"
        size="sm"
        icon={verified ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : undefined}
        {...props}
      >
        {skill}
      </Badge>
    );
  }
);

SkillBadge.displayName = 'SkillBadge';

// Badge Group component for organizing multiple badges
export interface BadgeGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
  className?: string;
}

export const BadgeGroup = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  wrap = true,
  className
}: BadgeGroupProps) => {
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        wrap && 'flex-wrap',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Badge, badgeVariants };
