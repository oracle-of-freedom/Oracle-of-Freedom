"use client";

import { ImageCropControl } from "@/components/proposals/image-crop-control";
import { Input, Label } from "@/components/ui/input";
import {
  resolveProposalDesign,
  type DesignAlign,
  type ProposalDesign,
  type ResolvedCoverDesign,
  type ResolvedProposalDesign,
  type SectionDesign,
} from "@/lib/proposal-design";
import { HERO_CROP_FALLBACK } from "@/lib/proposal-image-crop";
import { imageSrc, type ProposalImage, type ProposalSection } from "@/lib/proposals";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

function TextControl({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function AlignControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DesignAlign;
  onChange: (value: DesignAlign) => void;
}) {
  return (
    <Field label={label}>
      <select
        className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
        value={value}
        onChange={(e) => onChange(e.target.value as DesignAlign)}
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </Field>
  );
}

export function ProposalDesignFields({
  design,
  onChange,
  heroImage,
  onHeroImageChange,
}: {
  design?: ProposalDesign;
  onChange: (design: ProposalDesign) => void;
  heroImage?: ProposalImage | null;
  onHeroImageChange?: (heroImage: ProposalImage | null) => void;
}) {
  const value = resolveProposalDesign(design);

  function patch(partial: Partial<ResolvedProposalDesign>) {
    onChange({ ...value, ...partial });
  }

  function patchCover(partial: Partial<ResolvedCoverDesign>) {
    onChange({ ...value, cover: { ...value.cover, ...partial } });
  }

  const stops = value.cover.gradientStops;
  const coverPhoto = heroImage || null;

  return (
    <div className="grid gap-4">
      <p className="text-xs text-ink/55">
        Lengths use mm or px. Column tracks use fr, for example .79fr 1.21fr. Empty values fall back to the Awake-style defaults when you reset.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextControl label="Header height" hint="Default 70mm" value={value.cover.heroHeight} onChange={(heroHeight) => patchCover({ heroHeight })} />
        <TextControl label="Logo size" hint="Default 46px" value={value.cover.logoSize} onChange={(logoSize) => patchCover({ logoSize })} />
        <TextControl label="Date size" hint="Default 8pt, smaller than the subtitle" value={value.cover.dateSize} onChange={(dateSize) => patchCover({ dateSize })} />
        <TextControl label="Date offset" hint="Default 2.8mm, pulls the date lower" value={value.cover.dateOffset} onChange={(dateOffset) => patchCover({ dateOffset })} />
      </div>
      {onHeroImageChange && coverPhoto && imageSrc(coverPhoto) ? (
        <ImageCropControl
          image={coverPhoto}
          frame="hero"
          fallback={HERO_CROP_FALLBACK}
          onChange={onHeroImageChange}
        />
      ) : (
        <p className="text-xs text-ink/50">
          Add a cover photograph in the Cover section to crop the header image here.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {([0, 1, 2] as const).map((index) => (
          <Field key={index} label={`Gradient stop ${index + 1} (%)`} hint={index === 0 ? "Default 42 / 52 / 64" : undefined}>
            <Input
              type="number"
              min={0}
              max={100}
              value={stops[index]}
              onChange={(e) => {
                const next = [...stops] as [number, number, number];
                const parsed = Number(e.target.value);
                next[index] = Number.isFinite(parsed) ? parsed : stops[index];
                patchCover({ gradientStops: next });
              }}
            />
          </Field>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextControl label="Plan columns" hint="Default .79fr 1.21fr" value={value.planColumns} onChange={(planColumns) => patch({ planColumns })} />
        <TextControl label="Plan gap" hint="Default 5mm" value={value.planGap} onChange={(planGap) => patch({ planGap })} />
        <TextControl label="Olive box padding" hint="Default 4.5mm 5mm 6.7mm" value={value.planLeadPadding} onChange={(planLeadPadding) => patch({ planLeadPadding })} />
        <TextControl label="Investment columns" hint="Default 1.15fr 1fr" value={value.investmentColumns} onChange={(investmentColumns) => patch({ investmentColumns })} />
        <TextControl label="Investment gap" hint="Default 6mm" value={value.investmentGap} onChange={(investmentGap) => patch({ investmentGap })} />
        <TextControl label="Orange card top offset" hint="Default 0. The title stays outside the panel." value={value.cardOffsetTop} onChange={(cardOffsetTop) => patch({ cardOffsetTop })} />
        <TextControl label="Space above Next step" hint="Default 9.5mm" value={value.nextStepGap} onChange={(nextStepGap) => patch({ nextStepGap })} />
        <TextControl label="Space above the button" hint="Default 8.5mm" value={value.ctaGap} onChange={(ctaGap) => patch({ ctaGap })} />
        <TextControl label="Space above the sign-off" hint="Default 7.5mm" value={value.signOffGap} onChange={(signOffGap) => patch({ signOffGap })} />
        <AlignControl label="Button position" value={value.buttonPosition} onChange={(buttonPosition) => patch({ buttonPosition })} />
        <AlignControl label="Sign-off alignment" value={value.signOffAlign} onChange={(signOffAlign) => patch({ signOffAlign })} />
      </div>
    </div>
  );
}

export function SectionDesignFields({
  section,
  onChange,
}: {
  section: ProposalSection;
  onChange: (section: ProposalSection) => void;
}) {
  const design = section.design || {};
  const titleMode = design.titleStyle === "hidden" || design.showTitle === false ? "hidden" : "standard";

  function patch(partial: SectionDesign) {
    onChange({ ...section, design: { ...design, ...partial } } as ProposalSection);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white/50 p-4">
      <p className="text-xs tracking-[0.2em] text-ember uppercase">This block</p>
      <Field label="Section title" hint="Standard matches the other titles. Hidden removes it. Copy stays.">
        <select
          className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
          value={titleMode}
          onChange={(e) => {
            const hidden = e.target.value === "hidden";
            patch({ titleStyle: hidden ? "hidden" : "standard", showTitle: !hidden });
          }}
        >
          <option value="standard">Standard</option>
          <option value="hidden">Hidden</option>
        </select>
      </Field>
      <TextControl label="Box width / columns" hint="CSS grid tracks for this block. Leave blank to use the proposal default." value={design.columns || ""} onChange={(columns) => patch({ columns: columns || undefined })} />
      <AlignControl label="Horizontal alignment" value={design.align || "left"} onChange={(align) => patch({ align })} />
      <TextControl label="Horizontal offset" hint="CSS length, default 0" value={design.offsetX || ""} onChange={(offsetX) => patch({ offsetX: offsetX || undefined })} />
      <TextControl label="Padding" hint="CSS shorthand, for example 4.5mm 14mm 0" value={design.padding || ""} onChange={(padding) => patch({ padding: padding || undefined })} />
      <TextControl label="Space above" hint="CSS length" value={design.marginTop || ""} onChange={(marginTop) => patch({ marginTop: marginTop || undefined })} />
      <TextControl label="Column gap" value={design.gap || ""} onChange={(gap) => patch({ gap: gap || undefined })} />
      {section.type === "investment" ? (
        <TextControl
          label="Orange card top offset"
          hint="Default for Awake style is 0: title outside, card fills the right of the panel."
          value={design.cardOffsetTop || ""}
          onChange={(cardOffsetTop) => patch({ cardOffsetTop: cardOffsetTop || undefined })}
        />
      ) : null}
      {section.type === "nextStep" ? (
        <AlignControl
          label="Button position"
          value={design.buttonPosition || "left"}
          onChange={(buttonPosition) => patch({ buttonPosition })}
        />
      ) : null}
      {section.type === "signOff" ? (
        <AlignControl
          label="Sign-off alignment"
          value={design.signOffAlign || "left"}
          onChange={(signOffAlign) => patch({ signOffAlign })}
        />
      ) : null}
    </div>
  );
}
