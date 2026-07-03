import type { GitHubInsights, GitHubRepo } from "@/lib/github";
import { StateMessage } from "@/components/StateMessage";

type RepoInsightsProps = {
  insights: GitHubInsights;
};

export function RepoInsights({ insights }: RepoInsightsProps) {
  if (insights.totalRepos === 0) {
    return (
      <StateMessage
        message="GitHub returned a valid profile, but there are no public repositories to analyze yet."
        tone="empty"
        title="No public repositories"
      />
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Repository insights
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Top repositories by stars
            </h2>
          </div>
          <p className="text-sm text-zinc-500">
            Showing {insights.topRepositories.length} of{" "}
            {insights.totalRepos} fetched repos
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 font-medium">Repository</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Stars</th>
                <th className="px-4 py-3 font-medium">Forks</th>
                <th className="py-3 pl-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {insights.topRepositories.map((repo) => (
                <RepoRow key={repo.id} repo={repo} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-lg font-semibold text-white">
            Recently updated
          </h2>
          <div className="mt-4 divide-y divide-white/10">
            {insights.recentRepositories.map((repo) => (
              <a
                className="block py-3 transition hover:text-emerald-100"
                href={repo.htmlUrl}
                key={repo.id}
                rel="noreferrer"
                target="_blank"
              >
                <p className="truncate text-sm font-medium text-white">
                  {repo.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDate(repo.updatedAt)}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-lg font-semibold text-white">
            Repo count by language
          </h2>
          <div className="mt-4 space-y-3">
            {insights.languageCounts.length > 0 ? (
              insights.languageCounts.slice(0, 6).map((item) => (
                <div key={item.language}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-zinc-300">
                      {item.language}
                    </span>
                    <span className="font-medium text-white">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-300"
                      style={{
                        width: `${Math.max(
                          (item.count / insights.languageCounts[0].count) * 100,
                          12,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-zinc-400">
                GitHub did not return primary language data for these repos.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RepoRow({ repo }: { repo: GitHubRepo }) {
  return (
    <tr className="align-top text-zinc-300">
      <td className="max-w-[300px] py-4 pr-4">
        <a
          className="font-medium text-white transition hover:text-emerald-200"
          href={repo.htmlUrl}
          rel="noreferrer"
          target="_blank"
        >
          {repo.name}
        </a>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
          {repo.description ?? "No public description."}
        </p>
      </td>
      <td className="px-4 py-4">
        <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
          {repo.language ?? "Other"}
        </span>
      </td>
      <td className="px-4 py-4 font-medium text-white">
        {formatNumber(repo.stargazersCount)}
      </td>
      <td className="px-4 py-4">{formatNumber(repo.forksCount)}</td>
      <td className="py-4 pl-4 text-zinc-400">{formatDate(repo.updatedAt)}</td>
    </tr>
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
