/**
 * Layout controls for a proposal or template.
 *
 * Lengths are CSS values, usually millimetres (`70mm`, `4.5mm 5mm 6.7mm`)
 * or pixels (`46px`). Column tracks are CSS grid values (`.79fr 1.21fr`).
 * Gradient stops are percentages. Missing fields use the Awake-style defaults.
 * Optional `mobile` overrides apply under 768px; print always uses desktop.
 */

import {
  parseProposalDesignMobile,
  type ProposalDesignMobile,
} from "@/lib/proposal-mobile";

export type DesignAlign = "left" | "center" | "right";

export type CoverDesign = {
  /** Hero height. Default `70mm`. */
  heroHeight?: string;
  /** Om logo size. Default `46px`. */
  logoSize?: string;
  /** Date size. Default `8pt`, smaller than the subtitle. */
  dateSize?: string;
  /** Space above the date. Default `2.8mm`, so the date sits lower. */
  dateOffset?: string;
  /** CSS background-position. Default `right center`. */
  imagePosition?: string;
  /** CSS background-size. Default `auto 100%`. */
  imageSize?: string;
  /** Gradient stops in percent. Default 42 / 52 / 64. */
  gradientStops?: number[];
};

export type ProposalDesign = {
  cover?: CoverDesign;
  /** Plan columns. Default `.79fr 1.21fr`. */
  planColumns?: string;
  /** Gap between the olive box and the scene list. Default `5mm`. */
  planGap?: string;
  /** Olive lead box padding. Default `4.5mm 5mm 6.7mm`. */
  planLeadPadding?: string;
  /** Investment panel columns. Default `1.15fr 1fr`. */
  investmentColumns?: string;
  /** Gap inside the investment panel. Default `6mm`. */
  investmentGap?: string;
  /** Orange card top offset. Default `0` (the card fills the right of the panel). */
  cardOffsetTop?: string;
  /** Space above Next step. Default `9.5mm`. */
  nextStepGap?: string;
  /** Space above the reply button. Default `8.5mm`. */
  ctaGap?: string;
  /** Space above the sign-off. Default `7.5mm`. */
  signOffGap?: string;
  /** Reply button position. Default `left`. */
  buttonPosition?: DesignAlign;
  /** Sign-off alignment. Default `left`. */
  signOffAlign?: DesignAlign;
  /** Phone-only overrides. Missing keys fall back to the desktop values above. */
  mobile?: ProposalDesignMobile;
};

export type SectionDesign = {
  /** When false, the section title is hidden. Default true. */
  showTitle?: boolean;
  /** `standard` is the terracotta serif title with a peach rule. `hidden` turns it off. */
  titleStyle?: "standard" | "hidden";
  /** CSS padding shorthand. */
  padding?: string;
  /** Extra space above the section. */
  marginTop?: string;
  /** CSS grid-template-columns for this block. */
  columns?: string;
  /** Horizontal alignment. */
  align?: DesignAlign;
  /** Horizontal offset, a CSS length. Default `0`. */
  offsetX?: string;
  /** Column gap for this block. */
  gap?: string;
  /** Orange card top offset on the investment section. */
  cardOffsetTop?: string;
  /** Button position on the next-step section. */
  buttonPosition?: DesignAlign;
  /** Sign-off alignment on the sign-off section. */
  signOffAlign?: DesignAlign;
};

export type ResolvedCoverDesign = {
  heroHeight: string;
  logoSize: string;
  dateSize: string;
  dateOffset: string;
  imagePosition: string;
  imageSize: string;
  gradientStops: [number, number, number];
};

export type ResolvedProposalDesign = {
  cover: ResolvedCoverDesign;
  planColumns: string;
  planGap: string;
  planLeadPadding: string;
  investmentColumns: string;
  investmentGap: string;
  cardOffsetTop: string;
  nextStepGap: string;
  ctaGap: string;
  signOffGap: string;
  buttonPosition: DesignAlign;
  signOffAlign: DesignAlign;
};

const DEFAULT_STOPS: [number, number, number] = [42, 52, 64];

export function defaultCoverDesign(): ResolvedCoverDesign {
  return {
    heroHeight: "70mm",
    logoSize: "46px",
    dateSize: "8pt",
    dateOffset: "2.8mm",
    imagePosition: "right center",
    imageSize: "auto 100%",
    gradientStops: [...DEFAULT_STOPS],
  };
}

/** Awake-style defaults. Reset to default restores this object and clears per-section overrides. */
export function defaultProposalDesign(): ResolvedProposalDesign {
  return {
    cover: defaultCoverDesign(),
    planColumns: ".79fr 1.21fr",
    planGap: "5mm",
    planLeadPadding: "4.5mm 5mm 6.7mm",
    investmentColumns: "1.15fr 1fr",
    investmentGap: "6mm",
    cardOffsetTop: "0",
    nextStepGap: "9.5mm",
    ctaGap: "8.5mm",
    signOffGap: "7.5mm",
    buttonPosition: "left",
    signOffAlign: "left",
  };
}

function asCss(value: unknown, max = 80) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, max);
  if (!trimmed || /[{};<>]/.test(trimmed)) return "";
  return trimmed;
}

function asAlign(value: unknown): DesignAlign | undefined {
  return value === "left" || value === "center" || value === "right" ? value : undefined;
}

