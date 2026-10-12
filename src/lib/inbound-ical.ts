import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { lisbonDateTimeToUtc, utcToLisbonDateTime } from "@/lib/availability";
import type { Booking } from "@/lib/bookings";
import { isPrivateCalendarHost, normalizeInboundIcalUrl } from "@/lib/calendar-config";

const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; text: string }>();

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

function eventId(uid: string, date: string) {
  return `i${createHash("sha256").update(`${uid}\n${date}`).digest("hex").slice(0, 20)}`;
}

function unescapeIcal(value: string) {
  return value.replace(/\\(.)/g, (_, char: string) => (char === "n" || char === "N" ? "\n" : char));
}

function unfold(source: string) {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
}

function wallToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  let zone = timeZone;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: zone });
  } catch {
    zone = "Europe/Lisbon";
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utc);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asWall = Date.UTC(pick("year"), pick("month") - 1, pick("day"), pick("hour"), pick("minute"));
  return new Date(utc.getTime() - (asWall - utc.getTime()));
}

function parseStamp(meta: string, value: string) {
  const stamp = value.trim();
  const dateOnly = /VALUE=DATE/i.test(meta) || /^\d{8}$/.test(stamp);
  if (dateOnly) {
    const day = stamp.slice(0, 8);
    if (!/^\d{8}$/.test(day)) return null;
    return { kind: "date" as const, date: `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}` };
  }
  const match = stamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = `${match[4]}:${match[5]}`;
  if (stamp.endsWith("Z")) return { kind: "time" as const, utc: new Date(`${date}T${time}:00Z`) };
  const zone = /TZID="?([^";:]+)"?/i.exec(meta)?.[1] || "Europe/Lisbon";
  return { kind: "time" as const, utc: wallToUtc(date, time, zone) };
}

function readProps(block: string) {
  const props = new Map<string, { meta: string; value: string }>();
  const extra: string[] = [];
  for (const line of block.replace(/BEGIN:VALARM[\s\S]*?END:VALARM/g, "").split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const meta = line.slice(0, colon);
    const name = meta.split(";")[0].toUpperCase();
    const value = unescapeIcal(line.slice(colon + 1)).trim();
    if (name === "EXDATE") extra.push(value);
    else if (!props.has(name)) props.set(name, { meta, value });
  }
  return { props, exdates: extra.join(",") };
}

type Rule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count: number;
  until: string;
  byday: number[] | null;
};

function parseRule(value: string | undefined): Rule | null {
  if (!value) return null;
  const parts = new Map(
    value.split(";").map((part) => {
      const [key, raw] = part.split("=");
      return [key.toUpperCase(), raw || ""] as const;
    }),
  );
  const freq = parts.get("FREQ");
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY" && freq !== "YEARLY") return null;
  const bydayRaw = parts.get("BYDAY");
  let byday: number[] | null = null;
  if (bydayRaw) {
    if (freq !== "WEEKLY" || /[0-9-]/.test(bydayRaw)) return null;
    const names: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
    byday = bydayRaw
      .split(",")
      .map((day) => names[day])
      .filter((day) => day !== undefined)
      .sort((a, b) => a - b);
    if (byday.length === 0) return null;
  }
  const untilRaw = parts.get("UNTIL");
  const until = untilRaw && /^\d{8}/.test(untilRaw)
    ? `${untilRaw.slice(0, 4)}-${untilRaw.slice(4, 6)}-${untilRaw.slice(6, 8)}`
    : "9999-12-31";
  const count = Math.min(5000, Math.max(1, Number(parts.get("COUNT")) || 5000));
  const interval = Math.min(52, Math.max(1, Number(parts.get("INTERVAL")) || 1));
  return { freq, interval, count, until, byday };
}

