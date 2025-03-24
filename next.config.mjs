/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.resolve.fallback = {
        canvas: false, // Prevents webpack from bundling canvas
      };
      return config;
    },
  };
  
  export default nextConfig;
  