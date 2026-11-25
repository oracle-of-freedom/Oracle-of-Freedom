import { imageSrc, type ProposalImage } from "@/lib/proposals";

export type ProofLightboxItem = {
  /** Index in the full proof grid (including placeholders and phone-hidden). */
  gridIndex: number;
  src: string;
  alt: string;
  phoneHidden: boolean;
};

/** Every proof cell that has a real photo URL, in grid order. */
export function proofLightboxItems(images: ProposalImage[]): ProofLightboxItem[] {
  const items: ProofLightboxItem[] = [];
  images.forEach((image, gridIndex) => {
    const src = imageSrc(image);
    if (!src) return;
    items.push({
      gridIndex,
      src,
      alt: image.alt?.trim() || "Proposal photo",
      phoneHidden: Boolean(image.mobile?.hidden),
    });
  });
  return items;
}

/**
 * Photos available in the lightbox for the current viewport.
 * On phone, skip cells marked phone-hidden (same as `.is-phone-hidden` CSS).
 */
export function visibleProofLightboxItems(
  items: ProofLightboxItem[],
  isPhone: boolean,
): ProofLightboxItem[] {
  if (!isPhone) return items;
  return items.filter((item) => !item.phoneHidden);
}

/** Map a clicked grid index to the index inside the visible lightbox sequence. */
export function lightboxIndexForGrid(
  items: ProofLightboxItem[],
  gridIndex: number,
  isPhone: boolean,
): number {
  const visible = visibleProofLightboxItems(items, isPhone);
  return visible.findIndex((item) => item.gridIndex === gridIndex);
}

export function wrapLightboxIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}
