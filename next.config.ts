import type { NextConfig } from 'next';

const isElectronExport = process.env.EXPORT_ELECTRON === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: isElectronExport ? './' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
