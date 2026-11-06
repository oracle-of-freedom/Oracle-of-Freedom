import type { Locale } from "@/i18n/routing";

/**
 * Content Agota adds from the studio: reviews, photos and films.
 * It lives next to the repo content and is merged in when the public pages build.
 */

export const REVIEW_PAGE_IDS = [
  "home",
  "people",
  "portraits",
  "elopements",
  "retreats",
  "festivals",
  "places",
] as const;
export type ReviewPageId = (typeof REVIEW_PAGE_IDS)[number];

export const PHOTO_PAGE_IDS = [
  "home",
  "portfolio",
  "people",
  "experiences",
  "portraits",
  "elopements",
  "retreats",
  "festivals",
  "places",
] as const;
export type PhotoPageId = (typeof PHOTO_PAGE_IDS)[number];

/** Portfolio filter tabs a photo can appear under, besides All. */
export const PORTFOLIO_TAB_IDS = [
  "portraits",
  "elopements",
  "retreats",
  "festivals",
  "djs",
  "fire",
  "places",
] as const;
export type PortfolioTabId = (typeof PORTFOLIO_TAB_IDS)[number];

export const VIDEO_PAGE_IDS = ["festivals", "experiences", "portfolio"] as const;
export type VideoPageId = (typeof VIDEO_PAGE_IDS)[number];

export type LocalText = Record<Locale, string>;

/** Quick picks for the line under a review's name. Each one already has all three languages. */
export const SERVICE_PRESETS: LocalText[] = [
  { en: "Portrait session", es: "Sesión de retrato", pt: "Sessão de retrato" },
  { en: "Couples session", es: "Sesión de pareja", pt: "Sessão de casal" },
  { en: "Elopement", es: "Elopement", pt: "Elopement" },
  { en: "Wedding", es: "Boda", pt: "Casamento" },
  { en: "Retreat", es: "Retiro", pt: "Retiro" },
  { en: "Festival photos", es: "Fotos del festival", pt: "Fotos do festival" },
  { en: "Festival reels", es: "Reels del festival", pt: "Reels do festival" },
  { en: "Event aftermovie", es: "Aftermovie del evento", pt: "Aftermovie do evento" },
  { en: "DJ press kit", es: "Kit de prensa de DJ", pt: "Kit de imprensa de DJ" },
  { en: "DJ press kit and reels pack", es: "Kit de prensa de DJ y pack de reels", pt: "Kit de imprensa de DJ e pack de reels" },
  { en: "Live-set content", es: "Contenido del set en vivo", pt: "Conteúdo do set ao vivo" },
  { en: "Stay or venue", es: "Alojamiento o espacio", pt: "Alojamento ou espaço" },
];

export type LiveReview = {
  id: string;
  createdAt: string;
  quote: LocalText;
  /** Name and where the person is from, for example "India, Ireland". */
  name: string;
  /** The kind of service, for example "Festival aftermovie". */
  service: LocalText;
  pages: string[];
  /** Show before the older reviews on the pages it appears on. */
  first: boolean;
  hidden: boolean;
};

/** Changes to a review that ships with the site. The quote itself stays as it is. */
export type ReviewTweak = {
  name?: string;
  service?: LocalText;
  pages?: string[];
  hidden?: boolean;
};

export type LivePhoto = {
  id: string;
  createdAt: string;
  mediaId: string;
  width: number;
  height: number;
  blur: string;
  pages: string[];
  tabs: string[];
  first: boolean;
  alt: LocalText;
};

export type LiveVideo = {
  id: string;
  createdAt: string;
  platform: "youtube" | "instagram";
  url: string;
  youtubeId?: string;
  embedUrl?: string;
  posterMediaId: string;
  posterWidth: number;
  posterHeight: number;
  caption: LocalText;
  pages: string[];
  first: boolean;
};

export type LiveContent = {
  reviews: LiveReview[];
  reviewTweaks: Record<string, ReviewTweak>;
  photos: LivePhoto[];
  videos: LiveVideo[];
};

export const LIMITS = {
  reviews: 300,
  photos: 400,
  videos: 60,
  quote: 1500,
  name: 120,
  service: 80,
  alt: 200,
  caption: 160,
} as const;

export function emptyLiveContent(): LiveContent {
  return { reviews: [], reviewTweaks: {}, photos: [], videos: [] };
}

