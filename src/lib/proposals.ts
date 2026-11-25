import { createHash, randomBytes } from "node:crypto";
import { siteUrl } from "@/lib/content";
import {
  parseProposalDesign,
  parseSectionDesign,
  type ProposalDesign,
  type SectionDesign,
} from "@/lib/proposal-design";
import {
  parseImageMobile,
  parseSectionMobile,
  type ProposalImageMobile,
  type SectionMobile,
} from "@/lib/proposal-mobile";

/**
 * Section kinds a proposal or template can hold.
 * Starter templates used to trim optional sections once 10 were enabled.
 * Awake-style decks are longer, so the cap stays above a full Norte deck.
 */
export const SECTION_TYPES = [
  "cover",
  "welcome",
  "noticed",
  "divider",
  "plan",
  "proof",
  "howIWork",
  "deliverables",
  "addon",
  "investment",
  "terms",
  "review",
  "nextStep",
  "signOff",
  "text",
  "photos",
  "faq",
  "video",
  "quote",
  "gallery",
  "timeline",
  "cta",
  "columns",
] as const;

/** Schema version written on exported template JSON files. */
export const TEMPLATE_FORMAT_VERSION = 1;

export const SECTION_LAYOUTS = ["stack", "text", "textPhoto", "twoColumn"] as const;
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];

export const HEADING_EMPHASIS = ["default", "large", "xl"] as const;
export type HeadingEmphasis = (typeof HEADING_EMPHASIS)[number];

export type PriceLine = { id: string; label: string; price: string };

export type SectionType = (typeof SECTION_TYPES)[number];

export const TEMPLATE_KINDS = ["retreat", "festival", "quick", "custom"] as const;
export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

