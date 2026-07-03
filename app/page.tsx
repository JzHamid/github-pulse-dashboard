import Link from "next/link";
import { BadgeList } from "@/components/BadgeList";

const modules = [
  {
    title: "GitHub Pulse",
    href: "/github",
    description:
      "Profile lookup, repository stats, top repos, language mix, recent activity, and API preview.",
    endpoint: "/api/github?username=JzHamid",
    badges: ["GitHub API", "No API Key", "Server Route"],
  },
  {
    title: "Crypto Pulse",
    href: "/crypto",
    description:
      "Searchable market snapshots for custom coin watchlists with movers, volume, market cap, and raw response.",
    endpoint: "/api/crypto?coins=bitcoin,solana",
    badges: ["CoinGecko", "Autocomplete", "Demo Data"],
  },
  {
    title: "Weather Pulse",
    href: "/weather",
    description:
      "Current conditions and forecast previews for searched or preset locations using Open-Meteo with no API key.",
    endpoint: "/api/weather?location=Manila",
    badges: ["Open-Meteo", "Geocoding", "Forecast"],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Multi-API dashboard
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            API Pulse Dashboard turns public endpoints into useful product
            surfaces.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            A compact developer demo showing public API integration,
            autocomplete search, validation, server route handling, error
            states, and clean request/response previews.
          </p>
        </div>
        <div className="mt-6">
          <BadgeList
            items={[
              "Next.js App Router",
              "TypeScript",
              "Tailwind CSS",
              "Public APIs",
              "No Secrets",
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            className="group rounded-lg border border-white/10 bg-white/[0.045] p-5 transition hover:border-emerald-300/45 hover:bg-white/[0.07]"
            href={module.href}
            key={module.title}
          >
            <div className="flex h-full flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  API module
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {module.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {module.description}
                </p>
              </div>
              <BadgeList items={module.badges} />
              <code className="mt-auto block overflow-x-auto whitespace-nowrap border-t border-white/10 pt-4 text-xs text-zinc-500">
                {module.endpoint}
              </code>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Demo focus
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            Built to show fast API product work
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Each module uses public data, a server route, defensive error
            handling, responsive cards, and a raw response panel so the
            integration is visible to technical reviewers.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Route map
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            {modules.map((module) => (
              <div
                className="grid gap-2 border-b border-white/10 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[150px_1fr]"
                key={module.endpoint}
              >
                <span className="font-medium text-white">{module.title}</span>
                <code className="overflow-x-auto whitespace-nowrap text-zinc-500">
                  {module.endpoint}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
