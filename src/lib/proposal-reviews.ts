import type { Locale } from "@/i18n/routing";
import type { LiveContent, LiveReview, LocalText } from "@/lib/live-content";
import type { ProposalImage, ReviewData } from "@/lib/proposals";

/** Studio review ready for the proposal/template picker. */
export type ProposalStudioReview = {
  id: string;
  name: string;
  quote: string;
  service: string;
  /** Short label for the dropdown option. */
  optionLabel: string;
  hidden: boolean;
  /** Optional photo when the studio review carries one later. */
  image?: ProposalImage | null;
};

export function pickLocalText(
  text: LocalText | Partial<Record<Locale, string>> | undefined,
  locale: Locale,
) {
  if (!text) return "";
  const preferred = (text[locale] || "").trim();
  if (preferred) return preferred;
  return (text.en || "").trim();
}

function previewQuote(quote: string, max = 48) {
  const clean = quote.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function formatReviewOptionLabel(input: {
  name: string;
  service: string;
  quote: string;
  hidden?: boolean;
}) {
  const name = input.name.trim() || "Untitled review";
  const service = input.service.trim();
  const quoteBit = previewQuote(input.quote);
  const parts = [name];
  if (service) parts.push(service);
  if (quoteBit) parts.push(quoteBit);
  const base = parts.join(" · ");
  return input.hidden ? `${base} (hidden on site)` : base;
}

export function studioReviewFromLive(review: LiveReview, locale: Locale): ProposalStudioReview {
  const quote = pickLocalText(review.quote, locale);
  const service = pickLocalText(review.service, locale);
  return {
    id: review.id,
    name: review.name,
    quote,
    service,
    hidden: review.hidden,
    optionLabel: formatReviewOptionLabel({
      name: review.name,
      service,
      quote,
      hidden: review.hidden,
    }),
    image: null,
  };
}

/** True when the quote is empty or still the Agota placeholder. */
export function isReviewPlaceholder(quote: string) {
  const trimmed = quote.trim();
  if (!trimmed) return true;
  return /\[REVIEW:/i.test(trimmed);
}

export function reviewSlotHasContent(slot: { quote?: string } | null | undefined) {
  if (!slot) return false;
  return !isReviewPlaceholder(slot.quote || "");
}

export function reviewSectionHasContent(data: ReviewData) {
  return reviewSlotHasContent(data) || reviewSlotHasContent(data.second);
}

/** Shape used when assembling the full Studio list on the server. */
export type BundledReviewInput = {
  id: string;
  name?: string;
  shoot?: Partial<Record<Locale, string>>;
  quote: Partial<Record<Locale, string>>;
};

/**
 * Full Studio → Content → Reviews list for the proposal picker.
 * Call from server pages with bundled reviews + live content.
 */
export function listProposalStudioReviews(
  live: LiveContent | null | undefined,
  bundled: BundledReviewInput[],
  locale: Locale = "en",
): ProposalStudioReview[] {
  const content = live ?? {
    reviews: [] as LiveReview[],
    reviewTweaks: {} as LiveContent["reviewTweaks"],
  };
  const added = [...(content.reviews || [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((review) => studioReviewFromLive(review, locale));

  const older = bundled.map((item) => {
    const tweak = content.reviewTweaks?.[item.id];
    const name = tweak?.name ?? item.name ?? "";
    const serviceText = tweak?.service
      ? pickLocalText(tweak.service, locale)
      : pickLocalText(item.shoot, locale);
    const quote = pickLocalText(item.quote, locale);
    const hidden = tweak?.hidden === true;
    return {
      id: item.id,
      name,
      quote,
      service: serviceText,
      hidden,
      optionLabel: formatReviewOptionLabel({ name, service: serviceText, quote, hidden }),
      image: null,
    } satisfies ProposalStudioReview;
  });

  return [...added, ...older];
}
