import { ApiPreview } from "@/components/ApiPreview";
import { PageHeader } from "@/components/PageHeader";
import { StateMessage } from "@/components/StateMessage";
import type { CryptoAsset, CryptoInsights } from "@/lib/crypto";
import { getCryptoPulse } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function CryptoPulsePage() {
  const result = await getCryptoPulse();

  return (
    <>
      <PageHeader
        badges={["CoinGecko", "Public API", "No API Key", "Server Route"]}
        description="Track a small market watchlist for BTC, ETH, SOL, BNB, and XRP with live USD prices, 24h movement, market cap, volume, and raw API output."
        eyebrow="Crypto Pulse"
        tone="amber"
        title="A market-data dashboard powered by public crypto prices."
      />

      <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
        Market data is shown for API demonstration only, not financial advice.
      </p>

      {result.ok ? (
        <>
          <CryptoSummary insights={result.insights} />
          <CryptoPriceCards assets={result.insights.assets} />
          <CryptoMarketTable assets={result.insights.assets} />
          <ApiPreview preview={result.apiPreview} />
        </>
      ) : (
        <>
          <StateMessage
            message={result.error.message}
            tone={result.error.type === "empty" ? "empty" : result.error.type}
            title={result.error.title}
          />
          <ApiPreview preview={result.apiPreview} />
        </>
      )}
    </>
  );
}

function CryptoPriceCards({ assets }: { assets: CryptoAsset[] }) {
  if (assets.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {assets.map((asset) => (
        <article
          className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
          key={asset.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                {asset.name}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {asset.symbol}
              </h2>
            </div>
            <span
              className={
                (asset.change24h ?? 0) >= 0
                  ? "rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs font-medium text-amber-100"
                  : "rounded-md border border-rose-300/25 bg-rose-300/10 px-2 py-1 text-xs font-medium text-rose-100"
              }
            >
              {formatPercent(asset.change24h)}
            </span>
          </div>
          <p className="mt-5 text-2xl font-semibold text-white">
            {formatUsd(asset.priceUsd)}
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
              <dt className="text-zinc-500">Market cap</dt>
              <dd className="text-zinc-300">{formatCompactUsd(asset.marketCap)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
              <dt className="text-zinc-500">24h volume</dt>
              <dd className="text-zinc-300">{formatCompactUsd(asset.volume24h)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </section>
  );
}

function CryptoSummary({ insights }: { insights: CryptoInsights }) {
  const cards = [
    {
      label: "Tracked assets",
      value: String(insights.assets.length),
      detail: "BTC, ETH, SOL, BNB, XRP",
      accent: "border-amber-300/60",
    },
    {
      label: "Top mover",
      value: insights.topMover?.symbol ?? "N/A",
      detail: insights.topMover
        ? formatPercent(insights.topMover.change24h)
        : "No movement data",
      accent: "border-yellow-300/60",
    },
    {
      label: "Combined market cap",
      value: formatCompactUsd(insights.totalMarketCap),
      detail: "Across displayed assets",
      accent: "border-orange-300/60",
    },
    {
      label: "24h volume",
      value: formatCompactUsd(insights.totalVolume24h),
      detail: "Across displayed assets",
      accent: "border-amber-200/60",
    },
    {
      label: "Last updated",
      value: insights.lastUpdated ? formatTime(insights.lastUpdated) : "N/A",
      detail: insights.lastUpdated ? formatDate(insights.lastUpdated) : "No timestamp",
      accent: "border-yellow-200/60",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

function CryptoMarketTable({ assets }: { assets: CryptoAsset[] }) {
  if (assets.length === 0) {
    return (
      <StateMessage
        message="CoinGecko returned an empty market list for the configured watchlist."
        tone="empty"
        title="No crypto assets returned"
      />
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            Price cards
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Market table
          </h2>
        </div>
        <p className="text-sm text-zinc-500">USD prices from CoinGecko</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h change</th>
              <th className="px-4 py-3 font-medium">Market cap</th>
              <th className="px-4 py-3 font-medium">24h volume</th>
              <th className="py-3 pl-4 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {assets.map((asset) => (
              <tr className="align-top text-zinc-300" key={asset.id}>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-sm font-semibold text-amber-100">
                      {asset.symbol}
                    </span>
                    <div>
                      <p className="font-medium text-white">{asset.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Rank #{asset.marketCapRank ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-white">
                  {formatUsd(asset.priceUsd)}
                </td>
                <td
                  className={
                    (asset.change24h ?? 0) >= 0
                      ? "px-4 py-4 font-medium text-amber-200"
                      : "px-4 py-4 font-medium text-rose-200"
                  }
                >
                  {formatPercent(asset.change24h)}
                </td>
                <td className="px-4 py-4">{formatCompactUsd(asset.marketCap)}</td>
                <td className="px-4 py-4">{formatCompactUsd(asset.volume24h)}</td>
                <td className="py-4 pl-4 text-zinc-400">
                  {asset.lastUpdated ? formatTime(asset.lastUpdated) : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatUsd(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
    style: "currency",
  }).format(value);
}

function formatCompactUsd(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
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
