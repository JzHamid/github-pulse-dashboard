import type { ReactNode } from "react";

type StateTone = "empty" | "not-found" | "rate-limit" | "api-error" | "network-error";

type StateMessageProps = {
  tone: StateTone;
  title: string;
  message: string;
  action?: ReactNode;
};

const toneLabels: Record<StateTone, string> = {
  empty: "EMPTY",
  "not-found": "404",
  "rate-limit": "403",
  "api-error": "API",
  "network-error": "NET",
};

export function StateMessage({
  tone,
  title,
  message,
  action,
}: StateMessageProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-sm font-semibold text-emerald-200">
          {toneLabels[tone]}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {message}
          </p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
