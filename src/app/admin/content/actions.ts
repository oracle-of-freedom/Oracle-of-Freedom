"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { isAdmin } from "@/lib/admin-auth";
import { jpegSize } from "@/lib/jpeg";
import {
  LIMITS,
  PHOTO_PAGE_IDS,
  PORTFOLIO_TAB_IDS,
  REVIEW_PAGE_IDS,
  VIDEO_PAGE_IDS,
  isMediaId,
  parseVideoUrl,
  type LiveContent,
  type LocalText,
} from "@/lib/live-content";
import { readLiveContent, writeLiveContent } from "@/lib/live-content-store";
import { bundledReviews } from "@/lib/live-public";
import { deleteMedia, saveMedia } from "@/lib/media-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function refresh() {
  revalidateTag("live-content", "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin/content", "layout");
}

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) || "").trim().slice(0, max);
}

function localField(formData: FormData, prefix: string, max: number): LocalText {
  return {
    en: field(formData, `${prefix}En`, max),
    es: field(formData, `${prefix}Es`, max),
    pt: field(formData, `${prefix}Pt`, max),
  };
}

function picked(formData: FormData, name: string, allowed: readonly string[]) {
  const values = formData.getAll(name).map(String);
  return allowed.filter((id) => values.includes(id));
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

type Update = (content: LiveContent) => string | null | void;

/** Read what is saved, change it, and save it again. A string result is an error to show. */
async function change(update: Update): Promise<ActionState> {
  const t = studioCopy(await studioLang());
  try {
    const content = await readLiveContent();
    const problem = update(content);
    if (problem) return { error: problem };
    await writeLiveContent(content);
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("[content] save failed", error);
    return { error: error instanceof Error && error.message ? error.message : t.content.errors.save };
  }
}

export async function saveReview(_state: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const id = field(formData, "id", 64);
  const bundled = formData.get("bundled") === "1";
  const pages = picked(formData, "pages", REVIEW_PAGE_IDS);
  const hidden = checked(formData, "hidden");
  const name = field(formData, "name", LIMITS.name);
  const service = localField(formData, "service", LIMITS.service);
  const first = checked(formData, "first");

  if (!hidden && pages.length === 0) return { error: t.content.errors.pages };

  if (bundled) {
    if (!bundledReviews().some((item) => item.id === id)) return { error: t.content.errors.missing };
    return change((content) => {
      content.reviewTweaks[id] = { name, service, pages, ...(hidden ? { hidden: true } : {}) };
    });
  }

  const quote = localField(formData, "quote", LIMITS.quote);
  if (!quote.en) return { error: t.content.errors.quote };

  return change((content) => {
    const existing = id ? content.reviews.find((item) => item.id === id) : undefined;
    if (id && !existing) return t.content.errors.missing;
    if (existing) {
      Object.assign(existing, { quote, name, service, pages, first, hidden });
      return;
    }
    if (content.reviews.length >= LIMITS.reviews) return t.content.errors.full;
    content.reviews.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      quote,
      name,
      service,
      pages,
      first,
      hidden,
    });
  });
}

export async function deleteReview(formData: FormData) {
  await guard();
  const id = field(formData, "id", 64);
  await change((content) => {
    content.reviews = content.reviews.filter((item) => item.id !== id);
  });
}

type UploadedPhoto = { id: string; width: number; height: number; blur: string };

function readUploads(raw: string): UploadedPhoto[] {
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map((item): UploadedPhoto | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const width = Number(row.width);
        const height = Number(row.height);
        if (!isMediaId(row.id) || !Number.isInteger(width) || !Number.isInteger(height)) return null;
        if (width < 1 || height < 1 || width > 12000 || height > 12000) return null;
        const blur = typeof row.blur === "string" && row.blur.startsWith("data:image/") && row.blur.length < 3000 ? row.blur : "";
        return { id: row.id, width, height, blur };
      })
      .filter((item): item is UploadedPhoto => item !== null)
      .slice(0, 40);
  } catch {
    return [];
  }
}

export async function addPhotos(_state: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const uploads = readUploads(String(formData.get("photos") || ""));
  if (uploads.length === 0) return { error: t.content.errors.photos };
  const pages = picked(formData, "pages", PHOTO_PAGE_IDS);
  if (pages.length === 0) return { error: t.content.errors.pages };
  const tabs = picked(formData, "tabs", PORTFOLIO_TAB_IDS);
  const alt = localField(formData, "alt", LIMITS.alt);
  const first = formData.get("position") === "first";

  return change((content) => {
    if (content.photos.length + uploads.length > LIMITS.photos) return t.content.errors.full;
    const now = Date.now();
    uploads.forEach((upload, index) => {
      content.photos.push({
        id: randomUUID(),
        // A second apart keeps a batch in the order it was chosen.
        createdAt: new Date(now + (first ? uploads.length - index : index) * 1000).toISOString(),
        mediaId: upload.id,
        width: upload.width,
        height: upload.height,
        blur: upload.blur,
        pages,
        tabs,
        first,
        alt,
      });
    });
  });
}

