/* eslint-disable no-magic-numbers -- verbatim canvas-drawing port of
   _socialsExportSlideToCanvas (osago-bundle.js:28630-28729): the coordinates,
   sizes and offsets are a pixel-for-pixel visual reproduction where naming each
   one-off value would obscure rather than clarify. */
import JSZip from 'jszip'

import { SOCIALS_BRAND, SOCIALS_PLATFORM_SPECS } from '../constants'
import {
  type IllustrationItem,
  type InstagramData,
  type SingleVisualData,
  type SocialsInputs,
  type SocialsPlatform,
  type SocialsResult,
} from '../types'

const isError = (
  result: SocialsResult | undefined,
): boolean => !!result && 'error' in result && result.error === true

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number => {
  if (!text) {
    return y
  }
  const words = text.split(' ')
  let line = ''
  let cy = y
  let lines = 0
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, cy)
      line = words[n] + ' '
      cy += lineHeight
      lines++
      if (lines >= maxLines - 1) {
        const remaining = words.slice(n).join(' ')
        let final = remaining
        while (ctx.measureText(final + '…').width > maxWidth && final.length > 0) {
          final = final.slice(0, -1)
        }
        if (final.length < remaining.length) {
          final += '…'
        }
        ctx.fillText(final, x, cy)
        return cy + lineHeight
      }
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, cy)
  return cy + lineHeight
}

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

interface SlideCanvasOptions {
  platform: SocialsPlatform
  body?: string
  headline?: string
  illustrationSrc?: string | null
  slideIndex?: number
  subline?: string
  title?: string
  totalSlides?: number
}

const exportSlideToCanvas = async (
  opts: SlideCanvasOptions,
): Promise<string> => {
  const {
    body,
    headline,
    illustrationSrc,
    platform,
    slideIndex = 0,
    subline,
    title,
    totalSlides = 1,
  } = opts
  const spec = SOCIALS_PLATFORM_SPECS[platform]
  const canvas = document.createElement('canvas')
  canvas.width = spec.w
  canvas.height = spec.h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return ''
  }

  if (platform === 'instagram') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, spec.w, spec.h)
    ctx.fillStyle = SOCIALS_BRAND.bgSoft
    ctx.fillRect(0, 0, spec.w, 200)
    const padX = 80
    ctx.fillStyle = SOCIALS_BRAND.greenDeep
    ctx.font = '700 28px Georgia, serif'
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText('Osago', padX, 100)
    if (totalSlides > 1) {
      let dotX = spec.w - padX - totalSlides * 14
      for (let i = 0; i < totalSlides; i++) {
        ctx.fillStyle = i === slideIndex ? SOCIALS_BRAND.accent : '#CBD5E1'
        const w = i === slideIndex ? 26 : 6
        ctx.fillRect(dotX, 90, w, 4)
        dotX += w + 6
      }
    }
    const illBoxY = 240
    const illBoxH = 460
    if (illustrationSrc) {
      try {
        const img = await loadImage(illustrationSrc)
        const maxW = spec.w * 0.6
        const maxH = illBoxH * 0.95
        const scale = Math.min(maxW / img.width, maxH / img.height)
        const dW = img.width * scale
        const dH = img.height * scale
        const dX = (spec.w - dW) / 2
        const dY = illBoxY + (illBoxH - dH) / 2
        ctx.drawImage(img, dX, dY, dW, dH)
      } catch {
        // Illustration failed to load — skip it (legacy silently ignores).
      }
    }
    const textY = spec.h - 380
    ctx.fillStyle = SOCIALS_BRAND.ink
    ctx.font = '600 60px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    wrapText(ctx, title || '', padX, textY, spec.w - padX * 2, 70, 3)
    ctx.fillStyle = SOCIALS_BRAND.inkSoft
    ctx.font = '400 26px sans-serif'
    wrapText(ctx, body || '', padX, textY + 170, spec.w - padX * 2, 36, 4)
    ctx.fillStyle = SOCIALS_BRAND.accent
    ctx.fillRect(padX, spec.h - 70, 60, 3)
    if (totalSlides > 1) {
      ctx.fillStyle = SOCIALS_BRAND.inkMuted
      ctx.font = '500 16px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${slideIndex + 1} / ${totalSlides}`, spec.w - padX, spec.h - 60)
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, spec.w, spec.h)
    grad.addColorStop(0, SOCIALS_BRAND.greenDarker)
    grad.addColorStop(0.5, SOCIALS_BRAND.greenDeep)
    grad.addColorStop(1, SOCIALS_BRAND.greenDarker)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, spec.w, spec.h)
    ctx.fillStyle = SOCIALS_BRAND.accent
    ctx.fillRect(spec.w - 200, 0, 200, 6)
    const padX = 60
    const textColW = spec.w * 0.55 - padX * 1.5
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '700 24px Georgia, serif'
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText('Osago', padX, 80)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '600 50px Georgia, serif'
    const headY = spec.h / 2 - 40
    wrapText(ctx, headline || '', padX, headY, textColW, 56, 3)
    ctx.fillStyle = SOCIALS_BRAND.mint
    ctx.font = 'italic 500 22px Georgia, serif'
    wrapText(ctx, subline || '', padX, headY + 130, textColW, 30, 3)
    ctx.fillStyle = SOCIALS_BRAND.accent
    roundRect(ctx, padX, spec.h - 85, 260, 50, 10)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '600 17px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('Begin gratis op osago.nl', padX + 130, spec.h - 60)
    if (illustrationSrc) {
      try {
        const img = await loadImage(illustrationSrc)
        const boxX = spec.w * 0.55 + 20
        const boxY = 50
        const boxW = spec.w - boxX - 50
        const boxH = spec.h - 100
        ctx.fillStyle = '#FFFFFF'
        roundRect(ctx, boxX, boxY, boxW, boxH, 16)
        ctx.fill()
        const padBox = 30
        const innerW = boxW - padBox * 2
        const innerH = boxH - padBox * 2
        const scale = Math.min(innerW / img.width, innerH / img.height)
        const dW = img.width * scale
        const dH = img.height * scale
        const dX = boxX + (boxW - dW) / 2
        const dY = boxY + (boxH - dH) / 2
        ctx.drawImage(img, dX, dY, dW, dH)
      } catch {
        // Illustration failed to load — skip it.
      }
    }
  }
  return canvas.toDataURL('image/png')
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i)
  }
  return new Blob([arr], { type: mime })
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface ExportSocialsZipParams {
  illustrations: IllustrationItem[]
  inputs: SocialsInputs
  results: Partial<Record<SocialsPlatform, SocialsResult>>
}

