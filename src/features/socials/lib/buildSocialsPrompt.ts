import { SOCIALS_PLATFORM_SPECS } from '../constants'
import { type IllustrationItem, type SocialsInputs, type SocialsPlatform } from '../types'

// Brand context — ported verbatim from socialsGenerateAll (osago-bundle.js:28517).
export const SOCIALS_BRAND_CONTEXT = `Osago is een self-service M&A platform voor Nederlandse MKB-ondernemers (bedrijven met €0–€2.5M jaaromzet) die hun bedrijf willen verkopen.

Kernpropositie: klanten doen het meeste werk zelf met behulp van Osago's tools, templates en gevalideerde kopers. Osago levert structuur en begeleiding zonder de klassieke succesfee.
- Vaste lage prijzen: vanaf €999 per jaar
- GEEN succesfee (in tegenstelling tot traditionele M&A bureaus)
- Klant houdt de regie zelf
- Tools, templates, gevalideerde kopers

Tone of voice (heel belangrijk):
- INFORMEEL: gebruik je/jij/jouw, NOOIT u/uw
- Geen ampersands ("&"), gebruik altijd "en"
- "Succesfee" als één woord
- Concrete getallen waar mogelijk: vanaf €999, 6 maanden, 3 of 5 kopers, 50% terugbetaling, geen succesfee
- Self-service positionering: "jij doet het meeste zelf, met onze hulp"
- Ondernemend, no-nonsense, vertrouwd
- Italic-accent pattern: één woord of korte frase per zin mag licht benadrukt worden

Voorbeelden van hero-tekst stijl van de site:
- "Verkoop jouw bedrijf met onze hulp"
- "Met Osago verkoop je zelf jouw bedrijf, met onze tools en begeleiding. Voor een vast laag tarief, zonder succesfee."
- "Vaste lage prijs / Je houdt zelf de regie / Wij bieden je alle tools en hulp"

Naast bedrijfsverkoop biedt Osago ook bedrijfswaarderingen (vanaf €299).`

// Per-platform JSON-only instructions — ported verbatim from
// socialsGenerateForPlatform (osago-bundle.js:28447-28479).
const SOCIALS_PLATFORM_INSTRUCTIONS: Record<SocialsPlatform, string> = {
  facebook: `Genereer een Facebook post in het Nederlands voor Osago met één visueel concept. Toon: toegankelijker dan LinkedIn, mag persoonlijker en warmer. Publiek is ondernemers en hun omgeving. Geef ALLEEN geldig JSON:
{
  "post": "Post-tekst (120-220 woorden, INFORMEEL met je/jij/jouw, hook regel 1, korte alinea's, 1-2 emoji's, duidelijke CTA met link osago.nl, 2-4 hashtags)",
  "visual": { "headline": "Koptekst (max 8 woorden)", "subline": "Ondersteunend (max 14 woorden, je-vorm)", "illustration_hint": "Welke van de 5 Osago-illustraties past (bedrijfsbezoek/contract-tekenen/meeting/koffie-drinken/waardering)" }
}`,
  instagram: `Genereer een Instagram CARROUSEL post in het Nederlands voor Osago. Geef ALLEEN een geldig JSON object terug zonder markdown:
{
  "caption": "Caption (180-280 woorden, INFORMEEL met je/jij/jouw, 1-2 emoji's mag, duidelijke CTA naar 'Begin gratis op osago.nl' of 'Lees meer op osago.nl', 6-10 hashtags zoals #bedrijfovername #MKB #ondernemen #bedrijfverkopen)",
  "slides": [
    { "title": "Korte titel (max 6 woorden, mag een vraag of getal als hook zijn)", "body": "1-2 zinnen, je-vorm", "illustration_hint": "Welke van de 5 Osago-illustraties past hier het best (bedrijfsbezoek/contract-tekenen/meeting/koffie-drinken/waardering)" }
  ]
}
Geef 5 tot 7 slides; slide 1 = hook, laatste = CTA-slide ("Begin gratis op osago.nl" of vergelijkbaar).`,
  linkedin: `Genereer een LinkedIn post in het Nederlands voor Osago met één visueel concept. Toon: B2B-ondernemers, inhoudelijk, mag concrete getallen bevatten (€999, 6 maanden, geen succesfee). Geef ALLEEN geldig JSON:
{
  "post": "Post-tekst (180-300 woorden, INFORMEEL met je/jij/jouw, sterke hook regel 1, witregels tussen alinea's, max 1 emoji, CTA aan einde, 3-5 hashtags)",
  "visual": { "headline": "Koptekst (max 8 woorden, gebruik concrete getallen waar passend)", "subline": "Ondersteunend (max 14 woorden, je-vorm)", "illustration_hint": "Welke van de 5 Osago-illustraties past (bedrijfsbezoek/contract-tekenen/meeting/koffie-drinken/waardering)" }
}`,
}

// Ports the userBase assembly inside socialsGenerateAll (osago-bundle.js:28542).
export const buildSocialsUserBase = (
  inputs: SocialsInputs,
  illustrations: IllustrationItem[],
): string =>
  `Onderwerp: ${inputs.topic}
${inputs.angle ? `Invalshoek/hoek: ${inputs.angle}` : ''}
Gewenste toon (binnen Osago-stijl): ${inputs.tone}
Doelgroep: ${inputs.audience}
${
    illustrations.length > 0
      ? `De gebruiker heeft eigen illustraties geupload: ${illustrations
          .map(item => item.name)
          .join(', ')}`
      : 'Beschikbare standaard Osago-illustraties: bedrijfsbezoek, contract-tekenen, meeting, koffie-drinken, waardering'
  }`

// Ports the per-platform message content assembly (osago-bundle.js:28486).
export const buildSocialsMessage = (
  platform: SocialsPlatform,
  brandContext: string,
  userBase: string,
): string =>
  `${brandContext}\n\n${SOCIALS_PLATFORM_INSTRUCTIONS[platform]}\n\n${userBase}\n\nMaak hier de ${SOCIALS_PLATFORM_SPECS[platform].name} versie van.`

// Ports the JSON extraction with ```-fence stripping + {..} substring fallback
// (osago-bundle.js:28497-28507).
export const parseSocialsJson = (rawText: string): unknown => {
  const text = rawText.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(text)
  } catch {
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')

    if (first !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1))
    }

    throw new Error(`Model gaf geen geldige JSON terug: ${text.slice(0, 200)}`)
  }
}
