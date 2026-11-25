/**
 * Proposal colour schemes.
 *
 * Missing colours fall back to the current Awake sheet palette so existing
 * proposals render identically until the editor changes a value.
 */

export type ProposalColourScheme = {
  pageBg?: string;
  cardBg?: string;
  /** Block/card border colour. */
  border?: string;
  /** 0–100. Default 100. */
  borderOpacity?: number;
  heading?: string;
  text?: string;
  muted?: string;
  accent?: string;
  buttonBg?: string;
  buttonText?: string;
};

export type ResolvedColourScheme = {
  pageBg: string;
  cardBg: string;
  border: string;
  borderOpacity: number;
  heading: string;
  text: string;
  muted: string;
  accent: string;
  buttonBg: string;
  buttonText: string;
};

/** Current sheet defaults (must match globals.css fallbacks). */
export const DEFAULT_COLOUR_SCHEME: ResolvedColourScheme = {
  pageBg: "#f4ece1",
  cardBg: "#fbf6ef",
  border: "#d9913a",
  borderOpacity: 100,
  heading: "#b4532a",
  text: "#2a211c",
  muted: "#5c534c",
  accent: "#b4532a",
  buttonBg: "#b4532a",
  buttonText: "#ffffff",
};

export type ColourPaletteId =
  | "classic"
  | "earthSage"
  | "desertSunset"
  | "oceanMist"
  | "jungleNight"
  | "lavenderDusk"
  | "classicLight"
  | "festivalWarm";

export type ColourPalette = {
  id: ColourPaletteId;
  name: string;
  colours: ResolvedColourScheme;
};

export const COLOUR_PALETTES: ColourPalette[] = [
  {
    id: "classic",
    name: "Classic (current)",
    colours: { ...DEFAULT_COLOUR_SCHEME },
  },
  {
    id: "earthSage",
    name: "Earth & Sage",
    colours: {
      pageBg: "#f3efe6",
      cardBg: "#faf7f0",
      border: "#6b7f5a",
      borderOpacity: 70,
      heading: "#3f4f36",
      text: "#2a2f26",
      muted: "#6a7264",
      accent: "#6b7f5a",
      buttonBg: "#46553a",
      buttonText: "#f4ece1",
    },
  },
  {
    id: "desertSunset",
    name: "Desert Sunset",
    colours: {
      pageBg: "#f7ebe1",
      cardBg: "#fff6ee",
      border: "#c46b3a",
      borderOpacity: 80,
      heading: "#9a4522",
      text: "#2c211c",
      muted: "#7a5a4a",
      accent: "#d9913a",
      buttonBg: "#b4532a",
      buttonText: "#fff8f1",
    },
  },
  {
    id: "oceanMist",
    name: "Ocean Mist",
    colours: {
      pageBg: "#eef3f4",
      cardBg: "#f7fbfb",
      border: "#5f8a8b",
      borderOpacity: 65,
      heading: "#2f4f55",
      text: "#1f2c30",
      muted: "#5c7074",
      accent: "#3d7a7c",
      buttonBg: "#2f5f62",
      buttonText: "#f2f8f8",
    },
  },
  {
    id: "jungleNight",
    name: "Jungle Night",
    colours: {
      pageBg: "#1c211c",
      cardBg: "#262c26",
      border: "#8aa06e",
      borderOpacity: 55,
      heading: "#d7e0c8",
      text: "#e6eadf",
      muted: "#a3ad9a",
      accent: "#c4a35a",
      buttonBg: "#8aa06e",
      buttonText: "#1c211c",
    },
  },
  {
    id: "lavenderDusk",
    name: "Lavender Dusk",
    colours: {
      pageBg: "#f4eef6",
      cardBg: "#fbf7fc",
      border: "#8b6f9a",
      borderOpacity: 55,
      heading: "#5b4368",
      text: "#2b2430",
      muted: "#6f6478",
      accent: "#7a5f88",
      buttonBg: "#5b4368",
      buttonText: "#f8f2fa",
    },
  },
  {
    id: "classicLight",
    name: "Classic Light",
    colours: {
      pageBg: "#fbf8f3",
      cardBg: "#ffffff",
      border: "#cbb8a0",
      borderOpacity: 90,
      heading: "#8a4b2a",
      text: "#2a211c",
      muted: "#6e645c",
      accent: "#b4532a",
      buttonBg: "#2a211c",
      buttonText: "#fbf8f3",
    },
  },
  {
    id: "festivalWarm",
    name: "Festival Warm",
    colours: {
      pageBg: "#fff4e8",
      cardBg: "#fffaf3",
      border: "#e07a3d",
      borderOpacity: 75,
      heading: "#c24d1a",
      text: "#2b1d14",
      muted: "#7a5844",
      accent: "#e07a3d",
      buttonBg: "#c24d1a",
      buttonText: "#fff8f0",
    },
  },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return undefined;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function clampOpacity(value: unknown, fallback = 100): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseColourScheme(value: unknown): ProposalColourScheme | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const scheme: ProposalColourScheme = {};
  const pageBg = normalizeHex(record.pageBg);
  const cardBg = normalizeHex(record.cardBg);
  const border = normalizeHex(record.border);
  const heading = normalizeHex(record.heading);
  const text = normalizeHex(record.text);
  const muted = normalizeHex(record.muted);
  const accent = normalizeHex(record.accent);
  const buttonBg = normalizeHex(record.buttonBg);
  const buttonText = normalizeHex(record.buttonText);
  if (pageBg) scheme.pageBg = pageBg;
  if (cardBg) scheme.cardBg = cardBg;
  if (border) scheme.border = border;
  if (record.borderOpacity != null) scheme.borderOpacity = clampOpacity(record.borderOpacity);
  if (heading) scheme.heading = heading;
  if (text) scheme.text = text;
  if (muted) scheme.muted = muted;
  if (accent) scheme.accent = accent;
  if (buttonBg) scheme.buttonBg = buttonBg;
  if (buttonText) scheme.buttonText = buttonText;
  return Object.keys(scheme).length ? scheme : undefined;
}

