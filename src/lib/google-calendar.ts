import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { BusyInterval } from "@/lib/availability";
import { lisbonDateTimeToUtc, utcToLisbonDateTime } from "@/lib/availability";
import { isBooking, type Booking } from "@/lib/bookings";
import type { CalendarConfig, GoogleConnection } from "@/lib/calendar-config";
import { CALENDAR_TIME_ZONE } from "@/lib/calendar-config";
import { settings } from "@/lib/content";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const API_URL = "https://www.googleapis.com/calendar/v3";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

export type GoogleCalendarOption = {
  id: string;
  summary: string;
  primary: boolean;
};

type GoogleEvent = {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  transparency?: string;
  eventType?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  extendedProperties?: { private?: { oracleBookingId?: string } };
};

const SKIP_GOOGLE_EVENT_TYPES = new Set([
  "outOfOffice",
  "focusTime",
  "workingLocation",
  "birthday",
]);

function encryptionSecret() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.ADMIN_PASSWORD || "";
}

function encryptionKey() {
  const secret = encryptionSecret();
  if (!secret) throw new Error("Add GOOGLE_TOKEN_ENCRYPTION_KEY before connecting Google Calendar.");
  return createHash("sha256").update(secret).digest();
}

export function encryptGoogleToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((value) => value.toString("base64url")).join(".");
}

function decryptGoogleToken(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("The saved Google connection is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export type GoogleAppCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function localCallback(requestOrigin?: string) {
  if (!requestOrigin) return "";
  try {
    const url = new URL(requestOrigin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.origin}/api/admin/google/callback`;
    }
  } catch {
    return "";
  }
  return "";
}

export function suggestedGoogleRedirectUri(requestOrigin?: string) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return localCallback(requestOrigin) || `${settings.siteUrl.replace(/\/$/, "")}/api/admin/google/callback`;
}

export function oauthRedirectUri(stored: string | undefined, requestOrigin?: string) {
  const suggested = suggestedGoogleRedirectUri(requestOrigin);
  if (!stored) return suggested;
  try {
    const url = new URL(stored);
    const vercelHost = url.hostname.endsWith(".vercel.app");
    if (vercelHost || url.pathname !== "/api/admin/google/callback") return suggested;
    return stored;
  } catch {
    return suggested;
  }
}

export function googleAppFromConfig(
  config: CalendarConfig,
  requestOrigin?: string,
): GoogleAppCredentials | null {
  const redirectUri = oauthRedirectUri(config.googleApp?.redirectUri, requestOrigin);
  if (config.googleApp && encryptionSecret()) {
    try {
      const clientSecret = decryptGoogleToken(config.googleApp.encryptedClientSecret);
      if (clientSecret) {
        return {
          clientId: config.googleApp.clientId,
          clientSecret,
          redirectUri,
        };
      }
    } catch (error) {
      console.error("[calendar] stored Google app credentials could not be read", error);
    }
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret || !encryptionSecret()) return null;
  return { clientId, clientSecret, redirectUri };
}

export function googleAuthorizationUrl(state: string, app: GoogleAppCredentials) {
  const query = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: app.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${query}`;
}

async function tokenRequest(body: URLSearchParams) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !result.access_token) {
    throw new Error(`Google authorization failed (${result.error || response.status}).`);
  }
  return result;
}

export async function exchangeGoogleCode(code: string, app: GoogleAppCredentials) {
  return tokenRequest(
    new URLSearchParams({
      code,
      client_id: app.clientId,
      client_secret: app.clientSecret,
      redirect_uri: app.redirectUri,
      grant_type: "authorization_code",
    }),
  );
}

async function accessToken(config: CalendarConfig) {
  const app = googleAppFromConfig(config);
  if (!app || !config.google) throw new Error("Google Calendar credentials are not configured.");
  const result = await tokenRequest(
    new URLSearchParams({
      refresh_token: decryptGoogleToken(config.google.encryptedRefreshToken),
      client_id: app.clientId,
      client_secret: app.clientSecret,
      grant_type: "refresh_token",
    }),
  );
  return result.access_token!;
}

