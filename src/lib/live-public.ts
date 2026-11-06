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
  PHOTO_PAGE_IDS,
  PORTFOLIO_TAB_IDS,
  VIDEO_PAGE_IDS,
  emptyLiveContent,
  mediaSrc,
  orderNumber,
  parseLiveContent,
  pickText,
  resolveText,
  type LiveContent,
  type LivePhoto,
  type PhotoTweak,
  type VideoTweak,
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

// A copy cached by an older release may lack newer fields, so it is read through the parser again.
export const getLiveContent = cache(async () => parseLiveContent(await cachedLiveContent()));

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

const EDITABLE_PAGES: readonly string[] = PHOTO_PAGE_IDS;

/** Photos that ship with the site and can be moved from the studio. The cover and About photos stay put. */
export function editableBundledPhotos() {
  return gallery.filter(
    (image) => isPublishedPhoto(image) && image.id !== "cover-wide" && !image.id.startsWith("about-"),
  );
}

/** Where a photo that ships with the site goes now, in the terms the studio uses. */
export function builtInPlacement(image: GalleryImage) {
  const pages = PHOTO_PAGE_IDS.filter((page) => {
    if (page === "portfolio") return image.pages.includes("portfolio") || image.featured;
    return image.pages.includes(page);
  });
  const tabs = PORTFOLIO_TAB_IDS.filter((tab) =>
    image.portfolioTabs !== undefined
      ? image.portfolioTabs.includes(tab)
      : image.categories.includes(tab) || image.category === tab,
  );
  return { pages: [...pages], tabs: [...tabs] };
}

export function applyPhotoTweak(image: GalleryImage, tweak: PhotoTweak | undefined): GalleryImage {
  if (!tweak) return image;
  const kept = image.pages.filter((page) => !EDITABLE_PAGES.includes(page));
  const inPortfolio = tweak.pages.includes("portfolio");
  return {
    ...image,
    tweaked: true,
    pages: [...kept, ...tweak.pages],
    featured: tweak.pages.includes("home"),
    portfolioTabs: inPortfolio ? ["all", ...tweak.tabs] : [],
    order: tweak.first ? image.order - 1_000_000 : image.order,
    alt: {
      en: tweak.alt.en.trim() || image.alt.en,
      es: tweak.alt.es.trim() || image.alt.es,
      pt: tweak.alt.pt.trim() || image.alt.pt,
    },
  };
}

export async function getGallery(): Promise<GalleryImage[]> {
  const live = await getLiveContent();
  const older = gallery
    .filter((image) => !live.photoTweaks[image.id]?.hidden)
    .map((image) => applyPhotoTweak(image, live.photoTweaks[image.id]));
  return [...older, ...live.photos.map(livePhotoToImage)];
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
    (image) =>
      isPublishedPhoto(image) &&
      (image.pages.includes("portfolio") || (image.featured && image.tweaked !== true)),
  );
  const added = shown.filter((image) => image.id.startsWith("live-")).sort((a, b) => a.order - b.order);
  const bundled = shown.filter((image) => !image.id.startsWith("live-"));
  // Photos pinned to the front, from the studio, lead in the order they were pinned.
  const pinned = bundled.filter((image) => image.order < -500_000).sort((a, b) => a.order - b.order);
  const older = bundled.filter((image) => image.order >= -500_000);
  return [
    ...pinned,
    ...added.filter((image) => image.order < 0),
    ...older,
    ...added.filter((image) => image.order >= 0),
  ];
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
  const bundled = videos.items
    .filter((video) => {
      const tweak = live.videoTweaks[video.id];
      if (!tweak) return true;
      return !tweak.hidden && tweak.pages.includes(page);
    })
    .map((video) => ({ video: applyVideoTweak(video, live.videoTweaks[video.id]), tweak: live.videoTweaks[video.id] }))
    .map(({ video, tweak }) => {
      const poster = imageById(video.posterId);
      return { first: tweak?.first === true, film: { video, poster: { src: poster.src, width: poster.width, height: poster.height } } };
    });
  const added = live.videos
    .filter((video) => video.pages.includes(page))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [
    ...added.filter((video) => video.first).map(liveVideoToFilm),
    ...bundled.filter((item) => item.first).map((item) => item.film),
    ...bundled.filter((item) => !item.first).map((item) => item.film),
    ...added.filter((video) => !video.first).map(liveVideoToFilm),
  ];
}

/** Where the films that ship with the site show until Agota moves them. */
export const DEFAULT_FILM_PAGES: string[] = [...VIDEO_PAGE_IDS];

/** The films that ship with the site. */
export function bundledFilms() {
  return videos.items;
}

export function applyVideoTweak(video: VideoItem, tweak: VideoTweak | undefined): VideoItem {
  if (!tweak) return video;
  return {
    ...video,
    label: {
      en: tweak.caption.en.trim() || video.label.en,
      es: tweak.caption.es.trim() || video.label.es,
      pt: tweak.caption.pt.trim() || video.label.pt,
    },
  };
}
