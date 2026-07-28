import {
  buildMethodeToelichting,
  type MethodeToelichtingInput,
  type ToelichtingSegment,
} from './buildMethodeToelichting'

export {
  type MethodeToelichtingDcf,
  type MethodeToelichtingInput,
} from './buildMethodeToelichting'

const renderSegments = (segments: ToelichtingSegment[]): string =>
  segments
    .map(segment => (segment.isStrong ? `**${segment.text}**` : segment.text))
    .join('')

// The Methode toelichting as plain markdown, rendered from the same structure
// the on-screen card uses (buildMethodeToelichting). Table rows become
// "label: value" lines, matching the legacy htmlToPlainMarkdown conversion of
// the HTML table.
export const buildMethodeToelichtingMarkdown = (
  input: MethodeToelichtingInput,
): string => {
  const toelichting = buildMethodeToelichting(input)

  if (toelichting.kind === 'message') {
    return toelichting.text
  }

  if (toelichting.kind === 'dcf') {
    return [
      renderSegments(toelichting.intro),
      toelichting.lead,
      ...toelichting.rows.map(row => `${row.label}: ${row.value}`),
    ].join('\n')
  }

  return toelichting.paragraphs.map(renderSegments).join('\n\n')
}
