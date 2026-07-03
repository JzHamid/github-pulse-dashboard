import { ApiPreview } from "@/components/ApiPreview";
import { InsightCards } from "@/components/InsightCards";
import { PageHeader } from "@/components/PageHeader";
import { ProfileCard } from "@/components/ProfileCard";
import { RepoInsights } from "@/components/RepoInsights";
import { SearchForm } from "@/components/SearchForm";
import { StateMessage } from "@/components/StateMessage";
import { getGitHubDashboard, normalizeUsername } from "@/lib/github";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    username?: string | string[];
  }>;
};

export default async function GitHubPulsePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const username = normalizeUsername(getFirstParam(params.username));
  const result = await getGitHubDashboard(username);

  return (
    <>
      <PageHeader
        action={
          <SearchForm actionPath="/github" initialUsername={username} />
        }
        badges={["Public API", "No API Key", "Server Route", "Error Handling"]}
        description="Search a GitHub username to inspect profile signals, repository momentum, language mix, recent activity, and the raw API response behind the dashboard."
        eyebrow="GitHub Pulse"
        title="Developer profile intelligence from public GitHub data."
      />

      {result.ok ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <ProfileCard profile={result.profile} />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Profile pulse
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Snapshot for @{result.profile.login}
                  </h2>
                </div>
                <a
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-300/45 hover:text-emerald-100"
                  href={result.profile.htmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open profile
                </a>
              </div>
              <InsightCards insights={result.insights} />
            </div>
          </section>

          <RepoInsights insights={result.insights} />
          <ApiPreview preview={result.apiPreview} />
        </>
      ) : (
        <>
          <StateMessage
            message={result.error.message}
            tone={result.error.type}
            title={result.error.title}
          />
          <ApiPreview preview={result.apiPreview} />
        </>
      )}
    </>
  );
}

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
