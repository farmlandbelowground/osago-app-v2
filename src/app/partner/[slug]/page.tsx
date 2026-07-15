interface Props {
  params: Promise<{ slug: string }>
}

export default async function PartnerPage({ params }: Props) {
  await params

  return <div />
}
