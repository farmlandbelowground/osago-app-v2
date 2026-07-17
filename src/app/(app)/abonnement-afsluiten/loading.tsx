export default function Loading() {
  return (
    <div
      className={`
        w-full space-y-6 px-10 pt-8 pb-20
        max-[900px]:p-5
      `}
    >
      <div className="h-9 w-64 animate-pulse rounded bg-foreground/10" />
      <div
        className={`
          grid grid-cols-1 gap-5
          md:grid-cols-3
        `}
      >
        <div className="h-72 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-72 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-72 animate-pulse rounded-lg bg-foreground/10" />
      </div>
    </div>
  )
}