function asStops(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const stops = value.slice(0, 3).map((n) => (typeof n === "number" ? n : Number(n)));
  if (stops.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return undefined;
  return [stops[0]!, stops[1]!, stops[2]!];
}

export function parseCoverDesign(value: unknown): CoverDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const design: CoverDesign = {};
  const heroHeight = asCss(record.heroHeight);
  const logoSize = asCss(record.logoSize);
  const dateSize = asCss(record.dateSize);
  const dateOffset = asCss(record.dateOffset);
  const imagePosition = asCss(record.imagePosition, 40);
  const imageSize = asCss(record.imageSize, 40);
  const gradientStops = asStops(record.gradientStops);
  if (heroHeight) design.heroHeight = heroHeight;
  if (logoSize) design.logoSize = logoSize;
  if (dateSize) design.dateSize = dateSize;
  if (dateOffset) design.dateOffset = dateOffset;
  if (imagePosition) design.imagePosition = imagePosition;
  if (imageSize) design.imageSize = imageSize;
  if (gradientStops) design.gradientStops = gradientStops;
  return Object.keys(design).length ? design : undefined;
}

export function parseProposalDesign(value: unknown): ProposalDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const design: ProposalDesign = {};
  const cover = parseCoverDesign(record.cover);
  const planColumns = asCss(record.planColumns, 40);
  const planGap = asCss(record.planGap);
  const planLeadPadding = asCss(record.planLeadPadding);
  const investmentColumns = asCss(record.investmentColumns, 40);
  const investmentGap = asCss(record.investmentGap);
  const cardOffsetTop = asCss(record.cardOffsetTop);
  const nextStepGap = asCss(record.nextStepGap);
  const ctaGap = asCss(record.ctaGap);
  const signOffGap = asCss(record.signOffGap);
  const buttonPosition = asAlign(record.buttonPosition);
  const signOffAlign = asAlign(record.signOffAlign);
  const mobile = parseProposalDesignMobile(record.mobile);
  if (cover) design.cover = cover;
  if (planColumns) design.planColumns = planColumns;
  if (planGap) design.planGap = planGap;
  if (planLeadPadding) design.planLeadPadding = planLeadPadding;
  if (investmentColumns) design.investmentColumns = investmentColumns;
  if (investmentGap) design.investmentGap = investmentGap;
  if (cardOffsetTop) design.cardOffsetTop = cardOffsetTop;
  if (nextStepGap) design.nextStepGap = nextStepGap;
  if (ctaGap) design.ctaGap = ctaGap;
  if (signOffGap) design.signOffGap = signOffGap;
  if (buttonPosition) design.buttonPosition = buttonPosition;
  if (signOffAlign) design.signOffAlign = signOffAlign;
  if (mobile) design.mobile = mobile;
  return Object.keys(design).length ? design : undefined;
}

export function parseSectionDesign(value: unknown): SectionDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const design: SectionDesign = {};
  if (typeof record.showTitle === "boolean") design.showTitle = record.showTitle;
  if (record.titleStyle === "standard" || record.titleStyle === "hidden") {
    design.titleStyle = record.titleStyle;
  }
  const padding = asCss(record.padding);
  const marginTop = asCss(record.marginTop);
  const columns = asCss(record.columns, 60);
  const align = asAlign(record.align);
  const offsetX = asCss(record.offsetX);
  const gap = asCss(record.gap);
  const cardOffsetTop = asCss(record.cardOffsetTop);
  const buttonPosition = asAlign(record.buttonPosition);
  const signOffAlign = asAlign(record.signOffAlign);
  if (padding) design.padding = padding;
  if (marginTop) design.marginTop = marginTop;
  if (columns) design.columns = columns;
  if (align) design.align = align;
  if (offsetX) design.offsetX = offsetX;
  if (gap) design.gap = gap;
  if (cardOffsetTop) design.cardOffsetTop = cardOffsetTop;
  if (buttonPosition) design.buttonPosition = buttonPosition;
  if (signOffAlign) design.signOffAlign = signOffAlign;
  return Object.keys(design).length ? design : undefined;
}

export function resolveProposalDesign(design?: ProposalDesign | null): ResolvedProposalDesign {
  const base = defaultProposalDesign();
  if (!design) return base;
  const stops = asStops(design.cover?.gradientStops) || base.cover.gradientStops;
  return {
    cover: {
      heroHeight: design.cover?.heroHeight || base.cover.heroHeight,
      logoSize: design.cover?.logoSize || base.cover.logoSize,
      dateSize: design.cover?.dateSize || base.cover.dateSize,
      dateOffset: design.cover?.dateOffset || base.cover.dateOffset,
      imagePosition: design.cover?.imagePosition || base.cover.imagePosition,
      imageSize: design.cover?.imageSize || base.cover.imageSize,
      gradientStops: stops,
    },
    planColumns: design.planColumns || base.planColumns,
    planGap: design.planGap || base.planGap,
    planLeadPadding: design.planLeadPadding || base.planLeadPadding,
    investmentColumns: design.investmentColumns || base.investmentColumns,
    investmentGap: design.investmentGap || base.investmentGap,
    cardOffsetTop: design.cardOffsetTop || base.cardOffsetTop,
    nextStepGap: design.nextStepGap || base.nextStepGap,
    ctaGap: design.ctaGap || base.ctaGap,
    signOffGap: design.signOffGap || base.signOffGap,
    buttonPosition: design.buttonPosition || base.buttonPosition,
    signOffAlign: design.signOffAlign || base.signOffAlign,
  };
}

export function sectionTitleVisible(design?: SectionDesign) {
  if (!design) return true;
  if (design.titleStyle === "hidden" || design.showTitle === false) return false;
  return true;
}

/** Restore Awake-style design defaults. Copy on sections is left as it is. Clears phone design too. */
export function resetDesignDefaults<T extends { design?: ProposalDesign; sections: { design?: SectionDesign }[] }>(
  entity: T,
): T {
  return {
    ...entity,
    design: defaultProposalDesign(),
    sections: entity.sections.map((section) => {
      if (!section.design) return section;
      const next = { ...section };
      delete next.design;
      return next;
    }),
  };
}

export type { ProposalDesignMobile };
