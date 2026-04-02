import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
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
        value: 'camera=(), microphone=(), geolocation=(self), payment=()',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // Next.js requires unsafe-eval in dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://res.cloudinary.com https://ik.imagekit.io https://*.sentry.io",
            "connect-src 'self' https://ik.imagekit.io https://*.sentry.io",
            "frame-ancestors 'none'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    headers: async () => [
        {
            source: '/(.*)',
            headers: securityHeaders,
        },
    ],
    redirects: async () => [
        {
            source: '/dashboard/:school_id/utilities/settings',
            destination: '/dashboard/:school_id/settings',
            permanent: true,
        },
        {
            source: '/dashboard/:school_id/students/admit',
            destination: '/dashboard/:school_id/students/add',
            permanent: true,
        },
    ],
    // Recommended for Prisma in Next.js Edge runtime
    experimental: {},
    // Ensure server components can access env vars
    serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default withSentryConfig(nextConfig, {
    silent: true,
    org: "school-erp",
    project: "nextjs-app",
});
