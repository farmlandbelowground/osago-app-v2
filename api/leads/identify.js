// Vercel Serverless Function — automatische lead-identificatie.
// "Kopersmatching → Automatisch geïdentificeerde leads"
//
// Flow:
//   1. Verifieer ingelogde gebruiker (Supabase sessie via _auth.js).
//   2. Bouw zoekqueries op basis van het bedrijfsprofiel (sector + regio).
//   3. Serper (Google-search API) levert organische resultaten.
//   4. Claude structureert die resultaten naar concrete potentiële kopers
//      met fit-score + onderbouwing (JSON via tool-use, geen vrije tekst).
//   5. Retourneer de gestructureerde lijst aan de browser.
//
// Env-vars: SERPER_API_KEY, ANTHROPIC_API_KEY (+ SUPABASE_* voor auth).
// Keys leven uitsluitend server-side — nooit in de browser-bundle.

import { authenticate } from '../_auth.js';

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

// ── Serper web-search ────────────────────────────────────────────────
async function serperSearch(query, serperKey){
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'nl', hl: 'nl', num: 10 })
    });
    if(!res.ok) return [];
    const data = await res.json();
    const out = [];
    if(Array.isArray(data.organic)){
      for(const item of data.organic){
        out.push({
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || ''
        });
      }
    }
    return out;
  } catch(_){
    return [];
  }
}

// Bouw 3 zoekqueries: sector+regio, sector+overname-intentie, en sector breed.
function buildQueries({ sector, city, region }){
  const loc = region || city || 'Nederland';
  const s = sector || 'bedrijven';
  const queries = [
    `${s} bedrijven ${loc}`,
    `grootste ${s} bedrijven Nederland`,
    `${s} ${loc} overname acquisitie`
  ];
  // Dedup
  return [...new Set(queries)];
}

// ── Claude structurering ─────────────────────────────────────────────
const EXTRACTION_TOOL = {
  name: 'rapporteer_potentiele_kopers',
  description: 'Rapporteer de geïdentificeerde potentiële kopers/overnamekandidaten in gestructureerde vorm.',
  input_schema: {
    type: 'object',
    properties: {
      leads: {
        type: 'array',
        description: 'Lijst van potentiële kopers (max 8), gesorteerd op relevantie (hoogste fit eerst).',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Bedrijfsnaam' },
            type: { type: 'string', description: 'Type koper, bv. "Strategische koper", "Branchegenoot", "Investeerder / PE", "Concurrent"' },
            location: { type: 'string', description: 'Plaats of regio (indien bekend, anders leeg)' },
            website: { type: 'string', description: 'Website-URL indien bekend, anders leeg' },
            rationale: { type: 'string', description: 'Korte onderbouwing (1-2 zinnen) waarom dit een logische koper is.' },
            fitScore: { type: 'integer', description: 'Fit-score 0-100 op basis van sector-overlap, regio en omvang.' }
          },
          required: ['name', 'type', 'rationale', 'fitScore']
        }
      }
    },
    required: ['leads']
  }
};

async function structureWithClaude({ company, searchResults }, anthropicKey){
  const resultsText = searchResults
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.link}\n   ${r.snippet}`)
    .join('\n\n');

  const systemPrompt = `Je bent een M&A-analist die voor een verkopend bedrijf potentiële kopers identificeert op basis van web-zoekresultaten.

REGELS:
- Identificeer ALLEEN echte, bestaande bedrijven die uit de zoekresultaten blijken. Verzin GEEN bedrijven.
- Sluit het verkopende bedrijf zelf uit, plus directories/marktplaatsen (Sortlist, KvK, LinkedIn-overzichten, vergelijkingssites).
- Geef voorkeur aan strategische kopers, branchegenoten en investeerders die logischerwijs dit type onderneming zouden overnemen.
- Wees eerlijk over fit: een vage match krijgt een lage score.
- Maximaal 8 leads. Geen duplicaten.
- Antwoord UITSLUITEND via de tool rapporteer_potentiele_kopers.`;

  const userPrompt = `VERKOPEND BEDRIJF:
- Naam: ${company.name || 'onbekend'}
- Sector: ${company.sector || 'onbekend'}
- Regio/plaats: ${company.region || company.city || 'Nederland'}
${company.description ? `- Omschrijving: ${company.description}` : ''}

WEB-ZOEKRESULTATEN:
${resultsText || '(geen resultaten)'}

Identificeer de meest logische potentiële kopers voor dit bedrijf.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'rapporteer_potentiele_kopers' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if(!res.ok){
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const toolUse = (data.content || []).find(c => c.type === 'tool_use');
  if(!toolUse || !toolUse.input || !Array.isArray(toolUse.input.leads)){
    return [];
  }
  return toolUse.input.leads;
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth — alleen ingelogde gebruikers
  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const serperKey = process.env.SERPER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if(!serperKey || !anthropicKey){
    return res.status(500).json({ error: 'Server-config ontbreekt (SERPER_API_KEY / ANTHROPIC_API_KEY).' });
  }

  let body = req.body;
  if(typeof body === 'string'){ try { body = JSON.parse(body); } catch { body = null; } }
  const company = (body && body.company) || {};
  if(!company.sector){
    return res.status(400).json({ error: 'Sector ontbreekt — vul eerst het bedrijfsprofiel in.' });
  }

  try {
    // 1. Web-search (parallel over de queries)
    const queries = buildQueries(company);
    const searchBatches = await Promise.all(queries.map(q => serperSearch(q, serperKey)));
    // Flatten + dedup op link
    const seen = new Set();
    const searchResults = [];
    for(const batch of searchBatches){
      for(const r of batch){
        const key = r.link || r.title;
        if(key && !seen.has(key)){ seen.add(key); searchResults.push(r); }
      }
    }

    if(searchResults.length === 0){
      return res.status(200).json({ leads: [], note: 'Geen zoekresultaten gevonden voor dit profiel.' });
    }

    // 2. Claude structureert naar potentiële kopers
    const leads = await structureWithClaude({ company, searchResults }, anthropicKey);

    return res.status(200).json({
      leads,
      meta: { queriesRun: queries.length, resultsAnalysed: searchResults.length }
    });
  } catch(err){
    console.error('[leads/identify]', err);
    return res.status(502).json({ error: (err && err.message) || 'Lead-identificatie mislukt.' });
  }
}
