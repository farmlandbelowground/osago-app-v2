import { type FC } from 'react'

import { REPORT_SECTIONS } from '@features/valuation/constants/valuationReport'

import { ValuationReportSection } from '../ValuationReportSection'
import { type Props } from './types'

export const ValuationReportEditor: FC<Props> = ({
  content,
  footer,
  headerActions,
}) => (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Waarderingsrapport</h1>
      </div>
      {headerActions}
    </div>

    <div id="valuation-report-form">
      {REPORT_SECTIONS.map((section, index) => (
        <ValuationReportSection
          initialValue={content[section.field]}
          isFirst={index === 0}
          key={section.field}
          section={section}
        />
      ))}
    </div>

    {footer}
  </>
)
