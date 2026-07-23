import { Resvg } from '@resvg/resvg-js'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// resvg renders text from font FILES (no fontconfig/system-font dependency), so
// on serverless a bundled font is required or <text> is silently dropped. We
// ship Geist Regular (OFL) alongside this module; fall back to Next's bundled
// copy, then to system fonts. The resolved path is cached across calls.
let fontPathCache: string | null | undefined

const resolveFontPath = (): string | null => {
  if (fontPathCache !== undefined) {
    return fontPathCache
  }
  const candidates: string[] = []
  try {
    candidates.push(
      fileURLToPath(new URL('./assets/Geist-Regular.ttf', import.meta.url)),
    )
  } catch {
    // import.meta.url unavailable — skip this candidate.
  }
  try {
    const require = createRequire(import.meta.url)
    candidates.push(
      join(
        dirname(require.resolve('next/package.json')),
        'dist/compiled/@vercel/og/Geist-Regular.ttf',
      ),
    )
  } catch {
    // Next's bundled font not resolvable — skip.
  }
  fontPathCache = candidates.find(path => existsSync(path)) ?? null
  return fontPathCache
}

export interface RasterizedImage {
  bytes: Uint8Array
  ext: 'png'
  height: number
  width: number
}

// Rasterises a self-contained SVG string to PNG bytes at `zoom`× its intrinsic
// size (legacy captured components at scale 2). Ports captureHtmlToPngBytes'
// role (osago-bundle.js) to a deterministic server-side renderer.
export const rasterizeSvgToPng = (
  svg: string,
  zoom: number,
): RasterizedImage => {
  const fontPath = resolveFontPath()
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'zoom', value: zoom },
    font: fontPath
      ? {
          defaultFontFamily: 'Geist',
          fontFiles: [fontPath],
          loadSystemFonts: false,
        }
      : { defaultFontFamily: 'Geist', loadSystemFonts: true },
  })
  const rendered = resvg.render()
  return {
    bytes: new Uint8Array(rendered.asPng()),
    ext: 'png',
    height: rendered.height,
    width: rendered.width,
  }
}
