"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
          Runtime error
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          The dashboard hit an unexpected issue.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {error.message ||
            "Refresh the page or try another GitHub username to recover."}
        </p>
        <button
          className="mt-5 rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
  );
}
