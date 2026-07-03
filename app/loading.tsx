export default function Loading() {
  return (
    <main className="min-h-screen bg-[#07080d] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.045]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.045]"
              key={index}
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.045]" />
          <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.045]" />
        </div>
      </div>
    </main>
  );
}
