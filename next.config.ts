import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["react-force-graph-2d", "d3-force"],
};

export default nextConfig;
