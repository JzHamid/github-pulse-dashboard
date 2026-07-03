import Image from "next/image";
import type { GitHubProfile } from "@/lib/github";

type ProfileCardProps = {
  profile: GitHubProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Image
          alt={`${profile.login} avatar`}
          className="h-24 w-24 rounded-full border border-white/15 bg-zinc-900 object-cover"
          height={96}
          priority
          src={profile.avatarUrl}
          width={96}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            GitHub profile
          </p>
          <h2 className="mt-2 truncate text-2xl font-semibold text-white">
            {profile.name ?? profile.login}
          </h2>
          <a
            className="mt-1 inline-flex text-sm font-medium text-zinc-400 transition hover:text-emerald-200"
            href={profile.htmlUrl}
            rel="noreferrer"
            target="_blank"
          >
            @{profile.login}
          </a>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
            {profile.bio ?? "This profile does not have a public bio yet."}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-3">
        <ProfileMetric label="Followers" value={profile.followers} />
        <ProfileMetric label="Following" value={profile.following} />
        <ProfileMetric label="Public repos" value={profile.publicRepos} />
      </dl>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {profile.location ? <ProfileBadge label={profile.location} /> : null}
        {profile.company ? <ProfileBadge label={profile.company} /> : null}
        {profile.blog ? (
          <a
            className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-cyan-100 transition hover:border-cyan-200/60"
            href={profile.blog}
            rel="noreferrer"
            target="_blank"
          >
            Website
          </a>
        ) : null}
      </div>
    </section>
  );
}

function ProfileMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-white">
        {formatNumber(value)}
      </dd>
    </div>
  );
}

function ProfileBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-zinc-300">
      {label}
    </span>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
