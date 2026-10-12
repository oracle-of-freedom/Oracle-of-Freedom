export type PresenceRegion = "europe" | "latin-america";

export type PresenceStay = {
  id: string;
  region: PresenceRegion;
  city: string;
  country: string;
  starts: string;
  ends: string;
  visible: boolean;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9-]{8,80}$/;

const MONTHS = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
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

function monthName(locale: keyof typeof MONTHS, iso: string) {
  return MONTHS[locale][Number(iso.slice(5, 7)) - 1];
}

export function stayLine(locale: keyof typeof MONTHS, stay: Pick<PresenceStay, "city" | "country" | "starts" | "ends">) {
  const startMonth = monthName(locale, stay.starts);
  const endMonth = monthName(locale, stay.ends);
  const startDay = day(stay.starts);
  const endDay = day(stay.ends);
  const sameMonth = stay.starts.slice(0, 7) === stay.ends.slice(0, 7);
  if (locale === "en") {
    const when = sameMonth
      ? `${startDay}–${endDay} ${startMonth}`
      : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
    return `Available ${when} in ${stay.city}, ${stay.country}.`;
  }
  if (locale === "pt") {
    const when = sameMonth
      ? `${startDay} a ${endDay} de ${startMonth}`
      : `${startDay} de ${startMonth} a ${endDay} de ${endMonth}`;
    return `Disponível de ${when} em ${stay.city}, ${stay.country}.`;
  }
  const when = sameMonth
    ? `${startDay} al ${endDay} de ${startMonth}`
    : `${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
  return `Disponible del ${when} en ${stay.city}, ${stay.country}.`;
}

export function alsoLine(locale: keyof typeof MONTHS, stay: Pick<PresenceStay, "city" | "country" | "starts" | "ends">) {
  const line = stayLine(locale, stay);
  if (locale === "en") return `Also: ${line}`;
  if (locale === "pt") return `Também: ${line}`;
  return `También: ${line}`;
}

export function eventName(locale: keyof typeof MONTHS, stay: Pick<PresenceStay, "city">) {
  if (locale === "en") return `Photo and film sessions in ${stay.city}`;
  if (locale === "pt") return `Sessões de fotografia e vídeo em ${stay.city}`;
  return `Sesiones de foto y vídeo en ${stay.city}`;
}

export function visibleStays(stays: PresenceStay[] | undefined, today: string) {
  return (stays ?? [])
    .filter((stay) => stay.visible && stay.ends >= today)
    .sort((a, b) => {
      const aCurrent = a.starts <= today ? 0 : 1;
      const bCurrent = b.starts <= today ? 0 : 1;
      return aCurrent - bCurrent || a.starts.localeCompare(b.starts) || a.city.localeCompare(b.city);
    });
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

function normalizeStay(value: unknown): PresenceStay | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<PresenceStay>;
  if (row.region !== "europe" && row.region !== "latin-america") return null;
  if (typeof row.id !== "string" || !ID.test(row.id)) return null;
  if (typeof row.city !== "string" || typeof row.country !== "string") return null;
  if (typeof row.starts !== "string" || typeof row.ends !== "string") return null;
  if (!isRealDate(row.starts) || !isRealDate(row.ends) || row.ends < row.starts) return null;
  if (typeof row.visible !== "boolean") return null;
  const city = row.city.trim().slice(0, 80);
  const country = row.country.trim().slice(0, 80);
  if (!city || !country) return null;
  return {
    id: row.id,
    region: row.region,
    city,
    country,
    starts: row.starts,
    ends: row.ends,
    visible: row.visible,
  };
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
