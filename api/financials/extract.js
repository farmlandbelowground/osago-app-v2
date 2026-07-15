// Vercel Serverless Function — extractie van financiële gegevens uit
// geüploade jaarstukken (PDF) of spreadsheets (XLSX/CSV → als tekst).
//
// Flow:
//   1. Verifieer ingelogde gebruiker (Supabase sessie via _auth.js).
//   2. Stuur het document naar Claude:
//        - PDF  → native document-content-block (base64)
//        - text → tekst-block (client heeft XLSX/CSV al naar CSV-tekst omgezet)
//   3. Claude extraheert per boekjaar de 6 invoerbare velden via tool-use
//      (gestructureerde JSON, geen vrije tekst → geen giswerk in de shape).
//   4. Retourneer { years: [...], currencyNote, confidence }.
//
// Env-vars: ANTHROPIC_API_KEY (+ SUPABASE_* voor auth).

import { authenticate } from '../_auth.js';

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

const EXTRACTION_TOOL = {
  name: 'rapporteer_financiele_gegevens',
  description: 'Rapporteer de uit de jaarstukken gelezen financiële kerncijfers, per boekjaar.',
  input_schema: {
    type: 'object',
    properties: {
      years: {
        type: 'array',
        description: 'Eén item per boekjaar dat in het document voorkomt. Alleen jaren met daadwerkelijke cijfers.',
        items: {
          type: 'object',
          properties: {
            year: { type: 'integer', description: 'Boekjaar (4 cijfers), bv. 2024.' },
            revenue: { type: ['number', 'null'], description: 'Netto-omzet in hele euro\'s. Null als niet gevonden.' },
            cogs: { type: ['number', 'null'], description: 'Kostprijs van de omzet / inkoopwaarde in hele euro\'s. Null als niet gevonden.' },
            operatingExpenses: { type: ['number', 'null'], description: 'Bedrijfskosten / overige bedrijfslasten in hele euro\'s, EXCLUSIEF afschrijvingen en rentelasten (die hebben eigen velden). Null als niet gevonden.' },
            depreciation: { type: ['number', 'null'], description: 'Afschrijvingen in hele euro\'s. Null als niet gevonden.' },
            interest: { type: ['number', 'null'], description: 'Rentelasten / financiële lasten in hele euro\'s. Null als niet gevonden.' },
            taxesPaid: { type: ['number', 'null'], description: 'Belastingen (vennootschapsbelasting) in hele euro\'s. Null als niet gevonden.' }
          },
          required: ['year']
        }
      },
      currencyNote: { type: 'string', description: 'Korte opmerking over valuta/schaal, bv. "bedragen × €1.000 — omgerekend naar hele euro\'s" of leeg.' },
      confidence: { type: 'string', enum: ['hoog', 'gemiddeld', 'laag'], description: 'Inschatting van de betrouwbaarheid van de extractie.' }
    },
    required: ['years', 'confidence']
  }
};

