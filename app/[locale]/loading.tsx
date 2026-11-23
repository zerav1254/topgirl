export default function Loading() {
  return (
    <main id="main" aria-busy="true" className="mx-auto max-w-4xl px-4 pt-8 pb-28 sm:px-6">
      <div className="h-10 w-40 animate-pulse rounded-xl bg-panel-2" />
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-panel-2" />
        ))}
      </div>
    </main>
  );
}