/** Stored statuses. `expired` is derived when live and past validUntil. */
export const PROPOSAL_STATUSES = ["draft", "live", "archived"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export type EffectiveStatus = ProposalStatus | "expired";

export type ProposalImage = {
  mediaId?: string;
  /** Public path such as /images/portfolio/…. Prefer mediaId when set. */
  src?: string;
  alt: string;
  caption?: string;
  /** Horizontal focus as 0 to 100 percent. Missing means centred (50). */
  focusX?: number;
  /** Vertical focus as 0 to 100 percent. Missing means centred (50). */
  focusY?: number;
  /** Zoom scale from 1 to 3. Missing means 1 (no zoom). */
  zoom?: number;
  /** Phone-only crop, size and visibility. Missing keys fall back to desktop. */
  mobile?: ProposalImageMobile;
};

export type NoticedCard = {
  id: string;
  title: string;
  body: string;
  /** When true, the card spans the full row on desktop. */
  fullWidth?: boolean;
};

export type DeliverableCard = {
  id: string;
  title: string;
  items: string[];
  /** Cycles terracotta → ember → moss. */
  accent?: "terracotta" | "ember" | "moss";
};

export type HowIWorkStep = {
  id: string;
  title: string;
  body: string;
  /** When false, hide body even if set. Default true for old records. */
  showBody?: boolean;
};

export type PlanScene = {
  id: string;
  title: string;
  body: string;
  /** When false, hide body even if set. Default true for old records. */
  showBody?: boolean;
};

export type CoverData = {
  clientName: string;
  kicker: string;
  headline: string;
  /** Substring of headline emphasised in ember / italic. */
  headlineEmphasis?: string;
  subtitle: string;
  heroImage: ProposalImage | null;
  proposalDate: string;
};

export type WelcomeData = {
  body: string;
};

export type NoticedData = {
  heading: string;
  opportunity: string;
  cards: NoticedCard[];
};

export type DividerData = {
  line: string;
  image: ProposalImage | null;
};

export type PlanData = {
  heading: string;
  intro: string;
  datesLabel: string;
  datesBody: string;
  showDates: boolean;
  dayFlow: string;
  consent: string;
  scenes: PlanScene[];
};

export type ProofData = {
  heading: string;
  images: ProposalImage[];
  videoUrl: string;
  videoMediaId: string;
  /** Cover for the video card. Falls back to a YouTube thumb or a brand placeholder. */
  videoCover?: ProposalImage | null;
  portfolioLine: string;
};

export type HowIWorkData = {
  heading: string;
  kicker: string;
  steps: HowIWorkStep[];
};

export type DeliverablesData = {
  heading: string;
  cards: DeliverableCard[];
  outOfScope: string;
  /** Default "Out of scope". */
  outOfScopeLabel?: string;
  usage: string;
  /** Default "Usage". */
  usageLabel?: string;
};

export type AddonData = {
  heading: string;
  title: string;
  body: string;
  priceUsd: number;
  note: string;
  priceLines?: PriceLine[];
  /** Rendered as bullets under the body. Old records may only have body text. */
  bullets?: string[];
};

export type InvestmentData = {
  heading: string;
  clientLabel: string;
  packagePriceUsd: number;
  currencyNote: string;
  offerNote: string;
  /** Night panel copy (accommodation). */
  sideNote?: string;
  /** Short line in offer panel. */
  keyTerms?: string;
  depositPercent: number;
  normalRatesLine: string;
  compareRows: { id: string; label: string; amount: string; struck?: boolean }[];
};

export type TermsData = {
  heading: string;
  items: string[];
};

/** One client quote shown in a review section. */
export type ReviewSlot = {
  quote: string;
  name: string;
  service: string;
  /** Optional id of a Studio review this was copied from. */
  sourceReviewId?: string;
  metricsNote?: string;
  /** Optional portrait or still shown with the quote. */
  image?: ProposalImage | null;
};

export type ReviewData = {
  heading: string;
  quote: string;
  name: string;
  service: string;
  /** Optional id of an admin review this was copied from. */
  sourceReviewId?: string;
  metricsNote: string;
  /** Optional portrait or still for the first quote. */
  image?: ProposalImage | null;
  /** Optional second quote, shown beside the first on desktop. */
  second?: ReviewSlot | null;
};

export type NextStepData = {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  validUntilLabel: string;
  closingLine: string;
};

export type SignOffData = {
  /** Optional line above the fixed With Love sign-off. */
  intro: string;
};

export type TextBlockData = {
  heading: string;
  body: string;
};

export type PhotosBlockData = {
  heading: string;
  images: ProposalImage[];
};

export type FaqItem = { id: string; question: string; answer: string };
export type FaqData = {
  heading: string;
  items: FaqItem[];
};

export type VideoBlockData = {
  heading: string;
  videoUrl: string;
  videoMediaId: string;
  videoCover: ProposalImage | null;
  caption: string;
};

export type QuoteBlockData = {
  quote: string;
  name: string;
  role: string;
  image: ProposalImage | null;
};

export type GalleryColumns = 2 | 3 | 4;
export type GalleryData = {
  heading: string;
  columns: GalleryColumns;
  images: ProposalImage[];
};

export type TimelineItem = {
  id: string;
  when: string;
  title: string;
  body: string;
};
export type TimelineData = {
  heading: string;
  items: TimelineItem[];
};

export type CtaButton = { id: string; label: string; href: string };
export type CtaData = {
  heading: string;
  body: string;
  buttons: CtaButton[];
};

export type ColumnItem = {
  id: string;
  heading: string;
  body: string;
  image: ProposalImage | null;
};
export type ColumnsData = {
  heading: string;
  columnCount: 2 | 3;
  columns: ColumnItem[];
};

export type SectionDataMap = {
  cover: CoverData;
  welcome: WelcomeData;
  noticed: NoticedData;
  divider: DividerData;
  plan: PlanData;
  proof: ProofData;
  howIWork: HowIWorkData;
  deliverables: DeliverablesData;
  addon: AddonData;
  investment: InvestmentData;
  terms: TermsData;
  review: ReviewData;
  nextStep: NextStepData;
  signOff: SignOffData;
  text: TextBlockData;
  photos: PhotosBlockData;
  faq: FaqData;
  video: VideoBlockData;
  quote: QuoteBlockData;
  gallery: GalleryData;
  timeline: TimelineData;
  cta: CtaData;
  columns: ColumnsData;
};

export type ProposalSection = {
  [K in SectionType]: {
    id: string;
    type: K;
    enabled: boolean;
    data: SectionDataMap[K];
    layout?: SectionLayout;
    headingEmphasis?: HeadingEmphasis;
    /** Extra images on any section; hidden when empty. */
    images?: ProposalImage[];
    /** Per-block layout. Missing fields use the proposal design, then Awake defaults. */
    design?: SectionDesign;
    /** Phone-only visibility, order, spacing and type size. */
    mobile?: SectionMobile;
  };
}[SectionType];

export type ProposalSectionOf<T extends SectionType> = Extract<ProposalSection, { type: T }>;

export type ProposalTemplate = {
  id: string;
  name: string;
  kind: TemplateKind;
  createdAt: string;
  updatedAt: string;
  /** Built-in starter templates cannot be deleted. */
  builtin?: boolean;
  /**
   * When true, the template is hidden from the templates list and the
   * new-proposal picker. Built-in starters use this instead of delete.
   */
  hidden?: boolean;
  /** Layout controls copied onto proposals created from this template. */
  design?: ProposalDesign;
  /**
   * Export schema version. Missing on older records; export writes
   * TEMPLATE_FORMAT_VERSION.
   */
  formatVersion?: number;
  sections: ProposalSection[];
};

export type Proposal = {
  id: string;
  slug: string;
  /**
   * Former public slugs that permanently redirect to `slug`.
   * Kept so old client links keep working after a rename.
   */
  previousSlugs?: string[];
  /** Opaque token for draft preview without prices. See DECISIONS in PR. */
  previewToken: string;
  templateId: string;
  templateKind: TemplateKind;
  clientName: string;
  projectTitle: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  proposalDate: string;
  validUntil: string;
  /** Public live opens only. Admin and preview hits are ignored. */
  viewCount: number;
  /** ISO timestamp of the last counted public open. Empty until first view. */
  lastOpenedAt: string;
  /** Seeded example proposal (Norte Nosara). */
  example?: boolean;
  /** Layout controls. Missing fields use Awake-style defaults. */
  design?: ProposalDesign;
  /**
   * Norte content revision. Once this reaches the current Awake revision,
   * later reads do not overwrite Agota's edits.
   */
  contentRevision?: number;
  sections: ProposalSection[];
};

export const PORTFOLIO_LINE =
  "You can see my work here: https://oracleoffreedom.com/portfolio";

export const SIGN_OFF = {
  withLove: "With Love,",
  name: "Agota",
  brand: "Oracle of Freedom",
  url: "https://oracleoffreedom.com",
  urlHref: "https://oracleoffreedom.com",
} as const;

export const MAX_FULL_SECTIONS = 16;

export function newId(prefix = "p") {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export function randomCode(length = 7) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

/** Readable client stem + hard-to-guess code, e.g. client-name-x7k2q9. */
export function buildSlug(clientName: string, code = randomCode(7)) {
  const stem =
    clientName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "proposal";
  return `${stem}-${code}`;
}

/** Reserved path segments that must never be a proposal slug. */
export const RESERVED_PROPOSAL_SLUGS = ["admin", "api", "new", "edit"] as const;

export const PROPOSAL_SLUG_MIN = 3;
export const PROPOSAL_SLUG_MAX = 60;

/**
 * Live-clean a slug input: lowercase, spaces to hyphens, strip accents and
 * anything other than a-z / 0-9 / "-", collapse and trim hyphens.
 * Does not enforce length — callers validate 3–60 on save.
 */
export function cleanProposalSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedProposalSlug(slug: string) {
  return (RESERVED_PROPOSAL_SLUGS as readonly string[]).includes(slug);
}

/** True when the slug is already cleaned, within length, and not reserved. */
export function isValidProposalSlug(slug: string) {
  if (!slug) return false;
  if (slug !== cleanProposalSlug(slug)) return false;
  if (slug.length < PROPOSAL_SLUG_MIN || slug.length > PROPOSAL_SLUG_MAX) return false;
  if (isReservedProposalSlug(slug)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Client-name stem for Suggest: cleaned, no random code, no "example" token.
 */
export function proposalSlugStem(clientName: string) {
  const cleaned = cleanProposalSlug(clientName)
    .split("-")
    .filter((part) => part && part !== "example")
    .join("-");
  const stem = cleaned.slice(0, PROPOSAL_SLUG_MAX).replace(/-+$/g, "");
  return stem || "proposal";
}

/**
 * Suggest a free public slug from the client name (no random code).
 * If the stem is taken, append -2, -3, …
 */
export function suggestProposalSlug(clientName: string, taken: Iterable<string>) {
  const takenSet = taken instanceof Set ? taken : new Set(taken);
  let base = proposalSlugStem(clientName);
  if (base.length < PROPOSAL_SLUG_MIN) {
    base = `${base}${base ? "-" : ""}link`.slice(0, PROPOSAL_SLUG_MAX);
  }
  if (base.length < PROPOSAL_SLUG_MIN) base = "proposal";

  const tryCandidate = (candidate: string) =>
    isValidProposalSlug(candidate) && !takenSet.has(candidate);

  if (tryCandidate(base)) return base;

  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const maxBase = PROPOSAL_SLUG_MAX - suffix.length;
    const trimmed = base.slice(0, maxBase).replace(/-+$/g, "");
    const candidate = `${trimmed || "proposal"}${suffix}`;
    if (tryCandidate(candidate)) return candidate;
  }
  throw new Error("Could not suggest a free link.");
}

export type ProposalSlugMatch = {
  proposal: Proposal;
  matchedBy: "current" | "previous";
};

/** Resolve a public slug to a proposal, preferring the current slug. */
export function findProposalForSlug(
  proposals: Proposal[],
  slug: string,
): ProposalSlugMatch | null {
  if (!slug) return null;
  const current = proposals.find((p) => p.slug === slug);
  if (current) return { proposal: current, matchedBy: "current" };
  const previous = proposals.find((p) => p.previousSlugs?.includes(slug));
  if (previous) return { proposal: previous, matchedBy: "previous" };
  return null;
}

/** Path for a permanent redirect from an old slug, keeping ?preview=. */
export function previousSlugRedirectPath(
  currentSlug: string,
  preview?: string | null,
) {
  const qs =
    preview && preview.trim()
      ? `?preview=${encodeURIComponent(preview.trim())}`
      : "";
  return `/p/${currentSlug}${qs}`;
}

/** All slugs (current + previous) for uniqueness checks, optionally excluding one id. */
export function collectedProposalSlugs(
  proposals: Proposal[],
  exceptId?: string,
): Set<string> {
  const taken = new Set<string>();
  for (const proposal of proposals) {
    if (exceptId && proposal.id === exceptId) continue;
    if (proposal.slug) taken.add(proposal.slug);
    for (const previous of proposal.previousSlugs || []) {
      if (previous) taken.add(previous);
    }
  }
  return taken;
}

export function newPreviewToken() {
  return randomBytes(12).toString("base64url");
}

export function todayIsoDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultValidUntil(proposalDate: string, shootSoon = false) {
  return addDaysIso(proposalDate, shootSoon ? 14 : 30);
}

export function depositAmount(priceUsd: number, percent: number) {
  if (!Number.isFinite(priceUsd) || !Number.isFinite(percent)) return 0;
  return Math.round((priceUsd * percent) / 100);
}

export function isPastDate(isoDate: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const end = new Date(`${isoDate}T23:59:59.999Z`);
  return now.getTime() > end.getTime();
}

export function effectiveStatus(proposal: Proposal, now = new Date()): EffectiveStatus {
  if (proposal.status === "archived") return "archived";
  if (proposal.status === "draft") return "draft";
  if (proposal.status === "live" && isPastDate(proposal.validUntil, now)) return "expired";
  return proposal.status;
}

const FALLBACK_PUBLIC_ORIGIN = "https://oracleoffreedom.com";

/**
 * Canonical origin for proposal links shown or copied for clients.
 * Always the real domain — never the request host or a *.vercel.app alias.
 */
export function proposalBaseUrl() {
  try {
    const base = siteUrl().replace(/\/$/, "");
    if (!base) return FALLBACK_PUBLIC_ORIGIN;
    if (new URL(base).hostname.endsWith(".vercel.app")) return FALLBACK_PUBLIC_ORIGIN;
    return base;
  } catch {
    return FALLBACK_PUBLIC_ORIGIN;
  }
}

function canonicalProposalOrigin(origin?: string) {
  const candidate = (origin || proposalBaseUrl()).replace(/\/$/, "");
  try {
    if (!candidate || new URL(candidate).hostname.endsWith(".vercel.app")) {
      return proposalBaseUrl();
    }
    return candidate;
  } catch {
    return proposalBaseUrl();
  }
}

export function publicUrl(slug: string, origin?: string) {
  return `${canonicalProposalOrigin(origin)}/p/${slug}`;
}

export function previewUrl(slug: string, previewToken: string, origin?: string) {
  return `${publicUrl(slug, origin)}?preview=${encodeURIComponent(previewToken)}`;
}

export function imageSrc(image: ProposalImage | null | undefined) {
  if (!image) return "";
  if (image.mediaId) return `/api/media/${image.mediaId}`;
  return image.src || "";
}

export function cloneSections(sections: ProposalSection[]): ProposalSection[] {
  return structuredClone(sections);
}

export function findSection<T extends SectionType>(
  sections: ProposalSection[],
  type: T,
): ProposalSectionOf<T> | undefined {
  return sections.find((s): s is ProposalSectionOf<T> => s.type === type);
}

export function coverClientName(sections: ProposalSection[]) {
  const cover = findSection(sections, "cover");
  return cover?.data.clientName?.trim() || "";
}

const PLACEHOLDER_RE = /\[[^\]]+\]/;

export type ProposalWarning = {
  id: string;
  message: string;
};

export function proposalWarnings(proposal: Proposal): ProposalWarning[] {
  const warnings: ProposalWarning[] = [];
  const required: SectionType[] = ["cover", "noticed", "plan", "proof", "investment", "nextStep"];
  if (proposal.templateKind !== "quick") required.splice(4, 0, "howIWork", "deliverables");

  for (const type of required) {
    const section = findSection(proposal.sections, type);
    if (!section || !section.enabled) {
      warnings.push({ id: `missing-${type}`, message: `Required section “${type}” is off or missing.` });
    }
  }

  const cover = findSection(proposal.sections, "cover");
  if (cover?.enabled) {
    if (!cover.data.clientName.trim() || PLACEHOLDER_RE.test(cover.data.clientName)) {
      warnings.push({ id: "client-name", message: "Replace [Client name] on the cover." });
    }
    if (PLACEHOLDER_RE.test(cover.data.headline) || PLACEHOLDER_RE.test(cover.data.subtitle)) {
      warnings.push({ id: "cover-placeholders", message: "Cover still has placeholder text." });
    }
  }

  if (!proposal.validUntil) {
    warnings.push({ id: "valid-until", message: "Set an offer-valid-until date." });
  }

  const proof = findSection(proposal.sections, "proof");
  if (proof?.enabled && proof.data.portfolioLine.trim() !== PORTFOLIO_LINE) {
    warnings.push({
      id: "portfolio-line",
      message: "Proof portfolio line must match the exact wording.",
    });
  }

  const next = findSection(proposal.sections, "nextStep");
  if (next?.enabled) {
    const body = `${next.data.closingLine}\n${next.data.body}`;
    if (body.includes("—") || body.includes("–")) {
      warnings.push({ id: "em-dash", message: "Avoid em dashes in client-facing copy." });
    }
  }

  const aboutish = proposal.sections
    .filter((s) => s.enabled)
    .map((s) => JSON.stringify(s.data).toLowerCase())
    .join(" ");
  if (aboutish.includes("i'm a photographer") || aboutish.includes("i am a photographer")) {
    warnings.push({
      id: "photographer",
      message: "Never write “I'm a photographer”. She is a photo and film storyteller.",
    });
  }

  return warnings;
}

export function emptyImage(): ProposalImage {
  return { alt: "" };
}

function asString(value: unknown, max = 4000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function asNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asFocusPercent(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

function asZoom(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(3, Math.max(1, Math.round(n * 100) / 100));
}

function asImage(value: unknown): ProposalImage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const alt = asString(record.alt, 300);
  const mediaId = asString(record.mediaId, 64);
  const src = asString(record.src, 400);
  const caption = asString(record.caption, 300);
  const focusX = asFocusPercent(record.focusX);
  const focusY = asFocusPercent(record.focusY);
  const zoom = asZoom(record.zoom);
  const mobile = parseImageMobile(record.mobile);
  if (!mediaId && !src && !alt && focusX == null && focusY == null && zoom == null && !mobile) {
    return null;
  }
  return {
    ...(mediaId ? { mediaId } : {}),
    ...(src ? { src } : {}),
    alt,
    ...(caption ? { caption } : {}),
    ...(focusX != null ? { focusX } : {}),
    ...(focusY != null ? { focusY } : {}),
    ...(zoom != null ? { zoom } : {}),
    ...(mobile ? { mobile } : {}),
  };
}

function asImages(value: unknown): ProposalImage[] {
  if (!Array.isArray(value)) return [];
  return value.map(asImage).filter((img): img is ProposalImage => Boolean(img));
}

function parseCommonSectionFields(record: Record<string, unknown>) {
  const layoutRaw = asString(record.layout, 20);
  const layout = (SECTION_LAYOUTS as readonly string[]).includes(layoutRaw)
    ? (layoutRaw as SectionLayout)
    : undefined;
  const headingEmphasisRaw = asString(record.headingEmphasis, 20);
  const headingEmphasis = (HEADING_EMPHASIS as readonly string[]).includes(headingEmphasisRaw)
    ? (headingEmphasisRaw as HeadingEmphasis)
    : undefined;
  const images = asImages(record.images);
  const design = parseSectionDesign(record.design);
  const mobile = parseSectionMobile(record.mobile);
  return {
    ...(layout ? { layout } : {}),
    ...(headingEmphasis ? { headingEmphasis } : {}),
    ...(images.length ? { images } : {}),
    ...(design ? { design } : {}),
    ...(mobile ? { mobile } : {}),
  };
}

function parseTitleBodyStep(raw: unknown): HowIWorkStep {
  const s = (raw || {}) as Record<string, unknown>;
  const body = asString(s.body, 1200);
  const showBody = typeof s.showBody === "boolean" ? s.showBody : undefined;
  return {
    id: asString(s.id, 64) || newId("step"),
    title: asString(s.title, 160),
    body,
    ...(showBody !== undefined ? { showBody } : {}),
  };
}

function parsePlanScene(raw: unknown): PlanScene {
  const s = (raw || {}) as Record<string, unknown>;
  const body = asString(s.body, 1200);
  const showBody = typeof s.showBody === "boolean" ? s.showBody : undefined;
  return {
    id: asString(s.id, 64) || newId("scene"),
    title: asString(s.title, 160),
    body,
    ...(showBody !== undefined ? { showBody } : {}),
  };
}

function parsePriceLines(value: unknown): PriceLine[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const lines = value
    .map((line) => {
      const l = (line || {}) as Record<string, unknown>;
      const label = asString(l.label, 160);
      const price = asString(l.price, 80);
      if (!label && !price) return null;
      return {
        id: asString(l.id, 64) || newId("price"),
        label,
        price,
      };
    })
    .filter((line): line is PriceLine => Boolean(line));
  return lines.length ? lines : undefined;
}

export function defaultLayoutFor(type: SectionType): SectionLayout {
  const map: Record<SectionType, SectionLayout> = {
    cover: "stack",
    welcome: "text",
    noticed: "twoColumn",
    divider: "stack",
    plan: "twoColumn",
    proof: "stack",
    howIWork: "twoColumn",
    deliverables: "twoColumn",
    addon: "text",
    investment: "twoColumn",
    terms: "twoColumn",
    review: "text",
    nextStep: "text",
    signOff: "text",
    text: "text",
    photos: "stack",
    faq: "text",
    video: "stack",
    quote: "text",
    gallery: "stack",
    timeline: "text",
    cta: "text",
    columns: "twoColumn",
  };
  return map[type];
}

export function resolveLayout(section: ProposalSection): SectionLayout {
  return section.layout || defaultLayoutFor(section.type);
}

export function resolveHeadingEmphasis(section: ProposalSection): HeadingEmphasis {
  return section.headingEmphasis || "default";
}

export function sceneShowsBody(scene: { body: string; showBody?: boolean }) {
  if (scene.showBody === false) return false;
  return Boolean(scene.body?.trim());
}

export function addonPriceLines(data: AddonData): PriceLine[] {
  if (data.priceLines?.length) return data.priceLines;
  const lines: PriceLine[] = [];
  if (data.priceUsd > 0) lines.push({ id: "legacy-price", label: "Package", price: `US$${data.priceUsd}` });
  return lines;
}

export function ensureSignOffSection(sections: ProposalSection[]): ProposalSection[] {
  if (sections.some((s) => s.type === "signOff")) return sections;
  return [...sections, { id: newId("sec"), type: "signOff", enabled: true, data: { intro: "" } }];
}

function parseSection(raw: unknown): ProposalSection | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const type = asString(record.type, 40) as SectionType;
  if (!(SECTION_TYPES as readonly string[]).includes(type)) return null;
  const id = asString(record.id, 64) || newId("sec");
  const enabled = asBool(record.enabled, true);
  const common = parseCommonSectionFields(record);
  const data = (record.data && typeof record.data === "object" ? record.data : {}) as Record<string, unknown>;

  switch (type) {
    case "cover":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          clientName: asString(data.clientName, 120),
          kicker: asString(data.kicker, 160),
          headline: asString(data.headline, 240),
          headlineEmphasis: asString(data.headlineEmphasis, 120) || undefined,
          subtitle: asString(data.subtitle, 400),
          heroImage: asImage(data.heroImage),
          proposalDate: asString(data.proposalDate, 32),
        },
      };
    case "welcome":
      return { id, type, enabled, ...common, data: { body: asString(data.body, 4000) } };
    case "noticed":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "What we noticed",
          opportunity: asString(data.opportunity, 800),
          cards: Array.isArray(data.cards)
            ? data.cards.map((card) => {
                const c = (card || {}) as Record<string, unknown>;
                return {
                  id: asString(c.id, 64) || newId("card"),
                  title: asString(c.title, 160),
                  body: asString(c.body, 1200),
                  fullWidth: asBool(c.fullWidth, false) || undefined,
                };
              })
            : [],
        },
      };
    case "divider":
      return {
        id,
        type,
        enabled,
        ...common,
        data: { line: asString(data.line, 400), image: asImage(data.image) },
      };
    case "plan":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "The plan",
          intro: asString(data.intro, 2000),
          datesLabel: asString(data.datesLabel, 120) || "Dates",
          datesBody: asString(data.datesBody, 800),
          showDates: asBool(data.showDates, true),
          dayFlow: asString(data.dayFlow, 2000),
          consent: asString(data.consent, 1200),
          scenes: Array.isArray(data.scenes) ? data.scenes.map(parsePlanScene) : [],
        },
      };
    case "proof":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "Proof",
          images: asImages(data.images),
          videoUrl: asString(data.videoUrl, 500),
          videoMediaId: asString(data.videoMediaId, 64),
          videoCover: asImage(data.videoCover),
          portfolioLine: asString(data.portfolioLine, 300) || PORTFOLIO_LINE,
        },
      };
    case "howIWork":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "How I work",
          kicker: asString(data.kicker, 120),
          steps: Array.isArray(data.steps) ? data.steps.map(parseTitleBodyStep) : [],
        },
      };
    case "deliverables":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160) || "What's included",
          cards: Array.isArray(data.cards)
            ? data.cards.map((card, index) => {
                const c = (card || {}) as Record<string, unknown>;
                const accents = ["terracotta", "ember", "moss"] as const;
                const accentRaw = asString(c.accent, 20);
                return {
                  id: asString(c.id, 64) || newId("del"),
                  title: asString(c.title, 160),
                  items: Array.isArray(c.items)
                    ? c.items.map((item) => asString(item, 300)).filter(Boolean)
                    : [],
                  accent: (accents.includes(accentRaw as (typeof accents)[number])
                    ? accentRaw
                    : accents[index % 3]) as DeliverableCard["accent"],
                };
              })
            : [],
          outOfScope: asString(data.outOfScope, 1200),
          ...(asString(data.outOfScopeLabel, 80) ? { outOfScopeLabel: asString(data.outOfScopeLabel, 80) } : {}),
          usage: asString(data.usage, 1200),
          ...(asString(data.usageLabel, 80) ? { usageLabel: asString(data.usageLabel, 80) } : {}),
        },
      };
    case "addon":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "Optional add-on",
          title: asString(data.title, 160),
          body: asString(data.body, 1200),
          priceUsd: asNumber(data.priceUsd, 0),
          note: asString(data.note, 400),
          ...(parsePriceLines(data.priceLines) ? { priceLines: parsePriceLines(data.priceLines) } : {}),
          ...(Array.isArray(data.bullets)
            ? {
                bullets: data.bullets.map((item) => asString(item, 500)).filter(Boolean),
              }
            : {}),
        },
      };
    case "investment":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "Investment",
          clientLabel: asString(data.clientLabel, 120),
          packagePriceUsd: asNumber(data.packagePriceUsd, 0),
          currencyNote: asString(data.currencyNote, 80) || "USD",
          offerNote: asString(data.offerNote, 800),
          ...(asString(data.sideNote, 1200) ? { sideNote: asString(data.sideNote, 1200) } : {}),
          ...(asString(data.keyTerms, 400) ? { keyTerms: asString(data.keyTerms, 400) } : {}),
          depositPercent: asNumber(data.depositPercent, 50),
          normalRatesLine: asString(data.normalRatesLine, 400),
          compareRows: Array.isArray(data.compareRows)
            ? data.compareRows.map((row) => {
                const r = (row || {}) as Record<string, unknown>;
                return {
                  id: asString(r.id, 64) || newId("row"),
                  label: asString(r.label, 200),
                  amount: asString(r.amount, 80),
                  struck: asBool(r.struck, true),
                };
              })
            : [],
        },
      };
    case "terms":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "Terms",
          items: Array.isArray(data.items)
            ? data.items.map((item) => asString(item, 400)).filter(Boolean)
            : [],
        },
      };
    case "review": {
      const secondRaw =
        data.second && typeof data.second === "object"
          ? (data.second as Record<string, unknown>)
          : null;
      const secondQuote = secondRaw ? asString(secondRaw.quote, 2000) : "";
      const secondName = secondRaw ? asString(secondRaw.name, 160) : "";
      const secondService = secondRaw ? asString(secondRaw.service, 160) : "";
      const secondSource = secondRaw ? asString(secondRaw.sourceReviewId, 64) : "";
      const secondMetrics = secondRaw ? asString(secondRaw.metricsNote, 400) : "";
      const secondImage = secondRaw ? asImage(secondRaw.image) : null;
      const second =
        secondQuote || secondName || secondService || secondSource || secondMetrics || secondImage
          ? {
              quote: secondQuote,
              name: secondName,
              service: secondService,
              ...(secondSource ? { sourceReviewId: secondSource } : {}),
              ...(secondMetrics ? { metricsNote: secondMetrics } : {}),
              ...(secondImage ? { image: secondImage } : {}),
            }
          : null;
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "A word from a recent client",
          quote: asString(data.quote, 2000),
          name: asString(data.name, 160),
          service: asString(data.service, 160),
          sourceReviewId: asString(data.sourceReviewId, 64) || undefined,
          metricsNote: asString(data.metricsNote, 400),
          image: asImage(data.image),
          ...(second ? { second } : {}),
        },
      };
    }
    case "nextStep":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 120) || "Next step",
          body: asString(data.body, 2000),
          ctaLabel: asString(data.ctaLabel, 80),
          ctaHref: asString(data.ctaHref, 300),
          validUntilLabel: asString(data.validUntilLabel, 120) || "Offer valid until",
          closingLine: asString(data.closingLine, 400),
        },
      };
    case "signOff":
      return {
        id,
        type,
        enabled,
        ...common,
        data: { intro: asString(data.intro, 400) },
      };
    case "text":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          body: asString(data.body, 4000),
        },
      };
    case "photos":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          images: asImages(data.images),
        },
      };
    case "faq":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160) || "FAQ",
          items: Array.isArray(data.items)
            ? data.items.map((item) => {
                const row = (item || {}) as Record<string, unknown>;
                return {
                  id: asString(row.id, 64) || newId("faq"),
                  question: asString(row.question, 300),
                  answer: asString(row.answer, 2000),
                };
              })
            : [],
        },
      };
    case "video":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          videoUrl: asString(data.videoUrl, 500),
          videoMediaId: asString(data.videoMediaId, 64),
          videoCover: asImage(data.videoCover),
          caption: asString(data.caption, 400),
        },
      };
    case "quote":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          quote: asString(data.quote, 2000),
          name: asString(data.name, 160),
          role: asString(data.role, 160),
          image: asImage(data.image),
        },
      };
    case "gallery": {
      const columnsRaw = Math.floor(asNumber(data.columns, 3));
      const columns = ([2, 3, 4] as const).includes(columnsRaw as GalleryColumns)
        ? (columnsRaw as GalleryColumns)
        : 3;
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          columns,
          images: asImages(data.images),
        },
      };
    }
    case "timeline":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160) || "Timeline",
          items: Array.isArray(data.items)
            ? data.items.map((item) => {
                const row = (item || {}) as Record<string, unknown>;
                return {
                  id: asString(row.id, 64) || newId("time"),
                  when: asString(row.when, 120),
                  title: asString(row.title, 200),
                  body: asString(row.body, 1200),
                };
              })
            : [],
        },
      };
    case "cta":
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          body: asString(data.body, 1200),
          buttons: Array.isArray(data.buttons)
            ? data.buttons
                .map((item) => {
                  const row = (item || {}) as Record<string, unknown>;
                  const label = asString(row.label, 80);
                  const href = asString(row.href, 400);
                  if (!label && !href) return null;
                  return {
                    id: asString(row.id, 64) || newId("cta"),
                    label,
                    href,
                  };
                })
                .filter((button): button is CtaButton => Boolean(button))
                .slice(0, 2)
            : [],
        },
      };
    case "columns": {
      const countRaw = Math.floor(asNumber(data.columnCount, 2));
      const columnCount = countRaw === 3 ? 3 : 2;
      const columns = Array.isArray(data.columns)
        ? data.columns.map((item) => {
            const row = (item || {}) as Record<string, unknown>;
            return {
              id: asString(row.id, 64) || newId("col"),
              heading: asString(row.heading, 160),
              body: asString(row.body, 2000),
              image: asImage(row.image),
            };
          })
        : [];
      while (columns.length < columnCount) {
        columns.push({ id: newId("col"), heading: "", body: "", image: null });
      }
      return {
        id,
        type,
        enabled,
        ...common,
        data: {
          heading: asString(data.heading, 160),
          columnCount,
          columns: columns.slice(0, columnCount),
        },
      };
    }
    default:
      return null;
  }
}

