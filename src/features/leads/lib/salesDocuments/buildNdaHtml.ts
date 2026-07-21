import { NDA_FALLBACK_COURT_CITY } from '../../constants/salesDocuments'
import {
  buildBuyerAddress,
  buyerContactName,
  escapeHtml,
  type SalesDocumentContext,
} from './shared'

// Verbatim port of doGenerateNda's Word-HTML template (osago-bundle.js:21922-22115).
export const buildNdaHtml = (context: SalesDocumentContext): string => {
  const { buyer, company, seller, today } = context

  const sellerName = company.name
  const sellerLocation = company.city || ''
  const sellerKvk = company.kvkNummer || ''
  const sellerSignatory = seller.signatory
  const sellerEmail = seller.email

  const buyerName = buyer.name || '[bedrijfsnaam koper]'
  const buyerAddress = buildBuyerAddress(buyer, true) || '[adres koper]'
  const buyerContact = buyerContactName(buyer) || '[contactpersoon]'
  const buyerContactEmail = buyer.contactEmail || ''
  const buyerContactPhone = buyer.contactPhone || ''

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Geheimhoudingsovereenkomst — ${escapeHtml(sellerName)} & ${escapeHtml(buyerName)}</title>
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
.signature-block { margin-top: 36pt; }
.signature-table { width: 100%; border-collapse: collapse; margin-top: 12pt; }
.signature-table td { width: 50%; vertical-align: top; padding: 0 12pt 0 0; }
.sig-line { border-bottom: 1px solid #000; height: 36pt; margin-bottom: 6pt; }
.sig-meta { font-size: 10pt; line-height: 1.4; }
.note { font-size: 9pt; color:#666; font-style: italic; margin-top: 24pt; border-top: 1px solid #ccc; padding-top: 8pt; }
.confidential { color:#A30000; font-weight: bold; font-size: 9pt; letter-spacing: 1pt; text-align:center; margin-bottom: 4pt; }
.disclaimer-box { border: 2px solid #C0202B; background-color: #FDECEC; color: #000; padding: 10pt 12pt; margin: 0 0 18pt 0; font-size: 10pt; line-height: 1.45; }
.disclaimer-box strong { color: #8A1620; }
</style>
</head>
<body>

<div class="disclaimer-box">
<strong>Disclaimer:</strong> Dit is een standaardtemplate ter ondersteuning van het verkoopproces en vormt geen vervanging voor juridisch advies. Wij adviseren je dit document vóór ondertekening te laten beoordelen door een M&amp;A jurist, met name indien sprake is van bijzondere omstandigheden zoals concurrentiegevoelige informatie, internationale partijen of grote transactiewaarden. Osago aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van deze NDA.
</div>

<p class="confidential">VERTROUWELIJK</p>
<h1>Geheimhoudingsovereenkomst</h1>
<p class="subtitle">(Non-Disclosure Agreement)</p>

<p><strong>De ondergetekenden:</strong></p>

<div class="party-block">
<p><span class="party-label">1.</span> <strong>${escapeHtml(sellerName)}</strong>${sellerLocation ? `, gevestigd te ${escapeHtml(sellerLocation)}` : ''}${sellerKvk ? `, ingeschreven bij de Kamer van Koophandel onder ${escapeHtml(sellerKvk)}` : ''}, te dezen rechtsgeldig vertegenwoordigd door ${sellerSignatory ? `<strong>${escapeHtml(sellerSignatory)}</strong>` : '[naam ondertekenaar]'};<br>
hierna te noemen: <strong>"Verstrekker"</strong>;</p>
</div>

<p>en</p>

<div class="party-block">
<p><span class="party-label">2.</span> <strong>${escapeHtml(buyerName)}</strong>, gevestigd te ${escapeHtml(buyerAddress)}, te dezen rechtsgeldig vertegenwoordigd door <strong>${escapeHtml(buyerContact)}</strong>;<br>
hierna te noemen: <strong>"Ontvanger"</strong>;</p>
</div>

<p>Verstrekker en Ontvanger hierna gezamenlijk te noemen: <strong>"Partijen"</strong> en ieder afzonderlijk: <strong>"Partij"</strong>.</p>

<h2>Overwegende dat:</h2>

<ol>
<li>Verstrekker een onderneming exploiteert en onderzoekt of een transactie tot vervreemding van de aandelen of activa van de onderneming met Ontvanger tot stand kan komen (hierna: het <strong>"Project"</strong>);</li>
<li>Partijen in het kader van het Project vertrouwelijke informatie wensen uit te wisselen, waaronder financiële, commerciële, operationele en strategische gegevens;</li>
<li>Partijen het wenselijk achten de wijze waarop deze informatie wordt behandeld vooraf schriftelijk vast te leggen;</li>
</ol>

<p><strong>Komen het volgende overeen:</strong></p>

<ol class="articles">

<li><strong>Definities</strong>
<p>Onder <em>"Vertrouwelijke Informatie"</em> wordt in deze overeenkomst verstaan: alle informatie, in welke vorm dan ook (mondeling, schriftelijk, digitaal of anderszins), die door of namens de ene Partij in het kader van het Project aan de andere Partij wordt verstrekt of ter kennis komt, daaronder begrepen — doch niet beperkt tot — bedrijfsgegevens, financiële cijfers, klantenbestanden, leveranciersgegevens, technische informatie, intellectuele eigendomsrechten, strategieën, prognoses en het bestaan en de inhoud van deze overeenkomst zelf.</p>
</li>

<li><strong>Geheimhoudingsverplichting</strong>
<p>Partijen verbinden zich over en weer om alle Vertrouwelijke Informatie strikt geheim te houden, niet aan derden te verstrekken of openbaar te maken, en deze uitsluitend te gebruiken voor het in deze overeenkomst omschreven doel, te weten de beoordeling en uitwerking van het Project.</p>
</li>

<li><strong>Toegestane kring van personen</strong>
<p>Het is Ontvanger toegestaan de Vertrouwelijke Informatie uitsluitend te delen met haar bestuurders, werknemers en externe adviseurs (zoals accountants, advocaten en financiers) die direct betrokken zijn bij de beoordeling van het Project en voor wie kennisneming noodzakelijk is. Ontvanger garandeert dat deze personen aan een geheimhoudingsverplichting zijn gebonden die ten minste gelijkwaardig is aan die in deze overeenkomst, en blijft volledig aansprakelijk voor enige schending door deze personen.</p>
</li>

<li><strong>Uitzonderingen</strong>
<p>De geheimhoudingsverplichting geldt niet voor informatie die:</p>
<ol type="a">
<li>op het moment van verstrekking reeds publiekelijk bekend was, of zonder schending van deze overeenkomst publiekelijk bekend is geworden;</li>
<li>door Ontvanger aantoonbaar zelfstandig is ontwikkeld zonder gebruikmaking van Vertrouwelijke Informatie;</li>
<li>rechtmatig en zonder geheimhoudingsplicht is verkregen van een derde;</li>
<li>op grond van een wettelijke verplichting of een onherroepelijke uitspraak van een bevoegde rechter of toezichthouder openbaar moet worden gemaakt, in welk geval Ontvanger Verstrekker hierover voorafgaand zal informeren voor zover wettelijk toegestaan.</li>
</ol>
</li>

<li><strong>Geen verplichting tot transactie</strong>
<p>Niets in deze overeenkomst verplicht een Partij om Vertrouwelijke Informatie te verstrekken of om een transactie aan te gaan. Verstrekker geeft geen enkele garantie ten aanzien van de juistheid of volledigheid van de verstrekte Vertrouwelijke Informatie. Aansprakelijkheid van Verstrekker voor de inhoud daarvan is uitgesloten, behoudens in geval van opzet of grove schuld.</p>
</li>

<li><strong>Wervingsverbod</strong>
<p>Ontvanger zal gedurende de looptijd van deze overeenkomst en gedurende een periode van twaalf (12) maanden daarna geen werknemers of zelfstandige medewerkers van Verstrekker actief benaderen of in dienst nemen, behoudens voorafgaande schriftelijke toestemming van Verstrekker. Algemene werving via openbaar gepubliceerde vacatures is hiervan uitgezonderd.</p>
</li>

<li><strong>Teruggave en vernietiging</strong>
<p>Op eerste schriftelijk verzoek van Verstrekker, of uiterlijk binnen veertien (14) dagen na beëindiging van de besprekingen rond het Project, zal Ontvanger alle Vertrouwelijke Informatie — daaronder begrepen kopieën, aantekeningen, uittreksels en digitale bestanden — retourneren of aantoonbaar vernietigen, en dit op verzoek schriftelijk bevestigen. Een Partij mag één kopie behouden voor zover wettelijk vereist of voor archiveringsdoeleinden, mits de geheimhoudingsverplichting voor die kopie volledig blijft gelden.</p>
</li>

<li><strong>Duur</strong>
<p>Deze overeenkomst treedt in werking op de datum van ondertekening en eindigt drie (3) jaar daarna, dan wel op een eerder moment indien Partijen schriftelijk anders overeenkomen. De geheimhoudingsverplichting blijft echter van kracht voor een periode van vijf (5) jaar na het einde van deze overeenkomst.</p>
</li>

<li><strong>Boete en schadevergoeding</strong>
<p>Bij iedere overtreding van het bepaalde in artikel 2, 3, 6 of 7 van deze overeenkomst verbeurt de overtredende Partij, zonder dat een ingebrekestelling is vereist, een direct opeisbare boete van EUR 25.000 (vijfentwintigduizend euro) per overtreding, vermeerderd met EUR 1.000 (duizend euro) voor iedere dag dat de overtreding voortduurt, onverminderd het recht van de andere Partij op volledige schadevergoeding indien de werkelijke schade dit boetebedrag overschrijdt.</p>
</li>

<li><strong>Geen overdracht van rechten</strong>
<p>Het verstrekken van Vertrouwelijke Informatie houdt geen overdracht of licentie in van enig intellectueel eigendomsrecht of ander recht op die informatie. Alle rechten blijven berusten bij de Partij van wie de informatie afkomstig is.</p>
</li>

<li><strong>Toepasselijk recht en bevoegde rechter</strong>
<p>Op deze overeenkomst is uitsluitend Nederlands recht van toepassing. Alle geschillen die in verband met deze overeenkomst ontstaan, daaronder begrepen geschillen over haar bestaan en geldigheid, worden bij uitsluiting voorgelegd aan de bevoegde rechter te ${escapeHtml(sellerLocation || NDA_FALLBACK_COURT_CITY)}.</p>
</li>

<li><strong>Slotbepalingen</strong>
<p>Wijzigingen of aanvullingen op deze overeenkomst zijn slechts geldig indien schriftelijk overeengekomen. Indien een bepaling van deze overeenkomst nietig of vernietigbaar blijkt, blijven de overige bepalingen onverkort van kracht en zullen Partijen in goed overleg een vervangende bepaling overeenkomen die de bedoeling van de oorspronkelijke bepaling zo dicht mogelijk benadert.</p>
</li>

</ol>

<p>Aldus overeengekomen en in tweevoud opgemaakt te ${escapeHtml(sellerLocation || '_______________')} op ${escapeHtml(today)}.</p>

<div class="signature-block">
<table class="signature-table">
<tr>
<td>
<p><strong>Namens Verstrekker:</strong><br>
${escapeHtml(sellerName)}</p>
<div class="sig-line"></div>
<p class="sig-meta">
Naam: ${escapeHtml(sellerSignatory || '_______________')}<br>
Functie: _______________<br>
Datum: _______________<br>
${sellerEmail ? `E-mail: ${escapeHtml(sellerEmail)}` : ''}
</p>
</td>
<td>
<p><strong>Namens Ontvanger:</strong><br>
${escapeHtml(buyerName)}</p>
<div class="sig-line"></div>
<p class="sig-meta">
Naam: ${escapeHtml(buyerContact)}<br>
Functie: _______________<br>
Datum: _______________<br>
${buyerContactEmail ? `E-mail: ${escapeHtml(buyerContactEmail)}<br>` : ''}
${buyerContactPhone ? `Telefoon: ${escapeHtml(buyerContactPhone)}` : ''}
</p>
</td>
</tr>
</table>
</div>

</body>
</html>`
}
