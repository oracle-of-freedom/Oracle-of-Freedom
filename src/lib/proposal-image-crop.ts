import type { CSSProperties } from "react";
import type { ProposalImage, ProposalSection } from "@/lib/proposals";

export const IMAGE_CROP_FOCUS_DEFAULT = 50;
export const IMAGE_CROP_ZOOM_MIN = 1;
export const IMAGE_CROP_ZOOM_MAX = 3;
export const IMAGE_CROP_ZOOM_DEFAULT = 1;
export const IMAGE_CROP_NUDGE = 2;

export type ImageCrop = {
  focusX: number;
  focusY: number;
  zoom: number;
};

export function clampFocus(value: number) {
  if (!Number.isFinite(value)) return IMAGE_CROP_FOCUS_DEFAULT;
  return Math.min(100, Math.max(0, value));
}

export function clampZoom(value: number) {
  if (!Number.isFinite(value)) return IMAGE_CROP_ZOOM_DEFAULT;
  return Math.min(IMAGE_CROP_ZOOM_MAX, Math.max(IMAGE_CROP_ZOOM_MIN, value));
}

/** Round to a stable one-decimal place for storage. */
export function roundCropValue(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Minimal shape so phone helpers can share these without depending on ProposalImage. */
export type ImageCropSource = Partial<ImageCrop> | null | undefined;

export function hasImageCrop(image: ImageCropSource) {
  if (!image) return false;
  return image.focusX != null || image.focusY != null || image.zoom != null;
}

export function resolveImageCrop(
  image: ImageCropSource,
  fallback?: Partial<ImageCrop>,
): ImageCrop {
  return {
    focusX: clampFocus(image?.focusX ?? fallback?.focusX ?? IMAGE_CROP_FOCUS_DEFAULT),
    focusY: clampFocus(image?.focusY ?? fallback?.focusY ?? IMAGE_CROP_FOCUS_DEFAULT),
    zoom: clampZoom(image?.zoom ?? fallback?.zoom ?? IMAGE_CROP_ZOOM_DEFAULT),
  };
}

/** Awake cover used to default to `right center`. */
export const HERO_CROP_FALLBACK: ImageCrop = {
  focusX: 100,
  focusY: 50,
  zoom: 1,
};

export function applyImageCrop(
  image: ProposalImage,
  crop: Partial<ImageCrop>,
): ProposalImage {
  const next: ProposalImage = { ...image };
  if (crop.focusX != null) next.focusX = roundCropValue(clampFocus(crop.focusX));
  if (crop.focusY != null) next.focusY = roundCropValue(clampFocus(crop.focusY));
  if (crop.zoom != null) next.zoom = roundCropValue(clampZoom(crop.zoom), 2);
  return next;
}

export function clearImageCrop(image: ProposalImage): ProposalImage {
  const next: ProposalImage = { ...image };
  delete next.focusX;
  delete next.focusY;
  delete next.zoom;
  return next;
}

export function imageCropStyle(
  image: ImageCropSource,
  fallback?: Partial<ImageCrop>,
): CSSProperties {
  const crop = resolveImageCrop(image, fallback);
  return {
    objectFit: "cover",
    objectPosition: `${crop.focusX}% ${crop.focusY}%`,
    transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`,
    transformOrigin: `${crop.focusX}% ${crop.focusY}%`,
  };
}

function clearCropOnImage(image: ProposalImage | null | undefined): ProposalImage | null | undefined {
  if (!image) return image;
  if (!hasImageCrop(image)) return image;
  return clearImageCrop(image);
}

function clearCropsInSection(section: ProposalSection): ProposalSection {
  const next = { ...section } as ProposalSection;
  if (next.images?.length) {
    next.images = next.images.map((image) => clearImageCrop(image));
  }

  switch (next.type) {
    case "cover":
      next.data = {
        ...next.data,
        heroImage: clearCropOnImage(next.data.heroImage) ?? null,
      };
      break;
    case "divider":
      next.data = {
        ...next.data,
        image: clearCropOnImage(next.data.image) ?? null,
      };
      break;
    case "proof":
      next.data = {
        ...next.data,
        images: next.data.images.map((image) => clearImageCrop(image)),
        videoCover: clearCropOnImage(next.data.videoCover) ?? null,
      };
      break;
    default:
      break;
  }

  return next;
}

/** Strip crop fields from every image on a proposal or template. */
export function resetAllImageCrops<T extends { sections: ProposalSection[] }>(entity: T): T {
  return {
    ...entity,
    sections: entity.sections.map(clearCropsInSection),
  };
}
