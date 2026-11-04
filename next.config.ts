import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/KeywordCrawler',
  trailingSlash: false,
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/KeywordCrawler',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
