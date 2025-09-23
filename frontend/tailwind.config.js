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
      // Colors - Artisan Craft Design System
      colors: {
        mahogany: tokens.primitiveColors.mahogany,
        copper: tokens.primitiveColors.copper,
        gold: tokens.primitiveColors.gold,
        forest: tokens.primitiveColors.forest,
        bronze: tokens.primitiveColors.bronze,
        neutral: tokens.primitiveColors.neutral,
        
        // Semantic colors
        brand: tokens.semanticColors.brand,
        surface: tokens.semanticColors.surface,
        
        // Override default colors
        primary: tokens.semanticColors.brand.primary,
        secondary: tokens.semanticColors.brand.secondary,
        accent: tokens.semanticColors.brand.accent,
        success: tokens.semanticColors.success,
        warning: tokens.semanticColors.warning,
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
        'slide-in-up': 'slide-in-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'handwrite': 'handwrite 2s ease-in-out forwards',
        'grow': 'grow 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'sway': 'sway 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      
      // Background Images
      backgroundImage: {
        'craft-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpolygon fill='%23000' points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E\")",
        'leather-texture': 'linear-gradient(45deg, rgba(139, 69, 19, 0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(139, 69, 19, 0.1) 25%, transparent 25%)',
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-opacity='0.02'%3E%3Crect fill='%23000' width='1' height='1'/%3E%3C/g%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ]
};
