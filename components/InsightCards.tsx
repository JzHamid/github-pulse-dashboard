import type { GitHubInsights } from "@/lib/github";

type InsightCardsProps = {
  insights: GitHubInsights;
};

export function InsightCards({ insights }: InsightCardsProps) {
  const cards = [
    {
      label: "Total public repos",
      value: formatNumber(insights.totalRepos),
      detail: `${formatNumber(insights.totalForks)} forks in fetched repos`,
      accent: "border-emerald-300/60",
    },
    {
      label: "Total stars",
      value: formatNumber(insights.totalStars),
      detail: "Across public repositories",
      accent: "border-amber-300/60",
    },
    {
      label: "Most-used language",
      value: insights.mostUsedLanguage ?? "No language",
      detail: insights.mostUsedLanguage
        ? "Based on repo primary language"
        : "No language data returned",
      accent: "border-cyan-300/60",
    },
    {
      label: "Recently updated",
      value: insights.mostRecentlyUpdatedRepo?.name ?? "No repos",
      detail: insights.mostRecentlyUpdatedRepo
        ? formatDate(insights.mostRecentlyUpdatedRepo.updatedAt)
        : "No public repositories found",
      accent: "border-fuchsia-300/60",
    },
    {
      label: "Best performing repo",
      value: insights.bestPerformingRepo?.name ?? "No repos",
      detail: insights.bestPerformingRepo
        ? `${formatNumber(insights.bestPerformingRepo.stargazersCount)} stars`
        : "No starred repositories found",
      accent: "border-lime-300/60",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article
          className={`rounded-lg border border-white/10 border-t-2 ${card.accent} bg-white/[0.045] p-4`}
          key={card.label}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            {card.label}
          </p>
          <h3 className="mt-3 min-h-8 break-words text-xl font-semibold leading-tight text-white">
            {card.value}
          </h3>
          <p className="mt-3 text-sm leading-5 text-zinc-400">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
