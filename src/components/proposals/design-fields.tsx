"use client";

import {
  ColourSchemeFields,
  SectionBackgroundFields,
} from "@/components/proposals/colour-fields";
import { PhoneBadge, useEditorViewport } from "@/components/proposals/editor-viewport";
import { ImageCropControl } from "@/components/proposals/image-crop-control";
import {
  AdvancedCssDetails,
  AlignButtons,
  ChoiceButtons,
  ControlField,
  PaddingSlider,
  PercentSlider,
  SizeSlider,
  ToggleControl,
} from "@/components/proposals/visual-controls";
import { Input } from "@/components/ui/input";
import { resolveColourScheme } from "@/lib/proposal-colours";
import {
  resolveProposalDesign,
  type CardHeightMode,
  type CardPaddingPreset,
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
import { columnsToCss, countGridColumns } from "@/lib/proposal-visual-units";
import { imageSrc, type ProposalImage, type ProposalSection } from "@/lib/proposals";

const PLAN_TWO = ".79fr 1.21fr";
const INVESTMENT_TWO = "1.15fr 1fr";

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
  const desktop = resolveProposalDesign(design);

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

  function resetKey(key: keyof ProposalDesignMobile) {
    patchMobile({ [key]: undefined } as ProposalDesignMobile);
  }

  function resetCoverKey(key: keyof CoverMobileDesign) {
    patchCover({ [key]: undefined } as CoverMobileDesign);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink/55">
          Phone values apply on small screens only. Reset a field to keep the desktop look. PDF always uses desktop.
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
      <ColourSchemeFields design={design} onChange={onChange} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SizeSlider
          label="Header height"
          value={cover.heroHeight || ""}
          defaultValue={desktop.cover.heroHeight}
          min={120}
          max={600}
          step={4}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(heroHeight) => patchCover({ heroHeight })}
          badge={
            <PhoneBadge
              active={Boolean(cover.heroHeight)}
              onReset={cover.heroHeight ? () => resetCoverKey("heroHeight") : undefined}
            />
          }
        />
        <SizeSlider
          label="Cover title size"
          value={cover.titleSize || ""}
          defaultValue="32"
          min={14}
          max={48}
          step={1}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(titleSize) => patchCover({ titleSize })}
          badge={
            <PhoneBadge
              active={Boolean(cover.titleSize)}
              onReset={cover.titleSize ? () => resetCoverKey("titleSize") : undefined}
            />
          }
        />
        <SizeSlider
          label="Logo size"
          value={cover.logoSize || ""}
          defaultValue={desktop.cover.logoSize}
          min={24}
          max={96}
          step={2}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(logoSize) => patchCover({ logoSize })}
          badge={
            <PhoneBadge
              active={Boolean(cover.logoSize)}
              onReset={cover.logoSize ? () => resetCoverKey("logoSize") : undefined}
            />
          }
        />
        <SizeSlider
          label="Date size"
          value={cover.dateSize || ""}
          defaultValue={desktop.cover.dateSize}
          min={6}
          max={24}
          step={1}
          unit="pt"
          optional
          emptyMeansDefault
          onChange={(dateSize) => patchCover({ dateSize })}
          badge={
            <PhoneBadge
              active={Boolean(cover.dateSize)}
              onReset={cover.dateSize ? () => resetCoverKey("dateSize") : undefined}
            />
          }
        />
        <AlignButtons
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
        <ChoiceButtons
          label="Photo placement"
          value={cover.imageSide || "behind"}
          onChange={(imageSide) =>
            patchCover({ imageSide: imageSide === "behind" ? undefined : imageSide })
          }
          badge={
            <PhoneBadge
              active={Boolean(cover.imageSide)}
              onReset={cover.imageSide ? () => resetCoverKey("imageSide") : undefined}
            />
          }
          options={[
            { value: "behind", label: "Behind text" },
            { value: "top", label: "Above text" },
          ]}
        />
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
        <ChoiceButtons
          label="Photo grid columns"
          value={String(mobile.proofColumns || "") as "" | "1" | "2"}
          onChange={(value) =>
            patchMobile({
              proofColumns: value === "1" || value === "2" ? (Number(value) as 1 | 2) : undefined,
            })
          }
          badge={
            <PhoneBadge
              active={Boolean(mobile.proofColumns)}
              onReset={mobile.proofColumns ? () => resetKey("proofColumns") : undefined}
            />
          }
          options={[
            { value: "", label: "Desktop" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
        <ChoiceButtons
          label="Plan columns"
          value={
            mobile.planColumns
              ? String(countGridColumns(mobile.planColumns) as 1 | 2)
              : ""
          }
          onChange={(value) =>
            patchMobile({
              planColumns: value === "1" || value === "2" ? columnsToCss(Number(value) as 1 | 2) : undefined,
            })
          }
          badge={
            <PhoneBadge
              active={Boolean(mobile.planColumns)}
              onReset={mobile.planColumns ? () => resetKey("planColumns") : undefined}
            />
          }
          options={[
            { value: "", label: "Desktop" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
        <ChoiceButtons
          label="Investment columns"
          value={
            mobile.investmentColumns
              ? String(countGridColumns(mobile.investmentColumns) as 1 | 2)
              : ""
          }
          onChange={(value) =>
            patchMobile({
              investmentColumns:
                value === "1" || value === "2" ? columnsToCss(Number(value) as 1 | 2) : undefined,
            })
          }
          badge={
            <PhoneBadge
              active={Boolean(mobile.investmentColumns)}
              onReset={mobile.investmentColumns ? () => resetKey("investmentColumns") : undefined}
            />
          }
          options={[
            { value: "", label: "Desktop" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
        <ChoiceButtons
          label="Reviews"
          value={(mobile.reviewLayout || "") as "" | ReviewPhoneLayout}
          onChange={(reviewLayout) =>
            patchMobile({ reviewLayout: (reviewLayout || undefined) as ReviewPhoneLayout | undefined })
          }
          badge={
            <PhoneBadge
              active={Boolean(mobile.reviewLayout)}
              onReset={mobile.reviewLayout ? () => resetKey("reviewLayout") : undefined}
            />
          }
          options={[
            { value: "", label: "Desktop" },
            { value: "stack", label: "Stacked" },
            { value: "side", label: "Side by side" },
          ]}
        />
        <SizeSlider
          label="Section title size"
          value={mobile.sectionTitleSize || ""}
          defaultValue="25px"
          min={14}
          max={48}
          step={1}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(sectionTitleSize) => patchMobile({ sectionTitleSize })}
          badge={
            <PhoneBadge
              active={Boolean(mobile.sectionTitleSize)}
              onReset={mobile.sectionTitleSize ? () => resetKey("sectionTitleSize") : undefined}
            />
          }
        />
        <SizeSlider
          label="Space above sign-off"
          value={mobile.signOffGap || ""}
          defaultValue="32px"
          min={0}
          max={80}
          step={1}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(signOffGap) => patchMobile({ signOffGap })}
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
    onChange({
      ...value,
      ...partial,
      colours: design?.colours,
      background: design?.background,
      mobile: design?.mobile,
    });
  }

  function patchCover(partial: Partial<ResolvedCoverDesign>) {
    onChange({
      ...value,
      cover: { ...value.cover, ...partial },
      colours: design?.colours,
      background: design?.background,
      mobile: design?.mobile,
    });
  }

  const stops = value.cover.gradientStops;
  const coverPhoto = heroImage || null;
  const planCols = countGridColumns(value.planColumns);
  const investmentCols = countGridColumns(value.investmentColumns);

  return (
    <div className="grid gap-4">
      <p className="text-xs text-ink/55">
        Drag the sliders or tap the buttons. The live preview updates as you go. Reset restores the Awake default for that field.
      </p>
      <ColourSchemeFields design={design} onChange={onChange} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SizeSlider
          label="Header height"
          value={value.cover.heroHeight}
          defaultValue="70mm"
          min={120}
          max={600}
          step={4}
          unit="px"
          onChange={(heroHeight) => patchCover({ heroHeight: heroHeight || "70mm" })}
          onReset={() => patchCover({ heroHeight: "70mm" })}
        />
        <SizeSlider
          label="Logo size"
          value={value.cover.logoSize}
          defaultValue="46px"
          min={24}
          max={96}
          step={2}
          unit="px"
          onChange={(logoSize) => patchCover({ logoSize: logoSize || "46px" })}
          onReset={() => patchCover({ logoSize: "46px" })}
        />
        <SizeSlider
          label="Date size"
          value={value.cover.dateSize}
          defaultValue="8pt"
          min={6}
          max={24}
          step={1}
          unit="pt"
          onChange={(dateSize) => patchCover({ dateSize: dateSize || "8pt" })}
          onReset={() => patchCover({ dateSize: "8pt" })}
        />
        <SizeSlider
          label="Space above the date"
          value={value.cover.dateOffset}
          defaultValue="2.8mm"
          min={0}
          max={40}
          step={1}
          unit="px"
          onChange={(dateOffset) => patchCover({ dateOffset: dateOffset || "2.8mm" })}
          onReset={() => patchCover({ dateOffset: "2.8mm" })}
        />
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
          <PercentSlider
            key={index}
            label={`Gradient fade ${index + 1}`}
            hint={index === 0 ? "Where the dark fade meets the photo" : undefined}
            value={stops[index]}
            defaultValue={([42, 52, 64] as const)[index]}
            onChange={(amount) => {
              const next = [...stops] as [number, number, number];
              next[index] = amount;
              patchCover({ gradientStops: next });
            }}
            onReset={() => {
              const next = [...stops] as [number, number, number];
              next[index] = ([42, 52, 64] as const)[index];
              patchCover({ gradientStops: next });
            }}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceButtons
          label="Plan columns"
          value={String(planCols === 3 ? 2 : planCols) as "1" | "2"}
          onChange={(cols) =>
            patch({ planColumns: columnsToCss(Number(cols) as 1 | 2, PLAN_TWO) })
          }
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
        <SizeSlider
          label="Space between plan boxes"
          value={value.planGap}
          defaultValue="5mm"
          min={0}
          max={64}
          step={1}
          unit="px"
          onChange={(planGap) => patch({ planGap: planGap || "5mm" })}
          onReset={() => patch({ planGap: "5mm" })}
        />
        <PaddingSlider
          label="Space inside the olive box"
          value={value.planLeadPadding}
          defaultValue="4.5mm 5mm 6.7mm"
          onChange={(planLeadPadding) =>
            patch({ planLeadPadding: planLeadPadding || "4.5mm 5mm 6.7mm" })
          }
        />
        <ChoiceButtons
          label="Investment columns"
          value={String(investmentCols === 3 ? 2 : investmentCols) as "1" | "2"}
          onChange={(cols) =>
            patch({ investmentColumns: columnsToCss(Number(cols) as 1 | 2, INVESTMENT_TWO) })
          }
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
        <SizeSlider
          label="Space between investment boxes"
          value={value.investmentGap}
          defaultValue="6mm"
          min={0}
          max={64}
          step={1}
          unit="px"
          onChange={(investmentGap) => patch({ investmentGap: investmentGap || "6mm" })}
          onReset={() => patch({ investmentGap: "6mm" })}
        />
        <SizeSlider
          label="Orange card top offset"
          hint="Keeps the title outside the orange panel"
          value={value.cardOffsetTop}
          defaultValue="0"
          min={0}
          max={120}
          step={2}
          unit="px"
          onChange={(cardOffsetTop) => patch({ cardOffsetTop: cardOffsetTop || "0" })}
          onReset={() => patch({ cardOffsetTop: "0" })}
        />
        <SizeSlider
          label="Space above Next step"
          value={value.nextStepGap}
          defaultValue="9.5mm"
          min={0}
          max={80}
          step={1}
          unit="px"
          onChange={(nextStepGap) => patch({ nextStepGap: nextStepGap || "9.5mm" })}
          onReset={() => patch({ nextStepGap: "9.5mm" })}
        />
        <SizeSlider
          label="Space above the button"
          value={value.ctaGap}
          defaultValue="8.5mm"
          min={0}
          max={80}
          step={1}
          unit="px"
          onChange={(ctaGap) => patch({ ctaGap: ctaGap || "8.5mm" })}
          onReset={() => patch({ ctaGap: "8.5mm" })}
        />
        <SizeSlider
          label="Space above the sign-off"
          value={value.signOffGap}
          defaultValue="7.5mm"
          min={0}
          max={80}
          step={1}
          unit="px"
          onChange={(signOffGap) => patch({ signOffGap: signOffGap || "7.5mm" })}
          onReset={() => patch({ signOffGap: "7.5mm" })}
        />
        <AlignButtons
          label="Button position"
          value={value.buttonPosition}
          onChange={(buttonPosition) => patch({ buttonPosition })}
        />
        <AlignButtons
          label="Sign-off alignment"
          value={value.signOffAlign}
          onChange={(signOffAlign) => patch({ signOffAlign })}
        />
      </div>
    </div>
  );
}

const CARD_SECTION_TYPES = new Set([
  "noticed",
  "deliverables",
  "addon",
  "review",
  "howIWork",
]);

export function sectionHasCardLayout(type: ProposalSection["type"]) {
  return CARD_SECTION_TYPES.has(type);
}

type CardLayoutValue = Pick<
  SectionDesign,
  "cardHeight" | "cardHeightValue" | "cardPadding" | "cardTextSize" | "gap" | "columns"
>;

export function CardLayoutFields({
  value,
  onChange,
  phone = false,
}: {
  value: CardLayoutValue;
  onChange: (partial: CardLayoutValue) => void;
  phone?: boolean;
}) {
  const heightMode = value.cardHeight || (phone ? "auto" : "equal");
  const padding =
    typeof value.cardPadding === "string" &&
    ["compact", "normal", "roomy"].includes(value.cardPadding)
      ? value.cardPadding
      : "normal";
  const textSize = value.cardTextSize || "normal";
  const colCount = value.columns ? countGridColumns(value.columns) : ("" as const);

  return (
    <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white/40 p-3">
      <p className="text-xs tracking-[0.18em] text-ember uppercase">
        Cards{phone ? " · phone" : ""}
      </p>
      <ChoiceButtons
        label="Card height"
        hint={
          phone
            ? "Auto fits content (default on phone). Equal stretches a row. Fixed uses a number."
            : "Equal keeps a row the same height. Auto fits each card. Fixed uses a number."
        }
        value={heightMode}
        onChange={(next) => {
          const cardHeight = next as CardHeightMode;
          onChange({
            cardHeight: phone && cardHeight === "auto" ? undefined : cardHeight,
            cardHeightValue: cardHeight === "fixed" ? value.cardHeightValue || "48mm" : undefined,
          });
        }}
        options={[
          { value: "auto", label: "Auto" },
          { value: "equal", label: "Equal" },
          { value: "fixed", label: "Fixed" },
        ]}
      />
      {heightMode === "fixed" ? (
        <SizeSlider
          label="Fixed height"
          value={value.cardHeightValue || ""}
          defaultValue="48mm"
          min={24}
          max={200}
          step={1}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(cardHeightValue) =>
            onChange({ cardHeightValue: cardHeightValue || undefined })
          }
        />
      ) : null}
      <ChoiceButtons
        label="Card padding"
        value={padding}
        onChange={(next) => {
          const preset = next as CardPaddingPreset;
          onChange({ cardPadding: preset === "normal" ? undefined : preset });
        }}
        options={[
          { value: "compact", label: "Compact" },
          { value: "normal", label: "Normal" },
          { value: "roomy", label: "Roomy" },
        ]}
      />
      <ChoiceButtons
        label="Columns"
        value={colCount === "" ? "" : String(colCount)}
        onChange={(next) => {
          if (!next) {
            onChange({ columns: undefined });
            return;
          }
          onChange({ columns: columnsToCss(Number(next) as 1 | 2 | 3) });
        }}
        options={[
          { value: "", label: phone ? "Desktop" : "Default" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          ...(phone ? [] : [{ value: "3", label: "3" }]),
        ]}
      />
      <SizeSlider
        label="Gap between cards"
        value={value.gap || ""}
        defaultValue="16px"
        min={0}
        max={64}
        step={1}
        unit="px"
        optional
        emptyMeansDefault
        onChange={(gap) => onChange({ gap: gap || undefined })}
      />
      <ChoiceButtons
        label="Text size inside cards"
        value={textSize}
        onChange={(next) => onChange({ cardTextSize: next === "normal" ? undefined : next })}
        options={[
          { value: "normal", label: "Normal" },
          { value: "small", label: "Small" },
          { value: "large", label: "Large" },
        ]}
      />
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
  const titleVisible = !(design.titleStyle === "hidden" || design.showTitle === false);
  const colCount = design.columns ? countGridColumns(design.columns) : ("" as const);

  function patch(partial: SectionDesign) {
    onChange({ ...section, design: { ...design, ...partial } } as ProposalSection);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-ink/10 bg-white/50 p-4">
      <p className="text-xs tracking-[0.2em] text-ember uppercase">This block</p>
      <ToggleControl
        label="Show section title"
        hint="When off, the title is hidden but the copy stays."
        checked={titleVisible}
        onLabel="Shown"
        offLabel="Hidden"
        onChange={(shown) =>
          patch({ titleStyle: shown ? "standard" : "hidden", showTitle: shown })
        }
      />
      <ChoiceButtons
        label="Columns"
        value={colCount === "" ? "" : String(colCount)}
        onChange={(value) => {
          if (!value) {
            patch({ columns: undefined });
            return;
          }
          patch({ columns: columnsToCss(Number(value) as 1 | 2 | 3) });
        }}
        options={[
          { value: "", label: "Default" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
        ]}
      />
      <AlignButtons
        label="Horizontal alignment"
        value={design.align || "left"}
        onChange={(align) => patch({ align })}
      />
      <SizeSlider
        label="Nudge sideways"
        value={design.offsetX || ""}
        defaultValue="0"
        min={-80}
        max={80}
        step={2}
        unit="px"
        optional
        emptyMeansDefault
        onChange={(offsetX) => patch({ offsetX })}
      />
      <PaddingSlider
        label="Space inside box"
        value={design.padding || ""}
        defaultValue="0"
        optional
        onChange={(padding) => patch({ padding })}
      />
      <SizeSlider
        label="Space above"
        value={design.marginTop || ""}
        defaultValue="0"
        min={0}
        max={80}
        step={1}
        unit="px"
        optional
        emptyMeansDefault
        onChange={(marginTop) => patch({ marginTop })}
      />
      <SizeSlider
        label="Space between boxes"
        value={design.gap || ""}
        defaultValue="16px"
        min={0}
        max={64}
        step={1}
        unit="px"
        optional
        emptyMeansDefault
        onChange={(gap) => patch({ gap })}
      />
      {sectionHasCardLayout(section.type) ? (
        <CardLayoutFields value={design} onChange={(partial) => patch(partial)} />
      ) : null}
      {section.type === "investment" ? (
        <SizeSlider
          label="Orange card top offset"
          value={design.cardOffsetTop || ""}
          defaultValue="0"
          min={0}
          max={120}
          step={2}
          unit="px"
          optional
          emptyMeansDefault
          onChange={(cardOffsetTop) => patch({ cardOffsetTop })}
        />
      ) : null}
      {section.type === "nextStep" ? (
        <AlignButtons
          label="Button position"
          value={design.buttonPosition || "left"}
          onChange={(buttonPosition) => patch({ buttonPosition })}
        />
      ) : null}
      {section.type === "signOff" ? (
        <AlignButtons
          label="Sign-off alignment"
          value={design.signOffAlign || "left"}
          onChange={(signOffAlign) => patch({ signOffAlign })}
        />
      ) : null}
      <SectionBackgroundFields
        background={design.background}
        pageFallback={resolveColourScheme().pageBg}
        onChange={(background) => {
          const next = { ...design };
          if (background) next.background = background;
          else delete next.background;
          onChange({
            ...section,
            design: Object.keys(next).length ? next : undefined,
          } as ProposalSection);
        }}
      />
      <AdvancedCssDetails>
        <ControlField label="Columns (raw)">
          <Input
            value={design.columns || ""}
            placeholder="Leave blank for default"
            onChange={(e) => patch({ columns: e.target.value.trim() || undefined })}
          />
        </ControlField>
        <ControlField label="Padding (raw)">
          <Input
            value={design.padding || ""}
            placeholder="Leave blank for default"
            onChange={(e) => patch({ padding: e.target.value.trim() || undefined })}
          />
        </ControlField>
        <ControlField label="Gap (raw)">
          <Input
            value={design.gap || ""}
            placeholder="Leave blank for default"
            onChange={(e) => patch({ gap: e.target.value.trim() || undefined })}
          />
        </ControlField>
      </AdvancedCssDetails>
    </div>
  );
}
