"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { visitorTimeZone, zonedDateLabel, zonedTime, zonedZoneName } from "@/lib/visitor-time";

export function VisitorWhen({
  startsAt,
  endsAt,
  locale,
}: {
  startsAt: string;
  endsAt: string;
  locale: Locale;
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  useEffect(() => {
    setTimeZone(visitorTimeZone());
  }, []);
  const dateLocale = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB";
  if (!timeZone) return <p className="mt-6 h-16" />;
  return (
    <p className="mt-6 font-serif text-3xl">
      {zonedDateLabel(startsAt, dateLocale, timeZone)} · {zonedTime(startsAt, dateLocale, timeZone)}–
      {zonedTime(endsAt, dateLocale, timeZone)}
      <span className="mt-2 block font-sans text-sm text-ink/60">{zonedZoneName(dateLocale, timeZone)}</span>
    </p>
  );
}