function occurrenceDates(start: string, rule: Rule | null, from: string, to: string, skipped: Set<string>) {
  const dates: string[] = [];
  const push = (date: string) => {
    if (date >= from && date <= to && date <= (rule?.until || to) && !skipped.has(date) && dates.length < 60) {
      dates.push(date);
    }
  };
  if (!rule) {
    push(start);
    return dates;
  }
  const until = rule.until < to ? rule.until : to;
  if (rule.freq === "WEEKLY" && rule.byday) {
    const startDay = new Date(`${start}T00:00:00Z`).getUTCDay();
    const monday = addDays(start, -((startDay + 6) % 7));
    let produced = 0;
    let week = 0;
    if (start < from) {
      const firstWeek = Math.floor(daysBetween(monday, from) / 7);
      const aligned = firstWeek - (firstWeek % rule.interval);
      for (let past = 0; past < aligned && produced < rule.count; past += rule.interval) {
        for (const day of rule.byday) {
          const date = addDays(addDays(monday, past * 7), day);
          if (date < start || date >= from) continue;
          produced += 1;
        }
      }
      if (produced >= rule.count) return dates;
      week = aligned;
    }
    while (produced < rule.count && dates.length < 60) {
      const weekStart = addDays(monday, week * 7);
      if (weekStart > until) break;
      for (const day of rule.byday) {
        const date = addDays(weekStart, day);
        if (date < start) continue;
        if (date > until) return dates;
        produced += 1;
        if (produced > rule.count) return dates;
        push(date);
      }
      week += rule.interval;
    }
    return dates;
  }
  let index = 0;
  if (start < from && (rule.freq === "DAILY" || rule.freq === "WEEKLY")) {
    const step = rule.freq === "WEEKLY" ? rule.interval * 7 : rule.interval;
    index = Math.floor(daysBetween(start, from) / step);
  }
  while (index < rule.count && dates.length < 60) {
    const date = nextDate(start, rule, index);
    if (!date || date > until) break;
    push(date);
    index += 1;
    if (date > to) break;
  }
  return dates;
}

function nextDate(start: string, rule: Rule, index: number) {
  if (rule.freq === "DAILY") return addDays(start, index * rule.interval);
  if (rule.freq === "WEEKLY") return addDays(start, index * rule.interval * 7);
  const [year, month, day] = start.split("-").map(Number);
  const shift = index * rule.interval;
  const moved = new Date(Date.UTC(year, month - 1 + (rule.freq === "MONTHLY" ? shift : 0), 1));
  if (rule.freq === "YEARLY") moved.setUTCFullYear(year + shift);
  const last = new Date(Date.UTC(moved.getUTCFullYear(), moved.getUTCMonth() + 1, 0)).getUTCDate();
  if (day > last) return null;
  moved.setUTCDate(day);
  return moved.toISOString().slice(0, 10);
}

function booking(uid: string, title: string, place: string, date: string, allDay: boolean, start: string, end: string): Booking {
  return {
    id: eventId(uid, date),
    title: title.slice(0, 120) || "Ocupado",
    kind: "event",
    status: "confirmed",
    date,
    allDay,
    start: allDay ? "" : start,
    end: allDay ? "" : end,
    place: place.slice(0, 160),
    client: "",
    contact: "",
    notes: "",
    origin: "ical",
  };
}

function timedSlices(uid: string, title: string, place: string, startUtc: Date, endUtc: Date, from: string, to: string) {
  const slices: Booking[] = [];
  let cursor = startUtc;
  for (let guard = 0; guard < 8 && cursor < endUtc; guard += 1) {
    const local = utcToLisbonDateTime(cursor);
    const midnight = lisbonDateTimeToUtc(addDays(local.date, 1), "00:00");
    const sliceEnd = new Date(Math.min(midnight.getTime(), endUtc.getTime()));
    const endLocal = utcToLisbonDateTime(sliceEnd);
    const end = endLocal.date === local.date && endLocal.time > local.time ? endLocal.time : "23:59";
    if (local.date >= from && local.date <= to && end > local.time) {
      slices.push(booking(uid, title, place, local.date, false, local.time, end));
    }
    if (sliceEnd.getTime() <= cursor.getTime()) break;
    cursor = sliceEnd;
  }
  return slices;
}

