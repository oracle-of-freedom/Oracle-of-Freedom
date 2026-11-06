import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  gallery,
  imageById,
  testimonials,
  videos,
  type Film,
  type GalleryImage,
  type Testimonial,
  type VideoItem,
} from "@/lib/content";
import {
  emptyLiveContent,
  mediaSrc,
  orderNumber,
  pickText,
  resolveText,
  type LiveContent,
  type LivePhoto,
  type LiveReview,
  type LiveVideo,
  type ReviewPageId,
  type VideoPageId,
} from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { isPublishedPhoto } from "@/lib/utils";

async function loadLiveContent(): Promise<LiveContent> {
  try {
    return await readLiveContent();
  } catch (error) {
    console.error("[live-content] using what is in the repo", error);
    return emptyLiveContent();
  }
}

const cachedLiveContent = unstable_cache(loadLiveContent, ["live-content"], { tags: ["live-content"] });

export const getLiveContent = cache(async () => cachedLiveContent());

/** Where the reviews that ship with the site appear until Agota moves them. */
export const DEFAULT_REVIEW_PAGES: Record<ReviewPageId, string[]> = {
  home: ["india", "oliwia", "sage", "rewild", "kliq-press", "kliq", "nixie", "bliss-burn", "anael", "couple", "retreat", "artist"],
  people: ["india", "oliwia"],
  portraits: ["oliwia", "india", "couple", "soul-brand"],
  elopements: ["elopement", "wedding"],
  retreats: ["retreat"],
  festivals: ["rewild", "kliq-press", "kliq", "nixie", "bliss-burn", "anael", "sage", "artist"],
  places: ["place"],
};

/** Published reviews that ship with the site. Placeholders are left out. */
export function bundledReviews() {
  return testimonials.filter((item) => item.placeholder === false);
}

export function defaultPagesFor(id: string) {
  return (Object.keys(DEFAULT_REVIEW_PAGES) as ReviewPageId[]).filter((page) =>
    DEFAULT_REVIEW_PAGES[page].includes(id),
  );
}

export function applyTweak(item: Testimonial, live: LiveContent): Testimonial {
  const tweak = live.reviewTweaks[item.id];
  if (!tweak) return item;
  return {
    ...item,
    ...(tweak.name !== undefined ? { name: tweak.name } : {}),
    ...(tweak.service ? { shoot: resolveText(tweak.service) } : {}),
  };
}

export function liveReviewToTestimonial(review: LiveReview): Testimonial {
  return {
    id: review.id,
    placeholder: false,
    name: review.name,
    shoot: resolveText(review.service),
    quote: resolveText(review.quote),
  };
}

/** The reviews for one page: pinned new ones, the older ones, then the other new ones. */
export async function getReviews(page: ReviewPageId): Promise<Testimonial[]> {
  const live = await getLiveContent();
  const defaults = DEFAULT_REVIEW_PAGES[page];

  const older = bundledReviews()
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const tweak = live.reviewTweaks[item.id];
      if (tweak?.hidden) return false;
      return tweak?.pages ? tweak.pages.includes(page) : defaults.includes(item.id);
    })
    .sort((a, b) => {
      const left = defaults.indexOf(a.item.id);
      const right = defaults.indexOf(b.item.id);
      const keyA = left === -1 ? defaults.length + a.index : left;
      const keyB = right === -1 ? defaults.length + b.index : right;
      return keyA - keyB;
    })
    .map(({ item }) => applyTweak(item, live));

  const added = live.reviews
    .filter((review) => !review.hidden && review.pages.includes(page))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return [
    ...added.filter((review) => review.first).map(liveReviewToTestimonial),
    ...older,
    ...added.filter((review) => !review.first).map(liveReviewToTestimonial),
  ];
}

export function livePhotoToImage(photo: LivePhoto): GalleryImage {
  const fallback = "Photograph by Agota Urbikaite";
  const tabs = photo.pages.includes("portfolio") ? ["all", ...photo.tabs] : [];
  return {
    id: `live-${photo.id}`,
    src: mediaSrc(photo.mediaId),
    width: photo.width,
    height: photo.height,
    blur: photo.blur,
    category: photo.tabs[0] ?? "portraits",
    categories: photo.tabs,
    pages: photo.pages,
    portfolioTabs: tabs,
    featured: photo.pages.includes("home"),
    provisional: false,
    placeholder: false,
    order: orderNumber(photo.first, photo.createdAt),
    alt: {
      en: pickText(photo.alt, "en") || fallback,
      es: photo.alt.es.trim() || photo.alt.en.trim() || "Fotografía de Agota Urbikaite",
      pt: photo.alt.pt.trim() || photo.alt.en.trim() || "Fotografia de Agota Urbikaite",
    },
    source: "Agota Urbikaite",
  };
}

export async function getGallery(): Promise<GalleryImage[]> {
  const live = await getLiveContent();
  return [...gallery, ...live.photos.map(livePhotoToImage)];
}

export async function getImagesForPage(page: string) {
  return (await getGallery())
    .filter((image) => image.pages.includes(page) && isPublishedPhoto(image))
    .sort((a, b) => a.order - b.order);
}

export async function getFeaturedImages() {
  return (await getGallery())
    .filter((image) => image.featured && image.pages.includes("home") && isPublishedPhoto(image))
    .sort((a, b) => a.order - b.order);
}

/** Portfolio photos in the order the page already used: the repo list first, new work after. */
export async function getPortfolioImages() {
  const shown = (await getGallery()).filter(
    (image) => isPublishedPhoto(image) && (image.pages.includes("portfolio") || image.featured),
  );
  const added = shown.filter((image) => image.id.startsWith("live-")).sort((a, b) => a.order - b.order);
  const older = shown.filter((image) => !image.id.startsWith("live-"));
  return [...added.filter((image) => image.order < 0), ...older, ...added.filter((image) => image.order >= 0)];
}

function liveVideoToFilm(video: LiveVideo): Film {
  const item: VideoItem = {
    id: `live-${video.id}`,
    platform: video.platform,
    url: video.url,
    ...(video.youtubeId ? { youtubeId: video.youtubeId } : {}),
    ...(video.embedUrl ? { embedUrl: video.embedUrl } : {}),
    posterId: `live-${video.posterMediaId}`,
    verify: false,
    label: {
      en: video.caption.en.trim(),
      es: video.caption.es.trim() || video.caption.en.trim(),
      pt: video.caption.pt.trim() || video.caption.en.trim(),
    },
  };
  return {
    video: item,
    poster: { src: mediaSrc(video.posterMediaId), width: video.posterWidth, height: video.posterHeight },
  };
}

/** The films for a page. The ones that ship with the site show everywhere they did before. */
export async function getFilms(page: VideoPageId): Promise<Film[]> {
  const live = await getLiveContent();
  const older: Film[] = videos.items.map((video) => {
    const poster = imageById(video.posterId);
    return { video, poster: { src: poster.src, width: poster.width, height: poster.height } };
  });
  const added = live.videos
    .filter((video) => video.pages.includes(page))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [
    ...added.filter((video) => video.first).map(liveVideoToFilm),
    ...older,
    ...added.filter((video) => !video.first).map(liveVideoToFilm),
  ];
}
