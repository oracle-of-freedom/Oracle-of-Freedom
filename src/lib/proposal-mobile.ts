/**
 * Optional phone overrides for proposals.
 *
 * Missing mobile values fall back to the desktop value. Public pages apply
 * overrides with CSS container queries (and matching viewport media queries).
 * Print / PDF always uses the desktop values.
 */

import type { CSSProperties } from "react";
import {
  IMAGE_CROP_FOCUS_DEFAULT,
  IMAGE_CROP_ZOOM_DEFAULT,
  clampFocus,
  clampZoom,
  roundCropValue,
  type ImageCrop,
} from "@/lib/proposal-image-crop";

export const PROPOSAL_PHONE_MAX = 767;

export type DesignAlign = "left" | "center" | "right";

/** Structural image shape used by phone helpers (avoids a cycle with proposals.ts). */
export type ImageWithMobile = {
  focusX?: number;
  focusY?: number;
  zoom?: number;
  mobile?: ProposalImageMobile;
};

/** Structural section shape used by phone helpers. */
export type SectionWithMobile = {
  id: string;
  type: string;
  mobile?: SectionMobile;
  images?: ImageWithMobile[];
  data?: Record<string, unknown>;
};

export type ImageAspect = "auto" | "1:1" | "4:5" | "3:4" | "16:9";
export type TextScale = "small" | "normal" | "large";
export type CoverImageSide = "behind" | "top";
export type ReviewPhoneLayout = "stack" | "side";

export type ProposalImageMobile = {
  focusX?: number;
  focusY?: number;
  zoom?: number;
  /** CSS height, for example 62mm. */
  height?: string;
  aspect?: ImageAspect;
  /** When true, hide this image under the phone breakpoint. */
  hidden?: boolean;
};

export type CoverMobileDesign = {
  heroHeight?: string;
  logoSize?: string;
  dateSize?: string;
  dateOffset?: string;
  /** Title (h1) size, CSS length such as 26pt. */
  titleSize?: string;
  textAlign?: DesignAlign;
  /** Image stacked above copy, or behind as today. */
  imageSide?: CoverImageSide;
};

export type ProposalDesignMobile = {
  cover?: CoverMobileDesign;
  /** Plan columns on phone. Prefer `1fr` or `1fr 1fr`. */
  planColumns?: string;
  investmentColumns?: string;
  /** Proof photo grid columns. */
  proofColumns?: 1 | 2;
  /** Reviews stacked or side by side. */
  reviewLayout?: ReviewPhoneLayout;
};

export type SectionMobile = {
  /** Hide this section under the phone breakpoint. */
  hidden?: boolean;
  /** Sort key for phone order. Lower first. Missing keeps desktop array order. */
  order?: number;
  marginTop?: string;
  marginBottom?: string;
  headingSize?: TextScale | string;
  bodySize?: TextScale | string;
};

export type ProposalDesignWithMobile = {
  mobile?: ProposalDesignMobile;
};

const ASPECTS: ImageAspect[] = ["auto", "1:1", "4:5", "3:4", "16:9"];
const SCALES: TextScale[] = ["small", "normal", "large"];

function asCss(value: unknown, max = 80) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, max);
  if (!trimmed || /[{};<>]/.test(trimmed)) return "";
  return trimmed;
}

function asAlign(value: unknown): DesignAlign | undefined {
  return value === "left" || value === "center" || value === "right" ? value : undefined;
}

function asAspect(value: unknown): ImageAspect | undefined {
  return typeof value === "string" && (ASPECTS as string[]).includes(value)
    ? (value as ImageAspect)
    : undefined;
}

function asScaleOrCss(value: unknown): TextScale | string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 40);
  if (!trimmed) return undefined;
  if ((SCALES as string[]).includes(trimmed)) return trimmed as TextScale;
  return asCss(trimmed, 40) || undefined;
}

function asFocusPercent(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return roundCropValue(clampFocus(n));
}

