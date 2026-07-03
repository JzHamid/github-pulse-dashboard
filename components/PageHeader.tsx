import type { ReactNode } from "react";
import { BadgeList } from "@/components/BadgeList";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badges,
  action,
}: PageHeaderProps) {
  return (
    <header className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_520px] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            {description}
          </p>
          <div className="mt-5">
            <BadgeList items={badges} />
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </header>
  );
}