export async function savePhoto(_state: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const id = field(formData, "id", 64);
  const pages = picked(formData, "pages", PHOTO_PAGE_IDS);
  if (pages.length === 0) return { error: t.content.errors.pages };
  const tabs = picked(formData, "tabs", PORTFOLIO_TAB_IDS);
  const alt = localField(formData, "alt", LIMITS.alt);
  const first = formData.get("position") === "first";
  return change((content) => {
    const photo = content.photos.find((item) => item.id === id);
    if (!photo) return t.content.errors.missing;
    Object.assign(photo, { pages, tabs, alt, first });
  });
}

export async function deletePhoto(formData: FormData) {
  await guard();
  const id = field(formData, "id", 64);
  let mediaId = "";
  await change((content) => {
    mediaId = content.photos.find((item) => item.id === id)?.mediaId ?? "";
    content.photos = content.photos.filter((item) => item.id !== id);
  });
  if (mediaId) await deleteMedia(mediaId).catch(() => undefined);
}

/** The cover YouTube already has for a video, kept as our own picture. */
async function youtubeCover(youtubeId: string) {
  for (const name of ["maxresdefault", "mqdefault"]) {
    try {
      const response = await fetch(`https://i.ytimg.com/vi/${youtubeId}/${name}.jpg`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      const size = jpegSize(bytes);
      if (!size || bytes.length > 4 * 1024 * 1024) continue;
      const id = randomUUID();
      await saveMedia(id, bytes);
      return { id, width: size.width, height: size.height };
    } catch {
      continue;
    }
  }
  return null;
}

export async function saveVideo(_state: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const id = field(formData, "id", 64);
  const parsed = parseVideoUrl(field(formData, "url", 500));
  if (!parsed) return { error: t.content.errors.link };
  const pages = picked(formData, "pages", VIDEO_PAGE_IDS);
  if (pages.length === 0) return { error: t.content.errors.pages };
  const caption = localField(formData, "caption", LIMITS.caption);
  const first = formData.get("position") === "first";

  const uploadedId = field(formData, "posterId", 64);
  const uploaded = isMediaId(uploadedId)
    ? {
        id: uploadedId,
        width: Number(formData.get("posterWidth")) || 1280,
        height: Number(formData.get("posterHeight")) || 720,
      }
    : null;

  const current = await readLiveContent().catch(() => null);
  const existing = id ? current?.videos.find((item) => item.id === id) : undefined;
  if (id && !existing) return { error: t.content.errors.missing };

  let poster = uploaded;
  if (!poster && existing) {
    poster = { id: existing.posterMediaId, width: existing.posterWidth, height: existing.posterHeight };
  }
  let ownCover = false;
  if (!poster && parsed.platform === "youtube") {
    poster = await youtubeCover(parsed.youtubeId);
    ownCover = true;
    if (!poster) return { error: t.content.errors.posterFetch };
  }
  if (!poster) return { error: t.content.errors.poster };
  const cover = poster;

  let replaced = "";
  const result = await change((content) => {
    const found = existing ? content.videos.find((item) => item.id === existing.id) : undefined;
    if (existing && !found) return t.content.errors.missing;
    const base = {
      platform: parsed.platform,
      url: parsed.url,
      ...(parsed.platform === "youtube" ? { youtubeId: parsed.youtubeId } : { embedUrl: parsed.embedUrl }),
      posterMediaId: cover.id,
      posterWidth: cover.width,
      posterHeight: cover.height,
      caption,
      pages,
      first,
    } as const;
    if (found) {
      if (found.posterMediaId !== cover.id) replaced = found.posterMediaId;
      Object.assign(found, base);
      if (parsed.platform === "youtube") delete found.embedUrl;
      else delete found.youtubeId;
      return;
    }
    if (content.videos.length >= LIMITS.videos) return t.content.errors.full;
    content.videos.push({ id: randomUUID(), createdAt: new Date().toISOString(), ...base });
  });
  if (result?.error && (uploaded || ownCover)) await deleteMedia(cover.id).catch(() => undefined);
  if (replaced) await deleteMedia(replaced).catch(() => undefined);
  return result;
}

export async function deleteVideo(formData: FormData) {
  await guard();
  const id = field(formData, "id", 64);
  let mediaId = "";
  await change((content) => {
    mediaId = content.videos.find((item) => item.id === id)?.posterMediaId ?? "";
    content.videos = content.videos.filter((item) => item.id !== id);
  });
  if (mediaId) await deleteMedia(mediaId).catch(() => undefined);
}
