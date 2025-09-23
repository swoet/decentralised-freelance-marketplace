/**
 * Artisan Craft Design System - Design Tokens
 * Production-level token system with semantic and primitive values
 */

// Primitive Color Palette
const primitiveColors = {
  // Mahogany Family
  mahogany: {
    50: '#FDF8F6',
    100: '#F2E8E5',
    200: '#EADDD7',
    300: '#E0CFC5',
    400: '#D69E89',
    500: '#C1956C',
    600: '#8B4513', // Primary
    700: '#723A0F',
    800: '#5C2F0C',
    900: '#4A260A',
    950: '#2D1706'
  },
  
  // Copper Family
  copper: {
    50: '#FEF7F0',
    100: '#FEECDC',
    200: '#FCD9BD',
    300: '#F9C58D',
    400: '#F5A65B',
    500: '#D2691E', // Secondary
    600: '#B8591A',
    700: '#9A4A16',
    800: '#7D3C12',
    900: '#66310F',
    950: '#371A08'
  },
  
  // Golden Craft Family
  gold: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#DAA520', // Accent
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
    950: '#422006'
  },
  
  // Forest Family
  forest: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#228B22', // Success
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16'
  },
  
  // Burnished Bronze Family
  bronze: {
    50: '#FEF7ED',
    100: '#FEEFD5',
    200: '#FDDCAA',
    300: '#FBC474',
    400: '#F8A13C',
    500: '#CD853F', // Warning
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407'
  },
  
  // Neutral Craft Family
  neutral: {
    50: '#FFF8DC', // Warm Cream (Background)
    100: '#F5F5DC', // Soft Beige (Surface)
    200: '#F0E68C',
    300: '#DDD6C0',
    400: '#C4B59A',
    500: '#A0927A',
    600: '#8B7D6B',
    700: '#5D4037', // Text Secondary
    800: '#3E2723', // Text Primary
    900: '#2E1A16',
    950: '#1C0F0A'
  }
};

// Semantic Color Tokens
const semanticColors = {
  // Brand Colors
  brand: {
    primary: primitiveColors.mahogany[600],
    secondary: primitiveColors.copper[500],
    accent: primitiveColors.gold[500]
  },
  
  // Functional Colors
  success: {
    50: primitiveColors.forest[50],
    100: primitiveColors.forest[100],
    500: primitiveColors.forest[500],
    600: primitiveColors.forest[600],
    700: primitiveColors.forest[700]
  },
  
  warning: {
    50: primitiveColors.bronze[50],
    100: primitiveColors.bronze[100],
    500: primitiveColors.bronze[500],
    600: primitiveColors.bronze[600],
    700: primitiveColors.bronze[700]
  },
  
  // Surface Colors
  surface: {
    background: primitiveColors.neutral[50],
    primary: primitiveColors.neutral[100],
    secondary: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(139, 69, 19, 0.8)'
  },
  
  // Text Colors
  text: {
    primary: primitiveColors.neutral[800],
    secondary: primitiveColors.neutral[700],
    tertiary: primitiveColors.neutral[600],
    inverse: primitiveColors.neutral[50],
    accent: primitiveColors.mahogany[600],
    muted: primitiveColors.neutral[500]
  },
  
  // Border Colors
  border: {
    primary: primitiveColors.mahogany[200],
    secondary: primitiveColors.copper[200],
    accent: primitiveColors.gold[300],
    muted: primitiveColors.neutral[200]
  }
};

// Typography Tokens
const typography = {
  // Font Families
  fontFamily: {
    display: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
    body: ['Source Sans Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    accent: ['Crimson Text', 'Georgia', 'Times New Roman', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace']
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  
  // Font Sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }]
  }
};

