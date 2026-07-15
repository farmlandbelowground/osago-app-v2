// Vercel Serverless Function — start een Gamma-generatie voor het Osago
// verkoopmemorandum (IM) of het anonieme verkoopprofiel (teaser).
//
// Tweedelige flow (Gamma-generatie duurt minuten → langer dan een serverless
// functie mag draaien):
//   1. POST /api/gamma/generate  → maakt de generatie aan, geeft generationId
//   2. GET  /api/gamma/status    → polt één keer; browser herhaalt tot klaar
//
// Osago-huisstijl wordt via additionalInstructions afgedwongen (groen #00B33C,
// Fraunces/Inter-gevoel, zakelijke M&A-toon). Een dedicated Osago Gamma-thema
// kan later via GAMMA_OSAGO_THEME_ID worden ingeplugd voor pixel-perfecte stijl.
//
// Env-vars: GAMMA_API_KEY (+ SUPABASE_* voor auth).

import { authenticate } from '../_auth.js';

const GAMMA_BASE_URL = 'https://public-api.gamma.app/v1.0';

// Gedeelde Osago-huisstijl. Geldt voor alle documenttypes.
const OSAGO_HOUSE_STYLE =
  'HUISSTIJL OSAGO: gebruik als primaire accentkleur groen (#00B33C) met donkere ink-tekst (#0A1F14) op een rustige, lichte achtergrond. ' +
  'Koppen serif-achtig en zelfverzekerd, bodytekst schoon en zakelijk. Professioneel, transparant, vertrouwenwekkend — geen overdrijving. ' +
  'Minimale fontgrootte 11pt, ook in tabellen en grafieklabels. Gebruik op elke slide minimaal één visueel element (KPI-blok, tabel, grafiek, icoon-layout) — vermijd slides met alleen lopende tekst. ' +
  'Taal: Nederlands.';

// Positionering — kern van de Osago-propositie: self-service. De documenten
// worden opgesteld VIA het platform; de klant voert de verkoop zelf. Osago
// mag in de documenten nergens als begeleider, adviseur, tussenpersoon of
// contactpunt worden neergezet.
const OSAGO_POSITIONING =
  'POSITIONERING (belangrijk): dit document is opgesteld door de aanbieder zelf, met behulp van het Osago-platform. ' +
  'De verkoop wordt te allen tijde door de aanbieder zelf gevoerd. Osago begeleidt de transactie NIET, is GEEN partij, adviseur of tussenpersoon, en mag NERGENS als contactpunt of begeleider worden genoemd. ' +
  'Schrijf dus nooit "via Osago", "Osago begeleidt" of "contact via Osago". Verwijs voor contact en vervolgstappen uitsluitend naar de aanbieder zelf.';

// Vaste opbouw — de input bevat een expliciete slide-structuur die exact
// gevolgd moet worden. Geen eigen secties of inhoud toevoegen.
const OSAGO_FIXED_STRUCTURE =
  'VASTE OPBOUW: de input bevat een genummerde slide-opbouw. Volg die EXACT: dezelfde slides, dezelfde volgorde, dezelfde titels. ' +
  'Maak geen extra slides, voeg geen secties toe en verzin geen inhoud die niet is aangeleverd. Slides zonder aangeleverde inhoud staan niet in de opbouw en mogen ook niet worden toegevoegd.';

const OSAGO_STYLE_INSTRUCTIONS =
  'Dit is een vertrouwelijk verkoopdocument voor de verkoop van een Nederlandse onderneming, opgesteld door de aanbieder via het Osago-platform. ' +
  OSAGO_POSITIONING + ' ' +
  OSAGO_FIXED_STRUCTURE + ' ' +
  OSAGO_HOUSE_STYLE + ' ' +
  'Gebruik grote KPI-cijfers voor financiële kerngetallen, nette tabellen voor de meerjaren-financiën, en een 2x2-grid voor de SWOT. ' +
  'Toon: zakelijk en professioneel, gericht op potentiële kopers en investeerders.';