function exdateSet(value: string) {
  const dates = new Set<string>();
  for (const part of value.split(",")) {
    const stamp = part.trim();
    if (/^\d{8}/.test(stamp)) dates.add(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`);
  }
  return dates;
}

function eventBookings(block: string, from: string, to: string) {
  const { props, exdates } = readProps(block);
  const status = props.get("STATUS")?.value.toUpperCase();
  const transp = props.get("TRANSP")?.value.toUpperCase();
  if (status === "CANCELLED" || transp === "TRANSPARENT") return [];
  const uid = props.get("UID")?.value || "";
  if (!uid || uid.endsWith("@oracleoffreedom.com")) return [];
  const startProp = props.get("DTSTART");
  if (!startProp) return [];
  const start = parseStamp(startProp.meta, startProp.value);
  if (!start) return [];
  const endProp = props.get("DTEND");
  const end = endProp ? parseStamp(endProp.meta, endProp.value) : null;
  const title = (props.get("SUMMARY")?.value || "Ocupado").split("\n")[0].trim();
  const place = (props.get("LOCATION")?.value || "").split("\n")[0].trim();
  const rule = parseRule(props.get("RRULE")?.value);
  const skipped = exdateSet(exdates);

  if (start.kind === "date") {
    const firstEnd = end?.kind === "date" ? end.date : addDays(start.date, 1);
    const span = Math.min(21, Math.max(1, daysBetween(start.date, firstEnd)));
    const dates = occurrenceDates(start.date, rule, from, addDays(to, 1), skipped);
    return dates.flatMap((date) => {
      const rows: Booking[] = [];
      for (let offset = 0; offset < span; offset += 1) {
        const day = addDays(date, offset);
        if (day >= from && day <= to) rows.push(booking(uid, title, place, day, true, "", ""));
      }
      return rows;
    });
  }

  const endUtc = end?.kind === "time" ? end.utc : new Date(start.utc.getTime() + 60 * 60_000);
  const duration = Math.max(60_000, endUtc.getTime() - start.utc.getTime());
  const origin = utcToLisbonDateTime(start.utc);
  const dates = occurrenceDates(origin.date, rule, from, to, skipped);
  return dates.flatMap((date) => {
    const begins = lisbonDateTimeToUtc(date, origin.time);
    return timedSlices(uid, title, place, begins, new Date(begins.getTime() + duration), from, to);
  });
}

export function bookingsFromIcal(source: string, from: string, to: string) {
  const text = unfold(source);
  const rows: Booking[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(/BEGIN:VEVENT\n([\s\S]*?)\nEND:VEVENT/g)) {
    for (const item of eventBookings(match[1], from, to)) {
      if (seen.has(item.id) || rows.length >= 200) continue;
      seen.add(item.id);
      rows.push(item);
    }
  }
  return rows;
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isPrivateCalendarHost(host)) throw new Error("blocked");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return;
  const records = await lookup(host, { all: true });
  if (records.length === 0 || records.some((record) => isPrivateCalendarHost(record.address))) {
    throw new Error("blocked");
  }
}

async function fetchIcal(url: string) {
  let current = url;
  for (let hop = 0; hop < 4; hop += 1) {
    const parsed = new URL(current);
    await assertPublicHost(parsed.hostname);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "text/calendar, text/plain, */*",
        "user-agent": "OracleOfFreedom/1.0",
      },
      cache: "no-store",
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect");
      const next = normalizeInboundIcalUrl(new URL(location, current).toString());
      if (!next) throw new Error("redirect");
      current = next;
      continue;
    }
    if (!response.ok) throw new Error(String(response.status));
    const text = await response.text();
    if (text.length > 2_000_000 || !text.includes("BEGIN:VCALENDAR")) throw new Error("calendar");
    return text;
  }
  throw new Error("redirect");
}

async function loadIcal(url: string) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.text;
  const text = await fetchIcal(url);
  cache.set(url, { at: Date.now(), text });
  return text;
}

function sameBooking(left: Booking, right: Booking) {
  return (
    left.title === right.title &&
    left.date === right.date &&
    left.allDay === right.allDay &&
    left.start === right.start &&
    left.end === right.end &&
    left.place === right.place &&
    left.status === right.status
  );
}

export async function importInboundIcal(url: string, bookings: Booking[], from: string, to: string) {
  const text = await loadIcal(url);
  const incoming = bookingsFromIcal(text, from, to);
  const fresh = new Map(incoming.map((item) => [item.id, item]));
  const complete = incoming.length < 200;
  let changed = false;
  const next = bookings
    .filter((item) => {
      if (item.origin !== "ical" || item.date < from || item.date > to) return true;
      if (!complete || fresh.has(item.id)) return true;
      changed = true;
      return false;
    })
    .map((item) => {
      const update = fresh.get(item.id);
      if (!update) return item;
      fresh.delete(item.id);
      if (sameBooking(item, update)) return item;
      changed = true;
      return { ...item, ...update, origin: "ical" as const };
    });
  for (const item of fresh.values()) {
    if (next.length >= 1000) break;
    next.push(item);
    changed = true;
  }
  return { bookings: changed ? next : bookings, changed };
}
