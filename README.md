# GitHub Pulse Dashboard

GitHub Pulse Dashboard is a small API-powered developer dashboard built for an
OJT application challenge. It looks up a public GitHub profile and turns the
profile and repository response into a compact set of useful insights.

## What I Built

- A dark, responsive dashboard UI for searching a GitHub username.
- Public GitHub profile lookup with avatar, bio, company, location, follower
  counts, repo count, and profile link.
- Repository insights for total stars, total forks, most-used language, top
  repositories by stars, recently updated repositories, and language counts.
- A request/response preview panel that makes the app feel like a developer
  tool.
- Loading, empty, not-found, rate-limit, and unexpected-error states.

The default example username is `JzHamid`, so the dashboard shows data as soon
as it loads.

## Tools Used

- Next.js App Router
- TypeScript
- Tailwind CSS
- GitHub public REST API
- Built-in `fetch`

No database, authentication, API keys, or extra dependencies are required.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

For production checks:

```bash
npm run build
npm run lint
```

## What The App Demonstrates

- Server-side data fetching in the Next.js App Router.
- Typed API response handling and normalized view models.
- Clean component boundaries for profile, search, insights, repository tables,
  API preview, and states.
- Defensive handling for invalid users, empty repository lists, and GitHub
  unauthenticated API rate limits.
- A polished MVP that stays intentionally small and explainable.

## AI-Assisted Development

AI assistance was used to inspect the starter project, plan the MVP scope, build
the component structure, organize GitHub API fetching, and refine the dashboard
copy and UI states. The implementation was kept simple and reviewed against the
challenge constraints: no secrets, no API keys, no database, and no unnecessary
dependencies.

## What I Would Improve Next

- Add lightweight charts for language distribution and repository activity.
- Add a comparison mode for two GitHub users.
- Cache successful GitHub responses for a short time to reduce rate-limit risk.
- Add integration tests around API error handling and insight calculations.
