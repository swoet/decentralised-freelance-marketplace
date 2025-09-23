# Artisan Craft Design System - Implementation Guide

## 🚀 Production Deployment

### Step 1: Install Dependencies

```bash
# Core dependencies
npm install class-variance-authority clsx tailwind-merge

# Tailwind CSS plugins
npm install @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio

# Optional: For enhanced animations
npm install framer-motion # Alternative to our custom Motion component
```

### Step 2: Font Setup

Add to your `pages/_document.tsx` or HTML head:

```tsx
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" 
          as="style"
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;500&display=swap" 
          as="style"
        />
        
        {/* Load fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

### Step 3: Tailwind Configuration

Replace your `tailwind.config.js` with our Artisan Craft configuration:

```bash
# Backup your current config
cp tailwind.config.js tailwind.config.backup.js

# Use the Artisan Craft config
cp tailwind.config.artisan.js tailwind.config.js
```

### Step 4: CSS Integration

Update your main CSS file (usually `styles/globals.css`):

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Artisan Craft design system */
@import './design-systems/artisan-craft/accessibility.css';
@import './design-systems/artisan-craft/performance.css';
@import './design-systems/artisan-craft/utilities.css';

/* Base styles with Artisan Craft tokens */
:root {
  /* Import design tokens */
  --ac-primary: #8B4513;
  --ac-secondary: #D2691E;
  --ac-accent: #DAA520;
  --ac-success: #228B22;
  --ac-warning: #CD853F;
  --ac-background: #FFF8DC;
  --ac-surface: #F5F5DC;
  
  /* Typography */
  --ac-font-display: 'Playfair Display', Georgia, serif;
  --ac-font-body: 'Source Sans Pro', -apple-system, sans-serif;
  --ac-font-accent: 'Crimson Text', Georgia, serif;
  
  /* Spacing (Fibonacci-inspired) */
  --ac-space-1: 0.3125rem;  /* 5px */
  --ac-space-2: 0.625rem;   /* 10px */
  --ac-space-3: 0.9375rem;  /* 15px */
  --ac-space-4: 1.5625rem;  /* 25px */
  --ac-space-6: 2.5rem;     /* 40px */
  --ac-space-8: 4.0625rem;  /* 65px */
  
  /* Animation */
  --ac-duration-fast: 150ms;
  --ac-duration-gentle: 400ms;
  --ac-duration-normal: 600ms;
  --ac-duration-slow: 800ms;
  
  --ac-ease-organic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ac-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ac-ease-craft: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Base body styles */
body {
  font-family: var(--ac-font-body);
  background-color: var(--ac-background);
  color: var(--ac-text-primary);
  line-height: 1.5;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### Step 5: Component Integration

Start using Artisan Craft components in your existing pages:

```tsx
// Example: Update your dashboard page
import React from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Motion,
  Stagger 
} from '@/components/artisan-craft';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-surface-background bg-craft-texture p-6">
      <Motion preset="slideInDown">
        <h1 className="heading-craft text-4xl mb-8">Dashboard</h1>
      </Motion>
      
      <Stagger staggerDelay={150}>
        <Card variant="elevated" interactive="float">
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="primary" shape="organic">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </Stagger>
    </div>
  );
}
```

## 🎨 Gradual Migration Strategy

### Phase 1: Core Components (Week 1)
1. **Buttons**: Replace all button elements
2. **Cards**: Update project cards and info panels
3. **Typography**: Apply heading and text styles

```tsx
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<Button variant="primary" size="md" shape="organic">
  Click me
</Button>
```

### Phase 2: Forms & Inputs (Week 2)
1. **Input fields**: Replace form inputs
2. **Validation**: Add error/success states
3. **Labels**: Update form labels

```tsx
// Before
<input 
  type="email" 
  className="border rounded px-3 py-2"
  placeholder="Email"
/>

// After
<Input
  type="email"
  label="Email Address"
  variant="craft"
  shape="organic"
  placeholder="Enter your email..."
/>
```

### Phase 3: Advanced Components (Week 3)
1. **Badges**: Status indicators and skills
2. **Motion**: Add entrance animations
3. **Interactive states**: Hover and focus effects

### Phase 4: Polish & Optimization (Week 4)
1. **Performance**: Optimize animations
2. **Accessibility**: Test with screen readers
3. **Cross-browser**: Test on all target browsers

## 🔧 Customization Guide

### Theme Customization

Create a custom theme file:

```tsx
// lib/theme.ts
import { craftTheme } from '@/components/artisan-craft';

