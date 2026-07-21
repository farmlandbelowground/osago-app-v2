// Pure prompt-assembly primitives shared by both feature prompt builders
// (features/presentation + features/valuation). Ports buildSlidePrompt
// (osago-bundle.js:19694-19702) and the fmtIntNL number formatting the dossier
// lines use. The feature-specific slide content stays feature-local.

export interface GammaSlide {
  content: string
  title: string
}

export interface GammaSlidePromptResult {
  slideCount: number
  text: string
}

export const buildGammaSlidePrompt = (
  header: string,
  slides: GammaSlide[],
): GammaSlidePromptResult => {
  const lines: string[] = [
    header,
    '',
    `Het document bestaat uit EXACT ${slides.length} slides, in deze volgorde:`,
    '',
  ]

  slides.forEach((slide, index) => {
    lines.push(`SLIDE ${index + 1} — ${slide.title}`)
    lines.push(slide.content)
    lines.push('')
  })

  return { slideCount: slides.length, text: lines.join('\n') }
}

export const formatGammaInt = (value: number): string =>
  new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
