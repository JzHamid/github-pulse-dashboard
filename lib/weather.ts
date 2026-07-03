import type { ApiPreview } from "@/lib/api-preview";

const OPEN_METEO_API_BASE = "https://api.open-meteo.com/v1";

export const WEATHER_PRESETS = [
  { city: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842 },
  { city: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
  { city: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { city: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
] as const;

type WeatherPreset = (typeof WEATHER_PRESETS)[number];

type RawWeatherResponse = {
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

export type ForecastDay = {
  date: string;
  condition: string;
  maxTemperature: number | null;
  minTemperature: number | null;
};

export type WeatherPulse = {
  location: WeatherPreset;
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
  type: "invalid-city" | "api-error" | "network-error" | "empty";
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
  cityInput?: string | null,
): Promise<WeatherPulseResult> {
  const location = getWeatherPreset(cityInput);

  if (!location) {
    const error: WeatherError = {
      type: "invalid-city",
      title: "City preset not supported",
      message:
        "Choose one of the available preset cities: Manila, Singapore, Sydney, Tokyo, or New York.",
    };

    return {
      ok: false,
      error,
      apiPreview: createWeatherErrorPreview("N/A", null, error),
    };
  }

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
          "Open-Meteo returned an unexpected response. Try another city or refresh the page.",
      };

      return {
        ok: false,
        error,
        apiPreview: createWeatherErrorPreview(url, response.status, error),
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
        apiPreview: createWeatherErrorPreview(url, response.status, error),
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
      apiPreview: createWeatherErrorPreview(url, null, error),
    };
  }
}

export function getWeatherPreset(cityInput?: string | null) {
  const requestedCity = cityInput?.trim() || WEATHER_PRESETS[0].city;

  return WEATHER_PRESETS.find(
    (preset) => preset.city.toLowerCase() === requestedCity.toLowerCase(),
  );
}

function normalizeWeather(
  response: RawWeatherResponse,
  location: WeatherPreset,
): WeatherPulse {
  const currentCode = response.current?.weather_code ?? null;

  return {
    location,
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

function createWeatherPreview(
  url: string,
  status: number,
  pulse: WeatherPulse,
  rawResponse: RawWeatherResponse,
): ApiPreview {
  return {
    title: "Open-Meteo weather response",
    sourceLabel: "Open-Meteo Public API",
    requests: [
      {
        label: "Forecast",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      location: {
        city: pulse.location.city,
        country: pulse.location.country,
        latitude: pulse.location.latitude,
        longitude: pulse.location.longitude,
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
): ApiPreview {
  return {
    title: "Open-Meteo error response",
    sourceLabel: "Open-Meteo Public API",
    requests: [
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