function asZoom(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return roundCropValue(clampZoom(n), 2);
}

function asOrder(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(999, Math.max(0, Math.round(n)));
}

function asColumns(value: unknown): 1 | 2 | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 2) return n;
  return undefined;
}

/** Merge mobile onto desktop. Missing mobile keys keep the desktop value. */
export function resolveResponsive<T extends Record<string, unknown>>(
  desktop: T,
  mobile?: Partial<T> | null,
): T {
  if (!mobile) return desktop;
  const next = { ...desktop };
  for (const [key, value] of Object.entries(mobile)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export function aspectToCss(aspect: ImageAspect | undefined): string | undefined {
  switch (aspect) {
    case "1:1":
      return "1 / 1";
    case "4:5":
      return "4 / 5";
    case "3:4":
      return "3 / 4";
    case "16:9":
      return "16 / 9";
    default:
      return undefined;
  }
}

export function textScaleToCss(scale: TextScale | string | undefined, kind: "heading" | "body"): string | undefined {
  if (!scale || scale === "normal") return undefined;
  if (scale === "small") return kind === "heading" ? "14pt" : "11pt";
  if (scale === "large") return kind === "heading" ? "22pt" : "14pt";
  return asCss(scale, 40) || undefined;
}

export function parseImageMobile(value: unknown): ProposalImageMobile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const mobile: ProposalImageMobile = {};
  const focusX = asFocusPercent(record.focusX);
  const focusY = asFocusPercent(record.focusY);
  const zoom = asZoom(record.zoom);
  const height = asCss(record.height);
  const aspect = asAspect(record.aspect);
  if (focusX != null) mobile.focusX = focusX;
  if (focusY != null) mobile.focusY = focusY;
  if (zoom != null) mobile.zoom = zoom;
  if (height) mobile.height = height;
  if (aspect) mobile.aspect = aspect;
  if (typeof record.hidden === "boolean") mobile.hidden = record.hidden;
  return Object.keys(mobile).length ? mobile : undefined;
}

export function parseCoverMobileDesign(value: unknown): CoverMobileDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const cover: CoverMobileDesign = {};
  const heroHeight = asCss(record.heroHeight);
  const logoSize = asCss(record.logoSize);
  const dateSize = asCss(record.dateSize);
  const dateOffset = asCss(record.dateOffset);
  const titleSize = asCss(record.titleSize);
  const textAlign = asAlign(record.textAlign);
  if (heroHeight) cover.heroHeight = heroHeight;
  if (logoSize) cover.logoSize = logoSize;
  if (dateSize) cover.dateSize = dateSize;
  if (dateOffset) cover.dateOffset = dateOffset;
  if (titleSize) cover.titleSize = titleSize;
  if (textAlign) cover.textAlign = textAlign;
  if (record.imageSide === "behind" || record.imageSide === "top") {
    cover.imageSide = record.imageSide;
  }
  return Object.keys(cover).length ? cover : undefined;
}

export function parseProposalDesignMobile(value: unknown): ProposalDesignMobile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const mobile: ProposalDesignMobile = {};
  const cover = parseCoverMobileDesign(record.cover);
  const planColumns = asCss(record.planColumns, 40);
  const investmentColumns = asCss(record.investmentColumns, 40);
  const proofColumns = asColumns(record.proofColumns);
  if (cover) mobile.cover = cover;
  if (planColumns) mobile.planColumns = planColumns;
  if (investmentColumns) mobile.investmentColumns = investmentColumns;
  if (proofColumns) mobile.proofColumns = proofColumns;
  if (record.reviewLayout === "stack" || record.reviewLayout === "side") {
    mobile.reviewLayout = record.reviewLayout;
  }
  return Object.keys(mobile).length ? mobile : undefined;
}

