import { ApiPreview } from "@/components/ApiPreview";
import { InsightCards } from "@/components/InsightCards";
import { ProfileCard } from "@/components/ProfileCard";
import { RepoInsights } from "@/components/RepoInsights";
import { SearchForm } from "@/components/SearchForm";
import { StateMessage } from "@/components/StateMessage";
import {
  getGitHubDashboard,
  normalizeUsername,
} from "@/lib/github";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    username?: string | string[];
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const username = normalizeUsername(getFirstParam(params.username));
  const result = await getGitHubDashboard(username);

  return (
    <main className="min-h-screen bg-[#07080d] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                GitHub Pulse Dashboard
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
                Developer profile intelligence from public GitHub data.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Search a GitHub username to inspect profile signals,
                repository momentum, language mix, and the raw API response
                behind the dashboard.
              </p>
            </div>
            <SearchForm initialUsername={username} />
          </div>
        </header>

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
      </div>
    </main>
  );
}

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
