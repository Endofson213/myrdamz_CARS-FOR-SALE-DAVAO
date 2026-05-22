const isGithubPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isGithubPages ? "/myrdamz_CARS-FOR-SALE-DAVAO" : "",
  assetPrefix: isGithubPages ? "/myrdamz_CARS-FOR-SALE-DAVAO/" : "",
  images: {
    unoptimized: true
  }
};

export default nextConfig;
