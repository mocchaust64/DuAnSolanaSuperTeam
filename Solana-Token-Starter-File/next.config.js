/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  experimental: {
    esmExternals: false,
    pagesDir: 'src/pages'
  },
  images: {
    domains: ['gateway.pinata.cloud'],
  }
};

module.exports = nextConfig;
