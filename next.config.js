/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse reads files with fs — tell webpack not to bundle it on the client
  webpack: (cfg, { isServer }) => {
    if (!isServer) {
      cfg.resolve.fallback = {
        ...cfg.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return cfg
  },
}

module.exports = nextConfig