export function parseSectionMobile(value: unknown): SectionMobile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const mobile: SectionMobile = {};
  if (typeof record.hidden === "boolean") mobile.hidden = record.hidden;
  const order = asOrder(record.order);
  const marginTop = asCss(record.marginTop);
  const marginBottom = asCss(record.marginBottom);
  const headingSize = asScaleOrCss(record.headingSize);
  const bodySize = asScaleOrCss(record.bodySize);
  if (order != null) mobile.order = order;
  if (marginTop) mobile.marginTop = marginTop;
  if (marginBottom) mobile.marginBottom = marginBottom;
  if (headingSize) mobile.headingSize = headingSize;
  if (bodySize) mobile.bodySize = bodySize;
  return Object.keys(mobile).length ? mobile : undefined;
}

export function hasMobileImageCrop(image: ImageWithMobile | null | undefined) {
  const mobile = image?.mobile;
  if (!mobile) return false;
  return mobile.focusX != null || mobile.focusY != null || mobile.zoom != null;
}

export function hasImageMobileSettings(image: ImageWithMobile | null | undefined) {
  return Boolean(image?.mobile && Object.keys(image.mobile).length);
}

export function hasSectionMobileSettings(section: SectionWithMobile) {
  return Boolean(section.mobile && Object.keys(section.mobile).length);
}

export function hasDesignMobileSettings(design?: ProposalDesignWithMobile | null) {
  return Boolean(design?.mobile && Object.keys(design.mobile).length);
}

export function resolveMobileImageCrop(
  image: ImageWithMobile | null | undefined,
  fallback?: Partial<ImageCrop>,
): ImageCrop {
  const desktop: ImageCrop = {
    focusX: clampFocus(image?.focusX ?? fallback?.focusX ?? IMAGE_CROP_FOCUS_DEFAULT),
    focusY: clampFocus(image?.focusY ?? fallback?.focusY ?? IMAGE_CROP_FOCUS_DEFAULT),
    zoom: clampZoom(image?.zoom ?? fallback?.zoom ?? IMAGE_CROP_ZOOM_DEFAULT),
  };
  const mobile = image?.mobile;
  if (!mobile || (mobile.focusX == null && mobile.focusY == null && mobile.zoom == null)) {
    return desktop;
  }
  return {
    focusX: clampFocus(mobile.focusX ?? desktop.focusX),
    focusY: clampFocus(mobile.focusY ?? desktop.focusY),
    zoom: clampZoom(mobile.zoom ?? desktop.zoom),
  };
}

export function applyMobileImageCrop<T extends ImageWithMobile>(
  image: T,
  crop: Partial<ImageCrop>,
): T {
  const prev = image.mobile || {};
  const nextMobile: ProposalImageMobile = { ...prev };
  if (crop.focusX != null) nextMobile.focusX = roundCropValue(clampFocus(crop.focusX));
  if (crop.focusY != null) nextMobile.focusY = roundCropValue(clampFocus(crop.focusY));
  if (crop.zoom != null) nextMobile.zoom = roundCropValue(clampZoom(crop.zoom), 2);
  return { ...image, mobile: nextMobile };
}

export function clearMobileImageCrop<T extends ImageWithMobile>(image: T): T {
  if (!image.mobile) return image;
  const nextMobile: ProposalImageMobile = { ...image.mobile };
  delete nextMobile.focusX;
  delete nextMobile.focusY;
  delete nextMobile.zoom;
  if (!Object.keys(nextMobile).length) {
    const next = { ...image };
    delete next.mobile;
    return next;
  }
  return { ...image, mobile: nextMobile };
}

export function patchImageMobile<T extends ImageWithMobile>(
  image: T,
  partial: Partial<ProposalImageMobile>,
): T {
  const nextMobile: ProposalImageMobile = { ...(image.mobile || {}), ...partial };
  for (const key of Object.keys(partial) as (keyof ProposalImageMobile)[]) {
    if (partial[key] === undefined) delete nextMobile[key];
  }
  if (!Object.keys(nextMobile).length) {
    const next = { ...image };
    delete next.mobile;
    return next;
  }
  return { ...image, mobile: nextMobile };
}