const SYSTEM_PROMPT = `Je bent een Nederlandse boekhoudkundige assistent die kerncijfers uit jaarstukken (jaarrekening, winst-en-verliesrekening, kolommenbalans) leest en structureert.

REGELS:
- Lees per boekjaar de cijfers. Veel documenten tonen 2 of 3 jaren naast elkaar — neem ze allemaal mee.
- Bedragen ALTIJD in hele euro's. Als het document "bedragen × €1.000" of "(in duizenden)" vermeldt, vermenigvuldig met 1000 en meld dit in currencyNote.
- Nederlandse notatie: punt = duizendtalscheiding, komma = decimaal. €3.560.000 = drie miljoen vijfhonderdzestigduizend.
- Mapping van posten:
  • Netto-omzet / Omzet → revenue
  • Kostprijs van de omzet / Inkoopwaarde van de omzet → cogs
  • Overige bedrijfskosten / bedrijfslasten (EXCLUSIEF afschrijvingen en rentelasten) → operatingExpenses
  • Afschrijvingen (op materiële/immateriële vaste activa) → depreciation
  • Rentelasten / Financiële baten en lasten (lasten) → interest
  • Belastingen / Vennootschapsbelasting → taxesPaid
- Verzin GEEN cijfers. Vind je een veld niet, zet het op null.
- Negeren wat geen P&L-cijfer is (balansposten als debiteuren, voorraden, eigen vermogen horen NIET in deze velden).
- Antwoord UITSLUITEND via de tool rapporteer_financiele_gegevens.`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callClaude(contentBlocks, anthropicKey){
  // Retry-met-backoff op 429 (rate limit). Anthropic geeft soms een
  // `retry-after`-header in seconden; respecteer die, maar plafonneer de wacht
  // zodat de serverless-functie niet timeoutt. Max 2 retries.
  const MAX_RETRIES = 2;
  const MAX_WAIT_MS = 12000;
  let lastBody = '';
  for(let attempt = 0; attempt <= MAX_RETRIES; attempt++){
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
        system: SYSTEM_PROMPT,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: 'tool', name: 'rapporteer_financiele_gegevens' },
        messages: [{ role: 'user', content: contentBlocks }]
      })
    });

    if(res.ok){
      const data = await res.json();
      const toolUse = (data.content || []).find(c => c.type === 'tool_use');
      if(!toolUse || !toolUse.input){
        return { years: [], confidence: 'laag', currencyNote: '' };
      }
      return toolUse.input;
    }

    lastBody = await res.text().catch(() => '');

    // Alleen 429 (rate limit) is zinvol om te herproberen.
    if(res.status === 429 && attempt < MAX_RETRIES){
      const retryAfter = parseFloat(res.headers.get('retry-after') || '');
      const waitMs = Math.min(
        MAX_WAIT_MS,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 4000
      );
      await sleep(waitMs);
      continue;
    }

    // Geef een herkenbare, vertaalbare fout terug; 429 krijgt een eigen code.
    const err = new Error(`Anthropic ${res.status}: ${lastBody.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const err = new Error(`Anthropic 429 (rate limit) na ${MAX_RETRIES} retries: ${lastBody.slice(0, 200)}`);
  err.status = 429;
  throw err;
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if(!anthropicKey){
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY ontbreekt op de server.' });
  }

  let body = req.body;
  if(typeof body === 'string'){ try { body = JSON.parse(body); } catch { body = null; } }
  if(!body || !body.kind){
    return res.status(400).json({ error: 'Body moet { kind: "pdf"|"text", ... } bevatten.' });
  }

  try {
    let contentBlocks;
    if(body.kind === 'pdf'){
      if(!body.dataBase64){
        return res.status(400).json({ error: 'dataBase64 ontbreekt voor PDF-extractie.' });
      }
      // Grove grootte-check op de base64 (4/3 overhead)
      if(body.dataBase64.length * 0.75 > MAX_PDF_BYTES){
        return res.status(400).json({ error: 'PDF te groot (max 10 MB).' });
      }
      contentBlocks = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: body.dataBase64 }
        },
        { type: 'text', text: 'Extraheer de financiële kerncijfers uit deze jaarstukken, per boekjaar.' }
      ];
    } else if(body.kind === 'text'){
      const text = String(body.text || '').slice(0, 100000); // cap tegen extreme inputs
      if(!text.trim()){
        return res.status(400).json({ error: 'Lege tekst-inhoud aangeleverd.' });
      }
      contentBlocks = [
        { type: 'text', text: `Hieronder de inhoud van een geüpload financieel bestand (uit Excel/CSV omgezet naar tekst). Extraheer de financiële kerncijfers per boekjaar.\n\n---\n${text}\n---` }
      ];
    } else {
      return res.status(400).json({ error: 'Onbekende kind. Gebruik "pdf" of "text".' });
    }

    const result = await callClaude(contentBlocks, anthropicKey);
    // Normaliseer: filter jaren zonder enig cijfer, rond af op hele euro's
    const FIELDS = ['revenue', 'cogs', 'operatingExpenses', 'depreciation', 'interest', 'taxesPaid'];
    const years = (Array.isArray(result.years) ? result.years : [])
      .map(y => {
        const out = { year: parseInt(y.year, 10) };
        let hasAny = false;
        for(const f of FIELDS){
          const v = (y[f] === null || y[f] === undefined || y[f] === '') ? null : Number(y[f]);
          out[f] = (v === null || !Number.isFinite(v)) ? null : Math.round(v);
          if(out[f] !== null) hasAny = true;
        }
        return hasAny && Number.isInteger(out.year) ? out : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.year - b.year);

    return res.status(200).json({
      years,
      currencyNote: result.currencyNote || '',
      confidence: result.confidence || 'gemiddeld'
    });
  } catch(err){
    console.error('[financials/extract]', err);
    // Rate limit → herkenbare, vriendelijke melding (en correcte 429-status).
    if(err && err.status === 429){
      return res.status(429).json({
        error: 'De AI-dienst is even te druk (limiet bereikt). Wacht ongeveer een minuut en probeer het opnieuw. Tip: upload één jaarrekening tegelijk.'
      });
    }
    return res.status(502).json({ error: (err && err.message) || 'Extractie mislukt.' });
  }
}
