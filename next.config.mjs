/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gvlinweehfwzdcdxkkan.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/slicer-images/**',
      },
      {
        protocol: 'https',
        hostname: 'square-web-production-f.squarecdn.com',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'items-images-production.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'slice.so',
        port: '',
        pathname: '/_next/**',
      },
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // {
      //   source: '/.well-known/farcaster.json',
      //   destination:
      //     'https://api.farcaster.xyz/miniapps/hosted-manifest/01981eea-ac5e-c090-d06e-00c544aa1b9a',
      //   permanent: false,
      // },
    ];
  },
  // webpack: (config, { isServer }) => {
  //   if (!isServer && process.env.NODE_ENV !== 'production')
  //     config.resolve.fallback.fs = false;

  //   return config;
  // },
};

export default nextConfig;
