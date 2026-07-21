import { type ScorecardCategory } from '../types'

// The Take 5 sale-readiness questionnaire, ported verbatim as data from
// osago-bundle.js:6943-7289 — 13 categories, 280 questions. Dutch strings are
// reproduced exactly, with the legacy \u00XX escapes written as real diacritics
// (ë, ï, ü, é). Question numbering in the UI is continuous across visible
// categories (osago-bundle.js:7464-7471), so ids stay stable per category.
export const TAKE5_SCORECARD: readonly ScorecardCategory[] = [
  {
    id: 'algemeen',
    label: 'Algemeen',
    items: [
      {
        id: 'algemeen-q1',
        label: 'De omzet over de laatste 5 jaar is stabiel of groeiend.',
      },
      {
        id: 'algemeen-q2',
        label: 'EBITDA, EBIT en nettoresultaat van dit jaar zijn op orde.',
      },
      {
        id: 'algemeen-q3',
        label: 'EBITDA, EBIT en nettoresultaat van vorig jaar zijn op orde.',
      },
      {
        id: 'algemeen-q4',
        label:
          'EBITDA, EBIT en nettoresultaat van 2 jaar geleden zijn op orde.',
      },
      {
        id: 'algemeen-q5',
        label:
          'EBITDA, EBIT en nettoresultaat van 3 jaar geleden zijn op orde.',
      },
      {
        id: 'algemeen-q6',
        label:
          'EBITDA, EBIT en nettoresultaat van 4 jaar geleden zijn op orde.',
      },
      {
        id: 'algemeen-q7',
        label:
          'Verwachte EBITDA, EBIT en nettoresultaat dit jaar zijn realistisch onderbouwd.',
      },
      {
        id: 'algemeen-q8',
        label: 'Verwachting voor volgend jaar is realistisch onderbouwd.',
      },
      {
        id: 'algemeen-q9',
        label: 'Verwachting voor over 2 jaar is realistisch onderbouwd.',
      },
      {
        id: 'algemeen-q10',
        label: 'Verwachting voor over 3 jaar is realistisch onderbouwd.',
      },
      {
        id: 'algemeen-q11',
        label:
          'De prognose is goed onderbouwd (orderportefeuille, pijplijn, markttrends).',
      },
      {
        id: 'algemeen-q12',
        label: 'De juridische structuur is overzichtelijk en passend.',
      },
      {
        id: 'algemeen-q13',
        label: 'Financiering en gestelde zekerheden zijn helder in beeld.',
      },
      {
        id: 'algemeen-q14',
        label:
          'Aantal medewerkers, leeftijdsopbouw en gebruik van flexkrachten is duidelijk.',
      },
      {
        id: 'algemeen-q15',
        label: 'Er is een actueel organogram van de organisatie.',
      },
      {
        id: 'algemeen-q16',
        label:
          'Het bedrijf heeft een loyale, langdurig in dienst zijnde personeelskern.',
      },
      {
        id: 'algemeen-q17',
        label: 'Er is een herkenbare, gezonde bedrijfscultuur.',
      },
      {
        id: 'algemeen-q18',
        label: 'Er is een duidelijke toekomstvisie voor de komende jaren.',
      },
      {
        id: 'algemeen-q19',
        label: 'Innovatie speelt een belangrijke rol in deze markt.',
      },
      {
        id: 'algemeen-q20',
        label:
          'Duurzaamheid en milieu zijn belangrijke aandachtspunten voor de toekomst.',
      },
      {
        id: 'algemeen-q21',
        label: 'Het bedrijf kent geen onverwacht hoge kapitaalbehoefte.',
      },
      {
        id: 'algemeen-q22',
        label:
          'Subsidies vormen geen kritische, niet-vervangbare inkomstenstroom.',
      },
      {
        id: 'algemeen-q23',
        label:
          'De financiële rapportages geven een volledig beeld van de prestaties.',
      },
      {
        id: 'algemeen-q24',
        label: 'Er lopen regelmatig verbeterprojecten in de organisatie.',
      },
      {
        id: 'algemeen-q25',
        label:
          'Sterke punten en bedreigingen voor de komende jaren zijn helder in beeld.',
      },
      {
        id: 'algemeen-q26',
        label: 'De belangrijkste stakeholders zijn bekend en in beeld.',
      },
      {
        id: 'algemeen-q27',
        label:
          'De eigenaar heeft duidelijke wensen voor afspraken bij een eventuele verkoop.',
      },
    ],
  },
  {
    id: 'dga',
    label: 'Eigenaar',
    items: [
      { id: 'dga-q1', label: 'De oprichtingsakte is beschikbaar.' },
      { id: 'dga-q2', label: 'Statuten zijn aanwezig en up-to-date.' },
      { id: 'dga-q3', label: 'Er is een huishoudelijk reglement.' },
      {
        id: 'dga-q4',
        label:
          'Continuïteit bij wegvallen van de eigenaar is geregeld (bv. STAK).',
      },
      {
        id: 'dga-q5',
        label:
          'De eigenaar heeft volmacht om namens alle aandeelhouders te spreken.',
      },
      { id: 'dga-q6', label: 'De directeur is tevens eigenaar.' },
      {
        id: 'dga-q7',
        label: 'Er worden formele aandeelhoudersvergaderingen gehouden.',
      },
      { id: 'dga-q8', label: 'Er is een aandeelhoudersovereenkomst.' },
      {
        id: 'dga-q9',
        label: 'De aandeelhoudersovereenkomst wordt jaarlijks herzien.',
      },
      {
        id: 'dga-q10',
        label: 'Er is een heldere taakverdeling tussen alle eigenaren.',
      },
      {
        id: 'dga-q11',
        label:
          'Taakverdeling wordt regelmatig met eigenaren en management geëvalueerd.',
      },
      {
        id: 'dga-q12',
        label: 'Er is een actuele organisatiekaart van de hele bedrijfsgroep.',
      },
      {
        id: 'dga-q13',
        label:
          'Transacties tussen werkmaatschappij en holding voldoen aan de fiscale eisen.',
      },
      {
        id: 'dga-q14',
        label:
          'Transacties tussen werkmaatschappij en holding voldoen aan de aandeelhouderseisen.',
      },
      {
        id: 'dga-q15',
        label:
          'De eigenaar heeft een duidelijke visie op zijn rol bij verkoop.',
      },
      {
        id: 'dga-q16',
        label: 'Er is een gewenste tijdshorizon voor de verkoop.',
      },
      {
        id: 'dga-q17',
        label: 'De eigenaar weet wat hij na de verkoop gaat doen.',
      },
      {
        id: 'dga-q18',
        label:
          'De financiële toekomst van de eigenaar na verkoop is duidelijk in beeld.',
      },
      {
        id: 'dga-q19',
        label: 'Het is duidelijk wat de verkoop voor het management betekent.',
      },
      {
        id: 'dga-q20',
        label:
          'Er zijn afspraken over de betrokkenheid van het management bij verkoop.',
      },
      {
        id: 'dga-q21',
        label: 'Aandeelhoudersvergaderingen vinden met regelmaat plaats.',
      },
      {
        id: 'dga-q22',
        label:
          'De eigenaar wordt als prettig en sociaal ervaren in de organisatie.',
      },
      {
        id: 'dga-q23',
        label:
          'De mogelijkheden voor pensioenopbouw via het bedrijf zijn bekend.',
      },
    ],
  },
  {
    id: 'strat-beleid',
    label: 'Strategie & Beleid',
    items: [
      {
        id: 'strat-beleid-q1',
        label:
          'Het bedrijf heeft een heldere missie met herkenbare kernwaarden.',
      },
      {
        id: 'strat-beleid-q2',
        label:
          'Het bedrijf heeft een heldere visie met herkenbare kernwaarden.',
      },
      {
        id: 'strat-beleid-q3',
        label: 'Visie, missie en kernwaarden zijn bekend bij alle medewerkers.',
      },
      {
        id: 'strat-beleid-q4',
        label:
          'Doelmarkten en bijbehorende producten/diensten zijn duidelijk gekozen.',
      },
      {
        id: 'strat-beleid-q5',
        label:
          "Het bedrijf heeft duidelijke USP's die het onderscheiden van concurrenten.",
      },
      {
        id: 'strat-beleid-q6',
        label: 'Er is goed inzicht in de levenscyclus van producten/diensten.',
      },
      {
        id: 'strat-beleid-q7',
        label: 'Strategie is vertaald naar concrete targets per afdeling.',
      },
      {
        id: 'strat-beleid-q8',
        label: 'Strategie is vertaald naar individuele medewerkersdoelen.',
      },
      {
        id: 'strat-beleid-q9',
        label:
          'Voor relevante onderwerpen zijn aparte beleidsplannen opgesteld.',
      },
      {
        id: 'strat-beleid-q10',
        label:
          'Er is een transparante en duidelijke interne communicatiestructuur.',
      },
      {
        id: 'strat-beleid-q11',
        label: 'Strategie wordt minimaal jaarlijks gemonitord en bijgesteld.',
      },
      {
        id: 'strat-beleid-q12',
        label:
          'Wijzigingen in strategie worden helder aan medewerkers gecommuniceerd.',
      },
      {
        id: 'strat-beleid-q13',
        label: 'Klant- en productspreiding voorkomt te grote afhankelijkheid.',
      },
      {
        id: 'strat-beleid-q14',
        label: 'Jaarlijks wordt een SWOT-analyse uitgevoerd.',
      },
      {
        id: 'strat-beleid-q15',
        label: 'De gestelde bedrijfsdoelen van afgelopen jaar zijn behaald.',
      },
      { id: 'strat-beleid-q16', label: 'Het beleid wordt regelmatig herzien.' },
      {
        id: 'strat-beleid-q17',
        label: 'Het operationele plan wordt minimaal per kwartaal gemonitord.',
      },
      {
        id: 'strat-beleid-q18',
        label: 'Het bedrijf heeft duidelijk marktonderscheidend vermogen.',
      },
      { id: 'strat-beleid-q19', label: 'Er is een duidelijke groeistrategie.' },
      {
        id: 'strat-beleid-q20',
        label:
          'Op orderniveau worden goede en verbeterende marges gerealiseerd.',
      },
      {
        id: 'strat-beleid-q21',
        label: 'Het beoogde marktaandeel wordt gerealiseerd.',
      },
      {
        id: 'strat-beleid-q22',
        label:
          'Er zijn voldoende mogelijkheden om de komende jaren door te groeien.',
      },
      {
        id: 'strat-beleid-q23',
        label: 'Klanttevredenheid wordt minimaal jaarlijks onderzocht.',
      },
      {
        id: 'strat-beleid-q24',
        label: 'Medewerkers ervaren hun werk als leuk en uitdagend.',
      },
      {
        id: 'strat-beleid-q25',
        label: 'Er is goed inzicht in wensen en eisen van klanten.',
      },
    ],
  },
  {
    id: 'mis',
    label: 'Management Informatie Systeem',
    items: [
      {
        id: 'mis-q1',
        label: 'Er is een Management Informatiesysteem (MIS) aanwezig.',
      },
      { id: 'mis-q2', label: 'Het MIS wordt minimaal wekelijks bijgewerkt.' },
      { id: 'mis-q3', label: 'Alle relevante onderwerpen staan in het MIS.' },
      {
        id: 'mis-q4',
        label:
          'Het management krijgt via het systeem een goed beeld van het bedrijf.',
      },
      {
        id: 'mis-q5',
        label: 'De financiële cijfers in het MIS zijn betrouwbaar.',
      },
      {
        id: 'mis-q6',
        label: 'Resultaten in het MIS zijn direct gekoppeld aan targets.',
      },
      {
        id: 'mis-q7',
        label: 'Resultaten zijn gekoppeld aan productie en sales.',
      },
      {
        id: 'mis-q8',
        label: 'Resultaten zijn gekoppeld aan onderhoud en service.',
      },
      { id: 'mis-q9', label: 'Resultaten zijn gekoppeld aan kwaliteit.' },
      { id: 'mis-q10', label: 'Resultaten zijn gekoppeld aan veiligheid.' },
      {
        id: 'mis-q11',
        label:
          'Resultaten zijn gekoppeld aan klant- en personeelstevredenheid.',
      },
      {
        id: 'mis-q12',
        label:
          'Andere kritieke bedrijfsaspecten zijn ook in het MIS opgenomen.',
      },
    ],
  },
  {
    id: 'sales-marketing',
    label: 'Sales & Marketing',
    items: [
      {
        id: 'sales-marketing-q1',
        label:
          'Een werkend systeem geeft inzicht in klantprofielen en markten.',
      },
      {
        id: 'sales-marketing-q2',
        label:
          'Klanten, omzet, marge en ontwikkelingen zijn online inzichtelijk.',
      },
      {
        id: 'sales-marketing-q3',
        label: 'Producten en diensten sluiten goed aan op klantwensen.',
      },
      {
        id: 'sales-marketing-q4',
        label: 'Er is een marketingplan met meetbare doelstellingen.',
      },
      {
        id: 'sales-marketing-q5',
        label: "Het marketingplan bevat KPI's voor de verkoopafdeling.",
      },
      {
        id: 'sales-marketing-q6',
        label: 'Het bedrijf en zijn producten zijn herkenbaar in de markt.',
      },
      {
        id: 'sales-marketing-q7',
        label: 'Branding (huisstijl, uitstraling) is actueel en consistent.',
      },
      {
        id: 'sales-marketing-q8',
        label: 'De website werkt goed en wordt regelmatig geüpdatet.',
      },
      { id: 'sales-marketing-q9', label: 'Er is een actuele B2B-website.' },
      { id: 'sales-marketing-q10', label: 'Er is een actuele B2C-website.' },
      {
        id: 'sales-marketing-q11',
        label:
          'Social media (LinkedIn, Twitter, Facebook etc.) worden actief ingezet.',
      },
      {
        id: 'sales-marketing-q12',
        label: 'SEO wordt actief beheerd (intern of via consultant).',
      },
      {
        id: 'sales-marketing-q13',
        label: 'Er wordt actief geadverteerd in de doelmarkt.',
      },
      {
        id: 'sales-marketing-q14',
        label: 'Mailingen en nieuwsbrieven worden regelmatig verzonden.',
      },
      {
        id: 'sales-marketing-q15',
        label: 'Het bedrijf is actief op vakbeurzen.',
      },
      {
        id: 'sales-marketing-q16',
        label: 'Het bedrijf is actief op netwerkbijeenkomsten.',
      },
      {
        id: 'sales-marketing-q17',
        label: 'Het bedrijf is actief in een brancheorganisatie.',
      },
      {
        id: 'sales-marketing-q18',
        label:
          'Het bedrijf werkt actief samen met onderwijs (leerbedrijf, scholing).',
      },
      {
        id: 'sales-marketing-q19',
        label: 'Sales & Marketing heeft een eigen vastgesteld budget.',
      },
      {
        id: 'sales-marketing-q20',
        label: 'Sales & Marketing heeft een eigen marketingplan.',
      },
      {
        id: 'sales-marketing-q21',
        label:
          'Marketingactiviteiten worden op effectiviteit gemeten en gemonitord.',
      },
      {
        id: 'sales-marketing-q22',
        label: 'Marketinginitiatieven worden jaarlijks geëvalueerd.',
      },
      {
        id: 'sales-marketing-q23',
        label: 'Directie hecht veel waarde aan sales en marketing.',
      },
      {
        id: 'sales-marketing-q24',
        label: 'Er is een stabiele kern van langlopende klanten.',
      },
      {
        id: 'sales-marketing-q25',
        label: 'De klantenkring is evenwichtig opgebouwd.',
      },
      {
        id: 'sales-marketing-q26',
        label: 'Het bedrijf differentieert in prijsstelling per segment.',
      },
      {
        id: 'sales-marketing-q27',
        label: 'Directie ziet sales en marketing als strategische prioriteit.',
      },
      {
        id: 'sales-marketing-q28',
        label: 'Directie is zelf actief betrokken bij sales en marketing.',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        id: 'finance-q1',
        label: "Strategie is vertaald naar concrete financiële KPI's.",
      },
      {
        id: 'finance-q2',
        label: 'Er is een gestructureerd budgetteringsproces.',
      },
      { id: 'finance-q3', label: 'Budgetten zijn bekend binnen het bedrijf.' },
      {
        id: 'finance-q4',
        label: 'Budgetten zijn richtlijn voor de dagelijkse operatie.',
      },
      {
        id: 'finance-q5',
        label: 'Maandelijkse rapportages geven inzicht in resultaten.',
      },
      {
        id: 'finance-q6',
        label: 'Maandelijkse rapportages tonen ontwikkelingen t.o.v. budget.',
      },
      {
        id: 'finance-q7',
        label: 'Er wordt actief gestuurd op verschillen met budget.',
      },
      {
        id: 'finance-q8',
        label: 'Gemaakte uren worden correct verantwoord op orders.',
      },
      { id: 'finance-q9', label: 'Er is een actuele liquiditeitsplanning.' },
      {
        id: 'finance-q10',
        label:
          'Actuele rapportage van orderportefeuille en projectresultaat aanwezig.',
      },
      {
        id: 'finance-q11',
        label: 'Orderportefeuille is inzichtelijk voor sales en operatie.',
      },
      {
        id: 'finance-q12',
        label: 'Er is een actueel overzicht van onderhanden werk.',
      },
      {
        id: 'finance-q13',
        label: 'Er is goed inzicht in waar geld wordt verdiend.',
      },
      {
        id: 'finance-q14',
        label: 'Facturering en debiteurenbeheer verlopen vlot.',
      },
      { id: 'finance-q15', label: 'Inkoopfacturen worden vlot verwerkt.' },
      {
        id: 'finance-q16',
        label: 'Inkoop, productie en planning zijn goed op elkaar afgestemd.',
      },
      {
        id: 'finance-q17',
        label: 'Finance en sales/marketing zijn goed op elkaar afgestemd.',
      },
      {
        id: 'finance-q18',
        label:
          'Het MIS geeft inzicht in financiële verplichtingen en kasstromen.',
      },
      { id: 'finance-q19', label: "Er is goed inzicht in financiële KPI's." },
      {
        id: 'finance-q20',
        label: 'Margedoelstellingen op orders worden gemiddeld behaald.',
      },
      {
        id: 'finance-q21',
        label:
          'Het hanteren van betalingsregelingen verloopt zonder problemen.',
      },
      {
        id: 'finance-q22',
        label: 'Het eigen prijsbeleid geeft geen problemen.',
      },
      {
        id: 'finance-q23',
        label: 'Vroegtijdig facturen versturen verloopt zonder problemen.',
      },
      {
        id: 'finance-q24',
        label: 'Het debiteurenbeleid geeft geen problemen.',
      },
      {
        id: 'finance-q25',
        label: 'Actief crediteurenbeleid verloopt zonder problemen.',
      },
      {
        id: 'finance-q26',
        label: 'Aan klanten worden zo nodig betalingsregelingen verleend.',
      },
      {
        id: 'finance-q27',
        label: 'Fiscale investeringsaftrek (KIA, EIA, MIA) wordt benut.',
      },
      {
        id: 'finance-q28',
        label: 'Fiscaal vriendelijk schenken aan goede doelen wordt benut.',
      },
      {
        id: 'finance-q29',
        label: 'Beschikbare subsidies worden actief benut.',
      },
      {
        id: 'finance-q30',
        label: 'Er is structureel aandacht voor kostenbesparingen.',
      },
      {
        id: 'finance-q31',
        label: 'Er is structureel aandacht voor procesoptimalisatie.',
      },
      {
        id: 'finance-q32',
        label: 'Er is structureel aandacht voor margeverbetering.',
      },
      {
        id: 'finance-q33',
        label: 'Er is structureel aandacht voor investeringen in de toekomst.',
      },
      {
        id: 'finance-q34',
        label: 'Financiële activiteiten worden in eigen beheer uitgevoerd.',
      },
      {
        id: 'finance-q35',
        label: 'Financiële activiteiten zijn (gedeeltelijk) uitbesteed.',
      },
      {
        id: 'finance-q36',
        label: 'Inkoop en investeringen worden als voldoende ervaren.',
      },
      {
        id: 'finance-q37',
        label:
          'Voor inkoop en investeringen worden gestructureerd offertes opgesteld.',
      },
      {
        id: 'finance-q38',
        label: 'Alle relevante aspecten worden meegewogen in inkoopbesluiten.',
      },
    ],
  },
  {
    id: 'juridisch',
    label: 'Juridisch',
    items: [
      {
        id: 'juridisch-q1',
        label: 'Standaard contracten worden gebruikt voor in- en verkoop.',
      },
      {
        id: 'juridisch-q2',
        label: 'Algemene in- en verkoopvoorwaarden worden toegepast.',
      },
      {
        id: 'juridisch-q3',
        label: 'Algemene voorwaarden zijn up-to-date met wet- en regelgeving.',
      },
      {
        id: 'juridisch-q4',
        label: 'Juridische procedures via een advocaat komen zelden voor.',
      },
      {
        id: 'juridisch-q5',
        label: 'Intellectuele eigendommen zijn goed beschermd en vastgelegd.',
      },
      {
        id: 'juridisch-q6',
        label: 'Er is voldoende inzicht in benodigde verzekeringen.',
      },
      {
        id: 'juridisch-q7',
        label: 'Wet- en regelgeving wordt actief gevolgd en intern toegepast.',
      },
    ],
  },
  {
    id: 'productie',
    label: 'Productie',
    items: [
      {
        id: 'productie-q1',
        label: 'Tijd- en productverlies in het productieproces is beperkt.',
      },
      {
        id: 'productie-q2',
        label: 'Tijdregistratie geeft goed inzicht in productiekosten.',
      },
      {
        id: 'productie-q3',
        label:
          'Er is een duidelijke productieplanning inclusief mensen en middelen.',
      },
      {
        id: 'productie-q4',
        label:
          'De productieplanning wordt dagelijks doorgesproken en geëvalueerd.',
      },
      {
        id: 'productie-q5',
        label:
          'Productiemiddelen worden via een preventief onderhoudsplan onderhouden.',
      },
      {
        id: 'productie-q6',
        label:
          'Gebruik van energie, water en andere middelen wordt gemonitord.',
      },
      {
        id: 'productie-q7',
        label:
          'Een continu-verbeteringsprogramma in productie is operationeel.',
      },
      {
        id: 'productie-q8',
        label: 'Productiemiddelen voldoen aan de huidige eisen voor productie.',
      },
      {
        id: 'productie-q9',
        label: 'Productiemiddelen voldoen aan eisen voor productontwikkeling.',
      },
      {
        id: 'productie-q10',
        label: 'Productiemiddelen voldoen aan eisen voor onderhoud.',
      },
      {
        id: 'productie-q11',
        label: 'Productiemiddelen voldoen aan eisen voor opleidingen.',
      },
      {
        id: 'productie-q12',
        label: "Productiemiddelen voldoen aan eisen voor verkoopdemo's.",
      },
      {
        id: 'productie-q13',
        label: 'Productiemiddelen voldoen aan eisen voor kwaliteitsbewaking.',
      },
      {
        id: 'productie-q14',
        label:
          'Uitval van een productiemiddel heeft beperkte impact op productie en kosten.',
      },
      {
        id: 'productie-q15',
        label: 'Er is een eigen werkplaats voor kleine reparaties.',
      },
      {
        id: 'productie-q16',
        label: 'De werkplaats heeft de juiste mensen aan boord.',
      },
      {
        id: 'productie-q17',
        label:
          'Er zijn eigen monteurs/onderhoudspersoneel voor groter onderhoud.',
      },
      {
        id: 'productie-q18',
        label: "Er wordt met preventieve onderhoudsschema's gewerkt.",
      },
      {
        id: 'productie-q19',
        label: 'Calamiteitenoefeningen worden regelmatig gehouden.',
      },
      {
        id: 'productie-q20',
        label: 'Eigen mensen worden geschoold op nieuwe technieken.',
      },
      {
        id: 'productie-q21',
        label: 'Eigen mensen worden geschoold met het oog op de toekomst.',
      },
      {
        id: 'productie-q22',
        label: 'Er wordt gewerkt met stagiairs en BBL/BOL-praktijkleerlingen.',
      },
      {
        id: 'productie-q23',
        label: 'Bedrijfsgebouwen worden regelmatig onderhouden.',
      },
    ],
  },
  {
    id: 'inkoop',
    label: 'Inkoop',
    items: [
      {
        id: 'inkoop-q1',
        label: 'Inkoop is een aparte afdeling binnen het bedrijf.',
      },
      { id: 'inkoop-q2', label: 'Inkoop wordt door de directie aangestuurd.' },
      {
        id: 'inkoop-q3',
        label: 'Inkomende goederen worden op kwaliteit gecontroleerd.',
      },
      {
        id: 'inkoop-q4',
        label:
          'Er liggen geen grote voorraden verouderde of ongebruikte materialen.',
      },
      {
        id: 'inkoop-q5',
        label:
          'Ingekochte diensten en services sluiten goed aan op de behoefte.',
      },
      {
        id: 'inkoop-q6',
        label: 'Diensten worden geleverd conform de afgesproken specificaties.',
      },
      {
        id: 'inkoop-q7',
        label:
          'Jaarlijkse marktonderzoeken houden kwaliteit en prijzen vergelijkbaar.',
      },
    ],
  },
  {
    id: 'serv-onderh',
    label: 'Service & Onderhoud',
    items: [
      {
        id: 'serv-onderh-q1',
        label: 'Servicecontracten zijn grotendeels gestandaardiseerd.',
      },
      {
        id: 'serv-onderh-q2',
        label:
          'Service-evaluaties met klachten en input vinden maandelijks plaats.',
      },
      {
        id: 'serv-onderh-q3',
        label:
          'Service-evaluaties leiden tot concrete acties en verbeteringen.',
      },
      {
        id: 'serv-onderh-q4',
        label: "Monteurs werken met duidelijke KPI's die worden geëvalueerd.",
      },
      {
        id: 'serv-onderh-q5',
        label: 'De onderhoudswerkzaamheden zijn effectief.',
      },
      {
        id: 'serv-onderh-q6',
        label:
          "Er zijn geen grote bedrijfsrisico's door achterstallig onderhoud.",
      },
    ],
  },
  {
    id: 'kwal-veiligheid',
    label: 'Kwaliteit & Veiligheid',
    items: [
      {
        id: 'kwal-veiligheid-q1',
        label: 'Er is een goed werkend kwaliteits- en borgingssysteem.',
      },
      {
        id: 'kwal-veiligheid-q2',
        label: 'Het bedrijf heeft alle benodigde certificaten.',
      },
      {
        id: 'kwal-veiligheid-q3',
        label: 'Medewerkers voldoen aan de eisen van de certificaten.',
      },
      {
        id: 'kwal-veiligheid-q4',
        label: 'Het bedrijf heeft de juiste, sectorrelevante certificaten.',
      },
      {
        id: 'kwal-veiligheid-q5',
        label: 'Interne audits worden conform certificaat uitgevoerd.',
      },
      {
        id: 'kwal-veiligheid-q6',
        label: 'Onvolkomenheden worden actief geregistreerd.',
      },
      {
        id: 'kwal-veiligheid-q7',
        label: 'Klachten worden actief geregistreerd.',
      },
      {
        id: 'kwal-veiligheid-q8',
        label: 'Er wordt actief aan kwaliteitsmanagement gewerkt.',
      },
      {
        id: 'kwal-veiligheid-q9',
        label: 'Er is actieve ondersteuning voor kwaliteitsbewaking.',
      },
      {
        id: 'kwal-veiligheid-q10',
        label: 'Kwaliteit speelt een belangrijke rol binnen het bedrijf.',
      },
      {
        id: 'kwal-veiligheid-q11',
        label:
          'Continu-verbetering loopt actief en met medewerkerbetrokkenheid.',
      },
      {
        id: 'kwal-veiligheid-q12',
        label: 'Externe instanties voeren regelmatig audits uit.',
      },
      {
        id: 'kwal-veiligheid-q13',
        label: 'Eigen kwaliteitsmedewerkers voeren regelmatig audits uit.',
      },
      {
        id: 'kwal-veiligheid-q14',
        label: "RI&E's worden regelmatig uitgevoerd.",
      },
      {
        id: 'kwal-veiligheid-q15',
        label: 'Apparatuur en gereedschap worden regelmatig onderhouden.',
      },
      {
        id: 'kwal-veiligheid-q16',
        label: 'Veiligheid heeft een hoge prioriteit in het bedrijf.',
      },
      {
        id: 'kwal-veiligheid-q17',
        label:
          'Veiligheidsaudits van de werkomgeving worden regelmatig uitgevoerd.',
      },
      {
        id: 'kwal-veiligheid-q18',
        label:
          'Medewerkers beschikken over de juiste persoonlijke beschermingsmiddelen.',
      },
      {
        id: 'kwal-veiligheid-q19',
        label: 'Er doen zich nauwelijks ongevallen voor.',
      },
      {
        id: 'kwal-veiligheid-q20',
        label: 'Er doen zich nauwelijks bijna-ongevallen voor.',
      },
      {
        id: 'kwal-veiligheid-q21',
        label: 'Ongevallen worden actief gemonitord om herhaling te voorkomen.',
      },
      {
        id: 'kwal-veiligheid-q22',
        label:
          'BHV-cursussen worden regelmatig gegeven aan een vaste groep medewerkers.',
      },
      {
        id: 'kwal-veiligheid-q23',
        label:
          'Kwaliteit en veiligheid worden door de hele organisatie heen gecommuniceerd.',
      },
      {
        id: 'kwal-veiligheid-q24',
        label:
          "Medewerkers worden voldoende geïnformeerd over regels en risico's.",
      },
      {
        id: 'kwal-veiligheid-q25',
        label: 'Interne werkinstructies worden continu verbeterd.',
      },
      {
        id: 'kwal-veiligheid-q26',
        label: 'Werkomstandigheden worden continu verbeterd.',
      },
      {
        id: 'kwal-veiligheid-q27',
        label: 'Interne afspraken worden continu verbeterd.',
      },
    ],
  },
  {
    id: 'hrm',
    label: 'HRM',
    items: [
      { id: 'hrm-q1', label: 'Er is een aparte HR-afdeling.' },
      {
        id: 'hrm-q2',
        label:
          'HR ondersteunt het management bij de aansturing van afdelingen en medewerkers.',
      },
      {
        id: 'hrm-q3',
        label: 'HR-functie is duidelijk belegd binnen de organisatie.',
      },
      {
        id: 'hrm-q4',
        label: 'HR adviseert het management proactief over personeelsbeleid.',
      },
      {
        id: 'hrm-q5',
        label: 'Er is een medezeggenschapsorgaan (OR/PVT) ingesteld.',
      },
      {
        id: 'hrm-q6',
        label:
          'Het medezeggenschapsorgaan overlegt regelmatig met het management.',
      },
      { id: 'hrm-q7', label: 'Overlegnotulen worden schriftelijk vastgelegd.' },
      {
        id: 'hrm-q8',
        label:
          'Actiepunten worden systematisch tijdens de overleggen besproken.',
      },
      {
        id: 'hrm-q9',
        label: 'Het bedrijf hanteert een eigen CAO of een branche-CAO.',
      },
      { id: 'hrm-q10', label: 'De CAO-regels worden consequent toegepast.' },
      {
        id: 'hrm-q11',
        label:
          'Functionerings- en beoordelingsgesprekken vinden periodiek plaats.',
      },
      {
        id: 'hrm-q12',
        label: 'Persoonlijke ontwikkelplannen sluiten aan op bedrijfsdoelen.',
      },
      {
        id: 'hrm-q13',
        label: 'Persoonlijke ontwikkelplannen ondersteunen individuele groei.',
      },
      {
        id: 'hrm-q14',
        label: 'Groepsopleidingen en -trainingen worden regelmatig gevolgd.',
      },
      {
        id: 'hrm-q15',
        label: 'Individuele opleidingen worden regelmatig gefaciliteerd.',
      },
      {
        id: 'hrm-q16',
        label: 'Opleidingen en trainingen worden door de werkgever vergoed.',
      },
      {
        id: 'hrm-q17',
        label: 'Gevolgde opleidingen worden vastgelegd in personeelsdossiers.',
      },
      {
        id: 'hrm-q18',
        label: 'Opleidingen worden geëvalueerd op nut en toepasbaarheid.',
      },
      {
        id: 'hrm-q19',
        label: 'Er is een vastgesteld wervings- en selectiebeleid.',
      },
      { id: 'hrm-q20', label: 'Bij werving wordt extern advies ingewonnen.' },
      { id: 'hrm-q21', label: 'Werving wordt extern uitgevoerd, soms intern.' },
      {
        id: 'hrm-q22',
        label: 'Een deel van de werving komt via interne tips.',
      },
      {
        id: 'hrm-q23',
        label:
          'Er wordt conform de Wet Poortwachter gewerkt bij ziekteverzuim.',
      },
      {
        id: 'hrm-q24',
        label: 'Aan alle wettelijke HR-verplichtingen wordt voldaan.',
      },
      { id: 'hrm-q25', label: 'Er is een vastgelegd verzuimbeleid.' },
      { id: 'hrm-q26', label: 'Er is een vastgelegd aanstellingsbeleid.' },
      { id: 'hrm-q27', label: 'Er is een vastgelegd ontslagbeleid.' },
      { id: 'hrm-q28', label: 'Verzuimcijfers worden actief gemonitord.' },
      {
        id: 'hrm-q29',
        label:
          'Bij medische klachten worden externe partijen (arbo) ingeschakeld.',
      },
      {
        id: 'hrm-q30',
        label:
          'Het bedrijf voldoet aan de wettelijke privacy-eisen rond gezondheid.',
      },
      {
        id: 'hrm-q31',
        label: 'Er zijn dekkende verzekeringen voor verzuim en WGA.',
      },
      { id: 'hrm-q32', label: 'Gedragsregels worden gehanteerd.' },
      {
        id: 'hrm-q33',
        label: 'Gedragsregels worden jaarlijks vergeleken met branchenormen.',
      },
      {
        id: 'hrm-q34',
        label: 'Gedragsregels worden vergeleken met die van vakverenigingen.',
      },
      {
        id: 'hrm-q35',
        label: 'Gedragsregels worden getoetst aan wet- en regelgeving.',
      },
      {
        id: 'hrm-q36',
        label: 'Gedragsregels worden getoetst aan eigen bedrijfswaarden.',
      },
      { id: 'hrm-q37', label: 'Gedragsregels worden jaarlijks geëvalueerd.' },
      {
        id: 'hrm-q38',
        label:
          'Er wordt actief gewerkt aan goede communicatie tussen leiding en medewerkers.',
      },
      {
        id: 'hrm-q39',
        label:
          'Het personeelsbestand wordt geanalyseerd om tekorten op middellange termijn voor te zijn.',
      },
      {
        id: 'hrm-q40',
        label:
          'Het personeelsbestand wordt geanalyseerd in lijn met bedrijfsstrategie.',
      },
    ],
  },
  {
    id: 'rd',
    label: 'R&D',
    items: [
      { id: 'rd-q1', label: 'Er wordt voortdurend geïnnoveerd.' },
      { id: 'rd-q2', label: 'Er is een aparte R&D-afdeling.' },
      {
        id: 'rd-q3',
        label: 'R&D-doelstellingen zijn duidelijk en bekend in de organisatie.',
      },
      {
        id: 'rd-q4',
        label:
          'Minimaal halfjaarlijks worden product-marktcombinaties geanalyseerd.',
      },
      {
        id: 'rd-q5',
        label:
          'Er wordt jaarlijks budget gereserveerd voor productontwikkeling.',
      },
      {
        id: 'rd-q6',
        label: 'Productontwikkelingsbudget wordt gemonitord en bijgestuurd.',
      },
      {
        id: 'rd-q7',
        label: 'Er wordt gestructureerd onderzoek gedaan naar nieuwe markten.',
      },
      {
        id: 'rd-q8',
        label:
          'Er wordt gestructureerd onderzoek gedaan naar nieuwe producten.',
      },
      {
        id: 'rd-q9',
        label:
          'Er wordt gestructureerd onderzoek gedaan naar nieuwe markttrends.',
      },
      {
        id: 'rd-q10',
        label:
          'Externe partijen worden betrokken bij het ontwikkelen van nieuwe ideeën.',
      },
      {
        id: 'rd-q11',
        label:
          'Externe partijen worden betrokken bij het ontwikkelen van nieuwe markten.',
      },
      {
        id: 'rd-q12',
        label: 'Externe partijen worden betrokken bij productontwikkeling.',
      },
      {
        id: 'rd-q13',
        label: 'Externe partijen worden betrokken bij dienstontwikkeling.',
      },
      {
        id: 'rd-q14',
        label: 'Externe partijen worden betrokken bij nieuwe technologie.',
      },
      {
        id: 'rd-q15',
        label: 'Er wordt samengewerkt met wetenschappelijke instellingen.',
      },
      {
        id: 'rd-q16',
        label: 'Externe partijen worden betrokken bij andere ontwikkelingen.',
      },
      {
        id: 'rd-q17',
        label: 'Resulterende intellectuele eigendommen worden vastgelegd.',
      },
    ],
  },
] as const
