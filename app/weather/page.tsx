import Link from "next/link";
import { ApiPreview } from "@/components/ApiPreview";
import { AutocompleteSearchForm } from "@/components/AutocompleteSearchForm";
import { PageHeader } from "@/components/PageHeader";
import { StateMessage } from "@/components/StateMessage";
import { WeatherLocalTime } from "@/components/WeatherLocalTime";
import type { ForecastDay, WeatherPulse } from "@/lib/weather";
import {
  formatWeatherLocation,
  getWeatherPulse,
  WEATHER_PRESETS,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    city?: string | string[];
    location?: string | string[];
  }>;
};

export default async function WeatherPulsePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const location = getFirstParam(params.location) ?? getFirstParam(params.city);
  const result = await getWeatherPulse(location);
  const searchValue = result.ok
    ? formatWeatherLocation(result.pulse.location)
    : getWeatherSearchValue(location);

  return (
    <>
      <PageHeader
        action={
          <AutocompleteSearchForm
            actionPath="/weather"
            buttonLabel="Check weather"
            helperText="Search a city or choose one of the preset locations below."
            initialValue={searchValue}
            key={searchValue}
            label="Weather location"
            paramName="location"
            pendingLabel="Checking"
            placeholder="Manila, Tokyo, London"
            suggestionsEndpoint="/api/weather/search"
            tone="sky"
          />
        }
        badges={["Open-Meteo", "Public API", "No API Key", "Server Route"]}
        description="Search locations, switch between presets, and inspect current temperature, wind speed, WMO condition summaries, forecast preview, and raw Open-Meteo response data."
        eyebrow="Weather Pulse"
        tone="sky"
        title="A searchable weather dashboard powered by Open-Meteo."
      />

      <CityPresetNav selectedCity={result.ok ? result.pulse.location.city : location} />

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
            tone={getWeatherErrorTone(result.error.type)}
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
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
                    ? "rounded-lg border border-sky-300/40 bg-sky-300/10 px-3 py-2 text-sm font-semibold text-sky-100"
                    : "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
                }
                href={`/weather?location=${encodeURIComponent(preset.city)}`}
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
      accent: "border-sky-300/60",
    },
    {
      label: "Wind speed",
      value:
        pulse.current.windSpeed === null
          ? "N/A"
          : `${Math.round(pulse.current.windSpeed)} km/h`,
      detail: "10m wind speed",
      accent: "border-blue-300/60",
    },
    {
      label: "Condition",
      value: pulse.current.condition,
      detail:
        pulse.current.weatherCode === null
          ? "No weather code"
          : `WMO code ${pulse.current.weatherCode}`,
      accent: "border-cyan-300/60",
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
      <article className="rounded-lg border border-white/10 border-t-2 border-sky-200/60 bg-white/[0.045] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Local time
        </p>
        <h2 className="mt-3 min-h-8 break-words text-xl font-semibold leading-tight text-white">
          <WeatherLocalTime
            fallbackIso={pulse.current.observedAt}
            timeZone={pulse.timeZone}
          />
        </h2>
        <p className="mt-3 text-sm leading-5 text-zinc-400">
          Updates the minute live for {pulse.location.city}
        </p>
      </article>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(value));
}

function getWeatherSearchValue(value?: string) {
  if (!value || value.startsWith("geo|")) {
    return "Manila";
  }

  return value;
}

function getWeatherErrorTone(errorType: string) {
  if (errorType === "not-found") {
    return "not-found";
  }

  if (errorType === "network-error") {
    return "network-error";
  }

  if (errorType === "empty") {
    return "empty";
  }

  return "api-error";
}