export function parseTemplate(raw: unknown): ProposalTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = asString(record.id, 64);
  const name = asString(record.name, 160);
  const kind = asString(record.kind, 40) as TemplateKind;
  if (!id || !name || !(TEMPLATE_KINDS as readonly string[]).includes(kind)) return null;
  const sections = Array.isArray(record.sections)
    ? record.sections.map(parseSection).filter((s): s is ProposalSection => Boolean(s))
    : [];
  const design = parseProposalDesign(record.design);
  const formatVersion = Math.max(0, Math.floor(asNumber(record.formatVersion, 0)));
  return {
    id,
    name,
    kind,
    createdAt: asString(record.createdAt, 40) || new Date(0).toISOString(),
    updatedAt: asString(record.updatedAt, 40) || new Date(0).toISOString(),
    builtin: asBool(record.builtin, false) || undefined,
    ...(asBool(record.hidden, false) ? { hidden: true } : {}),
    ...(design ? { design } : {}),
    ...(formatVersion > 0 ? { formatVersion } : {}),
    sections: ensureSignOffSection(sections),
  };
}

export function parseProposal(raw: unknown): Proposal | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = asString(record.id, 64);
  const slug = asString(record.slug, 80);
  const status = asString(record.status, 20) as ProposalStatus;
  if (!id || !slug || !(PROPOSAL_STATUSES as readonly string[]).includes(status)) return null;
  const kind = asString(record.templateKind, 40) as TemplateKind;
  const sections = Array.isArray(record.sections)
    ? record.sections.map(parseSection).filter((s): s is ProposalSection => Boolean(s))
    : [];
  const design = parseProposalDesign(record.design);
  const contentRevision = Math.max(0, Math.floor(asNumber(record.contentRevision, 0)));
  const previousSlugs = Array.isArray(record.previousSlugs)
    ? [
        ...new Set(
          record.previousSlugs
            .map((value) => asString(value, PROPOSAL_SLUG_MAX))
            .filter((value) => value && value !== slug),
        ),
      ]
    : [];
  return {
    id,
    slug,
    ...(previousSlugs.length ? { previousSlugs } : {}),
    previewToken: asString(record.previewToken, 64) || newPreviewToken(),
    templateId: asString(record.templateId, 64),
    templateKind: (TEMPLATE_KINDS as readonly string[]).includes(kind) ? kind : "custom",
    clientName: asString(record.clientName, 120),
    projectTitle: asString(record.projectTitle, 200),
    status,
    createdAt: asString(record.createdAt, 40) || new Date(0).toISOString(),
    updatedAt: asString(record.updatedAt, 40) || new Date(0).toISOString(),
    proposalDate: asString(record.proposalDate, 32) || todayIsoDate(),
    validUntil: asString(record.validUntil, 32),
    viewCount: Math.max(0, Math.floor(asNumber(record.viewCount, 0))),
    lastOpenedAt: asString(record.lastOpenedAt, 40),
    example: asBool(record.example, false) || undefined,
    ...(design ? { design } : {}),
    ...(contentRevision > 0 ? { contentRevision } : {}),
    sections: ensureSignOffSection(sections),
  };
}

/** Stable fingerprint for change detection in the editor. */
export function proposalFingerprint(proposal: Proposal) {
  return createHash("sha256").update(JSON.stringify(proposal)).digest("hex").slice(0, 16);
}

export function sectionLabel(type: SectionType) {
  const labels: Record<SectionType, string> = {
    cover: "Cover",
    welcome: "Welcome",
    noticed: "What we noticed",
    divider: "Divider",
    plan: "The plan / dates",
    proof: "Proof",
    howIWork: "How I work",
    deliverables: "What's included",
    addon: "Optional add-on",
    investment: "Investment",
    terms: "Terms",
    review: "Review",
    nextStep: "Next step",
    signOff: "Sign-off",
    text: "Text block",
    photos: "Photo strip",
    faq: "FAQ",
    video: "Video",
    quote: "Quote",
    gallery: "Gallery",
    timeline: "Timeline",
    cta: "Call to action",
    columns: "Columns",
  };
  return labels[type];
}
