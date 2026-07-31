/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client", "@sentry/node", "@sentry/profiling-node"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
