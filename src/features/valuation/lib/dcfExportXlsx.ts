 
import * as XLSX from 'xlsx'

import {
  dcfAllYears,
  dcfExportFileBase,
  dcfYearType,
  type DcfExportData,
} from './dcfExportShared'

// Ports exportDcfToExcel (osago-bundle.js:4230) — 6 sheets built with
// aoa_to_sheet, downloaded via XLSX.writeFile. Runs in the browser.
export const exportDcfToXlsx = (data: DcfExportData): void => {
  const { company, financials, inputs, result } = data
  const b = result.berekening
  const u = inputs.uitgangspunten
  const wb = XLSX.utils.book_new()

  const overzicht = [
    ['DCF-export'],
    [],
    ['Bedrijf', company.name || '—'],
    ['KvK-nummer', company.kvkNummer || '—'],
    ['Sector', company.sector || '—'],
    ['Laatst gesloten boekjaar', company.lastClosedYear ?? '—'],
    ['Export-datum', new Date().toLocaleDateString('nl-NL')],
    [],
    ['Totaal-uitkomsten'],
    ['Waarde scenarioperiode', b.totalen.waardeScenario],
    ['Waarde restperiode', b.totalen.waardeRest],
    ['Totaal (DCF Waarde)', b.totalen.totaal],
    [],
    ['Pas DCF-waardering toe', company.dcfApplyEnabled ? 'Ja' : 'Nee'],
    ['Restwaarde beperken (cap 0,75×)', u.restwaardeCap ? 'Aan' : 'Uit'],
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(overzicht),
    'Overzicht',
  )

  const wacc = [
    ['WACC-componenten'],
    [],
    ['Onderdeel', 'Waarde', 'Toelichting'],
    [],
    ['Disconto Berekening'],
    ['Risk free rate', inputs.rfr, 'Backend-instelling'],
    ['Market risk premium', inputs.mrp, 'Backend-instelling'],
    ['Sectorcorrectie', inputs.sectoropslag, `Sector ${company.sector || '—'}`],
    ['Illiquiditeitspremie', inputs.ip, 'Backend-instelling'],
    ['Subtotaal Disconto Berekening', result.subtotaal1, '= rfr + mrp + sc + ip'],
    [],
    ['Kwetsbaarheid onderneming'],
    ['Afhankelijkheid aandeelhouders — bijdrage', result.klein.adh, ''],
    ['Afhankelijkheid afnemers — bijdrage', result.klein.afn, ''],
    ['Afhankelijkheid leveranciers — bijdrage', result.klein.alr, ''],
    ['Subtotaal Kwetsbaarheid onderneming', result.kleinPremie, ''],
    [],
    ['Risicoprofiel markt'],
    ['Merknaam en reputatie — bijdrage', result.asset.rep, ''],
    ['Spreiding van de activiteiten — bijdrage', result.asset.act, ''],
    ['Toetreding tot de markt — bijdrage', result.asset.toetr, ''],
    ['Track record — bijdrage', result.asset.trackR, ''],
    ['Subtotaal Risicoprofiel markt', result.alfa, ''],
    [],
    ['Kostenvoet unlevered (WACC)', result.kostenvoet, '= Disconto + Kwetsbaarheid + Risicoprofiel'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wacc), 'WACC')

  const startYear = inputs.scenarioStartYear
  const yearCount = inputs.scenarioYearCount
  const uitgangspunten = [
    ['Uitgangspunten'],
    [],
    ['Onderdeel', 'Waarde'],
    ['Aantal scenariojaren', yearCount],
    ['Scenarioperiode startjaar', startYear],
    ['Scenarioperiode eindjaar', startYear + yearCount - 1],
    ['Rest-jaar', startYear + yearCount],
    ['Disconteringsvoet scenarioperiode (= WACC)', result.kostenvoet],
    ['Vermogensvoet rest periode', u.vermogensvoetRest],
    ['Groei restperiode', u.groeiRest],
    ['Restwaarde beperken', u.restwaardeCap ? 'Aan' : 'Uit'],
    [
      'Ontwikkelingsschaal (Mijn bedrijf, 0-4)',
      company.bedrijfMarktOntwikkeling ?? '—',
    ],
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(uitgangspunten),
    'Uitgangspunten',
  )

  const allYears = dcfAllYears(result)
  const fieldRow = (
    label: string,
    key: keyof (typeof b.data)[number],
  ): (number | string)[] => [
    label,
    ...allYears.map(year => {
      const value = b.data[year]?.[key]
      return typeof value === 'number' && isFinite(value) ? value : ''
    }),
  ]

  const berekening: (number | string)[][] = [
    ['Berekening DCF — per jaar'],
    [],
    ['Veld', ...allYears.map(String)],
    ['Type', ...allYears.map(year => dcfYearType(result, year))],
    fieldRow('Omzet', 'revenue'),
    fieldRow('EBITDA', 'ebitda'),
    fieldRow('EBIT', 'ebit'),
    fieldRow('Afschrijvingen', 'afschrijvingen'),
    fieldRow('Betaalde belastingen', 'vpb'),
    fieldRow('Rentelasten', 'intrest'),
    fieldRow('Nettoresultaat', 'nettoResultaat'),
    fieldRow('Normaliseringen', 'normalisering'),
    fieldRow('Nettoresultaat genormaliseerd', 'nettoResultaatGenorm'),
    fieldRow('NOPLAT', 'noplat'),
    fieldRow('Investeringen', 'investeringen'),
    fieldRow('Aflossingen', 'aflossingen'),
    fieldRow('Free cash flow', 'fcf'),
    fieldRow('Disconteringsvoet (DF)', 'df'),
    fieldRow('Contante waarde free cash flow', 'cw'),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(berekening),
    'Berekening',
  )

  const disconto: (number | string)[][] = [
    ['Discontovoet per jaar van de scenarioperiode'],
    [],
    ['Jaar', 'Disconteringsvoet (DF)'],
    ...result.discRows.map(row => [row.year, row.df]),
    [`Rest-jaar (${startYear + yearCount})`, result.restDf],
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(disconto),
    'Disconto per jaar',
  )

  const finRow = (
    label: string,
    key: keyof (typeof financials)[number],
  ): (number | string)[] => [
    label,
    ...allYears.map(year => {
      const value = financials[year]?.[key]
      return typeof value === 'number' && isFinite(value) ? value : ''
    }),
  ]
  const finSheet: (number | string)[][] = [
    ['Financiële gegevens — opgeslagen invoer'],
    [],
    ['Veld', ...allYears.map(String)],
    finRow('Omzet', 'revenue'),
    finRow('Kostprijs van de omzet', 'cogs'),
    finRow('Bedrijfskosten', 'operatingExpenses'),
    finRow('Afschrijvingen', 'depreciation'),
    finRow('Rentelasten', 'interest'),
    finRow('Betaalde belastingen', 'taxesPaid'),
  ]
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(finSheet),
    'Financiële gegevens',
  )

  XLSX.writeFile(wb, `${dcfExportFileBase(company.name)}.xlsx`)
}
