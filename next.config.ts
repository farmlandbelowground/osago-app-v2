import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The Gamma PDF-injection pipeline (finalizeGammaDocument) uses these in the
  // Node server runtime; keep them external so Next does not bundle their
  // browser-global references / native binaries. `sharp` and `canvas` are
  // already in Next's default external list.
  serverExternalPackages: ['pdfjs-dist', '@resvg/resvg-js'],
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
