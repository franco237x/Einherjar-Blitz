import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The voucher PDF reads its artwork from disk at request time.
  outputFileTracingIncludes: {
    "/api/agro/vale": ["./public/evento-agro/espiga-ambar.png", "./public/jardin/vale-solmiel.png"],
  },
};

export default nextConfig;
