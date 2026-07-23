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

// Instructie voor de VASTE templates (teaser/IM/waarderingsrapport).
//
// ONTWERPVRIJHEID vs. WOORDELIJKE TEKST zijn bij Gamma één knop, geen twee: de
// ontwerpstap ís een herschrijfstap. Maikel/Robert kozen daarom expliciet:
// ONTWERP WINT. Gamma mag ondersteunende zinnen bijschrijven en bedragen
// afkorten (€ 4,2M); de klant leest na vóór verzending. De harde regels
// hieronder zijn géén smaak maar feitelijke integriteit — elke regel staat er
// omdat Gamma dat aantoonbaar fout deed (juli 2026, echte generaties).
const OSAGO_FIXED_TEMPLATE_INSTRUCTIONS =
  'JOUW ROL: je bent de vormgever van een zeer ervaren adviseur in bedrijfsovernames. Denk als een partner bij een M&A-kantoor: kerncijfers groot en zelfverzekerd, heldere visuele hiërarchie, rust en klasse.\n\n' +
  'ONTWERP MAXIMAAL — je hebt volledige ontwerpvrijheid: KPI-blokken, accentvlakken en gekleurde panelen, tabellen met accentkoppen, meerkolomsindelingen, tijdlijnen, pull-quotes en grafieken. Geef elke kaart een eigen compositie; vermijd een stramien van kop-plus-alinea. Vul de kaart evenwichtig.\n\n' +
  'CIJFERS VISUALISEREN IS GEWENST: zet aangeleverde cijfers om in grafieken en KPI-blokken. Je mag bedragen compact weergeven (€ 4,2M voor € 4.200.000) en ondersteunende tussenkoppen en korte kernzinnen toevoegen die uit de aangeleverde tekst volgen.\n\n' +
  'HARDE REGELS:\n\n' +
  '1. VERZIN GEEN CIJFERS OF OORDELEN: voeg nooit scores, percentages, ratio\'s, groeicijfers of jaartallen toe die niet uit de tekst volgen. Reken niets uit. Elk getal in een grafiek of KPI-blok komt uit de aangeleverde tekst. Zet onder of naast een KPI-blok NOOIT je eigen uitleg over hoe een getal tot stand kwam — schrijf bijvoorbeeld niet "Gemiddelde 2024-2025" onder een genormaliseerde EBITDA, want die is niet het gemiddelde van de jaren. Een bijschrift mag alleen woorden bevatten die de tekst zelf bij dat getal gebruikt.\n\n' +
  '2. VERZIN GEEN JURIDISCHE OF ZAKELIJKE BEWERINGEN: schrijf geen geheimhoudings-, aansprakelijkheids- of verspreidingsclausule bij. Verzin geen claims over bedrijven, certificeringen of specialismen. Staat er "Strikt vertrouwelijk document.", schrijf dan NIET "mag niet worden verspreid zonder toestemming van...".\n\n' +
  '3. NIETS WEGLATEN: alle koppen, alinea\'s en tabellen komen volledig terug. Een aangeleverde TABEL blijft altijd als tabel staan — een grafiek komt er hooguit BIJ, nooit in plaats van de tabel.\n\n' +
  '4. GRAFIEKEN MOGEN NOOIT MISLEIDEN: zet bedragen van verschillende jaren NOOIT als gestapelde staven op elkaar — dat suggereert een totaal dat niet bestaat (2024 + 2025 omzet is geen €7,7M). Gebruik altijd gegroepeerde staven naast elkaar of een lijn per reeks. Een lezer mag uit de grafiek geen getal kunnen aflezen dat niet in de tekst staat.\n\n' +
  '5. PAGINA-INDELING VOLGEN: elk tekstblok (gescheiden door ---) is precies één kaart. Voeg kaarten niet samen, splits ze niet, herorden ze niet. Binnen de kaart ben je vrij.\n\n' +
  '6. GEEN EIGEN AFBEELDINGEN: voeg geen foto\'s, stockbeelden of illustraties toe.\n\n' +
  '7. GEEN ICOON-AFBEELDING IN EEN CALLOUT: een callout- of waarschuwingsvak bevat UITSLUITEND tekst. Nooit een paginavullend of uitvergroot icoon; iconen zijn altijd klein en op tekstgrootte.\n\n' +
  '8. DISCLAIMER: geef een als blockquote aangeleverde disclaimer weer als amber/geel waarschuwingsvak over de volle breedte, tekst volledig leesbaar.\n\n' +
  '9. KAART "VALUE DRIVERS" MET ÉÉN ZIN: die kaart is bewust bijna leeg — daar plaatsen wij zelf een grafiek. Houd hem minimaal: alleen de kop en die ene zin. Dit geldt UITSLUITEND voor die kaart.\n\n' +
  'Taal: Nederlands.';

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

  // Beeldbron. Voor de vaste templates leveren we onze eigen foto's/componenten
  // zelf aan (server-side injectie); dan zetten we 'noImages' zodat Gamma GEEN
  // eigen stockfoto's toevoegt. Zonder opgave: 'pexels' (oude gedrag). Altijd
  // meesturen — zonder deze parameter valt Gamma terug op aiGenerated.
  const ALLOWED_IMG_SOURCES = ['aiGenerated','webAllImages','webFreeToUse','webFreeToUseCommercially','pictographic','giphy','pexels','placeholder','noImages','themeAccent','unsplash'];
  const imgSource = (body.imageOptions && ALLOWED_IMG_SOURCES.includes(body.imageOptions.source))
    ? body.imageOptions.source : 'pexels';

  // cardSplit 'inputTextBreaks' laat de vaste opbouw sturen door expliciete
  // '---'-scheidingen in de inputText (één blok = één slide). Zo volgt de deck
  // exact de aangeleverde slide-indeling.
  const cardSplit = (body.cardSplit === 'inputTextBreaks' || body.cardSplit === 'auto') ? body.cardSplit : null;

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
      ' Dit is een ANONIEME teaser: gebruik GEEN bedrijfsnaam, volledige adresgegevens (straat/huisnummer) of herkenbare klantnamen. Sector en vestigingsplaats mogen wél worden getoond. Houd het kort en prikkelend om interesse te peilen.';
  } else {
    additionalInstructions = OSAGO_STYLE_INSTRUCTIONS +
      ' Dit is het volledige Informatiememorandum: gedetailleerd, met bedrijfsprofiel, markt, financiën, waardering en transactierationale.';
  }

  // Vaste-template-modus: de client levert een volledig uitgewerkte, vaste
  // slide-opbouw (met eigen foto's/componenten die wij server-side injecteren).
  // Dan overrulen we de bovenstaande stijl-instructies met de minimale
  // fixedTemplate-variant (ONTWERP WINT + feitelijke-integriteit-regels).
  if(body.fixedTemplate === true){
    additionalInstructions = OSAGO_FIXED_TEMPLATE_INSTRUCTIONS +
      (variant === 'teaser'
        ? ' Dit is een ANONIEME teaser: gebruik GEEN bedrijfsnaam of volledige adresgegevens (straat/huisnummer); sector en vestigingsplaats mogen wél worden getoond.'
        : '');
    // Layout-hint: wij plaatsen zelf een foto in de rechterhelft van elke slide.
    // Dit wérkt: het vraagt om een lege grid-KOLOM, die Gamma structureel in de
    // kaart inbouwt (gridLayout colWidths [55,45], rechtercel leeg).
    if(body.reserveRightHalf === true){
      additionalInstructions += ' FOTO-RUIMTE: gebruik op elke kaart een indeling met de tekst in de linkerhelft (circa 55%) en houd de rechterhelft volledig leeg; daar plaatsen wij een foto. Laat de rechterhelft echt leeg — zet er geen tekst, tabel of grafiek in.';
    }
    // NB: er was hier een reserveBottom-hint. Die is verwijderd omdat hij
    // aantoonbaar NIETS doet: Gamma zet verticalAlign:"center" +
    // scaleContentToFit:true op DOCUMENTniveau, en additionalInstructions raken
    // alleen de contentgeneratie, niet de rendering. De vrije ruimte voor de
    // slider wordt daarom bij de INJECTIE gemeten en gemaakt (injectImagesIntoPdf),
    // niet aan Gamma gevraagd.
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
    cardOptions: { dimensions: '16x9' },
    additionalInstructions
  };
  // imageOptions ALTIJD meesturen. Empirisch gebleken: zonder deze parameter
  // valt Gamma terug op aiGenerated en verzint het beelden, en een tekstueel
  // verbod in de instructies houdt dat niet tegen. De client stuurt voor de
  // vaste templates 'noImages'; eigen foto's plaatsen we zelf via de injectie.
  reqBody.imageOptions = { source: imgSource };
  if(cardSplit) reqBody.cardSplit = cardSplit;
  // Gamma-thema bepaalt de visuele stijl (kleuren, fonts, kaart-/grafiek-opmaak).
  // Default: 'commons' — een groen, professioneel standaardthema dat met elke
  // API-key werkt. De client mag per variant een eigen themeId meegeven (bv. een
  // Take 5-thema); env GAMMA_OSAGO_THEME_ID kan de default overschrijven.
  const clientTheme = (typeof body.themeId === 'string' && /^[a-zA-Z0-9_-]{2,40}$/.test(body.themeId)) ? body.themeId : null;
  reqBody.themeId = clientTheme || process.env.GAMMA_OSAGO_THEME_ID || 'commons';

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
