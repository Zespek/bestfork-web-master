import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // `@bestfork/shared` é um workspace local publicado como TypeScript puro
  // (sem build). Sem isso o Next não transpila o pacote e o build quebra.
  transpilePackages: ['@bestfork/shared'],
}

export default nextConfig
