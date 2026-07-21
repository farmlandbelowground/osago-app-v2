import {
  buildBuyerAddress,
  buyerContactName,
  escapeHtml,
  type SalesDocumentContext,
} from './shared'

// Verbatim port of doGenerateLoi's Word-HTML template (osago-bundle.js:22520-22727).
export const buildLoiHtml = (context: SalesDocumentContext): string => {
  const { buyer, company, seller, today } = context

  const sellerName = company.name
  const sellerLocation = company.city || ''
  const sellerKvk = company.kvkNummer || ''
  const sellerSignatory = seller.signatory

  const buyerName = buyer.name || '[bedrijfsnaam koper]'
  const buyerLocation = buildBuyerAddress(buyer, false) || buyer.location || ''
  const buyerSignatory = buyerContactName(buyer)

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Intentieverklaring — ${escapeHtml(sellerName)} & ${escapeHtml(buyerName)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
@page { size: A4; margin: 2.5cm 2.5cm 2.5cm 2.5cm; mso-header-margin:1cm; mso-footer-margin:1cm; }
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color:#000; }
h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 0 0 6pt 0; }
h2 { font-size: 12pt; font-weight: bold; margin: 18pt 0 6pt 0; }
h3 { font-size: 11pt; font-weight: bold; margin: 12pt 0 4pt 0; }
p { margin: 0 0 8pt 0; text-align: justify; }
.subtitle { text-align: center; font-size: 10pt; color:#444; margin-bottom: 24pt; }
.party-block { margin: 6pt 0 12pt 0; padding-left: 18pt; }
.party-label { font-weight: bold; }
ol { margin: 0 0 8pt 24pt; padding-left: 0; }
ol.articles > li { margin-bottom: 8pt; }
ol.articles > li > p { margin-top: 4pt; }
ol li { margin-bottom: 4pt; }
.placeholder { background:#FFF8DC; padding:1pt 4pt; border:1px dashed #C4A24C; }
.signature-block { margin-top: 36pt; }
.signature-table { width: 100%; border-collapse: collapse; margin-top: 12pt; }
.signature-table td { width: 50%; vertical-align: top; padding: 0 12pt 0 0; }
.sig-line { border-bottom: 1px solid #000; height: 36pt; margin-bottom: 6pt; }
.sig-meta { font-size: 10pt; line-height: 1.4; }
.confidential { color:#A30000; font-weight: bold; font-size: 9pt; letter-spacing: 1pt; text-align:center; margin-bottom: 4pt; }
.disclaimer-box { border: 2px solid #C0202B; background-color: #FDECEC; color: #000; padding: 10pt 12pt; margin: 0 0 18pt 0; font-size: 10pt; line-height: 1.45; }
.disclaimer-box strong { color: #8A1620; }
.fill-note { font-size: 9pt; color:#666; font-style: italic; margin-top: 24pt; padding-top: 8pt; border-top: 1px solid #ccc; }
.binding-note { background:#F4F7FB; border-left:3px solid #1F4E8C; padding:8pt 10pt; margin: 8pt 0 12pt 0; font-size: 10pt; }
</style>
</head>
<body>

<div class="disclaimer-box">
<strong>Disclaimer:</strong> Dit is een standaardtemplate ter ondersteuning van het verkoopproces en vormt geen vervanging voor juridisch advies. Wij adviseren je dit document vóór ondertekening te laten beoordelen door een M&amp;A jurist, met name indien sprake is van bijzondere omstandigheden zoals concurrentiegevoelige informatie, internationale partijen of grote transactiewaarden. Osago aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van deze intentieverklaring.
</div>

<p class="confidential">VERTROUWELIJK</p>
<h1>Intentieverklaring (Letter of Intent)</h1>
<p class="subtitle">opgesteld op ${escapeHtml(today)}</p>

<p><strong>De ondergetekenden:</strong></p>

<div class="party-block">
<p><span class="party-label">1.</span> <strong>${escapeHtml(sellerName)}</strong>${sellerLocation ? `, gevestigd te ${escapeHtml(sellerLocation)}` : ''}${sellerKvk ? `, ingeschreven bij de Kamer van Koophandel onder nummer ${escapeHtml(sellerKvk)}` : ''}, te dezen rechtsgeldig vertegenwoordigd door ${sellerSignatory ? `<strong>${escapeHtml(sellerSignatory)}</strong>` : '<span class="placeholder">[naam ondertekenaar verkoper]</span>'};<br>
hierna te noemen: <strong>"Verkoper"</strong>;</p>
</div>

<div class="party-block">
<p><span class="party-label">2.</span> <strong>${escapeHtml(buyerName)}</strong>${buyerLocation ? `, gevestigd te ${escapeHtml(buyerLocation)}` : ''}, te dezen rechtsgeldig vertegenwoordigd door ${buyerSignatory ? `<strong>${escapeHtml(buyerSignatory)}</strong>` : '<span class="placeholder">[naam ondertekenaar koper]</span>'};<br>
hierna te noemen: <strong>"Koper"</strong>;</p>
</div>

<p>hierna gezamenlijk te noemen: <strong>"Partijen"</strong>;</p>

<p><strong>Overwegende dat:</strong></p>
<ol>
<li>Verkoper voornemens is de in artikel 1 omschreven onderneming te verkopen;</li>
<li>Koper interesse heeft om deze onderneming over te nemen onder de in deze intentieverklaring opgenomen indicatieve voorwaarden;</li>
<li>Partijen de hoofdlijnen van een mogelijke transactie wensen vast te leggen alvorens tot verdere onderhandelingen over te gaan;</li>
<li>Partijen zich realiseren dat deze intentieverklaring — met uitzondering van de uitdrukkelijk als bindend aangemerkte bepalingen — geen verplichting tot het sluiten van een transactie inhoudt.</li>
</ol>

<div class="binding-note">
<strong>Bindend / niet-bindend karakter:</strong> Deze intentieverklaring is, met uitzondering van de artikelen 6 (Geheimhouding), 7 (Exclusiviteit), 9 (Kostenverdeling) en 10 (Toepasselijk recht), <em>niet</em> juridisch bindend. De daadwerkelijke verkoop wordt pas perfect bij ondertekening van een definitieve verkoopovereenkomst (SPA/APA).
</div>

<p><strong>Komen overeen als volgt:</strong></p>

<ol class="articles">

<li><h2>Artikel 1 — Object van de voorgenomen transactie</h2>
<p>Verkoper is voornemens aan Koper te verkopen, en Koper is voornemens van Verkoper te kopen:</p>
<p><span class="placeholder">[Beschrijving van de over te dragen aandelen of activa, inclusief percentages en eventuele uitsluitingen — in te vullen]</span></p>
<p>hierna te noemen: <strong>"de Onderneming"</strong>.</p>
</li>

<li><h2>Artikel 2 — Indicatieve koopprijs en structuur</h2>
<p>De indicatieve koopprijs voor de Onderneming bedraagt <span class="placeholder">[indicatieve koopprijs in EUR]</span>, op basis van een <span class="placeholder">[cash-and-debt-free / locked box / completion accounts]</span> mechanisme.</p>
<p>De koopprijs is gebaseerd op de door Verkoper aan Koper verstrekte informatie en is onderhevig aan bevestiging na due-diligence-onderzoek. Eventuele aanpassingen op basis van het overeengekomen closing-mechanisme worden in de definitieve verkoopovereenkomst geregeld.</p>
<p>De betaalstructuur wordt nader uitgewerkt en kan onder meer omvatten: <span class="placeholder">[contant bij closing / earn-out / vendor loan / aandelenruil — in te vullen]</span>.</p>
</li>

<li><h2>Artikel 3 — Voorbehouden</h2>
<p>De voorgenomen transactie is — naast de verdere uitwerking in een definitieve verkoopovereenkomst — onderworpen aan de gebruikelijke voorbehouden, waaronder:</p>
<ol type="a">
<li>de uitkomst van een door Koper uit te voeren due-diligence-onderzoek tot tevredenheid van Koper;</li>
<li>het verkrijgen van eventueel benodigde toestemmingen van derden, financiers of toezichthouders;</li>
<li>goedkeuring door de bevoegde organen van Koper en/of Verkoper;</li>
<li><span class="placeholder">[overige voorbehouden — in te vullen]</span>.</li>
</ol>
</li>

<li><h2>Artikel 4 — Due diligence</h2>
<p>Verkoper zal Koper en diens adviseurs vanaf <span class="placeholder">[startdatum due diligence]</span> in de gelegenheid stellen tot het uitvoeren van een due-diligence-onderzoek naar de Onderneming, omvattende ten minste de financiële, fiscale, juridische en commerciële aspecten.</p>
<p>Verkoper zal hierbij redelijke medewerking verlenen en alle informatie verstrekken die voor een zorgvuldige beoordeling van de Onderneming noodzakelijk is, voor zover Verkoper hiertoe gerechtigd is.</p>
</li>

<li><h2>Artikel 5 — Tijdpad</h2>
<p>Partijen streven naar de volgende mijlpalen:</p>
<ol type="a">
<li>afronding due diligence: <span class="placeholder">[datum]</span>;</li>
<li>concept-verkoopovereenkomst gereed: <span class="placeholder">[datum]</span>;</li>
<li>ondertekening definitieve verkoopovereenkomst (signing): <span class="placeholder">[datum]</span>;</li>
<li>levering en overdracht (closing): <span class="placeholder">[datum]</span>.</li>
</ol>
<p>De genoemde data zijn richtinggevend en kunnen in onderling overleg worden aangepast.</p>
</li>

<li><h2>Artikel 6 — Geheimhouding (bindend)</h2>
<p>Partijen verplichten zich tot strikte geheimhouding van het bestaan en de inhoud van deze intentieverklaring, alsmede van alle informatie die hen in het kader van de voorgenomen transactie bekend is geworden, een en ander conform de tussen Partijen reeds gesloten geheimhoudingsovereenkomst (NDA) die onverkort van kracht blijft.</p>
<p>Bij het ontbreken van een afzonderlijke NDA gelden de geheimhoudingsverplichtingen van dit artikel als zelfstandige verplichting tussen Partijen.</p>
</li>

<li><h2>Artikel 7 — Exclusiviteit (bindend)</h2>
<p>Verkoper verbindt zich gedurende een periode van <span class="placeholder">[exclusiviteitsperiode, bijvoorbeeld 60 dagen]</span> na ondertekening van deze intentieverklaring (de <em>"Exclusiviteitsperiode"</em>) niet met derden te onderhandelen over of een aanbieding te doen of te aanvaarden voor een (gehele of gedeeltelijke) verkoop van de Onderneming.</p>
<p>Indien binnen de Exclusiviteitsperiode geen definitieve verkoopovereenkomst tot stand komt, eindigt de exclusiviteitsverplichting van rechtswege, tenzij Partijen schriftelijk anders overeenkomen.</p>
</li>

<li><h2>Artikel 8 — Geen verplichting tot transactie</h2>
<p>Behoudens het bepaalde in de uitdrukkelijk als bindend aangemerkte artikelen, schept deze intentieverklaring geen verplichting voor Partijen om een definitieve verkoopovereenkomst te sluiten. Het staat ieder van Partijen vrij om — om welke reden dan ook — af te zien van de voorgenomen transactie, zonder dat dit recht geeft op enige vergoeding van schade, kosten of gederfde winst, behoudens vergoeding van eventueel reeds verschuldigde kosten als bedoeld in artikel 9.</p>
</li>

<li><h2>Artikel 9 — Kostenverdeling (bindend)</h2>
<p>Iedere Partij draagt haar eigen kosten in verband met de voorbereiding, onderhandeling en uitvoering van deze intentieverklaring en de voorgenomen transactie, waaronder de kosten van eigen adviseurs (juridisch, fiscaal, financieel).</p>
<p>De kosten van eventuele gezamenlijke adviseurs of een eventuele notaris worden door Partijen <span class="placeholder">[gelijkelijk gedragen / door Koper gedragen / nader te bepalen]</span>.</p>
</li>

<li><h2>Artikel 10 — Toepasselijk recht en geschillen (bindend)</h2>
<p>Op deze intentieverklaring is uitsluitend Nederlands recht van toepassing.</p>
<p>Alle geschillen die voortvloeien uit of verband houden met deze intentieverklaring worden bij uitsluiting voorgelegd aan de bevoegde rechter te <span class="placeholder">[arrondissement]</span>.</p>
</li>

<li><h2>Artikel 11 — Looptijd</h2>
<p>Deze intentieverklaring eindigt van rechtswege op het eerste van de volgende momenten:</p>
<ol type="a">
<li>ondertekening van de definitieve verkoopovereenkomst tussen Partijen;</li>
<li>schriftelijke beëindiging door één van Partijen na het verstrijken van de Exclusiviteitsperiode;</li>
<li><span class="placeholder">[uiterste einddatum, bijvoorbeeld 6 maanden na ondertekening]</span>.</li>
</ol>
<p>De artikelen 6 (Geheimhouding) en 10 (Toepasselijk recht) blijven na beëindiging onverkort van kracht.</p>
</li>

</ol>

<p class="fill-note">De velden gemarkeerd met dashed-border placeholders moeten worden ingevuld vóór ondertekening. Wij adviseren nadrukkelijk om dit samen met een M&amp;A jurist te doen.</p>

<div class="signature-block">
<p><strong>Aldus overeengekomen en in tweevoud ondertekend:</strong></p>

<table class="signature-table">
<tr>
<td>
<p class="sig-meta">Voor Verkoper:</p>
<div class="sig-line"></div>
<p class="sig-meta">
${sellerSignatory ? `<strong>${escapeHtml(sellerSignatory)}</strong>` : '[Naam]'}<br>
${escapeHtml(sellerName)}<br>
Datum: ____________________<br>
Plaats: ____________________
</p>
</td>
<td>
<p class="sig-meta">Voor Koper:</p>
<div class="sig-line"></div>
<p class="sig-meta">
${buyerSignatory ? `<strong>${escapeHtml(buyerSignatory)}</strong>` : '[Naam]'}<br>
${escapeHtml(buyerName)}<br>
Datum: ____________________<br>
Plaats: ____________________
</p>
</td>
</tr>
</table>
</div>

</body>
</html>`
}
