/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true,
  },
  
  allowedDevOrigins: ['100.76.189.57']

};

export default nextConfig;
