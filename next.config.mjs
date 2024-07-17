/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV !== 'production')
      config.resolve.fallback.fs = false;

    return config;
  },
};

export default nextConfig;
