export default function Loading() {
  return (
    <div
      className={`
        w-full space-y-6 px-10 py-8
        max-[900px]:p-5
      `}
    >
      <div className="h-9 w-64 animate-pulse rounded bg-foreground/10" />
      <div className="grid grid-cols-4 gap-4">
        <div className="h-20 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-20 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-20 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-20 animate-pulse rounded-lg bg-foreground/10" />
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-foreground/10" />
    </div>
  )
}
