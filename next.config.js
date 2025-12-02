/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is the default in Next.js 15+
  // No need to explicitly enable it
  
  // Port configuration via PORT environment variable
  // Handled in package.json scripts
  
  // Environment variables
  env: {
    // These will be available at build time
    // Runtime env vars should use process.env directly
  },
  
  // Output configuration for Docker
  // Note: standalone output requires experimental.outputFileTracingRoot
  // For now, we'll use the default output
  // output: 'standalone',
  
  // Disable strict mode for development (optional)
  reactStrictMode: true,
};

module.exports = nextConfig;

