/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@repo/ui'],
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: '**',
              pathname: '**',
          },
      ],
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  turbopack: {
      resolveAlias: {
      },
  },
  poweredByHeader: false,
  experimental: {
      optimizePackageImports: [
          '@supabase/supabase-js',
          'lucide-react',
          '@stripe/stripe-js',
          '@stripe/react-stripe-js',
          '@paypal/react-paypal-js'
      ],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;