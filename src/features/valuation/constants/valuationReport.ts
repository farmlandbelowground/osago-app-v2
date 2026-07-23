import { type ValuationReportField } from '../types'

export interface ReportSectionDefinition {
  description: string
  field: ValuationReportField
  placeholder: string
  title: string
}

export const REPORT_SECTIONS: readonly ReportSectionDefinition[] = [
  {
    field: 'foreword',
    title: 'Voorwoord',
    description:
      'Een persoonlijke introductie aan het begin van het waarderingsrapport. Bijvoorbeeld een korte schets van jouw bedrijf, de aanleiding voor de waardering, of context die je aan een potentiële koper wilt meegeven.',
    placeholder:
      'Bijvoorbeeld: Onze onderneming is in 2008 gestart met als doel...',
  },
  {
    field: 'financialsNote',
    title: 'Toelichting financiële gegevens',
    description:
      'Een toelichting op de financiële cijfers — bijvoorbeeld over uitschieters, eenmalige posten, accounting-keuzes of context bij een specifiek jaar. Verschijnt in de PDF direct onder de tabel met financiële gegevens.',
    placeholder:
      'Bijvoorbeeld: De daling in 2023 wordt verklaard door eenmalige investeringen in IT-infrastructuur...',
  },
  {
    field: 'valueDriversNote',
    title: 'Toelichting value drivers',
    description:
      'Een toelichting op de scores en keuzes voor de value drivers — bijvoorbeeld over je positie in de markt, de kwaliteit van het managementteam of unieke aspecten van je bedrijfsmodel. Verschijnt in de PDF op een eigen pagina.',
    placeholder:
      'Bijvoorbeeld: Onze positie in de markt is sterk dankzij een lange geschiedenis van klanttevredenheid en repeat business...',
  },
  {
    field: 'closing',
    title: 'Tot slot',
    description:
      'Een afsluitend woord aan het einde van het rapport. Bijvoorbeeld een uitnodiging tot vervolggesprek, een dankwoord of een persoonlijke noot.',
    placeholder:
      'Bijvoorbeeld: Wij zien graag uw reactie tegemoet en zijn beschikbaar voor een vervolggesprek...',
  },
]
