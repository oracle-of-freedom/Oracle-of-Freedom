"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/routing";
import { visitorTimeZone, zonedDateLabel, zonedTime, zonedZoneName } from "@/lib/visitor-time";

function subscribe() {
  return () => {};
}

export function VisitorWhen({
  startsAt,
  endsAt,
  locale,
  timeZone: bookedZone,
}: {
  startsAt: string;
  endsAt: string;
  locale: Locale;
  timeZone?: string;
}) {
  const timeZone = useSyncExternalStore(
    subscribe,
    () => bookedZone || visitorTimeZone(),
    () => bookedZone || "",
  );
  const dateLocale = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB";
  if (!timeZone) return <p className="mt-6 h-16" />;
  const at = new Date(startsAt);
  return (
    <p className="mt-6 font-serif text-3xl">
      {zonedDateLabel(startsAt, dateLocale, timeZone)} · {zonedTime(startsAt, dateLocale, timeZone)}–
      {zonedTime(endsAt, dateLocale, timeZone)}
      <span className="mt-2 block font-sans text-sm text-ink/60">{zonedZoneName(dateLocale, timeZone, at)}</span>
    </p>
  );
}
