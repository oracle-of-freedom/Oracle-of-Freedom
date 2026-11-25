"use client";

import { PhoneBadge, useEditorViewport } from "@/components/proposals/editor-viewport";
import {
  ChoiceButtons,
  ControlField,
  PercentSlider,
  ToggleControl,
} from "@/components/proposals/visual-controls";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  BACKGROUND_PRESETS,
  backgroundFromImage,
  hasBackgroundOverrides,
  parseProposalBackground,
  resolveBackground,
  shuffleMeshSeed,
  type BackgroundKind,
  type GradientStop,
  type ProposalBackground,
} from "@/lib/proposal-backgrounds";
import {
  COLOUR_PALETTES,
  DEFAULT_COLOUR_SCHEME,
  colourContrastIssues,
  fixColourSchemeContrast,
  hasColourOverrides,
  normalizeHex,
  resolveColourScheme,
  resolveColourSchemeWithPhone,
  type ProposalColourScheme,
  type ResolvedColourScheme,
  WCAG_AA_BODY,
} from "@/lib/proposal-colours";
import type { ProposalDesign } from "@/lib/proposal-design";
import type { ProposalImage } from "@/lib/proposals";

function ColourSwatch({
  label,
  value,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onReset?: () => void;
}) {
  const hex = normalizeHex(value) || "#000000";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="mb-0 text-sm">{label}</Label>
        {onReset ? (
          <button
            type="button"
            className="text-xs text-terracotta underline-offset-4 hover:underline"
            onClick={onReset}
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex.length === 9 ? hex.slice(0, 7) : hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-xl border border-ink/15 bg-white p-1"
          aria-label={label}
        />
        <Input
          value={hex}
          onChange={(e) => {
            const next = normalizeHex(e.target.value);
            if (next) onChange(next);
          }}
          className="font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function PaletteRow({
  active,
  onPick,
}: {
  active: ResolvedColourScheme;
  onPick: (scheme: ResolvedColourScheme) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {COLOUR_PALETTES.map((palette) => {
        const selected =
          palette.colours.pageBg === active.pageBg &&
          palette.colours.heading === active.heading &&
          palette.colours.buttonBg === active.buttonBg;
        return (
          <button
            key={palette.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(palette.colours)}
            className={`rounded-2xl border p-2 text-left transition ${
              selected
                ? "border-terracotta bg-terracotta/10"
                : "border-ink/10 bg-white/70 hover:border-ink/25"
            }`}
          >
            <div className="mb-2 flex h-8 overflow-hidden rounded-xl">
              {[
                palette.colours.pageBg,
                palette.colours.cardBg,
                palette.colours.heading,
                palette.colours.accent,
                palette.colours.buttonBg,
              ].map((colour, index) => (
                <span key={index} className="flex-1" style={{ background: colour }} />
              ))}
            </div>
            <p className="text-sm font-medium text-ink">{palette.name}</p>
          </button>
        );
      })}
    </div>
  );
}

function BackgroundThumb({
  presetId,
  selected,
  onPick,
}: {
  presetId: string;
  selected: boolean;
  onPick: () => void;
}) {
  const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId);
  if (!preset) return null;
  const resolved = resolveBackground(preset.background);
  let preview = resolved.solid;
  if (resolved.kind === "gradient") {
    const stops = resolved.gradient.stops
      .map((stop) => `${stop.colour} ${stop.position}%`)
      .join(", ");
    preview =
      resolved.gradient.kind === "radial"
        ? `radial-gradient(circle, ${stops})`
        : `linear-gradient(${resolved.gradient.angle}deg, ${stops})`;
  } else if (resolved.kind === "mesh") {
    preview = `radial-gradient(circle at 20% 30%, ${resolved.mesh.colours[0]}, transparent 55%), radial-gradient(circle at 80% 70%, ${resolved.mesh.colours[1]}, transparent 50%), ${resolved.solid}`;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={`overflow-hidden rounded-2xl border text-left transition ${
        selected ? "border-terracotta ring-2 ring-terracotta/30" : "border-ink/10 hover:border-ink/25"
      }`}
    >
      <span className="block h-14 w-full" style={{ background: preview }} aria-hidden />
      <span className="block px-2 py-1.5 text-xs text-ink">{preset.name}</span>
    </button>
  );
}

