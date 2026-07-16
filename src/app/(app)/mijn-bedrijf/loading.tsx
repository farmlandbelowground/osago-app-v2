export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-foreground/10" />
      <div className="mb-6 h-32 animate-pulse rounded-lg bg-foreground/10" />
      <div className="h-96 animate-pulse rounded-lg bg-foreground/10" />
    </main>
  )
}
