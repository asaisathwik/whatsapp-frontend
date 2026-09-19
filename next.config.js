/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000",
  },
  async redirects() {
    return [
      { source: '/campaigns', destination: '/history', permanent: false },
      { source: '/campaign', destination: '/history', permanent: false },
      { source: '/contacts', destination: '/send', permanent: false },
      { source: '/contact', destination: '/send', permanent: false },
      { source: '/templates', destination: '/store', permanent: false },
      { source: '/template', destination: '/store', permanent: false },
      { source: '/inbox', destination: '/whatsapp', permanent: false },
      { source: '/chat', destination: '/whatsapp', permanent: false },
      { source: '/connect', destination: '/whatsapp', permanent: false },
      { source: '/messages', destination: '/send', permanent: false },
      { source: '/broadcast', destination: '/send', permanent: false },
    ];
  },
};

module.exports = nextConfig;