function StopEditor({
  stops,
  onChange,
}: {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
}) {
  return (
    <div className="space-y-3">
      {stops.map((stop, index) => (
        <div key={index} className="grid gap-2 rounded-2xl border border-ink/10 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <ColourSwatch
            label={`Stop ${index + 1}`}
            value={stop.colour}
            onChange={(colour) => {
              const next = [...stops];
              next[index] = { ...stop, colour };
              onChange(next);
            }}
          />
          <PercentSlider
            label="Position"
            value={stop.position}
            defaultValue={index === 0 ? 0 : index === stops.length - 1 ? 100 : 50}
            onChange={(position) => {
              const next = [...stops];
              next[index] = { ...stop, position };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="self-end text-sm text-terracotta disabled:opacity-40"
            disabled={stops.length <= 2}
            onClick={() => onChange(stops.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      {stops.length < 4 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...stops, { colour: "#e7d6c3", position: Math.min(100, stops.length * 33) }])
          }
        >
          Add stop
        </Button>
      ) : null}
    </div>
  );
}

export function BackgroundFields({
  background,
  pageFallback,
  onChange,
  badge,
  label = "Background",
}: {
  background?: ProposalBackground;
  pageFallback: string;
  onChange: (next: ProposalBackground | undefined) => void;
  badge?: React.ReactNode;
  label?: string;
}) {
  const resolved = resolveBackground(background, pageFallback);
  const kind = resolved.kind;

  function patch(partial: ProposalBackground) {
    const merged = { ...(background || {}), ...partial };
    onChange(parseProposalBackground(merged) || merged);
  }

  function setKind(next: BackgroundKind) {
    patch({ kind: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.2em] text-ember uppercase">{label}</p>
        {badge}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BACKGROUND_PRESETS.map((preset) => (
          <BackgroundThumb
            key={preset.id}
            presetId={preset.id}
            selected={
              (background?.kind || "solid") === (preset.background.kind || "solid") &&
              JSON.stringify(background?.gradient || null) ===
                JSON.stringify(preset.background.gradient || null) &&
              (background?.mesh?.seed ?? null) === (preset.background.mesh?.seed ?? null)
            }
            onPick={() => onChange({ ...preset.background })}
          />
        ))}
      </div>
      <ChoiceButtons
        label="Background type"
        value={kind}
        onChange={setKind}
        options={[
          { value: "solid", label: "Solid" },
          { value: "gradient", label: "Gradient" },
          { value: "mesh", label: "Soft blobs" },
          { value: "image", label: "Image" },
          { value: "texture", label: "Texture" },
        ]}
      />
      {(kind === "solid" || kind === "texture" || kind === "mesh") && (
        <ColourSwatch
          label="Base colour"
          value={resolved.solid}
          onChange={(solid) => patch({ solid })}
        />
      )}
      {kind === "gradient" ? (
        <div className="space-y-3">
          <ChoiceButtons
            label="Gradient style"
            value={resolved.gradient.kind}
            onChange={(gradientKind) =>
              patch({ gradient: { ...(background?.gradient || {}), kind: gradientKind } })
            }
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
            ]}
          />
          {resolved.gradient.kind === "linear" ? (
            <ControlField label="Angle" hint={`${resolved.gradient.angle}°`}>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={resolved.gradient.angle}
                onChange={(e) =>
                  patch({
                    gradient: {
                      ...(background?.gradient || {}),
                      angle: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-terracotta"
              />
            </ControlField>
          ) : null}
          <StopEditor
            stops={resolved.gradient.stops}
            onChange={(stops) =>
              patch({ gradient: { ...(background?.gradient || {}), stops } })
            }
          />
        </div>
      ) : null}
      {kind === "mesh" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {resolved.mesh.colours.map((colour, index) => (
              <ColourSwatch
                key={index}
                label={`Blob ${index + 1}`}
                value={colour}
                onChange={(nextColour) => {
                  const colours = [...resolved.mesh.colours];
                  colours[index] = nextColour;
                  patch({ mesh: { ...(background?.mesh || {}), colours } });
                }}
              />
            ))}
          </div>
          <PercentSlider
            label="Softness"
            value={resolved.mesh.softness}
            defaultValue={60}
            onChange={(softness) =>
              patch({ mesh: { ...(background?.mesh || {}), softness } })
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                mesh: {
                  ...(background?.mesh || {}),
                  seed: shuffleMeshSeed(background?.mesh?.seed),
                },
              })
            }
          >
            Shuffle
          </Button>
        </div>
      ) : null}
      {kind === "image" ? (
        <div className="space-y-3">
          <ControlField label="Image path or media id" hint="Paste a public path or studio media UUID.">
            <Input
              value={background?.image?.src || background?.image?.mediaId || ""}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const looksId = /^[0-9a-f-]{8,}$/i.test(raw) && !raw.includes("/");
                patch({
                  image: {
                    ...(background?.image || {}),
                    ...(looksId ? { mediaId: raw, src: undefined } : { src: raw, mediaId: undefined }),
                  },
                });
              }}
              placeholder="/images/… or media uuid"
            />
          </ControlField>
          <ColourSwatch
            label="Overlay colour"
            value={resolved.image.overlay}
            onChange={(overlay) =>
              patch({ image: { ...(background?.image || {}), overlay } })
            }
          />
          <PercentSlider
            label="Overlay opacity"
            value={resolved.image.overlayOpacity}
            defaultValue={35}
            onChange={(overlayOpacity) =>
              patch({ image: { ...(background?.image || {}), overlayOpacity } })
            }
          />
        </div>
      ) : null}
      <ToggleControl
        label="Grain texture"
        checked={resolved.texture.enabled}
        onChange={(enabled) =>
          patch({ texture: { ...(background?.texture || {}), enabled } })
        }
      />
      {resolved.texture.enabled ? (
        <PercentSlider
          label="Grain intensity"
          value={resolved.texture.intensity}
          defaultValue={20}
          onChange={(intensity) =>
            patch({ texture: { ...(background?.texture || {}), intensity } })
          }
        />
      ) : null}
      {(kind === "gradient" || kind === "mesh") && (
        <ToggleControl
          label="Gentle drift animation"
          hint="Off by default. Respects reduced-motion preferences."
          checked={resolved.animate}
          onChange={(animate) => patch({ animate })}
        />
      )}
      {hasBackgroundOverrides(background) ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(undefined)}>
          Clear background
        </Button>
      ) : null}
    </div>
  );
}