// Eigen format voor het waarderingsrapport (afwijkend van het IM). De vaste
// slide-opbouw zit in de input (SLIDE n — titel); hier alleen toon en regels.
const OSAGO_VALUATION_INSTRUCTIONS =
  'Dit is een INDICATIEF WAARDERINGSRAPPORT van een Nederlandse onderneming, opgesteld door de aanbieder zelf via het Osago-platform. ' +
  OSAGO_POSITIONING + ' ' +
  OSAGO_FIXED_STRUCTURE + ' ' +
  OSAGO_HOUSE_STYLE + ' ' +
  'Toon: objectief, onderbouwend en zakelijk — als een professioneel waarderingsdocument, niet als verkooppraatje. ' +
  'Gebruik grote, duidelijke KPI-cijfers voor de indicatieve waarde-bandbreedtes en een nette meerjaren-tabel voor de financiële onderbouwing. ' +
  'Geef de aangeleverde cijfers EXACT weer; verander of verzin GEEN bedragen. Presenteer waardes als bandbreedtes waar aangegeven.';

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const apiKey = process.env.GAMMA_API_KEY;
  if(!apiKey){
    return res.status(500).json({ error: 'GAMMA_API_KEY ontbreekt op de server.', code: 'CONFIG_ERROR' });
  }

  let body = req.body;
  if(typeof body === 'string'){ try { body = JSON.parse(body); } catch { body = null; } }
  if(!body || !body.inputText){
    return res.status(400).json({ error: 'inputText ontbreekt.' });
  }

  // variant: 'memorandum' (volledig IM), 'teaser' (anoniem, beknopt) of
  // 'valuation' (indicatief waarderingsrapport — eigen format).
  const ALLOWED_VARIANTS = ['memorandum', 'teaser', 'valuation'];
  const variant = ALLOWED_VARIANTS.includes(body.variant) ? body.variant : 'memorandum';
  const exportAs = body.exportAs === 'pptx' ? 'pptx' : 'pdf';

  // textMode bepaalt hoeveel vrijheid de generator heeft. 'preserve' = de
  // aangeleverde inhoud zo getrouw mogelijk visueel reproduceren (de klant
  // levert nu in de interface de volledige inhoud aan); 'condense'/'generate'
  // laten de generator zelf (her)schrijven. Client mag dit meegeven; default
  // 'preserve' zodat het document de ingevoerde informatie weergeeft i.p.v.
  // er nieuwe tekst bij te verzinnen.
  const ALLOWED_TEXT_MODES = ['preserve', 'condense', 'generate'];
  const textMode = ALLOWED_TEXT_MODES.includes(body.textMode) ? body.textMode : 'preserve';

  // Aantal slides: de client berekent dit op basis van de daadwerkelijk
  // gevulde secties (vaste opbouw). Zonder opgave: per-variant default.
  const defaultCards = variant === 'teaser' ? 6 : (variant === 'valuation' ? 12 : 18);
  const clientCards = parseInt(body.numCards, 10);
  const numCards = (Number.isInteger(clientCards) && clientCards >= 3 && clientCards <= 20)
    ? clientCards
    : defaultCards;
  const amount = variant === 'teaser' ? 'brief' : 'detailed';
  let additionalInstructions;
  if(variant === 'valuation'){
    additionalInstructions = OSAGO_VALUATION_INSTRUCTIONS;
  } else if(variant === 'teaser'){
    additionalInstructions = OSAGO_STYLE_INSTRUCTIONS +
      ' Dit is een ANONIEME teaser: gebruik GEEN bedrijfsnaam, exacte locatie of herkenbare klantnamen. Houd het kort en prikkelend om interesse te peilen.';
  } else {
    additionalInstructions = OSAGO_STYLE_INSTRUCTIONS +
      ' Dit is het volledige Informatiememorandum: gedetailleerd, met bedrijfsprofiel, markt, financiën, waardering en transactierationale.';
  }

  const reqBody = {
    inputText: String(body.inputText).slice(0, 100000),
    textMode,
    format: 'presentation',
    numCards,
    exportAs,
    textOptions: {
      language: 'nl',
      tone: variant === 'valuation' ? 'objectief en onderbouwend' : 'professioneel en zakelijk',
      audience: variant === 'valuation' ? 'ondernemer en adviseurs' : 'M&A kopers en investeerders',
      amount
    },
    imageOptions: { source: 'pexels' },
    cardOptions: { dimensions: '16x9' },
    additionalInstructions
  };
  // Optioneel dedicated Osago-thema
  if(process.env.GAMMA_OSAGO_THEME_ID){
    reqBody.themeId = process.env.GAMMA_OSAGO_THEME_ID;
  }

  try {
    const r = await fetch(`${GAMMA_BASE_URL}/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify(reqBody)
    });
    const text = await r.text();
    if(!r.ok){
      return res.status(r.status).json({ error: `Gamma API fout (${r.status}): ${text.slice(0, 300)}` });
    }
    let data; try { data = JSON.parse(text); } catch { data = {}; }
    if(!data.generationId){
      return res.status(502).json({ error: 'Gamma gaf geen generationId terug.' });
    }
    return res.status(200).json({ generationId: data.generationId, status: data.status || 'pending', variant });
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Gamma-call mislukt.' });
  }
}