async function googleFetch<T>(
  access: string,
  path: string,
  init?: RequestInit,
  accepted: number[] = [],
): Promise<{ status: number; data?: T }> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${access}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (accepted.includes(response.status)) return { status: response.status };
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar returned ${response.status}: ${body.slice(0, 240)}`);
  }
  if (response.status === 204) return { status: response.status };
  return { status: response.status, data: (await response.json()) as T };
}

export async function listGoogleCalendars(config: CalendarConfig) {
  if (!config.google || !googleAppFromConfig(config)) return [];
  const access = await accessToken(config);
  const result = await googleFetch<{
    items?: Array<{ id?: string; summary?: string; primary?: boolean; accessRole?: string }>;
  }>(access, "/users/me/calendarList?minAccessRole=writer&showHidden=false");
  return (result.data?.items || [])
    .filter((item) => item.id && item.summary)
    .map((item) => ({
      id: item.id!,
      summary: item.summary!,
      primary: item.primary === true,
    }));
}

export async function initialGoogleConnection(refreshToken: string, access: string) {
  const calendars = await googleFetch<{
    items?: Array<{ id?: string; summary?: string; primary?: boolean; accessRole?: string }>;
  }>(access, "/users/me/calendarList?minAccessRole=writer&showHidden=false");
  const writable = (calendars.data?.items || []).filter((item) => item.id && item.summary);
  const selected = writable.find((item) => item.primary) || writable[0];
  if (!selected?.id) throw new Error("No writable Google calendar was found.");
  return {
    encryptedRefreshToken: encryptGoogleToken(refreshToken),
    calendarId: selected.id,
    calendarSummary: selected.summary || "Google Calendar",
    accountEmail: selected.id.includes("@") ? selected.id : "",
    connectedAt: new Date().toISOString(),
  } satisfies GoogleConnection;
}

export async function googleBusy(
  config: CalendarConfig,
  from: Date,
  to: Date,
): Promise<BusyInterval[]> {
  if (!config.google || !googleAppFromConfig(config)) return [];
  const access = await accessToken(config);
  const result = await googleFetch<{
    calendars?: Record<string, { busy?: BusyInterval[] }>;
  }>(access, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: CALENDAR_TIME_ZONE,
      items: [{ id: config.google.calendarId }],
    }),
  });
  return result.data?.calendars?.[config.google.calendarId]?.busy || [];
}

function eventBody(booking: Booking) {
  const nextDate = new Date(`${booking.date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const description = [
    booking.origin === "web"
      ? "Booked through oracleoffreedom.com"
      : booking.origin === "google"
        ? ""
        : "Created in Oracle of Freedom Studio",
    booking.client ? `With: ${booking.client}` : "",
    booking.contact ? `Contact: ${booking.contact}` : "",
    booking.notes,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    summary: booking.title,
    description,
    location: booking.place || undefined,
    status: booking.status === "cancelled" ? "cancelled" : "confirmed",
    start: booking.allDay
      ? { date: booking.date }
      : {
          dateTime: lisbonDateTimeToUtc(booking.date, booking.start).toISOString(),
          timeZone: CALENDAR_TIME_ZONE,
        },
    end: booking.allDay
      ? {
          date: nextDate.toISOString().slice(0, 10),
        }
      : {
          dateTime: lisbonDateTimeToUtc(booking.date, booking.end).toISOString(),
          timeZone: CALENDAR_TIME_ZONE,
        },
    extendedProperties: { private: { oracleBookingId: booking.id } },
  };
}

export async function upsertGoogleEvent(config: CalendarConfig, booking: Booking) {
  if (!config.google || !googleAppFromConfig(config)) return booking;
  const access = await accessToken(config);
  const calendar = encodeURIComponent(config.google.calendarId);
  const result = await googleFetch<GoogleEvent>(
    access,
    booking.googleEventId
      ? `/calendars/${calendar}/events/${encodeURIComponent(booking.googleEventId)}?sendUpdates=none`
      : `/calendars/${calendar}/events?sendUpdates=none`,
    {
      method: booking.googleEventId ? "PUT" : "POST",
      body: JSON.stringify(eventBody(booking)),
    },
  );
  return result.data?.id ? { ...booking, googleEventId: result.data.id } : booking;
}

