/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production"
const repoName = "GOTS.github.io"
const isStaticExport = process.env.STATIC_EXPORT === "1"

const nextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: isProd ? `/${repoName}` : "",
        assetPrefix: isProd ? `/${repoName}/` : "",
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
