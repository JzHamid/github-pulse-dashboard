import type { ApiPreview } from "@/lib/api-preview";

export const DEFAULT_USERNAME = "JzHamid";

const GITHUB_API_BASE = "https://api.github.com";

type FetchSuccess<T> = {
  ok: true;
  status: number;
  data: T;
  rateLimitRemaining: string | null;
};

type FetchFailure = {
  ok: false;
  status: number;
  message: string;
  rateLimitRemaining: string | null;
};

type FetchResult<T> = FetchSuccess<T> | FetchFailure;

type RawGitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
};

type RawGitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
  homepage: string | null;
};

export type GitHubProfile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  htmlUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  updatedAt: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stargazersCount: number;
  forksCount: number;
  language: string | null;
  updatedAt: string;
  pushedAt: string | null;
  homepage: string | null;
};

export type LanguageCount = {
  language: string;
  count: number;
};

export type GitHubInsights = {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  mostUsedLanguage: string | null;
  languageCounts: LanguageCount[];
  topRepositories: GitHubRepo[];
  recentRepositories: GitHubRepo[];
  bestPerformingRepo: GitHubRepo | null;
  mostRecentlyUpdatedRepo: GitHubRepo | null;
};

export type GitHubError = {
  type: "not-found" | "rate-limit" | "api-error" | "network-error";
  title: string;
  message: string;
};

export type GitHubDashboardResult =
  | {
      ok: true;
      username: string;
      profile: GitHubProfile;
      repos: GitHubRepo[];
      insights: GitHubInsights;
      apiPreview: ApiPreview;
    }
  | {
      ok: false;
      username: string;
      error: GitHubError;
      apiPreview: ApiPreview;
    };

export function normalizeUsername(value?: string | null) {
  const username = value?.trim().replace(/^@+/, "");

  return username || DEFAULT_USERNAME;
}

export async function getGitHubDashboard(
  usernameInput: string,
): Promise<GitHubDashboardResult> {
  const username = normalizeUsername(usernameInput);
  const encodedUsername = encodeURIComponent(username);
  const profileUrl = `${GITHUB_API_BASE}/users/${encodedUsername}`;
  const reposUrl = `${GITHUB_API_BASE}/users/${encodedUsername}/repos?per_page=100&sort=updated`;

  try {
    const profileResponse = await fetchGitHub<RawGitHubUser>(profileUrl);

    if (!profileResponse.ok) {
      const error = createGitHubError(
        profileResponse.status,
        profileResponse.message,
        username,
      );

      return {
        ok: false,
        username,
        error,
        apiPreview: createErrorPreview(profileUrl, profileResponse.status, error),
      };
    }

    const reposResponse = await fetchGitHub<RawGitHubRepo[]>(reposUrl);

    if (!reposResponse.ok) {
      const error = createGitHubError(
        reposResponse.status,
        reposResponse.message,
        username,
      );

      return {
        ok: false,
        username,
        error,
        apiPreview: createErrorPreview(reposUrl, reposResponse.status, error, {
          label: "Profile",
          method: "GET",
          url: profileUrl,
          status: profileResponse.status,
        }),
      };
    }

    const profile = normalizeProfile(profileResponse.data);
    const repos = reposResponse.data.map(normalizeRepo);
    const insights = createInsights(repos);

    return {
      ok: true,
      username: profile.login,
      profile,
      repos,
      insights,
      apiPreview: createApiPreview(
        profileUrl,
        profileResponse.status,
        reposUrl,
        reposResponse.status,
        profile,
        insights,
      ),
    };
  } catch {
    const error: GitHubError = {
      type: "network-error",
      title: "GitHub could not be reached",
      message:
        "The dashboard could not connect to the public GitHub API. Check your connection and try again.",
    };

    return {
      ok: false,
      username,
      error,
      apiPreview: createErrorPreview(profileUrl, null, error),
    };
  }
}

async function fetchGitHub<T>(url: string): Promise<FetchResult<T>> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: getApiMessage(body, response.statusText),
      rateLimitRemaining,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: body as T,
    rateLimitRemaining,
  };
}

