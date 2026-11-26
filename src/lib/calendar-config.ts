import { randomBytes, timingSafeEqual } from "node:crypto";
import type { BookingKind } from "@/lib/bookings";
import type { Locale } from "@/i18n/routing";

/** Fallback studio zone when nothing is saved on the calendar config. */
export const CALENDAR_TIME_ZONE = "Europe/Madrid";

const ZONE_ID = /^[A-Za-z0-9_+/-]{1,80}$/;

function resolveTimeZone(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const zone = value.trim();
  if (!ZONE_ID.test(zone)) return undefined;
  try {
    const canonical = new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
    return canonical && ZONE_ID.test(canonical) ? canonical : undefined;
  } catch {
    return undefined;
  }
}

/** Resolve a calendar config's studio timezone, falling back to CALENDAR_TIME_ZONE. */
export function studioTimeZone(config?: { timeZone?: string } | null) {
  return resolveTimeZone(config?.timeZone) || CALENDAR_TIME_ZONE;
}

/** Wall-clock time (HH:MM, 24h) in the studio timezone. */
export function studioClock(timeZone = CALENDAR_TIME_ZONE, now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: studioTimeZone({ timeZone }),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

/** Today's calendar date (YYYY-MM-DD) in the given IANA timezone. */
export function calendarToday(timeZone = CALENDAR_TIME_ZONE, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: studioTimeZone({ timeZone }),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type LocalizedLabel = Record<Locale, string>;

export type PublicBookingType = {
  id: string;
  label: LocalizedLabel;
  description: LocalizedLabel;
  durationMinutes: number;
  kind: BookingKind;
  active: boolean;
};

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

export type GoogleConnection = {
  encryptedRefreshToken: string;
  calendarId: string;
  calendarSummary: string;
  accountEmail: string;
  connectedAt: string;
};

export type GoogleAppSettings = {
  clientId: string;
  encryptedClientSecret: string;
  redirectUri: string;
};

export type CalendarConfig = {
  bookingTypes: PublicBookingType[];
  weekly: Record<string, DaySchedule>;
  daysAhead: number;
  minimumNoticeHours: number;
  bufferMinutes: number;
  defaultLocation: string;
  /** IANA timezone for private booking hours and studio wall-clock times. */
  timeZone: string;
  /** Personal Google Meet or Zoom join link shown after confirmation. */
  meetingUrl?: string;
  /**
   * Standalone private booking invite (no inquiry required).
   * Absent or empty means the open link is off.
   */
  bookingInviteToken?: string;
  icalToken: string;
  inboundIcalUrl?: string;
  google?: GoogleConnection;
  googleApp?: GoogleAppSettings;
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function newCalendarToken() {
  return randomBytes(24).toString("base64url");
}

export function isPrivateCalendarHost(host: string) {
  let name = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (name.startsWith("::ffff:")) name = name.slice("::ffff:".length);
  if (
    name === "localhost" ||
    name.endsWith(".localhost") ||
    name.endsWith(".local") ||
    name === "metadata.google.internal" ||
    (name.includes(":") &&
      (name === "::1" || name.startsWith("fe80:") || name.startsWith("fc") || name.startsWith("fd")))
  ) {
    return true;
  }
  const ipv4 = name.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);
  if ([a, b, Number(ipv4[3]), Number(ipv4[4])].some((part) => part > 255)) return true;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function normalizeInboundIcalUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let value = trimmed;
  if (value.toLowerCase().startsWith("webcal://")) value = `https://${value.slice("webcal://".length)}`;
  if (value.toLowerCase().startsWith("webcals://")) value = `https://${value.slice("webcals://".length)}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.toString().length > 2000) return null;
  if (isPrivateCalendarHost(url.hostname)) return null;
  const ownFeed =
    (url.hostname === "oracleoffreedom.com" || url.hostname.endsWith(".vercel.app")) &&
    url.pathname.includes("/api/calendar/feed");
  if (ownFeed) return null;
  return url.toString();
}

/** Normalize a personal Meet / Zoom (or similar) join link. Empty clears the setting. */
export function normalizeMeetingUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.toString().length > 500) return null;
  if (isPrivateCalendarHost(url.hostname)) return null;
  return url.toString();
}

export function defaultCalendarConfig(): CalendarConfig {
  return {
    bookingTypes: [
      {
        id: "intro-call",
        label: {
          en: "Meet Agota",
          es: "Conoce a Agota",
          pt: "Conhece a Agota",
        },
        description: {
          en: "A relaxed video call to talk through your idea.",
          es: "Una videollamada tranquila para hablar de tu idea.",
          pt: "Uma videochamada tranquila para falar da tua ideia.",
        },
        durationMinutes: 30,
        kind: "meeting",
        active: true,
      },
      {
        id: "planning-call",
        label: {
          en: "Planning session",
          es: "Sesión de planificación",
          pt: "Sessão de planeamento",
        },
        description: {
          en: "One hour to shape a shoot, event or collaboration.",
          es: "Una hora para preparar una sesión, evento o colaboración.",
          pt: "Uma hora para preparar uma sessão, evento ou colaboração.",
        },
        durationMinutes: 60,
        kind: "session",
        active: true,
      },
    ],
    weekly: {
      "0": { enabled: false, start: "10:00", end: "18:00" },
      "1": { enabled: false, start: "10:00", end: "18:00" },
      "2": { enabled: true, start: "10:00", end: "18:00" },
      "3": { enabled: true, start: "10:00", end: "18:00" },
      "4": { enabled: true, start: "10:00", end: "18:00" },
      "5": { enabled: true, start: "10:00", end: "18:00" },
      "6": { enabled: true, start: "10:00", end: "18:00" },
    },
    daysAhead: 60,
    minimumNoticeHours: 24,
    bufferMinutes: 15,
    defaultLocation: "Video call",
    timeZone: CALENDAR_TIME_ZONE,
    icalToken: newCalendarToken(),
  };
}

function validLocalized(value: unknown): value is LocalizedLabel {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalizedLabel>;
  return ["en", "es", "pt"].every(
    (locale) => typeof item[locale as Locale] === "string" && item[locale as Locale]!.trim().length > 0,
  );
}

function validBookingType(value: unknown): value is PublicBookingType {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PublicBookingType>;
  return (
    typeof item.id === "string" &&
    /^[a-z0-9-]{1,60}$/.test(item.id) &&
    validLocalized(item.label) &&
    validLocalized(item.description) &&
    Number.isInteger(item.durationMinutes) &&
    (item.durationMinutes ?? 0) >= 15 &&
    (item.durationMinutes ?? 0) <= 480 &&
    (item.kind === "meeting" || item.kind === "session" || item.kind === "event") &&
    typeof item.active === "boolean"
  );
}

function validDay(value: unknown): value is DaySchedule {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DaySchedule>;
  return (
    typeof item.enabled === "boolean" &&
    typeof item.start === "string" &&
    typeof item.end === "string" &&
    timePattern.test(item.start) &&
    timePattern.test(item.end) &&
    item.end > item.start
  );
}

export function parseCalendarConfig(value: unknown): CalendarConfig | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CalendarConfig>;
  if (
    !Array.isArray(item.bookingTypes) ||
    item.bookingTypes.length === 0 ||
    item.bookingTypes.length > 12 ||
    !item.bookingTypes.every(validBookingType) ||
    !item.weekly ||
    !Array.from({ length: 7 }, (_, day) => String(day)).every((day) => validDay(item.weekly?.[day])) ||
    !Number.isInteger(item.daysAhead) ||
    (item.daysAhead ?? 0) < 1 ||
    (item.daysAhead ?? 0) > 365 ||
    !Number.isInteger(item.minimumNoticeHours) ||
    (item.minimumNoticeHours ?? 0) < 0 ||
    (item.minimumNoticeHours ?? 0) > 720 ||
    !Number.isInteger(item.bufferMinutes) ||
    (item.bufferMinutes ?? 0) < 0 ||
    (item.bufferMinutes ?? 0) > 180 ||
    typeof item.defaultLocation !== "string" ||
    item.defaultLocation.length > 160 ||
    typeof item.icalToken !== "string" ||
    item.icalToken.length < 20
  ) {
    return null;
  }
  if (item.googleApp && !validGoogleApp(item.googleApp)) delete item.googleApp;
  if (typeof item.inboundIcalUrl === "string") {
    const inbound = normalizeInboundIcalUrl(item.inboundIcalUrl);
    if (inbound) item.inboundIcalUrl = inbound;
    else delete item.inboundIcalUrl;
  } else {
    delete item.inboundIcalUrl;
  }
  if (typeof item.meetingUrl === "string") {
    const meeting = normalizeMeetingUrl(item.meetingUrl);
    if (meeting) item.meetingUrl = meeting;
    else if (item.meetingUrl.trim() === "") delete item.meetingUrl;
    else return null;
  } else {
    delete item.meetingUrl;
  }
  if (item.timeZone === undefined || item.timeZone === null || item.timeZone === "") {
    item.timeZone = CALENDAR_TIME_ZONE;
  } else {
    const zone = resolveTimeZone(item.timeZone);
    if (!zone) return null;
    item.timeZone = zone;
  }
  if (typeof item.bookingInviteToken === "string") {
    const token = item.bookingInviteToken.trim();
    if (!token) delete item.bookingInviteToken;
    else if (!/^[A-Za-z0-9_-]{16,100}$/.test(token)) return null;
    else item.bookingInviteToken = token;
  } else {
    delete item.bookingInviteToken;
  }
  return item as CalendarConfig;
}

/** True when the open (no-inquiry) private booking link is active. */
export function openBookingInviteActive(config: Pick<CalendarConfig, "bookingInviteToken">) {
  return Boolean(config.bookingInviteToken && /^[A-Za-z0-9_-]{16,100}$/.test(config.bookingInviteToken));
}

/** True when the token matches the studio's open private booking invite. */
export function matchesOpenBookingInvite(
  token: string,
  config: Pick<CalendarConfig, "bookingInviteToken">,
) {
  const expected = config.bookingInviteToken;
  if (!expected || !/^[A-Za-z0-9_-]{16,100}$/.test(token)) return false;
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function validGoogleApp(value: unknown): value is GoogleAppSettings {
  if (!value || typeof value !== "object") return false;
  const app = value as Partial<GoogleAppSettings>;
  return (
    typeof app.clientId === "string" &&
    app.clientId.length >= 8 &&
    app.clientId.length <= 200 &&
    typeof app.encryptedClientSecret === "string" &&
    app.encryptedClientSecret.split(".").length === 3 &&
    typeof app.redirectUri === "string" &&
    app.redirectUri.startsWith("https://") &&
    app.redirectUri.length <= 300
  );
}
