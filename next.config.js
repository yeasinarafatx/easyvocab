/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['*.trycloudflare.com', '192.168.0.100', '192.168.0.101', '192.168.0.102'],
};

module.exports = nextConfig;