export function clearImageMobile<T extends ImageWithMobile>(image: T): T {
  if (!image.mobile) return image;
  const next = { ...image };
  delete next.mobile;
  return next;
}

/**
 * CSS variables only. The `.proposal-cropped` class applies object-position /
 * transform so phone container queries can override without fighting inline styles.
 */
export function imageResponsiveStyle(
  image: ImageWithMobile | null | undefined,
  fallback?: Partial<ImageCrop>,
): CSSProperties {
  const desktop: ImageCrop = {
    focusX: clampFocus(image?.focusX ?? fallback?.focusX ?? IMAGE_CROP_FOCUS_DEFAULT),
    focusY: clampFocus(image?.focusY ?? fallback?.focusY ?? IMAGE_CROP_FOCUS_DEFAULT),
    zoom: clampZoom(image?.zoom ?? fallback?.zoom ?? IMAGE_CROP_ZOOM_DEFAULT),
  };
  const mobileCrop = resolveMobileImageCrop(image, desktop);
  const mobile = image?.mobile;
  const style: Record<string, string> = {
    ["--crop-x"]: `${desktop.focusX}%`,
    ["--crop-y"]: `${desktop.focusY}%`,
    ["--crop-z"]: String(desktop.zoom),
  };

  if (hasMobileImageCrop(image)) {
    style["--crop-x-m"] = `${mobileCrop.focusX}%`;
    style["--crop-y-m"] = `${mobileCrop.focusY}%`;
    style["--crop-z-m"] = String(mobileCrop.zoom);
  }
  if (mobile?.height) style["--img-height-m"] = mobile.height;
  const aspect = aspectToCss(mobile?.aspect);
  if (aspect) style["--img-aspect-m"] = aspect;

  return style as CSSProperties;
}

/** Put height/aspect vars on the frame that sizes the image (figure / cell). */
export function imageFrameMobileStyle(image: ImageWithMobile | null | undefined): CSSProperties {
  const mobile = image?.mobile;
  if (!mobile) return {};
  const style: Record<string, string> = {};
  if (mobile.height) style["--img-height-m"] = mobile.height;
  const aspect = aspectToCss(mobile.aspect);
  if (aspect) style["--img-aspect-m"] = aspect;
  return style as CSSProperties;
}

export function imagePhoneHiddenClass(image: ImageWithMobile | null | undefined) {
  return image?.mobile?.hidden ? "is-phone-hidden" : "";
}

export function sectionMobileStyle(section: SectionWithMobile, index: number): CSSProperties {
  const mobile = section.mobile;
  const style: Record<string, string> = {
    ["--section-order-m"]: String(mobile?.order ?? index),
  };
  if (mobile?.marginTop) style["--section-mt-m"] = mobile.marginTop;
  if (mobile?.marginBottom) style["--section-mb-m"] = mobile.marginBottom;
  const heading = textScaleToCss(mobile?.headingSize, "heading");
  const body = textScaleToCss(mobile?.bodySize, "body");
  if (heading) style["--section-heading-m"] = heading;
  if (body) style["--section-body-m"] = body;
  return style;
}

export function sectionPhoneClass(section: SectionWithMobile) {
  return section.mobile?.hidden ? "is-phone-hidden" : "";
}