function normalizeProfile(user: RawGitHubUser): GitHubProfile {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    location: user.location,
    company: user.company,
    blog: normalizeBlogUrl(user.blog),
    htmlUrl: user.html_url,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function normalizeRepo(repo: RawGitHubRepo): GitHubRepo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    language: repo.language,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    homepage: normalizeBlogUrl(repo.homepage),
  };
}

function createInsights(repos: GitHubRepo[]): GitHubInsights {
  const topRepositories = [...repos].sort(sortByStars).slice(0, 5);
  const recentRepositories = [...repos].sort(sortByUpdatedAt).slice(0, 5);
  const languageCounts = getLanguageCounts(repos);

  return {
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazersCount, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forksCount, 0),
    mostUsedLanguage: languageCounts[0]?.language ?? null,
    languageCounts,
    topRepositories,
    recentRepositories,
    bestPerformingRepo: topRepositories[0] ?? null,
    mostRecentlyUpdatedRepo: recentRepositories[0] ?? null,
  };
}

function getLanguageCounts(repos: GitHubRepo[]) {
  const counts = new Map<string, number>();

  for (const repo of repos) {
    if (!repo.language) {
      continue;
    }

    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  return Array.from(counts, ([language, count]) => ({ language, count })).sort(
    (a, b) => b.count - a.count || a.language.localeCompare(b.language),
  );
}

function createApiPreview(
  profileUrl: string,
  profileStatus: number,
  reposUrl: string,
  reposStatus: number,
  profile: GitHubProfile,
  insights: GitHubInsights,
): ApiPreview {
  return {
    requests: [
      {
        label: "Profile",
        method: "GET",
        url: profileUrl,
        status: profileStatus,
      },
      {
        label: "Repositories",
        method: "GET",
        url: reposUrl,
        status: reposStatus,
      },
    ],
    response: {
      profile: {
        login: profile.login,
        name: profile.name,
        publicRepos: profile.publicRepos,
        followers: profile.followers,
        following: profile.following,
      },
      insights: {
        totalRepos: insights.totalRepos,
        totalStars: insights.totalStars,
        totalForks: insights.totalForks,
        mostUsedLanguage: insights.mostUsedLanguage,
        bestPerformingRepo: insights.bestPerformingRepo?.name ?? null,
        mostRecentlyUpdatedRepo: insights.mostRecentlyUpdatedRepo?.name ?? null,
        languageCounts: insights.languageCounts,
      },
      repositoriesPreview: insights.topRepositories.slice(0, 3).map((repo) => ({
        name: repo.name,
        stars: repo.stargazersCount,
        forks: repo.forksCount,
        language: repo.language,
        updatedAt: repo.updatedAt,
      })),
    },
  };
}

function createErrorPreview(
  url: string,
  status: number | null,
  error: GitHubError,
  extraRequest?: ApiPreview["requests"][number],
): ApiPreview {
  return {
    requests: [
      ...(extraRequest ? [extraRequest] : []),
      {
        label: error.type === "not-found" ? "Profile" : "GitHub API",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      error: {
        message: error.message,
        type: error.type,
      },
    },
  };
}

function createGitHubError(
  status: number,
  message: string,
  username: string,
): GitHubError {
  const normalizedMessage = message.toLowerCase();

  if (status === 404) {
    return {
      type: "not-found",
      title: "GitHub user not found",
      message: `No public GitHub profile was found for "${username}". Check the username and try again.`,
    };
  }

  if (status === 403 && normalizedMessage.includes("rate limit")) {
    return {
      type: "rate-limit",
      title: "GitHub rate limit reached",
      message:
        "GitHub is limiting unauthenticated API requests right now. Wait a few minutes, then search again.",
    };
  }

  return {
    type: "api-error",
    title: "GitHub API request failed",
    message:
      message ||
      "GitHub returned an unexpected response. Try another username or refresh the page.",
  };
}

function getApiMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return fallback;
}

function normalizeBlogUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function sortByStars(a: GitHubRepo, b: GitHubRepo) {
  return (
    b.stargazersCount - a.stargazersCount ||
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function sortByUpdatedAt(a: GitHubRepo, b: GitHubRepo) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}
