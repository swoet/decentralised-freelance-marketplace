/** @type {import('tailwindcss').Config} */
const tokens = require('./styles/design-systems/artisan-craft/tokens');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/design-systems/artisan-craft/**/*.{js,ts,jsx,tsx,css}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Colors
      colors: {
        // Primitive colors
        mahogany: tokens.primitiveColors.mahogany,
        copper: tokens.primitiveColors.copper,
        gold: tokens.primitiveColors.gold,
        forest: tokens.primitiveColors.forest,
        bronze: tokens.primitiveColors.bronze,
        neutral: tokens.primitiveColors.neutral,
        
        // Semantic colors
        brand: tokens.semanticColors.brand,
        surface: tokens.semanticColors.surface,
        
        // Override default Tailwind colors with semantic tokens
        primary: tokens.semanticColors.brand.primary,
        secondary: tokens.semanticColors.brand.secondary,
        accent: tokens.semanticColors.brand.accent,
        success: tokens.semanticColors.success,
        warning: tokens.semanticColors.warning,
        
        // Text colors
        'text-primary': tokens.semanticColors.text.primary,
        'text-secondary': tokens.semanticColors.text.secondary,
        'text-tertiary': tokens.semanticColors.text.tertiary,
        'text-inverse': tokens.semanticColors.text.inverse,
        'text-accent': tokens.semanticColors.text.accent,
        'text-muted': tokens.semanticColors.text.muted,
        
        // Border colors
        'border-primary': tokens.semanticColors.border.primary,
        'border-secondary': tokens.semanticColors.border.secondary,
        'border-accent': tokens.semanticColors.border.accent,
        'border-muted': tokens.semanticColors.border.muted
      },
      
      // Typography
      fontFamily: tokens.typography.fontFamily,
      fontWeight: tokens.typography.fontWeight,
      fontSize: tokens.typography.fontSize,
      
      // Spacing (Fibonacci-inspired)
      spacing: tokens.spacing,
      
      // Border Radius
      borderRadius: {
        ...tokens.borderRadius,
        'organic-gentle': tokens.borderRadius.organic.gentle,
        'organic-leaf': tokens.borderRadius.organic.leaf,
        'organic-craft': tokens.borderRadius.organic.craft,
        'organic-wax': tokens.borderRadius.organic.wax
      },
      
      // Box Shadow
      boxShadow: {
        ...tokens.boxShadow,
        'craft-soft': tokens.boxShadow.craft.soft,
        'craft-warm': tokens.boxShadow.craft.warm,
        'craft-deep': tokens.boxShadow.craft.deep,
        'craft-embossed': tokens.boxShadow.craft.embossed,
        'craft-debossed': tokens.boxShadow.craft.debossed
      },
      
      // Animations
      transitionDuration: tokens.animation.duration,
      transitionTimingFunction: tokens.animation.easing,
      keyframes: tokens.animation.keyframes,
      animation: {
        'fade-in': 'fade-in 0.6s ease-in-out',
        'fade-out': 'fade-out 0.6s ease-in-out',
        'slide-in-up': 'slide-in-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-down': 'slide-in-down 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'handwrite': 'handwrite 2s ease-in-out forwards',
        'grow': 'grow 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'sway': 'sway 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      
      // Screens
      screens: tokens.screens,
      
      // Z-Index
      zIndex: tokens.zIndex,
      
      // Custom utilities
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px'
      },
      
      // Custom gradients
      backgroundImage: {
        'craft-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpolygon fill='%23000' points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E\")",
        'leather-texture': 'linear-gradient(45deg, rgba(139, 69, 19, 0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(139, 69, 19, 0.1) 25%, transparent 25%)',
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-opacity='0.02'%3E%3Crect fill='%23000' width='1' height='1'/%3E%3C/g%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'craft-warm': 'linear-gradient(145deg, var(--color-mahogany-600), var(--color-copper-500))',
        'craft-gold': 'linear-gradient(135deg, var(--color-gold-400), var(--color-gold-600))',
        'craft-success': 'linear-gradient(135deg, var(--color-forest-400), var(--color-forest-600))'
      },
      
      // Custom clip paths for organic shapes
      clipPath: {
        'organic-1': 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
        'organic-2': 'polygon(5% 0, 100% 0, 100% 95%, 0 100%)',
        'organic-3': 'polygon(0 5%, 95% 0, 100% 95%, 5% 100%)',
        'leaf': 'ellipse(50% 50% at 50% 50%)',
        'badge': 'circle(50% at 50% 50%)'
      },
      
      // Custom aspect ratios
      aspectRatio: {
        'golden': '1.618',
        'card': '4/3',
        'hero': '16/9',
        'portrait': '3/4'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for Artisan Craft utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance'
        },
        '.text-pretty': {
          'text-wrap': 'pretty'
        },
        '.writing-vertical': {
          'writing-mode': 'vertical-rl'
        },
        '.writing-horizontal': {
          'writing-mode': 'horizontal-tb'
        }
      });
      
      // Custom component classes
      addComponents({
        // Craft Button Base
        '.btn-craft': {
          '@apply relative inline-flex items-center justify-center px-6 py-3 font-body font-semibold text-base': {},
          '@apply bg-gradient-to-br from-mahogany-600 to-copper-500 text-neutral-50': {},
          '@apply border-none rounded-organic-craft cursor-pointer': {},
          '@apply transition-all duration-gentle ease-organic': {},
          '@apply shadow-craft-soft hover:shadow-craft-warm': {},
          '@apply transform hover:-translate-y-0.5 active:translate-y-0': {},
          
          '&::before': {
            '@apply content-[""] absolute top-0.5 left-0.5 right-0.5 h-1/2': {},
            '@apply bg-gradient-to-b from-white/30 to-transparent': {},
            '@apply rounded-md pointer-events-none': {}
          }
        },
        
        // Craft Card Base
        '.card-craft': {
          '@apply bg-surface-primary bg-craft-texture': {},
          '@apply border-2 border-mahogany-200 rounded-lg p-6': {},
          '@apply shadow-craft-soft relative overflow-hidden': {},
          '@apply transition-all duration-gentle ease-organic': {},
          '@apply hover:-translate-y-1 hover:shadow-craft-warm hover:border-copper-300': {},
          
          '&::before': {
            '@apply content-[""] absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5': {},
            '@apply bg-gradient-to-br from-gold-500 to-copper-500': {},
            '@apply -z-10 rounded-lg': {}
          }
        },
        
        // Craft Input Base
        '.input-craft': {
          '@apply w-full px-4 py-3 font-body text-base': {},
          '@apply bg-surface-background bg-paper-texture': {},
          '@apply border-2 border-mahogany-300 rounded-md': {},
          '@apply text-text-primary placeholder:text-text-muted': {},
          '@apply transition-all duration-gentle ease-organic': {},
          '@apply focus:outline-none focus:border-gold-500 focus:ring-3 focus:ring-gold-500/20': {}
        },
        
        // Craft Badge Base
        '.badge-craft': {
          '@apply relative inline-flex items-center justify-center': {},
          '@apply px-4 py-2 min-w-[60px] min-h-[60px]': {},
          '@apply bg-gradient-to-br from-gold-500 to-mahogany-600': {},
          '@apply text-neutral-50 font-accent font-semibold text-sm': {},
          '@apply rounded-full text-center shadow-craft-deep': {},
          
          '&::before': {
            '@apply content-[""] absolute -top-1 -left-1 -right-1 -bottom-1': {},
            '@apply border-2 border-copper-500 rounded-full -z-10': {}
          }
        },
        
        // Typography Components
        '.heading-craft': {
          '@apply font-display font-bold text-text-primary': {},
          '@apply tracking-tight leading-tight': {}
        },
        
        '.body-craft': {
          '@apply font-body font-regular text-text-primary': {},
          '@apply leading-relaxed': {}
        },
        
        '.accent-craft': {
          '@apply font-accent font-medium text-text-accent': {},
          '@apply italic': {}
        }
      });
    }
  ]
};
