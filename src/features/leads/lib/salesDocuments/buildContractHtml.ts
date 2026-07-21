import {
  buildBuyerAddress,
  buyerContactName,
  escapeHtml,
  type SalesDocumentContext,
} from './shared'

// Verbatim port of doGenerateContract's Word-HTML template (osago-bundle.js:22229-22411).
export const buildContractHtml = (context: SalesDocumentContext): string => {
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
<title>Verkoopovereenkomst — ${escapeHtml(sellerName)} & ${escapeHtml(buyerName)}</title>
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
</style>
</head>
<body>

<div class="disclaimer-box">
<strong>Disclaimer:</strong> Dit is een standaardtemplate ter ondersteuning van het verkoopproces en vormt geen vervanging voor juridisch advies. Wij adviseren je dit document vóór ondertekening te laten beoordelen door een M&amp;A jurist, met name indien sprake is van bijzondere omstandigheden zoals concurrentiegevoelige informatie, internationale partijen of grote transactiewaarden. Osago aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van deze verkoopovereenkomst.
</div>

<p class="confidential">VERTROUWELIJK</p>
<h1>Verkoopovereenkomst</h1>
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
<li>Verkoper voornemens is de in artikel 1 beschreven onderneming aan Koper te verkopen;</li>
<li>Koper deze onderneming wenst over te nemen onder de in deze overeenkomst opgenomen voorwaarden;</li>
<li>Partijen zich bewust zijn van de wederzijdse rechten en verplichtingen die uit deze overeenkomst voortvloeien.</li>
</ol>

<p><strong>Komen overeen als volgt:</strong></p>

<ol class="articles">

<li><h2>Artikel 1 — Object van de overeenkomst</h2>
<p>Verkoper verkoopt en draagt over aan Koper, die koopt en aanvaardt:</p>
<p><span class="placeholder">[Beschrijving van de verkochte aandelen of activa, inclusief percentages, activum-typen en eventuele uitzonderingen — in te vullen samen met M&amp;A jurist]</span></p>
<p>hierna te noemen: <strong>"de Onderneming"</strong>.</p>
</li>

<li><h2>Artikel 2 — Koopprijs</h2>
<p>De koopprijs voor de Onderneming bedraagt <span class="placeholder">[koopprijs in EUR]</span>, exclusief eventuele aanpassingen op basis van een nader overeen te komen closing-mechanisme (locked box, completion accounts of vergelijkbaar).</p>
<p>De koopprijs wordt voldaan op de wijze en op de momenten zoals nader beschreven in <span class="placeholder">[bijlage betaalschema]</span>.</p>
</li>

<li><h2>Artikel 3 — Voorwaarden vooraf (closing conditions)</h2>
<p>De levering van de Onderneming vindt plaats onder de opschortende voorwaarden dat:</p>
<ol type="a">
<li>de eventueel benodigde toestemmingen van derden, waaronder mogelijk de mededingingsautoriteit, zijn verkregen;</li>
<li>het in de bij deze overeenkomst behorende due diligence onderzoek geen materieel nadelige bevindingen aan het licht zijn gekomen;</li>
<li><span class="placeholder">[overige voorwaarden vooraf — in te vullen]</span>.</li>
</ol>
</li>

<li><h2>Artikel 4 — Closing</h2>
<p>De levering en betaling vinden plaats op <span class="placeholder">[closing-datum]</span> ten kantore van <span class="placeholder">[notaris of locatie]</span>, of op een ander tussen Partijen overeen te komen tijdstip en plaats.</p>
</li>

<li><h2>Artikel 5 — Garanties en verklaringen</h2>
<p>Verkoper geeft de in <span class="placeholder">[bijlage garanties]</span> opgenomen garanties en verklaringen ten aanzien van onder meer de juistheid van de financiële cijfers, het bestaan en het ongestoord bezit van de overgedragen activa en/of aandelen, de afwezigheid van geschillen en de naleving van wet- en regelgeving.</p>
<p>Eventuele schendingen geven Koper recht op vergoeding overeenkomstig <span class="placeholder">[regeling vrijwaringen en aansprakelijkheid]</span>.</p>
</li>

<li><h2>Artikel 6 — Vrijwaringen</h2>
<p>Verkoper vrijwaart Koper voor schade die voortvloeit uit feiten of omstandigheden die zich vóór de closing-datum hebben voorgedaan en niet uit de overgedragen onderneming bekend waren, conform de in <span class="placeholder">[bijlage vrijwaringen]</span> opgenomen specifieke vrijwaringen.</p>
</li>

<li><h2>Artikel 7 — Concurrentie- en relatiebeding</h2>
<p>Verkoper zal gedurende een periode van <span class="placeholder">[duur, bijvoorbeeld 24 maanden]</span> na de closing-datum niet — direct of indirect — actief zijn in een onderneming die concurrerend is met de Onderneming, en zal in diezelfde periode geen klanten of werknemers van de Onderneming actief benaderen.</p>
</li>

<li><h2>Artikel 8 — Geheimhouding</h2>
<p>Partijen verplichten zich tot geheimhouding van alle informatie die hen in het kader van deze overeenkomst bekend is geworden, een en ander conform de tussen Partijen gesloten geheimhoudingsovereenkomst (NDA).</p>
</li>

<li><h2>Artikel 9 — Mededelingen</h2>
<p>Alle mededelingen tussen Partijen geschieden schriftelijk en worden gericht aan de in deze overeenkomst opgenomen adressen, dan wel aan een ander adres dat een Partij schriftelijk aan de andere Partij heeft kenbaar gemaakt.</p>
</li>

<li><h2>Artikel 10 — Toepasselijk recht en geschillen</h2>
<p>Op deze overeenkomst is uitsluitend Nederlands recht van toepassing.</p>
<p>Alle geschillen die voortvloeien uit of verband houden met deze overeenkomst worden bij uitsluiting voorgelegd aan de bevoegde rechter te <span class="placeholder">[arrondissement]</span>.</p>
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
