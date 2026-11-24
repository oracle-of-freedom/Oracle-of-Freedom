/**
 * Convert CSS lengths used in proposal design fields to slider numbers and back.
 * Existing saved values (mm, px, pt, rem) load onto the nearest slider step.
 */

const MM_TO_PX = 96 / 25.4;
const PT_TO_PX = 96 / 72;

export type LengthUnit = "px" | "mm" | "pt";

export function parseCssLength(value: string | undefined | null): { amount: number; unit: LengthUnit } | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Use the first length in multi-value shorthands (padding).
  const match = trimmed.match(/(-?\d+(?:\.\d+)?)\s*(px|mm|pt|rem|em)?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const raw = (match[2] || "px").toLowerCase();
  if (raw === "mm") return { amount, unit: "mm" };
  if (raw === "pt") return { amount, unit: "pt" };
  if (raw === "rem" || raw === "em") return { amount: amount * 16, unit: "px" };
  return { amount, unit: "px" };
}

export function cssLengthToPx(value: string | undefined | null, fallbackPx: number): number {
  const parsed = parseCssLength(value);
  if (!parsed) return fallbackPx;
  if (parsed.unit === "mm") return parsed.amount * MM_TO_PX;
  if (parsed.unit === "pt") return parsed.amount * PT_TO_PX;
  return parsed.amount;
}

export function cssLengthToUnit(
  value: string | undefined | null,
  unit: LengthUnit,
  fallback: number,
): number {
  const px = cssLengthToPx(value, unit === "px" ? fallback : toPx(fallback, unit));
  if (unit === "mm") return px / MM_TO_PX;
  if (unit === "pt") return px / PT_TO_PX;
  return px;
}

function toPx(amount: number, unit: LengthUnit) {
  if (unit === "mm") return amount * MM_TO_PX;
  if (unit === "pt") return amount * PT_TO_PX;
  return amount;
}

export function formatCssLength(amount: number, unit: LengthUnit): string {
  const rounded =
    unit === "px" || unit === "pt"
      ? Math.round(amount)
      : Math.round(amount * 10) / 10;
  return `${rounded}${unit}`;
}

export function clampStep(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value));
  const steps = Math.round((clamped - min) / step);
  return Math.min(max, Math.max(min, min + steps * step));
}

/** First number from a multi-value padding string, averaged for 2–4 values when possible. */
export function cssPaddingToUniformPx(value: string | undefined | null, fallbackPx: number): number {
  if (!value?.trim()) return fallbackPx;
  const parts = [...value.matchAll(/(-?\d+(?:\.\d+)?)\s*(px|mm|pt|rem|em)?/gi)];
  if (!parts.length) return fallbackPx;
  const px = parts.map((part) => {
    const amount = Number(part[1]);
    const unit = (part[2] || "px").toLowerCase();
    if (unit === "mm") return amount * MM_TO_PX;
    if (unit === "pt") return amount * PT_TO_PX;
    if (unit === "rem" || unit === "em") return amount * 16;
    return amount;
  });
  return px.reduce((a, b) => a + b, 0) / px.length;
}

export function countGridColumns(value: string | undefined | null): 1 | 2 | 3 {
  if (!value?.trim()) return 2;
  const tracks = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tracks.length >= 3) return 3;
  if (tracks.length === 1) return 1;
  return 2;
}

export function columnsToCss(count: 1 | 2 | 3, preset2?: string): string {
  if (count === 1) return "1fr";
  if (count === 3) return "1fr 1fr 1fr";
  return preset2 || "1fr 1fr";
}