export async function deleteGoogleEvent(config: CalendarConfig, booking: Booking) {
  if (!config.google || !booking.googleEventId || !googleAppFromConfig(config)) return;
  const access = await accessToken(config);
  await googleFetch(
    access,
    `/calendars/${encodeURIComponent(config.google.calendarId)}/events/${encodeURIComponent(booking.googleEventId)}?sendUpdates=none`,
    { method: "DELETE" },
    [404, 410],
  );
}

function scheduleFromEvent(event: GoogleEvent) {
  if (event.start?.dateTime) {
    const start = utcToLisbonDateTime(event.start.dateTime);
    let end = "23:59";
    if (event.end?.dateTime) {
      const finish = utcToLisbonDateTime(event.end.dateTime);
      if (finish.date === start.date && finish.time > start.time) end = finish.time;
    }
    return { date: start.date, allDay: false, start: start.time, end };
  }
  if (event.start?.date && /^\d{4}-\d{2}-\d{2}$/.test(event.start.date)) {
    return { date: event.start.date, allDay: true, start: "", end: "" };
  }
  return null;
}

function bookingFromGoogleEvent(event: GoogleEvent): Booking | null {
  if (!event.id || event.status === "cancelled" || event.transparency === "transparent") return null;
  if (event.eventType && SKIP_GOOGLE_EVENT_TYPES.has(event.eventType)) return null;
  const schedule = scheduleFromEvent(event);
  if (!schedule) return null;
  const title = (event.summary || "Google Calendar").trim().slice(0, 120);
  if (!title) return null;
  const booking: Booking = {
    id: `g${createHash("sha256").update(event.id).digest("hex").slice(0, 20)}`,
    title,
    kind: "event",
    status: "confirmed",
    date: schedule.date,
    allDay: schedule.allDay,
    start: schedule.start,
    end: schedule.end,
    place: (event.location || "").trim().slice(0, 160),
    client: "",
    contact: "",
    notes: (event.description || "").trim().slice(0, 2000),
    origin: "google",
    googleEventId: event.id.slice(0, 200),
  };
  return isBooking(booking) ? booking : null;
}

export async function syncLinkedGoogleBookings(
  config: CalendarConfig,
  bookings: Booking[],
  from: string,
  to: string,
) {
  if (!config.google || !googleAppFromConfig(config)) return { bookings, changed: false };
  const candidates = bookings.filter(
    (booking) =>
      booking.googleEventId &&
      booking.status !== "cancelled" &&
      booking.date >= from &&
      booking.date <= to,
  );
  if (candidates.length === 0) return { bookings, changed: false };
  const access = await accessToken(config);
  const calendar = encodeURIComponent(config.google.calendarId);
  let changed = false;
  const updates = new Map<string, Booking>();

  await Promise.all(
    candidates.map(async (booking) => {
      const result = await googleFetch<GoogleEvent>(
        access,
        `/calendars/${calendar}/events/${encodeURIComponent(booking.googleEventId!)}`,
        undefined,
        [404, 410],
      );
      if (result.status === 404 || result.status === 410 || result.data?.status === "cancelled") {
        updates.set(booking.id, { ...booking, status: "cancelled" });
        changed = true;
        return;
      }
      const event = result.data;
      const schedule = event ? scheduleFromEvent(event) : null;
      if (!event || !schedule) return;
      const next: Booking = {
        ...booking,
        title: (event.summary || booking.title).trim().slice(0, 120) || booking.title,
        date: schedule.date,
        allDay: schedule.allDay,
        start: schedule.start,
        end: schedule.end,
        place: typeof event.location === "string" ? event.location.trim().slice(0, 160) : booking.place,
        notes:
          booking.origin === "google" && typeof event.description === "string"
            ? event.description.trim().slice(0, 2000)
            : booking.notes,
      };
      if (!isBooking(next)) return;
      if (
        next.title !== booking.title ||
        next.date !== booking.date ||
        next.allDay !== booking.allDay ||
        next.start !== booking.start ||
        next.end !== booking.end ||
        next.place !== booking.place ||
        next.notes !== booking.notes
      ) {
        updates.set(booking.id, next);
        changed = true;
      }
    }),
  );

  return {
    bookings: changed
      ? bookings.map((booking) => updates.get(booking.id) || booking)
      : bookings,
    changed,
  };
}

