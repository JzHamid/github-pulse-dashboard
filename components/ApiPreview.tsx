import type { ApiPreview as ApiPreviewData } from "@/lib/github";

type ApiPreviewProps = {
  preview: ApiPreviewData;
};

export function ApiPreview({ preview }: ApiPreviewProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            API preview
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Request and response snapshot
          </h2>
        </div>
        <span className="w-fit rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300">
          Public GitHub API
        </span>
      </div>

      <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
        {preview.requests.map((request) => (
          <div
            className="grid gap-2 py-3 text-sm md:grid-cols-[88px_1fr_72px] md:items-center"
            key={`${request.label}-${request.url}`}
          >
            <span className="font-semibold text-emerald-300">
              {request.method}
            </span>
            <code className="overflow-x-auto whitespace-nowrap text-xs text-zinc-300">
              {request.url}
            </code>
            <span className="w-fit rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
              {request.status ?? "N/A"}
            </span>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-white/10 bg-black/45 p-4 text-xs leading-6 text-zinc-300">
        <code>{JSON.stringify(preview.response, null, 2)}</code>
      </pre>
    </section>
  );
}
