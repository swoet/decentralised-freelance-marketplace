/** @type {import('next').NextConfig} */
// Temporarily disable Sentry to allow frontend to run
// const { withSentryConfig } = require('@sentry/nextjs');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src * blob: data:; connect-src *; font-src 'self'; frame-src 'self';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=()'
  }
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  env: {
    SENTRY_DSN: process.env.SENTRY_DSN,
  },
};

// Temporarily disable Sentry wrapper
module.exports = nextConfig;
// module.exports = withSentryConfig(nextConfig, { silent: true }); 