export function designMobileVars(mobile?: ProposalDesignMobile | null): CSSProperties {
  if (!mobile) return {};
  const style: Record<string, string> = {};
  const cover = mobile.cover;
  if (cover?.heroHeight) style["--hero-height-m"] = cover.heroHeight;
  if (cover?.logoSize) style["--logo-size-m"] = cover.logoSize;
  if (cover?.dateSize) style["--date-size-m"] = cover.dateSize;
  if (cover?.dateOffset) style["--date-offset-m"] = cover.dateOffset;
  if (cover?.titleSize) style["--title-size-m"] = cover.titleSize;
  if (cover?.textAlign) style["--hero-align-m"] = cover.textAlign;
  if (cover?.imageSide) style["--hero-side-m"] = cover.imageSide;
  if (mobile.planColumns) style["--plan-columns-m"] = mobile.planColumns;
  if (mobile.investmentColumns) style["--investment-columns-m"] = mobile.investmentColumns;
  if (mobile.proofColumns === 1) style["--proof-columns-m"] = "1fr";
  if (mobile.proofColumns === 2) style["--proof-columns-m"] = "1fr 1fr";
  if (mobile.reviewLayout === "stack") style["--review-columns-m"] = "1fr";
  if (mobile.reviewLayout === "side") style["--review-columns-m"] = "1fr 1fr";
  return style;
}

function clearMobileOnImage<T extends ImageWithMobile>(
  image: T | null | undefined,
): T | null | undefined {
  if (!image?.mobile) return image;
  return clearImageMobile(image);
}

function clearMobileInSection<T extends SectionWithMobile>(section: T): T {
  const next = { ...section };
  if (next.mobile) delete next.mobile;
  if (next.images?.length) {
    next.images = next.images.map((image) => clearImageMobile(image));
  }

  const data = next.data ? { ...next.data } : undefined;
  if (data) {
    if ("heroImage" in data) {
      data.heroImage = clearMobileOnImage(data.heroImage as ImageWithMobile | null) ?? null;
    }
    if ("image" in data && next.type !== "review") {
      data.image = clearMobileOnImage(data.image as ImageWithMobile | null) ?? null;
    }
    if ("images" in data && Array.isArray(data.images)) {
      data.images = (data.images as ImageWithMobile[]).map((image) => clearImageMobile(image));
    }
    if ("videoCover" in data) {
      data.videoCover = clearMobileOnImage(data.videoCover as ImageWithMobile | null) ?? null;
    }
    if (next.type === "review") {
      if ("image" in data) {
        data.image = clearMobileOnImage(data.image as ImageWithMobile | null) ?? null;
      }
      const second = data.second as { image?: ImageWithMobile | null } | null | undefined;
      if (second) {
        data.second = {
          ...second,
          image: clearMobileOnImage(second.image) ?? null,
        };
      }
    }
    next.data = data;
  }

  return next;
}

/** Strip every phone override from a proposal or template. */
export function resetAllPhoneSettings<
  T extends { design?: ProposalDesignWithMobile; sections: SectionWithMobile[] },
>(entity: T): T {
  const nextDesign = entity.design ? { ...entity.design } : undefined;
  if (nextDesign && "mobile" in nextDesign) {
    delete (nextDesign as ProposalDesignWithMobile).mobile;
  }
  return {
    ...entity,
    ...(nextDesign ? { design: nextDesign } : {}),
    sections: entity.sections.map((section) => clearMobileInSection(section)),
  };
}

/** Reorder sections for phone using mobile.order (stable for ties). */
export function phoneSectionOrder<T extends SectionWithMobile>(sections: T[]): T[] {
  return sections
    .map((section, index) => ({ section, index, order: section.mobile?.order ?? index }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map((entry) => entry.section);
}

export function moveSectionPhoneOrder<T extends SectionWithMobile>(
  sections: T[],
  id: string,
  dir: -1 | 1,
): T[] {
  const ordered = phoneSectionOrder(sections);
  const index = ordered.findIndex((section) => section.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= ordered.length) return sections;
  const nextOrder = [...ordered];
  const [item] = nextOrder.splice(index, 1);
  nextOrder.splice(target, 0, item!);
  const orderById = new Map(nextOrder.map((section, order) => [section.id, order]));
  return sections.map((section) => ({
    ...section,
    mobile: {
      ...(section.mobile || {}),
      order: orderById.get(section.id) ?? 0,
    },
  }));
}
