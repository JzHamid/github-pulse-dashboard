import type { ApiPreview } from "@/lib/api-preview";

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const DEFAULT_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
];
const MAX_SELECTED_COINS = 8;

export const POPULAR_CRYPTO_OPTIONS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "the-open-network", symbol: "TON", name: "Toncoin" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
] as const;

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

type RawCoinSearchResult = {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number | null;
};

type RawCoinSearchResponse = {
  coins?: RawCoinSearchResult[];
};

type ApiRequest = ApiPreview["requests"][number];

type CoinSelection =
  | {
      ok: true;
      ids: string[];
      requests: ApiRequest[];
      unresolved: string[];
      userInput: string | null;
    }
  | {
      ok: false;
      error: CryptoError;
      requests: ApiRequest[];
    };

export type CryptoSuggestion = {
  label: string;
  value: string;
  detail: string;
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
  unresolved: string[];
};

export type CryptoError = {
  type: "invalid-input" | "rate-limit" | "api-error" | "network-error" | "empty";
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

export async function getCryptoPulse(
  coinInput?: string | null,
): Promise<CryptoPulseResult> {
  const selection = await resolveCoinSelection(coinInput);

  if (!selection.ok) {
    return {
      ok: false,
      error: selection.error,
      apiPreview: createCryptoErrorPreview("N/A", null, selection.error, selection.requests),
    };
  }

  const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${selection.ids.join(
    ",",
  )}&order=market_cap_desc&per_page=${selection.ids.length}&page=1&sparkline=false&price_change_percentage=24h`;

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
        apiPreview: createCryptoErrorPreview(
          url,
          response.status,
          error,
          selection.requests,
        ),
      };
    }

    if (!Array.isArray(body) || body.length === 0) {
      const error: CryptoError = {
        type: "empty",
        title: "No market data returned",
        message:
          "CoinGecko returned an empty response for the selected assets. Try another coin search.",
      };

      return {
        ok: false,
        error,
        apiPreview: createCryptoErrorPreview(
          url,
          response.status,
          error,
          selection.requests,
        ),
      };
    }

    const assets = body.map((asset) => normalizeAsset(asset as RawCoinMarket));
    const insights = createCryptoInsights(assets, selection.unresolved);

    return {
      ok: true,
      insights,
      apiPreview: createCryptoPreview(
        url,
        response.status,
        insights,
        body as RawCoinMarket[],
        selection,
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
      apiPreview: createCryptoErrorPreview(url, null, error, selection.requests),
    };
  }
}

export async function searchCryptoAssets(
  queryInput?: string | null,
): Promise<CryptoSuggestion[]> {
  const query = cleanCoinToken(queryInput ?? "");
  const localMatches = getLocalCoinMatches(query);

  if (query.length < 2) {
    return localMatches.slice(0, 8);
  }

  const remoteMatches = await fetchCoinSearch(query);

  return dedupeSuggestions([...localMatches, ...remoteMatches]).slice(0, 8);
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

function createCryptoInsights(
  assets: CryptoAsset[],
  unresolved: string[],
): CryptoInsights {
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
    unresolved,
  };
}

async function resolveCoinSelection(
  coinInput?: string | null,
): Promise<CoinSelection> {
  const parsed = parseCoinInput(coinInput);

  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      requests: [],
    };
  }

  if (parsed.tokens.length === 0) {
    return {
      ok: true,
      ids: DEFAULT_COIN_IDS,
      requests: [],
      unresolved: [],
      userInput: null,
    };
  }

  const ids: string[] = [];
  const unresolved: string[] = [];
  const requests: ApiRequest[] = [];

  for (const token of parsed.tokens) {
    const localMatch = matchLocalCoin(token);

    if (localMatch) {
      ids.push(localMatch.id);
      continue;
    }

    const searchUrl = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(
      token,
    )}`;
    const searchResult = await fetchCoinSearchWithRequest(token, searchUrl);
    requests.push(searchResult.request);

    const bestMatch = chooseBestSearchMatch(token, searchResult.suggestions);

    if (bestMatch) {
      ids.push(bestMatch.value);
    } else {
      unresolved.push(token);
    }
  }

  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return {
      ok: false,
      error: {
        type: "empty",
        title: "No matching coins found",
        message:
          "Try a CoinGecko coin name, symbol, or id such as bitcoin, eth, dogecoin, or solana.",
      },
      requests,
    };
  }

  return {
    ok: true,
    ids: uniqueIds,
    requests,
    unresolved,
    userInput: parsed.tokens.join(", "),
  };
}

