import { en } from "@/content/en";
import { es } from "@/content/es";
import { pt } from "@/content/pt";
import type { Locale } from "@/i18n/routing";
import { stayLine, visibleStays, type PresenceStay } from "@/lib/presence";

const ELSEWHERE: Record<Locale, string> = {
  en: en.home.elsewhere,
  es: es.home.elsewhere,
  pt: pt.home.elsewhere,
};

const PLACES_FALLBACK: Record<Locale, string> = {
  en: "Europe and Latin America",
  es: "Europa y América Latina",
  pt: "Europa e América Latina",
};

const KEYWORD_FALLBACK: Record<Locale, string> = {
  en: "Europe; Latin America",
  es: "Europa; América Latina",
  pt: "Europa; América Latina",
};

/** The same sentences as the homepage stay banners, in banner order. */
export function presenceBanner(locale: Locale, stays: PresenceStay[] | undefined, today: string) {
  return visibleStays(stays, today)
    .map((stay) => stayLine(locale, stay))
    .join(" ");
}

export function presencePlaceList(stays: PresenceStay[] | undefined, today: string) {
  const seen = new Set<string>();
  const places: string[] = [];
  for (const stay of visibleStays(stays, today)) {
    const place = `${stay.city}, ${stay.country}`;
    if (seen.has(place)) continue;
    seen.add(place);
    places.push(place);
  }
  return places;
}

/** Cities and countries from the banners. With no banner, the cover regions. */
export function presenceAreas(stays: PresenceStay[] | undefined, today: string) {
  const places = presencePlaceList(stays, today);
  if (places.length === 0) return ["Europe", "Latin America"];
  const areas: string[] = [];
  for (const place of places) {
    const [city, country] = place.split(", ");
    if (city && !areas.includes(city)) areas.push(city);
    if (country && !areas.includes(country)) areas.push(country);
  }
  return areas;
}

export function presenceTokens(locale: Locale, stays: PresenceStay[] | undefined, today: string) {
  const banner = presenceBanner(locale, stays, today);
  const elsewhere = ELSEWHERE[locale];
  const places = presencePlaceList(stays, today);
  return {
    "{presence}": banner,
    "{availability}": banner ? `${banner} ${elsewhere}` : elsewhere,
    "{presencePlaces}": places.length > 0 ? places.join(" · ") : PLACES_FALLBACK[locale],
    "{presenceKeywords}": places.length > 0 ? places.join("; ") : KEYWORD_FALLBACK[locale],
  };
}
