/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle canvas binary file
    config.resolve.alias.canvas = false;
    
    // Ignore all Node.js modules in PDF.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      zlib: false,
      stream: false,
      util: false,
      crypto: false,
      canvas: false,
      url: false,
      http: false,
      https: false,
      os: false
    };
    
    // Exclude node modules in PDF.js from processing
    config.module.rules.push({
      test: /node_modules\/pdfjs-dist\/build\/pdf\.worker\.js/,
      use: 'raw-loader',
    });
    
    return config;
  },
  // Increase timeout for builds
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
};

export default nextConfig;