interface Props {
  params: Promise<{ slug: string }>
}

export default async function AfspraakPage({ params }: Props) {
  await params

  return <div />
}
