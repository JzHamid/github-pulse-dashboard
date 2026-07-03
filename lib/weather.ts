import type { ApiPreview } from "@/lib/api-preview";

const OPEN_METEO_API_BASE = "https://api.open-meteo.com/v1";
const OPEN_METEO_GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";

export const WEATHER_PRESETS = [
  { city: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842 },
  { city: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
  { city: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { city: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
] as const satisfies WeatherLocation[];

type RawWeatherResponse = {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

type RawGeocodingLocation = {
  name?: string;
  country?: string;
  admin1?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};

type RawGeocodingResponse = {
  results?: RawGeocodingLocation[];
};

type ApiRequest = ApiPreview["requests"][number];

type LocationResolution =
  | {
      ok: true;
      location: WeatherLocation;
      requests: ApiRequest[];
      input: string | null;
    }
  | {
      ok: false;
      error: WeatherError;
      requests: ApiRequest[];
    };

export type WeatherLocation = {
  city: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timeZone?: string;
};

export type WeatherSuggestion = {
  label: string;
  value: string;
  detail: string;
  submitValue: string;
};

export type ForecastDay = {
  date: string;
  condition: string;
  maxTemperature: number | null;
  minTemperature: number | null;
};

export type WeatherPulse = {
  location: WeatherLocation;
  timeZone: string | null;
  current: {
    temperature: number | null;
    windSpeed: number | null;
    weatherCode: number | null;
    condition: string;
    observedAt: string | null;
  };
  forecast: ForecastDay[];
};

export type WeatherError = {
  type: "invalid-location" | "not-found" | "api-error" | "network-error" | "empty";
  title: string;
  message: string;
};

export type WeatherPulseResult =
  | {
      ok: true;
      pulse: WeatherPulse;
      apiPreview: ApiPreview;
    }
  | {
      ok: false;
      error: WeatherError;
      apiPreview: ApiPreview;
    };

export async function getWeatherPulse(
  locationInput?: string | null,
): Promise<WeatherPulseResult> {
  const resolution = await resolveWeatherLocation(locationInput);

  if (!resolution.ok) {
    return {
      ok: false,
      error: resolution.error,
      apiPreview: createWeatherErrorPreview("N/A", null, resolution.error, resolution.requests),
    };
  }

  const { location } = resolution;
  const url = `${OPEN_METEO_API_BASE}/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const error: WeatherError = {
        type: "api-error",
        title: "Open-Meteo API request failed",
        message:
          getApiMessage(body) ||
          "Open-Meteo returned an unexpected response. Try another location or refresh the page.",
      };

      return {
        ok: false,
        error,
        apiPreview: createWeatherErrorPreview(
          url,
          response.status,
          error,
          resolution.requests,
        ),
      };
    }

    const weather = normalizeWeather(body as RawWeatherResponse, location);

    if (!weather.current.observedAt && weather.forecast.length === 0) {
      const error: WeatherError = {
        type: "empty",
        title: "No weather data returned",
        message:
          "Open-Meteo returned an empty response for this location. Try another city.",
      };

      return {
        ok: false,
        error,
        apiPreview: createWeatherErrorPreview(
          url,
          response.status,
          error,
          resolution.requests,
        ),
      };
    }

    return {
      ok: true,
      pulse: weather,
      apiPreview: createWeatherPreview(
        url,
        response.status,
        weather,
        body as RawWeatherResponse,
        resolution,
      ),
    };
  } catch {
    const error: WeatherError = {
      type: "network-error",
      title: "Open-Meteo could not be reached",
      message:
        "The dashboard could not connect to the public Open-Meteo API. Check your connection and try again.",
    };

    return {
      ok: false,
      error,
      apiPreview: createWeatherErrorPreview(url, null, error, resolution.requests),
    };
  }
}

export async function searchWeatherLocations(
  queryInput?: string | null,
): Promise<WeatherSuggestion[]> {
  const query = cleanLocationInput(queryInput ?? "");
  const presetMatches = getPresetSuggestions(query);

  if (query.length < 2) {
    return presetMatches.slice(0, 8);
  }

  const remoteMatches = await fetchLocationSuggestions(query);

  return dedupeWeatherSuggestions([...presetMatches, ...remoteMatches]).slice(0, 8);
}

export function getWeatherPreset(cityInput?: string | null) {
  const requestedCity = cityInput?.trim() || WEATHER_PRESETS[0].city;

  return WEATHER_PRESETS.find(
    (preset) => preset.city.toLowerCase() === requestedCity.toLowerCase(),
  );
}

export function createWeatherSubmitValue(location: WeatherLocation) {
  return [
    "geo",
    String(location.latitude),
    String(location.longitude),
    encodeURIComponent(location.city),
    encodeURIComponent(location.country),
    encodeURIComponent(location.admin1 ?? ""),
  ].join("|");
}

export function formatWeatherLocation(location: WeatherLocation) {
  return [location.city, location.admin1, location.country].filter(Boolean).join(", ");
}

async function resolveWeatherLocation(
  locationInput?: string | null,
): Promise<LocationResolution> {
  const parsedGeo = parseSubmittedGeoLocation(locationInput);

  if (parsedGeo) {
    return {
      ok: true,
      location: parsedGeo,
      requests: [],
      input: formatWeatherLocation(parsedGeo),
    };
  }

  const input = cleanLocationInput(locationInput ?? "");
  const preset = getWeatherPreset(input);

  if (!input || preset) {
    const location = preset ?? WEATHER_PRESETS[0];

    return {
      ok: true,
      location,
      requests: [],
      input: input || null,
    };
  }

  const validationError = validateLocationInput(input);

  if (validationError) {
    return {
      ok: false,
      error: validationError,
      requests: [],
    };
  }

  const searchUrl = createGeocodingUrl(input, 1);
  const search = await fetchLocationSearch(searchUrl, `Search ${input}`);
  const location = search.locations[0];

  if (!location) {
    return {
      ok: false,
      error: {
        type: "not-found",
        title: "Location not found",
        message:
          "Open-Meteo could not find that location. Try a city name like Manila, Tokyo, London, or New York.",
      },
      requests: [search.request],
    };
  }

  return {
    ok: true,
    location,
    requests: [search.request],
    input,
  };
}

function normalizeWeather(
  response: RawWeatherResponse,
  location: WeatherLocation,
): WeatherPulse {
  const currentCode = response.current?.weather_code ?? null;

  return {
    location,
    timeZone: response.timezone ?? location.timeZone ?? null,
    current: {
      temperature: response.current?.temperature_2m ?? null,
      windSpeed: response.current?.wind_speed_10m ?? null,
      weatherCode: currentCode,
      condition: getWeatherCondition(currentCode),
      observedAt: response.current?.time ?? null,
    },
    forecast: normalizeForecast(response.daily),
  };
}

function normalizeForecast(daily: RawWeatherResponse["daily"]): ForecastDay[] {
  if (!daily?.time) {
    return [];
  }

  return daily.time.slice(0, 5).map((date, index) => {
    const code = daily.weather_code?.[index] ?? null;

    return {
      date,
      condition: getWeatherCondition(code),
      maxTemperature: daily.temperature_2m_max?.[index] ?? null,
      minTemperature: daily.temperature_2m_min?.[index] ?? null,
    };
  });
}

function parseSubmittedGeoLocation(input?: string | null): WeatherLocation | null {
  if (!input?.startsWith("geo|")) {
    return null;
  }

  const [, latitude, longitude, city, country, admin1] = input.split("|");
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    !city ||
    !country
  ) {
    return null;
  }

  return {
    city: decodeURIComponent(city),
    country: decodeURIComponent(country),
    admin1: admin1 ? decodeURIComponent(admin1) : undefined,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  };
}

function cleanLocationInput(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateLocationInput(input: string): WeatherError | null {
  if (input.length > 90) {
    return {
      type: "invalid-location",
      title: "Location search is too long",
      message: "Use a city or location name under 90 characters.",
    };
  }

  if (/[<>]/.test(input)) {
    return {
      type: "invalid-location",
      title: "Location search has unsupported characters",
      message: "Use a plain city or location name without angle brackets.",
    };
  }

  return null;
}

function getPresetSuggestions(query: string): WeatherSuggestion[] {
  const normalized = query.toLowerCase();

  return WEATHER_PRESETS.filter((preset) => {
    if (!normalized) {
      return true;
    }

    return (
      preset.city.toLowerCase().includes(normalized) ||
      preset.country.toLowerCase().includes(normalized)
    );
  }).map(toWeatherSuggestion);
}

async function fetchLocationSuggestions(query: string) {
  const search = await fetchLocationSearch(createGeocodingUrl(query, 8), `Search ${query}`);

  return search.locations.map(toWeatherSuggestion);
}

async function fetchLocationSearch(url: string, label: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as
      | RawGeocodingResponse
      | null;
    const locations = Array.isArray(body?.results)
      ? body.results
          .map(normalizeGeocodingLocation)
          .filter((location): location is WeatherLocation => Boolean(location))
      : [];

    return {
      request: {
        label,
        method: "GET" as const,
        url,
        status: response.status,
      },
      locations,
    };
  } catch {
    return {
      request: {
        label,
        method: "GET" as const,
        url,
        status: null,
      },
      locations: [],
    };
  }
}

function createGeocodingUrl(query: string, count: number) {
  return `${OPEN_METEO_GEOCODING_BASE}/search?name=${encodeURIComponent(
    query,
  )}&count=${count}&language=en&format=json`;
}

function normalizeGeocodingLocation(
  location: RawGeocodingLocation,
): WeatherLocation | null {
  if (
    !location.name ||
    !location.country ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return null;
  }

  return {
    city: location.name,
    country: location.country,
    admin1: location.admin1,
    latitude: location.latitude,
    longitude: location.longitude,
    timeZone: location.timezone,
  };
}

function toWeatherSuggestion(location: WeatherLocation): WeatherSuggestion {
  return {
    label: formatWeatherLocation(location),
    value: formatWeatherLocation(location),
    detail: `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`,
    submitValue: createWeatherSubmitValue(location),
  };
}

function dedupeWeatherSuggestions(suggestions: WeatherSuggestion[]) {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = suggestion.submitValue;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createWeatherPreview(
  url: string,
  status: number,
  pulse: WeatherPulse,
  rawResponse: RawWeatherResponse,
  resolution: Extract<LocationResolution, { ok: true }>,
): ApiPreview {
  return {
    title: "Open-Meteo weather response",
    sourceLabel: "Open-Meteo Public API",
    requests: [
      ...resolution.requests,
      {
        label: "Forecast",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      query: {
        input: resolution.input ?? "default preset",
        resolvedLocation: formatWeatherLocation(pulse.location),
      },
      location: {
        city: pulse.location.city,
        country: pulse.location.country,
        admin1: pulse.location.admin1 ?? null,
        latitude: pulse.location.latitude,
        longitude: pulse.location.longitude,
        timeZone: pulse.timeZone,
      },
      current: pulse.current,
      forecast: pulse.forecast,
      rawResponsePreview: rawResponse,
    },
  };
}

function createWeatherErrorPreview(
  url: string,
  status: number | null,
  error: WeatherError,
  requests: ApiRequest[] = [],
): ApiPreview {
  return {
    title: "Open-Meteo error response",
    sourceLabel: "Open-Meteo Public API",
    requests: [
      ...requests,
      {
        label: "Forecast",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      error,
    },
  };
}

function getWeatherCondition(code: number | null) {
  if (code === null) {
    return "Unknown";
  }

  if (code === 0) {
    return "Clear sky";
  }

  if ([1, 2, 3].includes(code)) {
    return "Partly cloudy";
  }

  if ([45, 48].includes(code)) {
    return "Fog";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "Drizzle";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Rain";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Snow";
  }

  if ([95, 96, 99].includes(code)) {
    return "Thunderstorm";
  }

  return "Mixed conditions";
}

function getApiMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "reason" in body &&
    typeof body.reason === "string"
  ) {
    return body.reason;
  }

  return "";
}
