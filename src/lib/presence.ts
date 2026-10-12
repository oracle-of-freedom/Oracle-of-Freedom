import { countryByCode, countryName, resolveCountry } from "@/lib/countries";
import type { Locale } from "@/i18n/routing";
import type { PresenceRegion } from "@/lib/presence-region";

export type { PresenceRegion };

export type PresenceStay = {
  id: string;
  region: PresenceRegion;
  countries: string[];
  city: string;
  starts: string;
  ends: string;
  visible: boolean;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9-]{8,80}$/;
export const MAX_COUNTRIES = 6;

const MONTHS = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
} as const;

const SHORT_MONTHS = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
} as const;

export function isRealDate(iso: string) {
  if (!DATE.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function day(iso: string) {
  return Number(iso.slice(8, 10));
}

export function shortWhen(locale: Locale, starts: string, ends: string) {
  const startMonth = SHORT_MONTHS[locale][Number(starts.slice(5, 7)) - 1];
  const endMonth = SHORT_MONTHS[locale][Number(ends.slice(5, 7)) - 1];
  const startDay = day(starts);
  const endDay = day(ends);
  if (starts.slice(0, 7) === ends.slice(0, 7)) return `${startDay}–${endDay} ${startMonth}`;
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export function placeTitle(locale: Locale, stay: Pick<PresenceStay, "city" | "countries">, code: string) {
  const country = countryName(locale, code);
  if (stay.countries.length === 1 && stay.city.trim()) return stay.city.trim();
  return country;
}

export function placeDetail(locale: Locale, stay: Pick<PresenceStay, "city" | "countries">, code: string) {
  if (stay.countries.length === 1 && stay.city.trim()) return countryName(locale, code);
  return "";
}

export function chipLabel(locale: Locale, stay: PresenceStay, code: string) {
  const place = stay.countries.length === 1 && stay.city.trim() ? stay.city.trim() : countryName(locale, code);
  return `${place}, ${shortWhen(locale, stay.starts, stay.ends)}`;
}

export function staySummary(locale: Locale, stay: PresenceStay) {
  const names = stay.countries.map((code) =>
    stay.countries.length === 1 && stay.city.trim()
      ? `${stay.city.trim()}, ${countryName(locale, code)}`
      : countryName(locale, code),
  );
  return `${shortWhen(locale, stay.starts, stay.ends)} · ${names.join(" · ")}`;
}

export function eventName(locale: Locale, stay: PresenceStay, code: string) {
  const place = placeTitle(locale, stay, code);
  if (locale === "en") return `Photo and film sessions in ${place}`;
  if (locale === "pt") return `Sessões de fotografia e vídeo em ${place}`;
  return `Sesiones de foto y vídeo en ${place}`;
}

export function visibleStays(stays: PresenceStay[] | undefined, today: string) {
  return (stays ?? [])
    .filter((stay) => stay.visible && stay.countries.length > 0 && stay.ends >= today)
    .sort((a, b) => {
      const aCurrent = a.starts <= today ? 0 : 1;
      const bCurrent = b.starts <= today ? 0 : 1;
      return aCurrent - bCurrent || a.starts.localeCompare(b.starts) || a.countries[0].localeCompare(b.countries[0]);
    });
}

export function stayEvents(locale: Locale, stay: PresenceStay) {
  return stay.countries.map((code) => {
    const country = countryName(locale, code);
    const city = stay.countries.length === 1 ? stay.city.trim() : "";
    return {
      code,
      name: eventName(locale, stay, code),
      placeName: city ? `${city}, ${country}` : country,
      locality: city,
    };
  });
}

type RawStay = {
  id?: unknown;
  region?: unknown;
  city?: unknown;
  country?: unknown;
  countries?: unknown;
  starts?: unknown;
  ends?: unknown;
  visible?: unknown;
};

function readCountries(raw: RawStay): { region: PresenceRegion; countries: string[] } | null {
  const fromList = Array.isArray(raw.countries)
    ? raw.countries.filter((item): item is string => typeof item === "string")
    : [];
  const seeds = fromList.length > 0 ? fromList : typeof raw.country === "string" && raw.country.trim() ? [raw.country] : [];
  const countries: string[] = [];
  for (const seed of seeds) {
    const code = resolveCountry(seed);
    if (!code || countries.includes(code)) continue;
    countries.push(code);
  }
  if (countries.length === 0 || countries.length > MAX_COUNTRIES) return null;
  const region = countryByCode(countries[0])?.region;
  if (!region || countries.some((code) => countryByCode(code)?.region !== region)) return null;
  if (raw.region === "europe" || raw.region === "latin-america") {
    if (raw.region !== region) return null;
  }
  return { region, countries };
}

function normalizeStay(value: unknown): PresenceStay | null {
  if (!value || typeof value !== "object") return null;
  const row = value as RawStay;
  if (typeof row.id !== "string" || !ID.test(row.id)) return null;
  if (typeof row.starts !== "string" || typeof row.ends !== "string") return null;
  if (!isRealDate(row.starts) || !isRealDate(row.ends) || row.ends < row.starts) return null;
  if (typeof row.visible !== "boolean") return null;
  const parsed = readCountries(row);
  if (!parsed) return null;
  const city = typeof row.city === "string" ? row.city.trim().slice(0, 80) : "";
  return {
    id: row.id,
    region: parsed.region,
    countries: parsed.countries,
    city,
    starts: row.starts,
    ends: row.ends,
    visible: row.visible,
  };
}

export function parseStays(value: unknown): PresenceStay[] {
  if (!Array.isArray(value)) return [];
  const stays: PresenceStay[] = [];
  for (const item of value) {
    const stay = normalizeStay(item);
    if (stay) stays.push(stay);
  }
  return stays;
}

export function normalizeStays(value: unknown): { stays: PresenceStay[] } | { error: "invalid" | "tooMany" } {
  if (!Array.isArray(value)) return { error: "invalid" };
  if (value.length > 12) return { error: "tooMany" };
  const stays: PresenceStay[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    const stay = normalizeStay(item);
    if (!stay || ids.has(stay.id)) return { error: "invalid" };
    ids.add(stay.id);
    stays.push(stay);
  }
  return { stays };
}