function parseCoinInput(coinInput?: string | null) {
  const trimmed = coinInput?.trim() ?? "";

  if (!trimmed) {
    return { ok: true as const, tokens: [] };
  }

  if (trimmed.length > 160) {
    return {
      ok: false as const,
      error: {
        type: "invalid-input" as const,
        title: "Coin search is too long",
        message: "Search up to eight coins using short names, symbols, or ids.",
      },
    };
  }

  const tokens = trimmed
    .split(",")
    .map(cleanCoinToken)
    .filter(Boolean);

  if (tokens.length > MAX_SELECTED_COINS) {
    return {
      ok: false as const,
      error: {
        type: "invalid-input" as const,
        title: "Too many coins selected",
        message: `Track up to ${MAX_SELECTED_COINS} coins at once so the dashboard stays readable.`,
      },
    };
  }

  const invalidToken = tokens.find((token) => !/^[a-z0-9 .+-]+$/i.test(token));

  if (invalidToken) {
    return {
      ok: false as const,
      error: {
        type: "invalid-input" as const,
        title: "Coin search has unsupported characters",
        message:
          "Use coin names, symbols, or CoinGecko ids with letters, numbers, spaces, dots, plus signs, or hyphens.",
      },
    };
  }

  return { ok: true as const, tokens };
}

function cleanCoinToken(token: string) {
  return token.trim().replace(/^\$+/, "").replace(/\s+/g, " ");
}

function matchLocalCoin(token: string) {
  const normalized = token.toLowerCase();

  return POPULAR_CRYPTO_OPTIONS.find(
    (option) =>
      option.id.toLowerCase() === normalized ||
      option.symbol.toLowerCase() === normalized ||
      option.name.toLowerCase() === normalized,
  );
}

function getLocalCoinMatches(query: string): CryptoSuggestion[] {
  const normalized = query.toLowerCase();
  const matches = POPULAR_CRYPTO_OPTIONS.filter((option) => {
    if (!normalized) {
      return true;
    }

    return (
      option.id.toLowerCase().includes(normalized) ||
      option.symbol.toLowerCase().includes(normalized) ||
      option.name.toLowerCase().includes(normalized)
    );
  });

  return matches.map((option) => ({
    label: `${option.name} (${option.symbol})`,
    value: option.id,
    detail: `CoinGecko id: ${option.id}`,
  }));
}

async function fetchCoinSearch(query: string): Promise<CryptoSuggestion[]> {
  const url = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`;
  const result = await fetchCoinSearchWithRequest(query, url);

  return result.suggestions;
}

async function fetchCoinSearchWithRequest(query: string, url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as
      | RawCoinSearchResponse
      | null;
    const suggestions = Array.isArray(body?.coins)
      ? body.coins.map(toCryptoSuggestion)
      : [];

    return {
      request: {
        label: `Search ${query}`,
        method: "GET" as const,
        url,
        status: response.status,
      },
      suggestions,
    };
  } catch {
    return {
      request: {
        label: `Search ${query}`,
        method: "GET" as const,
        url,
        status: null,
      },
      suggestions: [],
    };
  }
}

function toCryptoSuggestion(coin: RawCoinSearchResult): CryptoSuggestion {
  return {
    label: `${coin.name} (${coin.symbol.toUpperCase()})`,
    value: coin.id,
    detail: coin.market_cap_rank
      ? `CoinGecko id: ${coin.id} | Rank #${coin.market_cap_rank}`
      : `CoinGecko id: ${coin.id}`,
  };
}

function chooseBestSearchMatch(
  token: string,
  suggestions: CryptoSuggestion[],
) {
  const normalized = token.toLowerCase();

  return (
    suggestions.find((suggestion) => suggestion.value.toLowerCase() === normalized) ??
    suggestions.find((suggestion) =>
      suggestion.label.toLowerCase().includes(`(${normalized})`),
    ) ??
    suggestions.find((suggestion) =>
      suggestion.label.toLowerCase().startsWith(normalized),
    ) ??
    suggestions[0] ??
    null
  );
}

function dedupeSuggestions(suggestions: CryptoSuggestion[]) {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.value)) {
      return false;
    }

    seen.add(suggestion.value);
    return true;
  });
}

function createCryptoPreview(
  url: string,
  status: number,
  insights: CryptoInsights,
  rawAssets: RawCoinMarket[],
  selection: Extract<CoinSelection, { ok: true }>,
): ApiPreview {
  return {
    title: "CoinGecko market response",
    sourceLabel: "CoinGecko Public API",
    requests: [
      ...selection.requests,
      {
        label: "Market data",
        method: "GET",
        url,
        status,
      },
    ],
    response: {
      query: {
        input: selection.userInput ?? "default watchlist",
        selectedIds: selection.ids,
        unresolved: insights.unresolved,
      },
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
  requests: ApiRequest[] = [],
): ApiPreview {
  return {
    title: "CoinGecko error response",
    sourceLabel: "CoinGecko Public API",
    requests: [
      ...requests,
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
