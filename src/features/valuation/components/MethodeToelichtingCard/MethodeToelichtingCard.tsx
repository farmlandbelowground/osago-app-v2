import { Fragment, type FC } from 'react'

import {
  buildMethodeToelichting,
  type ToelichtingSegment,
} from '../../lib/buildMethodeToelichting'
import {
  LEAD_STYLE,
  PARAGRAPH_STYLE,
  TABLE_STYLE,
  TD_LABEL_STYLE,
  TD_VALUE_STYLE,
} from './constants'
import { type Props } from './types'

const Segments: FC<{ segments: ToelichtingSegment[] }> = ({ segments }) => (
  <>
    {segments.map((segment, index) => (
      <Fragment key={index}>
        {segment.isStrong ? <strong>{segment.text}</strong> : segment.text}
      </Fragment>
    ))}
  </>
)

// Ports the "Methode toelichting" card body (osago-bundle.js:15205-15327 for
// the sector-multiple variant, :15132-15194 for the DCF variant).
export const MethodeToelichtingCard: FC<Props> = ({ input }) => {
  const toelichting = buildMethodeToelichting(input)

  return (
    <div className="card">
      <h3>Methode toelichting</h3>

      {toelichting.kind === 'message' && (
        <p className="text-sm text-muted" style={{ margin: 0 }}>
          {toelichting.text}
        </p>
      )}

      {toelichting.kind === 'sector' &&
        toelichting.paragraphs.map((paragraph, index) => (
          <p
            className="text-sm"
            key={index}
            style={
              index === toelichting.paragraphs.length - 1
                ? { lineHeight: 1.6, margin: 0 }
                : PARAGRAPH_STYLE
            }
          >
            <Segments segments={paragraph} />
          </p>
        ))}

      {toelichting.kind === 'dcf' && (
        <>
          <p className="text-sm" style={PARAGRAPH_STYLE}>
            <Segments segments={toelichting.intro} />
          </p>
          <p className="text-sm" style={LEAD_STYLE}>
            {toelichting.lead}
          </p>
          <table className="text-sm" style={TABLE_STYLE}>
            <tbody>
              {toelichting.rows.map(row => (
                <tr key={row.label}>
                  <td style={TD_LABEL_STYLE}>{row.label}</td>
                  <td style={TD_VALUE_STYLE}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