// Ports socialsExportZip (osago-bundle.js:28749-28854): renders each slide/visual
// to a PNG, assembles posts.txt, zips with JSZip and downloads.
export const exportSocialsZip = async (
  params: ExportSocialsZipParams,
): Promise<void> => {
  const { illustrations, inputs, results } = params
  const zip = new JSZip()
  const date = new Date().toISOString().split('T')[0]

  const assignedIllustration = (idx: number): IllustrationItem | null =>
    illustrations.length === 0 ? null : illustrations[idx % illustrations.length]

  const instagram = results.instagram
  if (instagram && !isError(instagram)) {
    const folder = zip.folder('instagram')
    const slides = (instagram as InstagramData).slides
    for (let i = 0; i < slides.length; i++) {
      const ill = assignedIllustration(i)
      const dataUrl = await exportSlideToCanvas({
        body: slides[i].body,
        illustrationSrc: ill?.src,
        platform: 'instagram',
        slideIndex: i,
        title: slides[i].title,
        totalSlides: slides.length,
      })
      folder?.file(
        `slide-${String(i + 1).padStart(2, '0')}.png`,
        dataUrlToBlob(dataUrl),
      )
    }
  }

  for (const platform of ['linkedin', 'facebook'] as const) {
    const result = results[platform]
    if (result && !isError(result)) {
      const folder = zip.folder(platform)
      const visual = (result as SingleVisualData).visual
      const dataUrl = await exportSlideToCanvas({
        headline: visual.headline,
        illustrationSrc: illustrations[0]?.src,
        platform,
        subline: visual.subline,
      })
      folder?.file('visual.png', dataUrlToBlob(dataUrl))
    }
  }

  const sep = '═'.repeat(70)
  const lines: string[] = []
  lines.push(sep)
  lines.push(`OSAGO SOCIAL POST · ${date}`)
  lines.push(`Onderwerp: ${inputs.topic}`)
  if (inputs.angle) {
    lines.push(`Invalshoek: ${inputs.angle}`)
  }
  lines.push(`Doelgroep: ${inputs.audience} · Toon: ${inputs.tone}`)
  lines.push(sep)
  lines.push('')

  if (instagram && !isError(instagram)) {
    const igData = instagram as InstagramData
    lines.push(sep)
    lines.push(
      `INSTAGRAM — Carrousel (${SOCIALS_PLATFORM_SPECS.instagram.label}, 4:5 portret)`,
    )
    lines.push('Plaats deze tekst als bijschrift bij de carrousel uit /instagram/')
    lines.push(sep)
    lines.push('')
    lines.push('CAPTION:')
    lines.push('')
    lines.push(igData.caption)
    lines.push('')
    lines.push('')
    lines.push('SLIDES (tekst per slide, in volgorde):')
    lines.push('')
    igData.slides.forEach((slide, i) => {
      lines.push(`  Slide ${String(i + 1).padStart(2, '0')}  →  ${slide.title}`)
      lines.push(`            ${slide.body}`)
      if (slide.illustration_hint) {
        lines.push(`            (illustratie: ${slide.illustration_hint})`)
      }
      lines.push('')
    })
    lines.push('')
  }

  for (const platform of ['linkedin', 'facebook'] as const) {
    const result = results[platform]
    if (result && !isError(result)) {
      const data = result as SingleVisualData
      lines.push(sep)
      lines.push(
        `${platform.toUpperCase()} — Single visual (${SOCIALS_PLATFORM_SPECS[platform].label}, 1.91:1 landscape)`,
      )
      lines.push(`Plaats deze tekst bij de visual uit /${platform}/visual.png`)
      lines.push(sep)
      lines.push('')
      lines.push('POST TEKST:')
      lines.push('')
      lines.push(data.post)
      lines.push('')
      lines.push(`Visual headline:  ${data.visual.headline}`)
      lines.push(`Visual subline:   ${data.visual.subline}`)
      if (data.visual.illustration_hint) {
        lines.push(`Illustratie:      ${data.visual.illustration_hint}`)
      }
      lines.push('')
    }
  }

  lines.push(sep)
  lines.push('Gegenereerd door Osago Social Studio · osago.nl')
  lines.push(sep)
  zip.file('posts.txt', lines.join('\n'))

  const blob = await zip.generateAsync({ type: 'blob' })
  const safeTopic =
    (inputs.topic || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'post'
  downloadBlob(blob, `osago-${safeTopic}-${date}.zip`)
}