const idPattern = /^[A-Za-z0-9-]{8,64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isMediaId(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function mediaSrc(mediaId: string) {
  return `/api/media/${mediaId}`;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function localText(value: unknown, max: number): LocalText {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { en: text(record.en, max), es: text(record.es, max), pt: text(record.pt, max) };
}

function ids(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  return allowed.filter((id) => value.includes(id));
}

function dimension(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12000 ? n : 0;
}

function stamp(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
}

function parseReview(value: unknown): LiveReview | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !idPattern.test(item.id)) return null;
  const quote = localText(item.quote, LIMITS.quote);
  if (!quote.en) return null;
  return {
    id: item.id,
    createdAt: stamp(item.createdAt),
    quote,
    name: text(item.name, LIMITS.name),
    service: localText(item.service, LIMITS.service),
    pages: ids(item.pages, REVIEW_PAGE_IDS),
    first: item.first === true,
    hidden: item.hidden === true,
  };
}

function parsePhoto(value: unknown): LivePhoto | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !idPattern.test(item.id) || !isMediaId(item.mediaId)) return null;
  const width = dimension(item.width);
  const height = dimension(item.height);
  if (!width || !height) return null;
  const blur = typeof item.blur === "string" && item.blur.startsWith("data:image/") && item.blur.length < 3000 ? item.blur : "";
  return {
    id: item.id,
    createdAt: stamp(item.createdAt),
    mediaId: item.mediaId,
    width,
    height,
    blur,
    pages: ids(item.pages, PHOTO_PAGE_IDS),
    tabs: ids(item.tabs, PORTFOLIO_TAB_IDS),
    first: item.first === true,
    alt: localText(item.alt, LIMITS.alt),
  };
}

function parseVideo(value: unknown): LiveVideo | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !idPattern.test(item.id) || !isMediaId(item.posterMediaId)) return null;
  if (item.platform !== "youtube" && item.platform !== "instagram") return null;
  const url = text(item.url, 500);
  if (!url.startsWith("https://")) return null;
  const embedUrl = text(item.embedUrl, 500);
  const youtubeId = text(item.youtubeId, 20);
  return {
    id: item.id,
    createdAt: stamp(item.createdAt),
    platform: item.platform,
    url,
    ...(item.platform === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(youtubeId) ? { youtubeId } : {}),
    ...(item.platform === "instagram" && embedUrl.startsWith("https://www.instagram.com/") ? { embedUrl } : {}),
    posterMediaId: item.posterMediaId,
    posterWidth: dimension(item.posterWidth) || 1280,
    posterHeight: dimension(item.posterHeight) || 720,
    caption: localText(item.caption, LIMITS.caption),
    pages: ids(item.pages, VIDEO_PAGE_IDS),
    first: item.first === true,
  };
}

function parseTweaks(value: unknown): Record<string, ReviewTweak> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, ReviewTweak> = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-z0-9-]{2,40}$/.test(id)) continue;
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const tweak: ReviewTweak = {};
    if (typeof item.name === "string") tweak.name = text(item.name, LIMITS.name);
    if (item.service) tweak.service = localText(item.service, LIMITS.service);
    if (Array.isArray(item.pages)) tweak.pages = ids(item.pages, REVIEW_PAGE_IDS);
    if (item.hidden === true) tweak.hidden = true;
    out[id] = tweak;
  }
  return out;
}

function list<T>(value: unknown, parse: (item: unknown) => T | null, max: number): T[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map(parse).filter((item): item is T => item !== null);
}

export function parseLiveContent(value: unknown): LiveContent {
  if (!value || typeof value !== "object") return emptyLiveContent();
  const item = value as Record<string, unknown>;
  return {
    reviews: list(item.reviews, parseReview, LIMITS.reviews),
    reviewTweaks: parseTweaks(item.reviewTweaks),
    photos: list(item.photos, parsePhoto, LIMITS.photos),
    videos: list(item.videos, parseVideo, LIMITS.videos),
  };
}

/** The wording for one language. A language left empty falls back to English. */
export function pickText(value: LocalText, locale: Locale) {
  return value[locale]?.trim() || value.en;
}

export function resolveText(value: LocalText): LocalText {
  return { en: value.en, es: pickText(value, "es"), pt: pickText(value, "pt") };
}

/** Pin order: newest "first" items lead; the rest keep their place after the older ones. */
export function orderNumber(first: boolean, createdAt: string) {
  const seconds = Math.floor(new Date(createdAt).getTime() / 1000);
  return first ? -seconds : 1_000_000 + seconds;
}

/** A YouTube or Instagram link, read into what the site needs to play it. */
export function parseVideoUrl(raw: string):
  | { platform: "youtube"; url: string; youtubeId: string }
  | { platform: "instagram"; url: string; embedUrl: string }
  | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/")[1] ?? "";
    else if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
    else {
      const [, kind, value] = url.pathname.split("/");
      if (kind === "shorts" || kind === "embed" || kind === "live") id = value ?? "";
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { platform: "youtube", url: `https://www.youtube.com/watch?v=${id}`, youtubeId: id };
  }

  if (host === "instagram.com") {
    const [, kind, code] = url.pathname.split("/");
    if ((kind !== "reel" && kind !== "p" && kind !== "tv") || !/^[A-Za-z0-9_-]{5,20}$/.test(code ?? "")) {
      return null;
    }
    const base = `https://www.instagram.com/${kind}/${code}/`;
    return { platform: "instagram", url: base, embedUrl: `${base}embed/` };
  }

  return null;
}
