import Link from "next/link";
import { ApiPreview } from "@/components/ApiPreview";
import { PageHeader } from "@/components/PageHeader";
import { StateMessage } from "@/components/StateMessage";
import type { ForecastDay, WeatherPulse } from "@/lib/weather";
import { getWeatherPulse, WEATHER_PRESETS } from "@/lib/weather";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    city?: string | string[];
  }>;
};

export default async function WeatherPulsePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const city = getFirstParam(params.city);
  const result = await getWeatherPulse(city);

  return (
    <>
      <PageHeader
        badges={["Open-Meteo", "Public API", "No API Key", "Server Route"]}
        description="Switch between preset cities and inspect current temperature, wind speed, WMO condition summaries, forecast preview, and raw Open-Meteo response data."
        eyebrow="Weather Pulse"
        title="A city weather dashboard powered by Open-Meteo."
      />

      <CityPresetNav selectedCity={result.ok ? result.pulse.location.city : city} />

      {result.ok ? (
        <>
          <WeatherSummary pulse={result.pulse} />
          <ForecastPreview forecast={result.pulse.forecast} />
          <ApiPreview preview={result.apiPreview} />
        </>
      ) : (
        <>
          <StateMessage
            message={result.error.message}
            tone={result.error.type === "empty" ? "empty" : "api-error"}
            title={result.error.title}
          />
          <ApiPreview preview={result.apiPreview} />
        </>
      )}
    </>
  );
}

function CityPresetNav({ selectedCity }: { selectedCity?: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Preset cities
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Open-Meteo forecast data, no API key required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEATHER_PRESETS.map((preset) => {
            const isActive =
              selectedCity?.toLowerCase() === preset.city.toLowerCase();

            return (
              <Link
                className={
                  isActive
                    ? "rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100"
                    : "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
                }
                href={`/weather?city=${encodeURIComponent(preset.city)}`}
                key={preset.city}
              >
                {preset.city}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WeatherSummary({ pulse }: { pulse: WeatherPulse }) {
  const cards = [
    {
      label: "Current temperature",
      value:
        pulse.current.temperature === null
          ? "N/A"
          : `${Math.round(pulse.current.temperature)} C`,
      detail: `${pulse.location.city}, ${pulse.location.country}`,
      accent: "border-emerald-300/60",
    },
    {
      label: "Wind speed",
      value:
        pulse.current.windSpeed === null
          ? "N/A"
          : `${Math.round(pulse.current.windSpeed)} km/h`,
      detail: "10m wind speed",
      accent: "border-cyan-300/60",
    },
    {
      label: "Condition",
      value: pulse.current.condition,
      detail:
        pulse.current.weatherCode === null
          ? "No weather code"
          : `WMO code ${pulse.current.weatherCode}`,
      accent: "border-amber-300/60",
    },
    {
      label: "Observed",
      value: pulse.current.observedAt
        ? formatTime(pulse.current.observedAt)
        : "N/A",
      detail: pulse.current.observedAt
        ? formatDate(pulse.current.observedAt)
        : "No timestamp",
      accent: "border-fuchsia-300/60",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          className={`rounded-lg border border-white/10 border-t-2 ${card.accent} bg-white/[0.045] p-4`}
          key={card.label}
        >
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            {card.label}
          </p>
          <h2 className="mt-3 min-h-8 break-words text-xl font-semibold leading-tight text-white">
            {card.value}
          </h2>
          <p className="mt-3 text-sm leading-5 text-zinc-400">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}

function ForecastPreview({ forecast }: { forecast: ForecastDay[] }) {
  if (forecast.length === 0) {
    return (
      <StateMessage
        message="Open-Meteo returned current conditions, but no daily forecast preview."
        tone="empty"
        title="No forecast returned"
      />
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Forecast preview
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Next {forecast.length} days
          </h2>
        </div>
        <p className="text-sm text-zinc-500">Daily high, low, and condition</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {forecast.map((day) => (
          <article
            className="rounded-lg border border-white/10 bg-zinc-950/40 p-4"
            key={day.date}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              {formatShortDate(day.date)}
            </p>
            <h3 className="mt-3 text-base font-semibold text-white">
              {day.condition}
            </h3>
            <p className="mt-4 text-sm text-zinc-400">
              High{" "}
              <span className="font-medium text-white">
                {formatTemperature(day.maxTemperature)}
              </span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Low{" "}
              <span className="font-medium text-white">
                {formatTemperature(day.minTemperature)}
              </span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatTemperature(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value)} C`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(value));
}