async function listGoogleWindow(access: string, calendarId: string, from: string, to: string) {
  const timeMin = lisbonDateTimeToUtc(from, "00:00").toISOString();
  const endDay = new Date(`${to}T00:00:00Z`);
  endDay.setUTCDate(endDay.getUTCDate() + 1);
  const timeMax = lisbonDateTimeToUtc(endDay.toISOString().slice(0, 10), "00:00").toISOString();
  const items: GoogleEvent[] = [];
  let pageToken = "";
  for (let page = 0; page < 4; page += 1) {
    const query = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: "100",
      showDeleted: "false",
    });
    if (pageToken) query.set("pageToken", pageToken);
    const result = await googleFetch<{ items?: GoogleEvent[]; nextPageToken?: string }>(
      access,
      `/calendars/${encodeURIComponent(calendarId)}/events?${query}`,
    );
    items.push(...(result.data?.items || []));
    pageToken = result.data?.nextPageToken || "";
    if (!pageToken) break;
  }
  return items;
}

export async function importGoogleEvents(
  config: CalendarConfig,
  bookings: Booking[],
  from: string,
  to: string,
) {
  if (!config.google || !googleAppFromConfig(config)) return { bookings, changed: false };
  const access = await accessToken(config);
  const events = await listGoogleWindow(access, config.google.calendarId, from, to);
  let next = bookings;
  let changed = false;
  let added = 0;
  const knownEventIds = new Set(bookings.flatMap((booking) => (booking.googleEventId ? [booking.googleEventId] : [])));
  const knownIds = new Set(bookings.map((booking) => booking.id));

  for (const event of events) {
    if (!event.id) continue;
    const oracleId = event.extendedProperties?.private?.oracleBookingId;
    if (oracleId) {
      const index = next.findIndex((item) => item.id === oracleId);
      if (index >= 0 && !next[index].googleEventId) {
        if (next === bookings) next = bookings.slice();
        next[index] = { ...next[index], googleEventId: event.id.slice(0, 200) };
        knownEventIds.add(event.id);
        changed = true;
      }
      continue;
    }
    if (knownEventIds.has(event.id) || added >= 120 || next.length >= 1000) continue;
    const booking = bookingFromGoogleEvent(event);
    if (!booking || booking.date < from || booking.date > to || knownIds.has(booking.id)) continue;
    if (next === bookings) next = bookings.slice();
    next.push(booking);
    knownIds.add(booking.id);
    knownEventIds.add(event.id);
    added += 1;
    changed = true;
  }

  return { bookings: next, changed };
}

export async function pushUnlinkedBookings(
  config: CalendarConfig,
  bookings: Booking[],
  from: string,
  to: string,
) {
  if (!config.google || !googleAppFromConfig(config)) return { bookings, changed: false };
  const pending = bookings.filter(
    (booking) =>
      !booking.googleEventId &&
      booking.origin !== "google" &&
      booking.status !== "cancelled" &&
      booking.date >= from &&
      booking.date <= to,
  );
  if (pending.length === 0) return { bookings, changed: false };
  const updates = new Map<string, Booking>();
  for (const booking of pending.slice(0, 40)) {
    try {
      const synced = await upsertGoogleEvent(config, booking);
      if (synced.googleEventId) updates.set(booking.id, synced);
    } catch (error) {
      console.error("[calendar] could not send a booking to Google", error);
    }
  }
  if (updates.size === 0) return { bookings, changed: false };
  return {
    bookings: bookings.map((booking) => updates.get(booking.id) || booking),
    changed: true,
  };
}

export async function reconcileGoogleBookings(
  config: CalendarConfig,
  bookings: Booking[],
  from: string,
  to: string,
) {
  const pushed = await pushUnlinkedBookings(config, bookings, from, to);
  const synced = await syncLinkedGoogleBookings(config, pushed.bookings, from, to);
  const imported = await importGoogleEvents(config, synced.bookings, from, to);
  return {
    bookings: imported.bookings,
    changed: pushed.changed || synced.changed || imported.changed,
  };
}