export function ColourSchemeFields({
  design,
  onChange,
}: {
  design?: ProposalDesign;
  onChange: (design: ProposalDesign) => void;
}) {
  const { isPhone } = useEditorViewport();
  const { desktop, phone } = resolveColourSchemeWithPhone(
    design?.colours,
    design?.mobile?.colours,
  );
  const active = isPhone ? phone : desktop;
  const phoneActive = hasColourOverrides(design?.mobile?.colours);

  function patchColours(next: ProposalColourScheme | undefined) {
    if (isPhone) {
      const mobile = { ...(design?.mobile || {}) };
      if (next && Object.keys(next).length) mobile.colours = next;
      else delete mobile.colours;
      const designNext: ProposalDesign = { ...(design || {}) };
      if (Object.keys(mobile).length) designNext.mobile = mobile;
      else delete designNext.mobile;
      onChange(designNext);
      return;
    }
    const designNext: ProposalDesign = { ...(design || {}) };
    if (next && Object.keys(next).length) designNext.colours = next;
    else delete designNext.colours;
    onChange(designNext);
  }

  function setResolved(scheme: ResolvedColourScheme) {
    patchColours({ ...scheme });
  }

  function patchKey<K extends keyof ResolvedColourScheme>(key: K, value: ResolvedColourScheme[K]) {
    setResolved({ ...active, [key]: value });
  }

  const issues = colourContrastIssues(active);

  function patchBackground(next: ProposalBackground | undefined) {
    if (isPhone) {
      const mobile = { ...(design?.mobile || {}) };
      if (next) mobile.background = next;
      else delete mobile.background;
      const designNext: ProposalDesign = { ...(design || {}) };
      if (Object.keys(mobile).length) designNext.mobile = mobile;
      else delete designNext.mobile;
      onChange(designNext);
      return;
    }
    const designNext: ProposalDesign = { ...(design || {}) };
    if (next) designNext.background = next;
    else delete designNext.background;
    onChange(designNext);
  }

  const background = isPhone ? design?.mobile?.background : design?.background;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.2em] text-ember uppercase">
          Colours{isPhone ? " · phone" : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isPhone ? (
            <PhoneBadge
              active={phoneActive}
              onReset={phoneActive ? () => patchColours(undefined) : undefined}
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setResolved({ ...DEFAULT_COLOUR_SCHEME })}
          >
            Reset colours
          </Button>
        </div>
      </div>

      <PaletteRow active={active} onPick={setResolved} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ColourSwatch
          label="Page background"
          value={active.pageBg}
          onChange={(pageBg) => patchKey("pageBg", pageBg)}
        />
        <ColourSwatch
          label="Block / card background"
          value={active.cardBg}
          onChange={(cardBg) => patchKey("cardBg", cardBg)}
        />
        <ColourSwatch
          label="Block border"
          value={active.border}
          onChange={(border) => patchKey("border", border)}
        />
        <PercentSlider
          label="Border opacity"
          value={active.borderOpacity}
          defaultValue={100}
          onChange={(borderOpacity) => patchKey("borderOpacity", borderOpacity)}
        />
        <ColourSwatch
          label="Headings"
          value={active.heading}
          onChange={(heading) => patchKey("heading", heading)}
        />
        <ColourSwatch
          label="Body text"
          value={active.text}
          onChange={(text) => patchKey("text", text)}
        />
        <ColourSwatch
          label="Muted / small text"
          value={active.muted}
          onChange={(muted) => patchKey("muted", muted)}
        />
        <ColourSwatch
          label="Accent"
          value={active.accent}
          onChange={(accent) => patchKey("accent", accent)}
        />
        <ColourSwatch
          label="Button background"
          value={active.buttonBg}
          onChange={(buttonBg) => patchKey("buttonBg", buttonBg)}
        />
        <ColourSwatch
          label="Button text"
          value={active.buttonText}
          onChange={(buttonText) => patchKey("buttonText", buttonText)}
        />
      </div>

      {issues.length ? (
        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-3 py-3 text-sm text-ink">
          <p className="font-medium">Contrast warning</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-ink/80">
            {issues.map((issue) => (
              <li key={issue.pair}>
                {issue.pair === "heading" ? "Heading" : "Body"} text is{" "}
                {issue.ratio.toFixed(2)}:1 against the page (needs{" "}
                {issue.pair === "heading" ? "3" : WCAG_AA_BODY}:1 for WCAG AA).
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => setResolved(fixColourSchemeContrast(active))}
          >
            Fix contrast
          </Button>
        </div>
      ) : null}

      <BackgroundFields
        background={background}
        pageFallback={active.pageBg}
        onChange={patchBackground}
        badge={
          isPhone ? (
            <PhoneBadge
              active={hasBackgroundOverrides(design?.mobile?.background)}
              onReset={
                hasBackgroundOverrides(design?.mobile?.background)
                  ? () => patchBackground(undefined)
                  : undefined
              }
            />
          ) : undefined
        }
        label={isPhone ? "Page background · phone" : "Page background"}
      />
    </div>
  );
}

export function SectionBackgroundFields({
  background,
  pageFallback,
  onChange,
}: {
  background?: ProposalBackground;
  pageFallback: string;
  onChange: (next: ProposalBackground | undefined) => void;
}) {
  return (
    <BackgroundFields
      background={background}
      pageFallback={pageFallback}
      onChange={onChange}
      label="Section background"
    />
  );
}

/** Helper kept for image background wiring from crop controls. */
export function applyBackgroundImage(
  background: ProposalBackground | undefined,
  image: ProposalImage | null,
): ProposalBackground {
  return {
    ...(background || {}),
    kind: "image",
    image: {
      ...(background?.image || {}),
      ...backgroundFromImage(image),
      overlay: background?.image?.overlay || "#1b1512",
      overlayOpacity: background?.image?.overlayOpacity ?? 35,
    },
  };
}

export { resolveColourScheme };
