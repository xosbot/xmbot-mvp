/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
