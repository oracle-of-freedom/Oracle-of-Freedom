"use client";

import { Label } from "@/components/ui/input";
import {
  clampStep,
  cssLengthToPx,
  cssLengthToUnit,
  cssPaddingToUniformPx,
  formatCssLength,
  type LengthUnit,
} from "@/lib/proposal-visual-units";
import type { DesignAlign } from "@/lib/proposal-design";

export function ControlField({
  label,
  hint,
  children,
  badge,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <Label className="mb-0">{label}</Label>
        {badge}
      </div>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function ChoiceButtons<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  badge,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
  badge?: React.ReactNode;
}) {
  return (
    <ControlField label={label} hint={hint} badge={badge}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border px-3 text-sm transition ${
                active
                  ? "border-terracotta bg-terracotta/15 text-ink"
                  : "border-ink/15 bg-white/70 text-ink/70 hover:border-ink/30"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
      </div>
    </ControlField>
  );
}

export function AlignButtons({
  label,
  value,
  onChange,
  badge,
}: {
  label: string;
  value: DesignAlign;
  onChange: (value: DesignAlign) => void;
  badge?: React.ReactNode;
}) {
  return (
    <ChoiceButtons
      label={label}
      value={value}
      onChange={onChange}
      badge={badge}
      options={[
        { value: "left", label: "Left", icon: <AlignIcon side="left" /> },
        { value: "center", label: "Center", icon: <AlignIcon side="center" /> },
        { value: "right", label: "Right", icon: <AlignIcon side="right" /> },
      ]}
    />
  );
}

function AlignIcon({ side }: { side: DesignAlign }) {
  const justify =
    side === "left" ? "justify-start" : side === "right" ? "justify-end" : "justify-center";
  return (
    <span className={`inline-flex w-4 flex-col gap-0.5 ${justify}`} aria-hidden>
      <span className="h-0.5 w-3 rounded bg-current" />
      <span className="h-0.5 w-2 rounded bg-current" />
      <span className="h-0.5 w-3 rounded bg-current" />
    </span>
  );
}

export function ToggleControl({
  label,
  hint,
  checked,
  onChange,
  onLabel = "On",
  offLabel = "Off",
  badge,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <ControlField label={label} hint={hint} badge={badge}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex h-11 w-full items-center justify-between rounded-2xl border px-3 text-sm ${
          checked ? "border-terracotta/40 bg-terracotta/10" : "border-ink/15 bg-white/70"
        }`}
      >
        <span>{checked ? onLabel : offLabel}</span>
        <span
          className={`relative h-6 w-11 rounded-full transition ${
            checked ? "bg-terracotta" : "bg-ink/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              checked ? "left-5" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </ControlField>
  );
}

export function SizeSlider({
  label,
  hint,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  onReset,
  badge,
  optional = false,
  emptyMeansDefault = false,
}: {
  label: string;
  hint?: string;
  /** Stored CSS length, or empty when optional / using default. */
  value: string;
  /** Default CSS length used when value is empty. */
  defaultValue: string;
  min: number;
  max: number;
  step?: number;
  unit?: LengthUnit;
  onChange: (css: string | undefined) => void;
  onReset?: () => void;
  badge?: React.ReactNode;
  /** When true, Reset clears to undefined instead of writing defaultValue. */
  optional?: boolean;
  emptyMeansDefault?: boolean;
}) {
  const fallback = cssLengthToUnit(defaultValue, unit, min);
  const raw = value.trim()
    ? cssLengthToUnit(value, unit, fallback)
    : emptyMeansDefault || optional
      ? fallback
      : fallback;
  const current = clampStep(raw, min, max, step);
  const display = Math.round(current * 10) / 10;
  const isCustom = Boolean(value.trim()) && optional;

  function commit(next: number) {
    const clamped = clampStep(next, min, max, step);
    onChange(formatCssLength(clamped, unit));
  }

  return (
    <ControlField
      label={label}
      hint={hint}
      badge={
        <span className="flex items-center gap-2">
          {badge}
          {onReset || optional ? (
            <button
              type="button"
              className="text-xs text-terracotta underline-offset-4 hover:underline"
              onClick={() => {
                if (optional) onChange(undefined);
                else if (onReset) onReset();
                else onChange(defaultValue);
              }}
            >
              Reset
            </button>
          ) : null}
        </span>
      }
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white/70 text-lg leading-none text-ink/70 hover:border-ink/30"
          onClick={() => commit(current - step)}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => commit(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-terracotta"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white/70 text-lg leading-none text-ink/70 hover:border-ink/30"
          onClick={() => commit(current + step)}
        >
          +
        </button>
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-ink/70">{display}</span>
      </div>
      {optional && !isCustom && emptyMeansDefault ? (
        <p className="mt-1 text-xs text-ink/45">Using the default. Move the slider to customise.</p>
      ) : null}
    </ControlField>
  );
}

/** Padding slider that writes a uniform CSS padding value. */
export function PaddingSlider({
  label,
  hint,
  value,
  defaultValue,
  onChange,
  badge,
  optional = false,
}: {
  label: string;
  hint?: string;
  value: string;
  defaultValue: string;
  onChange: (css: string | undefined) => void;
  badge?: React.ReactNode;
  optional?: boolean;
}) {
  const fallback = Math.round(cssPaddingToUniformPx(defaultValue, 16));
  const current = clampStep(
    value.trim() ? cssPaddingToUniformPx(value, fallback) : fallback,
    0,
    64,
    1,
  );
  return (
    <SizeSlider
      label={label}
      hint={hint}
      value={value.trim() ? `${Math.round(current)}px` : optional ? "" : `${Math.round(current)}px`}
      defaultValue={`${fallback}px`}
      min={0}
      max={64}
      step={1}
      unit="px"
      optional={optional}
      emptyMeansDefault={optional}
      onChange={onChange}
      badge={badge}
    />
  );
}

export function PercentSlider({
  label,
  hint,
  value,
  onChange,
  onReset,
}: {
  label: string;
  hint?: string;
  value: number;
  defaultValue: number;
  onChange: (value: number) => void;
  onReset?: () => void;
}) {
  const current = clampStep(value, 0, 100, 1);
  return (
    <ControlField
      label={label}
      hint={hint}
      badge={
        onReset ? (
          <button
            type="button"
            className="text-xs text-terracotta underline-offset-4 hover:underline"
            onClick={onReset}
          >
            Reset
          </button>
        ) : null
      }
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white/70 text-lg leading-none text-ink/70 hover:border-ink/30"
          onClick={() => onChange(clampStep(current - 1, 0, 100, 1))}
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-terracotta"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white/70 text-lg leading-none text-ink/70 hover:border-ink/30"
          onClick={() => onChange(clampStep(current + 1, 0, 100, 1))}
        >
          +
        </button>
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-ink/70">{current}</span>
      </div>
    </ControlField>
  );
}

export function AdvancedCssDetails({ children }: { children: React.ReactNode }) {
  return (
    <details className="rounded-2xl border border-ink/10 bg-white/40 p-3">
      <summary className="cursor-pointer text-xs tracking-[0.18em] text-ink/45 uppercase">
        Advanced (developers)
      </summary>
      <div className="mt-3 grid gap-3">{children}</div>
    </details>
  );
}

export function pxFromCss(value: string | undefined, fallback: number) {
  return Math.round(cssLengthToPx(value, fallback));
}
