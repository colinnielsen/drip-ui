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
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'slice.so',
        port: '',
        pathname: '/_next/**',
      },
    ],
  },
  // webpack: (config, { isServer }) => {
  //   if (!isServer && process.env.NODE_ENV !== 'production')
  //     config.resolve.fallback.fs = false;

  //   return config;
  // },
};

export default nextConfig;
