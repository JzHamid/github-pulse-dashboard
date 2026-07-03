"use client";

import { useEffect, useState } from "react";

type WeatherLocalTimeProps = {
  fallbackIso?: string | null;
  timeZone?: string | null;
};

export function WeatherLocalTime({
  fallbackIso,
  timeZone,
}: WeatherLocalTimeProps) {
  const [now, setNow] = useState<Date | null>(null);
  const fallbackDate = fallbackIso ? new Date(fallbackIso) : null;
  const displayDate = now ?? fallbackDate;

  useEffect(() => {
    function tick() {
      setNow(new Date());
    }

    tick();
    const timer = window.setInterval(tick, 15_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!displayDate) {
    return <span>N/A</span>;
  }

  return (
    <time dateTime={displayDate.toISOString()}>
      {new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timeZone ?? undefined,
      }).format(displayDate)}
    </time>
  );
}
