export function visitorTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function part(iso: string, timeZone: string, type: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function zonedDateKey(iso: string, timeZone: string) {
  return `${part(iso, timeZone, "year")}-${part(iso, timeZone, "month")}-${part(iso, timeZone, "day")}`;
}

export function zonedTime(iso: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

export function zonedDateLabel(iso: string, dateLocale: string, timeZone: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  }).format(new Date(iso));
}

export function zonedZoneName(dateLocale: string, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat(dateLocale, {
      timeZone,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    return parts.find((item) => item.type === "timeZoneName")?.value || timeZone;
  } catch {
    return timeZone;
  }
}