export const customTheme = {
  ...craftTheme,
  colors: {
    ...craftTheme.colors,
    primary: '#YOUR_BRAND_COLOR',
    accent: '#YOUR_ACCENT_COLOR'
  },
  fonts: {
    ...craftTheme.fonts,
    display: 'Your Custom Font, serif'
  }
};
```

Apply custom theme:

```css
/* styles/custom-theme.css */
:root {
  --ac-primary: #YOUR_BRAND_COLOR;
  --ac-accent: #YOUR_ACCENT_COLOR;
  --ac-font-display: 'Your Custom Font', serif;
}
```

### Component Variants

Extend existing components:

```tsx
// components/custom/CustomButton.tsx
import { Button, buttonVariants } from '@/components/artisan-craft';
import { cva } from 'class-variance-authority';

const customButtonVariants = cva(buttonVariants, {
  variants: {
    variant: {
      ...buttonVariants.variants.variant,
      brand: 'bg-your-brand-color text-white hover:bg-your-brand-dark'
    }
  }
});

export function CustomButton({ variant = 'brand', ...props }) {
  return <Button variant={variant} {...props} />;
}
```

## 📱 Responsive Implementation

### Breakpoint Strategy

```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card variant="default" className="w-full">
    Mobile: Full width
    Tablet: Half width  
    Desktop: Third width
  </Card>
</div>
```

### Touch Optimization

```tsx
// Larger touch targets on mobile
<Button 
  size="md" 
  className="min-h-[44px] min-w-[44px] md:min-h-auto md:min-w-auto"
>
  Touch-friendly
</Button>
```

## ⚡ Performance Optimization

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const ShowcaseDemo = dynamic(
  () => import('@/components/artisan-craft/examples/ShowcaseDemo'),
  { loading: () => <div>Loading...</div> }
);
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true npm run build
```

### Tree Shaking

```tsx
// Import only what you need
import { Button } from '@/components/artisan-craft/Button';
import { Card } from '@/components/artisan-craft/Card';

// Instead of
import { Button, Card } from '@/components/artisan-craft';
```

## 🧪 Testing Strategy

### Component Testing

```tsx
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/artisan-craft';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-craft');
  });

  it('handles loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Accessibility Testing

```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react jest-axe

# Run accessibility tests
npm run test:a11y
```

### Visual Regression Testing

```bash
# Install Chromatic for visual testing
npm install --save-dev chromatic

# Run visual tests
npx chromatic --project-token=YOUR_TOKEN
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] All fonts are loading correctly
- [ ] CSS is properly minified
- [ ] Bundle size is optimized
- [ ] Accessibility tests pass
- [ ] Cross-browser testing complete
- [ ] Performance metrics meet targets

### Production Environment

```bash
# Build and test
npm run build
npm run start

# Check bundle size
npm run analyze

# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

### CDN Configuration

```nginx
# Nginx configuration for font caching
location ~* \.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# CSS caching
location ~* \.css$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔍 Monitoring & Analytics

### Performance Monitoring

```tsx
// lib/performance.ts
export function trackComponentPerformance(componentName: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const mark = `${componentName}-start`;
    performance.mark(mark);
    
    return () => {
      const endMark = `${componentName}-end`;
      performance.mark(endMark);
      performance.measure(componentName, mark, endMark);
    };
  }
  return () => {};
}

// Usage in components
const endTracking = trackComponentPerformance('ArtisanButton');
// Component logic
endTracking();
```

### User Experience Metrics

```tsx
// Track design system adoption
import { analytics } from '@/lib/analytics';

function trackDesignSystemUsage(component: string, variant: string) {
  analytics.track('Design System Component Used', {
    component,
    variant,
    system: 'artisan-craft'
  });
}
```

## 🆘 Troubleshooting

### Common Issues

**Fonts not loading:**
```tsx
// Check font preload in _document.tsx
// Verify CORS headers for font files
// Test with different font-display values
```

**Tailwind classes not applying:**
```bash
# Verify content paths in tailwind.config.js
# Check for CSS purging issues
# Ensure proper import order
```

**Performance issues:**
```tsx
// Use React.memo for expensive components
// Implement proper code splitting
// Optimize image loading
```

**Accessibility problems:**
```tsx
// Test with screen readers
// Verify keyboard navigation
// Check color contrast ratios
```

## 📞 Support & Resources

### Documentation
- [Component API Reference](./docs/components.md)
- [Design Tokens Guide](./docs/tokens.md)
- [Accessibility Guidelines](./docs/accessibility.md)

### Community
- GitHub Issues: Report bugs and feature requests
- Discord: Real-time community support
- Stack Overflow: Tag questions with `artisan-craft`

### Professional Support
- Design consultation available
- Custom component development
- Performance optimization services

---

**Ready to craft something amazing? Start with the showcase page at `/artisan-showcase` to see the full system in action!**