export function resolveColourScheme(
  scheme?: ProposalColourScheme | null,
  fallback: ResolvedColourScheme = DEFAULT_COLOUR_SCHEME,
): ResolvedColourScheme {
  return {
    pageBg: scheme?.pageBg || fallback.pageBg,
    cardBg: scheme?.cardBg || fallback.cardBg,
    border: scheme?.border || fallback.border,
    borderOpacity:
      scheme?.borderOpacity != null ? clampOpacity(scheme.borderOpacity) : fallback.borderOpacity,
    heading: scheme?.heading || fallback.heading,
    text: scheme?.text || fallback.text,
    muted: scheme?.muted || fallback.muted,
    accent: scheme?.accent || fallback.accent,
    buttonBg: scheme?.buttonBg || fallback.buttonBg,
    buttonText: scheme?.buttonText || fallback.buttonText,
  };
}

/** Phone colours fall back to desktop resolved values field by field. */
export function resolveColourSchemeWithPhone(
  desktop?: ProposalColourScheme | null,
  phone?: ProposalColourScheme | null,
): { desktop: ResolvedColourScheme; phone: ResolvedColourScheme } {
  const resolvedDesktop = resolveColourScheme(desktop);
  return {
    desktop: resolvedDesktop,
    phone: resolveColourScheme(phone, resolvedDesktop),
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized || normalized.length !== 7) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function hexWithOpacity(hex: string, opacityPct: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, clampOpacity(opacityPct) / 100));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(rgb.r);
  const g = channel(rgb.g);
  const b = channel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 == null || l2 == null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_BODY = 4.5;
export const WCAG_AA_LARGE = 3;

export type ContrastIssue = {
  pair: "heading" | "body";
  ratio: number;
  foreground: string;
  background: string;
};

export function colourContrastIssues(scheme: ResolvedColourScheme): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const heading = contrastRatio(scheme.heading, scheme.pageBg);
  if (heading != null && heading < WCAG_AA_LARGE) {
    issues.push({
      pair: "heading",
      ratio: heading,
      foreground: scheme.heading,
      background: scheme.pageBg,
    });
  }
  const body = contrastRatio(scheme.text, scheme.pageBg);
  if (body != null && body < WCAG_AA_BODY) {
    issues.push({
      pair: "body",
      ratio: body,
      foreground: scheme.text,
      background: scheme.pageBg,
    });
  }
  return issues;
}

function mixToward(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  if (!a || !b) return hex;
  const t = Math.max(0, Math.min(1, amount));
  const channel = (x: number, y: number) => Math.round(x + (y - x) * t);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(channel(a.r, b.r))}${toHex(channel(a.g, b.g))}${toHex(channel(a.b, b.b))}`;
}

/**
 * Nudge text colour toward black or white until WCAG AA is met (or closest).
 */
export function fixContrastColour(
  foreground: string,
  background: string,
  minRatio: number,
): string {
  const bgLum = relativeLuminance(background);
  if (bgLum == null) return foreground;
  const target = bgLum > 0.45 ? "#000000" : "#ffffff";
  let best = foreground;
  let bestRatio = contrastRatio(foreground, background) || 0;
  if (bestRatio >= minRatio) return foreground;
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixToward(foreground, target, step / 20);
    const ratio = contrastRatio(candidate, background) || 0;
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= minRatio) return candidate;
  }
  return best;
}

export function fixColourSchemeContrast(scheme: ResolvedColourScheme): ResolvedColourScheme {
  const next = { ...scheme };
  const headingRatio = contrastRatio(next.heading, next.pageBg);
  if (headingRatio != null && headingRatio < WCAG_AA_LARGE) {
    next.heading = fixContrastColour(next.heading, next.pageBg, WCAG_AA_LARGE);
  }
  const bodyRatio = contrastRatio(next.text, next.pageBg);
  if (bodyRatio != null && bodyRatio < WCAG_AA_BODY) {
    next.text = fixContrastColour(next.text, next.pageBg, WCAG_AA_BODY);
  }
  return next;
}

export function colourSchemeVars(
  scheme: ResolvedColourScheme,
  opts?: { phone?: boolean },
): Record<string, string> {
  const suffix = opts?.phone ? "-m" : "";
  const border = hexWithOpacity(scheme.border, scheme.borderOpacity);
  const vars: Record<string, string> = {
    [`--p-bg${suffix}`]: scheme.pageBg,
    [`--p-card-bg${suffix}`]: scheme.cardBg,
    [`--p-border${suffix}`]: border,
    [`--p-heading${suffix}`]: scheme.heading,
    [`--p-text${suffix}`]: scheme.text,
    [`--p-muted${suffix}`]: scheme.muted,
    [`--p-accent${suffix}`]: scheme.accent,
    [`--p-btn-bg${suffix}`]: scheme.buttonBg,
    [`--p-btn-text${suffix}`]: scheme.buttonText,
  };
  if (!opts?.phone) {
    // Bridge legacy tokens used throughout the stylesheet.
    vars["--cream"] = scheme.pageBg;
    vars["--ink"] = scheme.text;
    vars["--terra"] = scheme.heading;
    vars["--rust"] = scheme.heading;
    vars["--amber"] = scheme.accent;
    vars["--peach"] = scheme.accent;
  }
  return vars;
}

export function hasColourOverrides(scheme?: ProposalColourScheme | null): boolean {
  return Boolean(scheme && Object.keys(scheme).length);
}
