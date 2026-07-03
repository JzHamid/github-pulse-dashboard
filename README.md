# API Pulse Dashboard

API Pulse Dashboard is a multi-API public dashboard built for the Vibe Coder
OJT optional challenge. It demonstrates how quickly a useful developer-tool
style product can be built from public APIs with clean UI states, typed data
handling, and route-handler based integration points.

## What I Built

- A dark, responsive dashboard shell with navigation for three API modules.
- A home overview page that explains the modules and their server routes.
- GitHub Pulse for profile and repository insights.
- Crypto Pulse for searchable market snapshots across custom coin watchlists.
- Weather Pulse for searched or preset location weather and forecast previews.
- Request/response preview panels for each API module.
- Loading, empty, invalid input, rate-limit, and error states.

## APIs Used

- GitHub public REST API for developer profiles and repositories.
- CoinGecko public API for crypto market prices.
- Open-Meteo public API for current weather and daily forecasts.

No database, authentication, paid API keys, or secrets are required.

## App Routes

- `/` - overview of all API modules.
- `/github` - GitHub username lookup, defaulting to `JzHamid`.
- `/crypto` - crypto market dashboard with coin search and autocomplete.
- `/weather` - weather dashboard with location search, autocomplete, and preset city buttons.

## Server Routes

- `/api/github?username=JzHamid`
- `/api/crypto?coins=bitcoin,solana`
- `/api/crypto/search?q=bit`
- `/api/weather?location=Manila`
- `/api/weather/search?q=tok`

These routes keep API fetching organized and make the app easier to review as
an integration challenge.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or the port shown by Next.js.

Production checks:

```bash
npm run build
npm run lint
```

On Windows PowerShell, if script execution blocks `npm.ps1`, use:

```bash
npm.cmd run build
npm.cmd run lint
```

## What The App Demonstrates

- Next.js App Router pages and route handlers.
- TypeScript API response normalization.
- Public API integration without secrets.
- Basic input validation for usernames, coin watchlists, and locations.
- Dependency-free autocomplete backed by public search/geocoding endpoints.
- Safe error handling for not-found, rate-limit, empty, and network states.
- Responsive Tailwind CSS dashboard components.
- Developer-focused request/response preview panels.

## AI-Assisted Development

AI assistance was used to inspect the starter project, plan the product
expansion, confirm public API endpoint shapes, organize reusable components,
write typed integration helpers, and iterate on build/lint issues. The
implementation stayed within the challenge constraints: public APIs only, no
auth, no paid keys, no secrets, and no unnecessary dependencies.

## What I Would Improve Next

- Add small charts for crypto movement and weather trends.
- Cache successful API responses briefly to reduce rate-limit risk.
- Add automated tests for API route validation and insight calculations.
- Add comparison views, such as GitHub user vs user or city vs city.
