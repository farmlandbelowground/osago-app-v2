// Server-side SVG builders for the two injected components (Option B, spec §9.3):
// the value-slider gauge and the value-driver bars. They mirror the legacy
// buildValuationGaugeHtml / buildValueDriversHtml (osago-bundle.js) and the
// .shv-* CSS in globals.css, so the rasterised PNG matches the on-screen look.
// Pure string builders — the rasteriser turns them into PNG bytes.

import { formatGammaInt } from '../slidePrompt'
import { type GammaGaugeSpec, type GammaValueDriversSpec } from '../types'
import { OSAGO_GAUGE_COLORS, T5_COLORS, VALUE_DRIVER_COLORS } from './constants'

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const euro = (value: number): string =>
  `€ ${formatGammaInt(Math.round(value || 0))}`

// Rough label-box width from text length — good enough to centre a boxed label.
const approxTextWidth = (text: string, fontSize: number): number =>
  Math.max(text.length * fontSize * 0.6, fontSize)

const FONT_SANS = 'Inter, Arial, Helvetica, sans-serif'
const FONT_SERIF = "Fraunces, Georgia, 'Times New Roman', serif"

// The value-slider gauge — low/mid/high band, mirrors .shv-card--summary. Take 5
// recolours the card + active fill + handles + mid label (brand), but the title
// stays muted for both brands (it is grey in the app too). Returns an SVG string.
export const buildValuationGaugeSvg = (spec: GammaGaugeSpec): string => {
  const take5 = spec.merk === 'take5'

  const cardStart = take5 ? T5_COLORS.purpleSoft : OSAGO_GAUGE_COLORS.greenSoft
  const cardBorder = take5 ? T5_COLORS.purple : OSAGO_GAUGE_COLORS.green
  const activeStart = take5 ? T5_COLORS.orange : OSAGO_GAUGE_COLORS.green
  const activeEnd = take5 ? T5_COLORS.purple : OSAGO_GAUGE_COLORS.greenDark
  const handleFill = take5 ? T5_COLORS.purple : OSAGO_GAUGE_COLORS.greenDark
  const midColor = take5 ? T5_COLORS.purple : OSAGO_GAUGE_COLORS.greenDark

  const w = 900
  const h = 250
  const trackX0 = 90
  const trackX1 = 810
  const trackW = trackX1 - trackX0
  const yMid = 150
  const pos = (pct: number): number => trackX0 + pct * trackW
  const pos25 = pos(0.25)
  const pos50 = pos(0.5)
  const pos75 = pos(0.75)

  const boxedLabel = (cx: number, text: string): string => {
    const fontSize = 13
    const boxW = approxTextWidth(text, fontSize) + 16
    const boxH = 24
    const boxX = cx - boxW / 2
    const boxY = yMid - 34 - boxH
    return `<g>
      <rect x="${boxX.toFixed(1)}" y="${boxY}" width="${boxW.toFixed(1)}" height="${boxH}" rx="6" fill="#ffffff" stroke="${OSAGO_GAUGE_COLORS.line}" stroke-width="1"/>
      <text x="${cx}" y="${boxY + 16}" font-family="${FONT_SANS}" font-size="${fontSize}" font-weight="600" fill="${OSAGO_GAUGE_COLORS.ink2}" text-anchor="middle">${escapeXml(text)}</text>
    </g>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="gauge-card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${cardStart}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="gauge-active" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${activeStart}"/>
      <stop offset="1" stop-color="${activeEnd}"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="884" height="234" rx="16" fill="url(#gauge-card)" stroke="${cardBorder}" stroke-width="1"/>
  <text x="${w / 2}" y="52" font-family="${FONT_SANS}" font-size="13" font-weight="600" letter-spacing="0.6" fill="${OSAGO_GAUGE_COLORS.muted}" text-anchor="middle">${escapeXml(spec.title.toUpperCase())}</text>
  <rect x="${trackX0}" y="${yMid - 3}" width="${trackW}" height="6" rx="3" fill="${OSAGO_GAUGE_COLORS.line}"/>
  <rect x="${pos25}" y="${yMid - 3}" width="${pos75 - pos25}" height="6" rx="3" fill="url(#gauge-active)"/>
  <rect x="${pos50 - 1}" y="${yMid - 8}" width="2" height="16" fill="${OSAGO_GAUGE_COLORS.ink2}"/>
  <circle cx="${pos25}" cy="${yMid}" r="9" fill="${handleFill}" stroke="#ffffff" stroke-width="3"/>
  <circle cx="${pos75}" cy="${yMid}" r="9" fill="${handleFill}" stroke="#ffffff" stroke-width="3"/>
  ${boxedLabel(pos25, euro(spec.low))}
  ${boxedLabel(pos75, euro(spec.high))}
  <text x="${pos50}" y="${yMid + 48}" font-family="${FONT_SERIF}" font-size="26" font-weight="500" fill="${midColor}" text-anchor="middle">${escapeXml(euro(spec.mid))}</text>
</svg>`
}

// The value-driver bars — per theme a slecht→matig→goed gradient bar with the
// score as a marker + percentage. The gradient is SEMANTIC (never recoloured for
// Take 5, spec §13.7). Returns an SVG string sized to the number of rows.
export const buildValueDriversSvg = (
  scores: GammaValueDriversSpec['scores'],
): string => {
  const w = 960
  const titleColW = 300
  const leftPad = 8
  const rightPctW = 46
  const barX0 = leftPad + titleColW + 14
  const barX1 = w - leftPad - rightPctW - 14
  const barW = barX1 - barX0
  const headerY = 22
  const rowsTop = 44
  const rowH = 30
  const h = rowsTop + scores.length * rowH + 12

  const header = `<text x="${barX0}" y="${headerY}" font-family="${FONT_SANS}" font-size="11" font-weight="600" letter-spacing="0.44" fill="${VALUE_DRIVER_COLORS.headerLabel}" text-anchor="start">SLECHT</text>
  <text x="${(barX0 + barX1) / 2}" y="${headerY}" font-family="${FONT_SANS}" font-size="11" font-weight="600" letter-spacing="0.44" fill="${VALUE_DRIVER_COLORS.headerLabel}" text-anchor="middle">MATIG</text>
  <text x="${barX1}" y="${headerY}" font-family="${FONT_SANS}" font-size="11" font-weight="600" letter-spacing="0.44" fill="${VALUE_DRIVER_COLORS.headerLabel}" text-anchor="end">GOED</text>`

  const rows = scores
    .map((score, index) => {
      const pct = Math.max(0, Math.min(100, Math.round(score.score || 0)))
      const rowCenter = rowsTop + index * rowH + rowH / 2
      const markerX = barX0 + (pct / 100) * barW - 2
      return `<text x="${leftPad}" y="${rowCenter + 5}" font-family="${FONT_SANS}" font-size="13" font-weight="600" fill="${VALUE_DRIVER_COLORS.ink}" text-anchor="start">${escapeXml(score.title)}</text>
  <rect x="${barX0}" y="${rowCenter - 7}" width="${barW}" height="14" rx="7" fill="url(#vd-grad)"/>
  <rect x="${markerX.toFixed(1)}" y="${rowCenter - 12}" width="4" height="24" rx="2" fill="${VALUE_DRIVER_COLORS.ink}"/>
  <text x="${w - leftPad}" y="${rowCenter + 5}" font-family="${FONT_SANS}" font-size="13" font-weight="700" fill="${VALUE_DRIVER_COLORS.ink}" text-anchor="end">${pct}%</text>`
    })
    .join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="vd-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${VALUE_DRIVER_COLORS.bad}"/>
      <stop offset="0.5" stop-color="${VALUE_DRIVER_COLORS.ok}"/>
      <stop offset="1" stop-color="${VALUE_DRIVER_COLORS.good}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>
  ${header}
  ${rows}
</svg>`
}
