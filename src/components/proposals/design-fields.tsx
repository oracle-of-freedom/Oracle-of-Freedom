"use client";

import { PhoneBadge, useEditorViewport } from "@/components/proposals/editor-viewport";
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
import {
  hasDesignMobileSettings,
  type CoverMobileDesign,
  type ProposalDesignMobile,
  type ReviewPhoneLayout,
} from "@/lib/proposal-mobile";
import { imageSrc, type ProposalImage, type ProposalSection } from "@/lib/proposals";

function Field({
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

function TextControl({
  label,
  hint,
  value,
  onChange,
  badge,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  badge?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} badge={badge}>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function AlignControl({
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
    <Field label={label} badge={badge}>
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

function PhoneDesignFields({
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
  const mobile = design?.mobile || {};
  const cover = mobile.cover || {};
  const active = hasDesignMobileSettings(design);
  const coverPhoto = heroImage || null;

  function patchMobile(partial: ProposalDesignMobile) {
    const nextMobile: ProposalDesignMobile = { ...mobile, ...partial };
    for (const key of Object.keys(partial) as (keyof ProposalDesignMobile)[]) {
      if (partial[key] === undefined) delete nextMobile[key];
    }
    const next: ProposalDesign = { ...(design || {}) };
    if (Object.keys(nextMobile).length) next.mobile = nextMobile;
    else delete next.mobile;
    onChange(next);
  }

  function patchCover(partial: CoverMobileDesign) {
    const nextCover: CoverMobileDesign = { ...cover, ...partial };
    for (const key of Object.keys(partial) as (keyof CoverMobileDesign)[]) {
      if (partial[key] === undefined) delete nextCover[key];
    }
    patchMobile({
      cover: Object.keys(nextCover).length ? nextCover : undefined,
    });
  }

  function resetKey(
    key: keyof ProposalDesignMobile,
  ) {
    patchMobile({ [key]: undefined } as ProposalDesignMobile);
  }

  function resetCoverKey(key: keyof CoverMobileDesign) {
    patchCover({ [key]: undefined } as CoverMobileDesign);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink/55">
          Phone values apply under 768px. Leave a field blank to keep the desktop value. PDF always uses desktop.
        </p>
        <PhoneBadge
          active={active}
          onReset={
            active
              ? () => {
                  const next = { ...(design || {}) };
                  delete next.mobile;
                  onChange(next);
                }
              : undefined
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextControl
          label="Header height"
          hint="Desktop default 70mm"
          value={cover.heroHeight || ""}
          placeholder="Uses desktop"
          onChange={(heroHeight) => patchCover({ heroHeight: heroHeight.trim() || undefined })}
          badge={
            <PhoneBadge
              active={Boolean(cover.heroHeight)}
              onReset={cover.heroHeight ? () => resetCoverKey("heroHeight") : undefined}
            />
          }
        />
        <TextControl
          label="Title size"
          hint="For example 24pt"
          value={cover.titleSize || ""}
          placeholder="Uses desktop"
          onChange={(titleSize) => patchCover({ titleSize: titleSize.trim() || undefined })}
          badge={
            <PhoneBadge
              active={Boolean(cover.titleSize)}
              onReset={cover.titleSize ? () => resetCoverKey("titleSize") : undefined}
            />
          }
        />
        <TextControl
          label="Logo size"
          value={cover.logoSize || ""}
          placeholder="Uses desktop"
          onChange={(logoSize) => patchCover({ logoSize: logoSize.trim() || undefined })}
          badge={
            <PhoneBadge
              active={Boolean(cover.logoSize)}
              onReset={cover.logoSize ? () => resetCoverKey("logoSize") : undefined}
            />
          }
        />
        <TextControl
          label="Date size"
          value={cover.dateSize || ""}
          placeholder="Uses desktop"
          onChange={(dateSize) => patchCover({ dateSize: dateSize.trim() || undefined })}
          badge={
            <PhoneBadge
              active={Boolean(cover.dateSize)}
              onReset={cover.dateSize ? () => resetCoverKey("dateSize") : undefined}
            />
          }
        />
        <AlignControl
          label="Text alignment"
          value={cover.textAlign || "left"}
          onChange={(textAlign) => patchCover({ textAlign })}
          badge={
            <PhoneBadge
              active={Boolean(cover.textAlign)}
              onReset={cover.textAlign ? () => resetCoverKey("textAlign") : undefined}
            />
          }
        />
        <Field
          label="Image side"
          hint="Behind text (current) or stacked on top"
          badge={
            <PhoneBadge
              active={Boolean(cover.imageSide)}
              onReset={cover.imageSide ? () => resetCoverKey("imageSide") : undefined}
            />
          }
        >
          <select
            className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
            value={cover.imageSide || "behind"}
            onChange={(e) => {
              const value = e.target.value as "behind" | "top";
              patchCover({ imageSide: value === "behind" ? undefined : value });
            }}
          >
            <option value="behind">Behind text (desktop)</option>
            <option value="top">On top of text</option>
          </select>
        </Field>
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
          Add a cover photograph in the Cover section to crop the header image for phone here.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Photo grid columns"
          badge={
            <PhoneBadge
              active={Boolean(mobile.proofColumns)}
              onReset={mobile.proofColumns ? () => resetKey("proofColumns") : undefined}
            />
          }
        >
          <select
            className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
            value={mobile.proofColumns || ""}
            onChange={(e) => {
              const value = e.target.value;
              patchMobile({
                proofColumns: value === "1" || value === "2" ? (Number(value) as 1 | 2) : undefined,
              });
            }}
          >
            <option value="">Desktop default</option>
            <option value="1">1 column</option>
            <option value="2">2 columns</option>
          </select>
        </Field>
        <Field
          label="Plan / package columns"
          badge={
            <PhoneBadge
              active={Boolean(mobile.planColumns)}
              onReset={mobile.planColumns ? () => resetKey("planColumns") : undefined}
            />
          }
        >
          <select
            className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
            value={mobile.planColumns || ""}
            onChange={(e) => {
              const value = e.target.value;
              patchMobile({ planColumns: value || undefined });
            }}
          >
            <option value="">Desktop default</option>
            <option value="1fr">1 column</option>
            <option value="1fr 1fr">2 columns</option>
          </select>
        </Field>
        <Field
          label="Investment columns"
          badge={
            <PhoneBadge
              active={Boolean(mobile.investmentColumns)}
              onReset={mobile.investmentColumns ? () => resetKey("investmentColumns") : undefined}
            />
          }
        >
          <select
            className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
            value={mobile.investmentColumns || ""}
            onChange={(e) => {
              const value = e.target.value;
              patchMobile({ investmentColumns: value || undefined });
            }}
          >
            <option value="">Desktop default</option>
            <option value="1fr">1 column</option>
            <option value="1fr 1fr">2 columns</option>
          </select>
        </Field>
        <Field
          label="Reviews"
          badge={
            <PhoneBadge
              active={Boolean(mobile.reviewLayout)}
              onReset={mobile.reviewLayout ? () => resetKey("reviewLayout") : undefined}
            />
          }
        >
          <select
            className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
            value={mobile.reviewLayout || ""}
            onChange={(e) => {
              const value = e.target.value as ReviewPhoneLayout | "";
              patchMobile({ reviewLayout: value || undefined });
            }}
          >
            <option value="">Desktop default</option>
            <option value="stack">Stacked</option>
            <option value="side">Side by side</option>
          </select>
        </Field>
        <TextControl
          label="Section title size"
          hint="Default 25px on phone. Desktop stays 16.5pt."
          value={mobile.sectionTitleSize || ""}
          placeholder="25px"
          onChange={(sectionTitleSize) =>
            patchMobile({ sectionTitleSize: sectionTitleSize.trim() || undefined })
          }
          badge={
            <PhoneBadge
              active={Boolean(mobile.sectionTitleSize)}
              onReset={mobile.sectionTitleSize ? () => resetKey("sectionTitleSize") : undefined}
            />
          }
        />
        <TextControl
          label="Space above sign-off"
          hint="Space between Reply and With Love. Default 32px on phone."
          value={mobile.signOffGap || ""}
          placeholder="32px"
          onChange={(signOffGap) => patchMobile({ signOffGap: signOffGap.trim() || undefined })}
          badge={
            <PhoneBadge
              active={Boolean(mobile.signOffGap)}
              onReset={mobile.signOffGap ? () => resetKey("signOffGap") : undefined}
            />
          }
        />
      </div>
    </div>
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
  const { isPhone } = useEditorViewport();
  const value = resolveProposalDesign(design);

  if (isPhone) {
    return (
      <PhoneDesignFields
        design={design}
        onChange={onChange}
        heroImage={heroImage}
        onHeroImageChange={onHeroImageChange}
      />
    );
  }

  function patch(partial: Partial<ResolvedProposalDesign>) {
    onChange({ ...value, ...partial, mobile: design?.mobile });
  }

  function patchCover(partial: Partial<ResolvedCoverDesign>) {
    onChange({
      ...value,
      cover: { ...value.cover, ...partial },
      mobile: design?.mobile,
    });
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