// Spacing Tokens (Fibonacci-inspired organic growth)
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.3125rem',    // 5px
  1.5: '0.46875rem', // 7.5px
  2: '0.625rem',     // 10px
  2.5: '0.78125rem', // 12.5px
  3: '0.9375rem',    // 15px
  3.5: '1.09375rem', // 17.5px
  4: '1.5625rem',    // 25px
  5: '1.953125rem',  // 31.25px
  6: '2.5rem',       // 40px
  7: '3.125rem',     // 50px
  8: '4.0625rem',    // 65px
  9: '5.078125rem',  // 81.25px
  10: '6.5625rem',   // 105px
  11: '8.203125rem', // 131.25px
  12: '10.5625rem',  // 169px
  14: '13.671875rem', // 219px
  16: '17.578125rem', // 281px
  20: '22.65625rem',  // 362.5px
  24: '29.296875rem', // 468.75px
  28: '37.890625rem', // 606.25px
  32: '48.828125rem', // 781.25px
  36: '63.0859375rem', // 1009.375px
  40: '81.25rem',     // 1300px
  44: '104.6875rem',  // 1675px
  48: '135rem',       // 2160px
  52: '174.21875rem', // 2787.5px
  56: '224.84375rem', // 3597.5px
  60: '290.234375rem', // 4643.75px
  64: '374.21875rem',  // 5987.5px
  72: '607.5rem',      // 9720px
  80: '984.375rem',    // 15750px
  96: '1593.75rem'     // 25500px
};

// Border Radius Tokens
const borderRadius = {
  none: '0',
  sm: '0.25rem',     // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.75rem',     // 12px
  lg: '1rem',        // 16px
  xl: '1.5rem',      // 24px
  '2xl': '2rem',     // 32px
  '3xl': '3rem',     // 48px
  organic: {
        gentle: '0.5rem 1rem 0.5rem 1rem',
        leaf: '1rem 0.5rem 1rem 0.5rem',
        craft: '0.8rem 1.2rem 0.6rem 1.4rem',
        wax: '50% 20% 50% 20%'
  },
  full: '9999px'
};

// Shadow Tokens
const boxShadow = {
  xs: '0 1px 2px 0 rgba(139, 69, 19, 0.05)',
  sm: '0 1px 3px 0 rgba(139, 69, 19, 0.1), 0 1px 2px -1px rgba(139, 69, 19, 0.1)',
  DEFAULT: '0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -2px rgba(139, 69, 19, 0.1)',
  md: '0 4px 6px -1px rgba(139, 69, 19, 0.1), 0 2px 4px -2px rgba(139, 69, 19, 0.1)',
  lg: '0 10px 15px -3px rgba(139, 69, 19, 0.1), 0 4px 6px -4px rgba(139, 69, 19, 0.1)',
  xl: '0 20px 25px -5px rgba(139, 69, 19, 0.1), 0 8px 10px -6px rgba(139, 69, 19, 0.1)',
  '2xl': '0 25px 50px -12px rgba(139, 69, 19, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(139, 69, 19, 0.05)',
  craft: {
    soft: '0 2px 8px rgba(139, 69, 19, 0.15)',
    warm: '0 4px 12px rgba(210, 105, 30, 0.2)',
    deep: '0 8px 24px rgba(139, 69, 19, 0.25)',
    embossed: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(139, 69, 19, 0.3)',
    debossed: 'inset 0 2px 4px rgba(139, 69, 19, 0.2)'
  },
  none: '0 0 #0000'
};

// Animation Tokens
const animation = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    gentle: '400ms',
    normal: '600ms',
    slow: '800ms',
    slower: '1200ms',
    slowest: '1800ms'
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    organic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    craft: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  
  // Keyframes
  keyframes: {
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' }
    },
    'fade-out': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' }
    },
    'slide-in-up': {
      '0%': { transform: 'translateY(100%)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' }
    },
    'slide-in-down': {
      '0%': { transform: 'translateY(-100%)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' }
    },
    'scale-in': {
      '0%': { transform: 'scale(0.9)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' }
    },
    'handwrite': {
      '0%': { 
        'stroke-dashoffset': '100%',
        opacity: '0'
      },
      '50%': {
        opacity: '1'
      },
      '100%': { 
        'stroke-dashoffset': '0%',
        opacity: '1'
      }
    },
    'grow': {
      '0%': {
        transform: 'scale(0)',
        opacity: '0'
      },
      '50%': {
        opacity: '1'
      },
      '100%': {
        transform: 'scale(1)',
        opacity: '1'
      }
    },
    'sway': {
      '0%': { transform: 'rotate(-2deg)' },
      '50%': { transform: 'rotate(2deg)' },
      '100%': { transform: 'rotate(-2deg)' }
    },
    'shimmer': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' }
    }
  }
};

// Breakpoint Tokens
const screens = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Z-Index Tokens
const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070'
};

module.exports = {
  primitiveColors,
  semanticColors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  screens,
  zIndex
};
