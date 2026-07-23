import {
  type GammaComponentPlacement,
  type GammaPhotoSource,
  type GammaPlacementPlan,
} from '../types'
import { injectImagesIntoPdf } from './injectImagesIntoPdf'
import { resolvePhotoBytes } from './photoBytes'
import { rasterizeSvgToPng } from './rasterize'
import { buildValuationGaugeSvg, buildValueDriversSvg } from './svgBuilders'
import { type ResolvedPlacement } from './types'

// Components are captured at 2× (legacy html2canvas used scale 2).
const COMPONENT_ZOOM = 2

// The caller owns where a photo lives (session photo / presentation DB), so it
// supplies a resolver that maps a source descriptor to a fetchable URL/data-URL.
export type PhotoSourceResolver = (
  source: GammaPhotoSource,
) => Promise<string | null>

const resolveComponent = (
  component: GammaComponentPlacement,
): ResolvedPlacement => {
  const svg =
    component.spec.kind === 'gauge'
      ? buildValuationGaugeSvg(component.spec)
      : buildValueDriversSvg(component.spec.scores)
  const png = rasterizeSvgToPng(svg, COMPONENT_ZOOM)
  return {
    bytes: png.bytes,
    ext: png.ext,
    mode: 'measured',
    natH: png.height,
    natW: png.width,
    rect: component.rect,
    slide: component.slide,
  }
}

// Turns the placement plan into concrete image placements — components
// rasterised from SVG (measured into the page), photos resolved to bytes and
// drawn as fixed overlays — then injects them. Returns the original bytes
// untouched when there is nothing to inject.
export const applyPlacementPlan = async (
  pdfBytes: Uint8Array,
  plan: GammaPlacementPlan,
  resolvePhotoSource: PhotoSourceResolver,
): Promise<Uint8Array> => {
  const placements: ResolvedPlacement[] = plan.components.map(resolveComponent)

  for (const photo of plan.photos) {
    const src = await resolvePhotoSource(photo.source)
    if (!src) {
      continue
    }
    const bytes = await resolvePhotoBytes(src)
    if (!bytes) {
      continue
    }
    placements.push({
      bytes: bytes.bytes,
      ext: bytes.ext,
      mode: 'overlay',
      natH: bytes.height,
      natW: bytes.width,
      rect: photo.rect,
      slide: photo.slide,
    })
  }

  if (placements.length === 0) {
    return pdfBytes
  }
  return injectImagesIntoPdf(pdfBytes, placements, plan.pageBg)
}
