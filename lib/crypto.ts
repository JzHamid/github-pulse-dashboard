import type { ApiPreview } from "@/lib/api-preview";

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const TRACKED_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
];

type RawCoinMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string | null;
};

export type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  volume24h: number | null;
  change24h: number | null;
  lastUpdated: string | null;
};

export type CryptoInsights = {
  assets: CryptoAsset[];
  topMover: CryptoAsset | null;
  lastUpdated: string | null;
  totalMarketCap: number;
  totalVolume24h: number;
};

export type CryptoError = {
  type: "rate-limit" | "api-error" | "network-error" | "empty";
  title: string;
  message: string;
};

export type CryptoPulseResult =
  | {
      ok: true;
      insights: CryptoInsights;
      apiPreview: ApiPreview;
    }
  | {
      ok: false;
      error: CryptoError;
      apiPreview: ApiPreview;
    };

export async function getCryptoPulse(): Promise<CryptoPulseResult> {
  const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${TRACKED_COIN_IDS.join(
    ",",
  )}&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const error = createCryptoError(response.status, getApiMessage(body));

      return {
        ok: false,
        error,
        apiPreview: createCryptoErrorPreview(url, response.status, error),
      };
    }

    if (!Array.isArray(body) || body.length === 0) {
      const error: CryptoError = {
        type: "empty",
        title: "No market data returned",
        message:
          "CoinGecko returned an empty response for the tracked assets. Try refreshing the page.",
      };

      return {
        ok: false,
        error,
        apiPreview: createCryptoErrorPreview(url, response.status, error),
      };
    }

    const assets = body.map((asset) =>
      normalizeAsset(asset as RawCoinMarket),
    );
    const insights = createCryptoInsights(assets);

    return {
      ok: true,
      insights,
      apiPreview: createCryptoPreview(
        url,
        response.status,
        insights,
        body as RawCoinMarket[],
      ),
    };
  } catch {
    const error: CryptoError = {
      type: "network-error",
      title: "CoinGecko could not be reached",
      message:
        "The dashboard could not connect to the public CoinGecko API. Check your connection and try again.",
    };

    return {
      ok: false,
      error,
      apiPreview: createCryptoErrorPreview(url, null, error),
    };
  }
}

function normalizeAsset(asset: RawCoinMarket): CryptoAsset {
  return {
    id: asset.id,
    symbol: asset.symbol.toUpperCase(),
    name: asset.name,
    priceUsd: asset.current_price,
    marketCap: asset.market_cap,
    marketCapRank: asset.market_cap_rank,
    volume24h: asset.total_volume,
    change24h: asset.price_change_percentage_24h,
    lastUpdated: asset.last_updated,
  };
}

function createCryptoInsights(assets: CryptoAsset[]): CryptoInsights {
  const topMover = [...assets].sort(
    (a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0),
  )[0];

  return {
    assets,
    topMover: topMover ?? null,
    lastUpdated:
      assets
        .map((asset) => asset.lastUpdated)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ??
      null,
    totalMarketCap: assets.reduce(
      (sum, asset) => sum + (asset.marketCap ?? 0),
      0,
    ),
    totalVolume24h: assets.reduce(
      (sum, asset) => sum + (asset.volume24h ?? 0),
      0,
    ),
  };
}

function createCryptoPreview(
  url: string,
  status: number,
  insights: CryptoInsights,
  rawAssets: RawCoinMarket[],
): ApiPreview {
  return {
    title: "CoinGecko market response",
    sourceLabel: "CoinGecko Public API",
    requests: [
      {
        label: "Market data",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      assets: insights.assets.map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        priceUsd: asset.priceUsd,
        change24h: asset.change24h,
        marketCap: asset.marketCap,
        volume24h: asset.volume24h,
        lastUpdated: asset.lastUpdated,
      })),
      summary: {
        topMover: insights.topMover?.symbol ?? null,
        lastUpdated: insights.lastUpdated,
        totalMarketCap: insights.totalMarketCap,
        totalVolume24h: insights.totalVolume24h,
      },
      rawResponsePreview: rawAssets.slice(0, 5),
    },
  };
}

function createCryptoErrorPreview(
  url: string,
  status: number | null,
  error: CryptoError,
): ApiPreview {
  return {
    title: "CoinGecko error response",
    sourceLabel: "CoinGecko Public API",
    requests: [
      {
        label: "Market data",
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

function createCryptoError(status: number, message: string): CryptoError {
  if (status === 429) {
    return {
      type: "rate-limit",
      title: "CoinGecko rate limit reached",
      message:
        "CoinGecko is limiting public API requests right now. Wait a moment, then refresh the dashboard.",
    };
  }

  return {
    type: "api-error",
    title: "CoinGecko API request failed",
    message:
      message ||
      "CoinGecko returned an unexpected response. Refresh the page to try again.",
  };
}

function getApiMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return "";
}
