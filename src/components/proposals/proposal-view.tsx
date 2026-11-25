import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Image from "next/image";
import { OmMark } from "@/components/om-mark";
import { ProposalPdfButton } from "@/components/proposals/proposal-pdf-button";
import { ProposalProofGrid } from "@/components/proposals/proposal-proof-grid";
import { ProposalVideoBlock } from "@/components/proposals/proposal-video";
import {
  backgroundStyleVars,
  resolveBackground,
} from "@/lib/proposal-backgrounds";
import {
  colourSchemeVars,
  resolveColourSchemeWithPhone,
} from "@/lib/proposal-colours";
import {
  cardLayoutVars,
  resolveProposalDesign,
  sectionTitleVisible,
  type DesignAlign,
  type ResolvedProposalDesign,
} from "@/lib/proposal-design";
import {
  HERO_CROP_FALLBACK,
  hasImageCrop,
} from "@/lib/proposal-image-crop";
import {
  designMobileVars,
  hasMobileImageCrop,
  imagePhoneHiddenClass,
  imageResponsiveStyle,
  sectionMobileStyle,
  sectionPhoneClass,
} from "@/lib/proposal-mobile";
import { isReviewPlaceholder, reviewSlotHasContent } from "@/lib/proposal-reviews";
import { resolveProposalVideo } from "@/lib/proposal-video";
import {
  SIGN_OFF,
  addonPriceLines,
  depositAmount,
  imageSrc,
  resolveHeadingEmphasis,
  sceneShowsBody,
  type Proposal,
  type ProposalImage,
  type ProposalSection,
  type ProposalSectionOf,
  type ReviewSlot,
} from "@/lib/proposals";

export type ProposalViewMode = "public" | "preview" | "admin";

const PAGE_BREAK_TYPES = new Set<ProposalSection["type"]>(["proof", "deliverables", "investment"]);

function formatUsd(amount: number) {
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDisplayDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(`${iso}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function alignClass(align: DesignAlign | undefined, fallback: DesignAlign) {
  const value = align || fallback;
  if (value === "center") return "is-center";
  if (value === "right") return "is-right";
  return "is-left";
}

function designVars(
  design: ResolvedProposalDesign,
  raw?: import("@/lib/proposal-design").ProposalDesign | null,
): CSSProperties {
  const [stop1, stop2, stop3] = design.cover.gradientStops;
  const mobile = raw?.mobile;
  const { desktop: colours, phone: phoneColours } = resolveColourSchemeWithPhone(
    raw?.colours,
    mobile?.colours,
  );
  const pageBg = resolveBackground(raw?.background, colours.pageBg);
  const pageBgPhone = resolveBackground(mobile?.background || raw?.background, phoneColours.pageBg);
  return {
    ["--hero-height" as string]: design.cover.heroHeight,
    ["--logo-size" as string]: design.cover.logoSize,
    ["--date-size" as string]: design.cover.dateSize,
    ["--date-offset" as string]: design.cover.dateOffset,
    ["--hero-position" as string]: design.cover.imagePosition,
    ["--hero-size" as string]: design.cover.imageSize,
    ["--grad-1" as string]: `${stop1}%`,
    ["--grad-2" as string]: `${stop2}%`,
    ["--grad-3" as string]: `${stop3}%`,
    ["--plan-columns" as string]: design.planColumns,
    ["--plan-gap" as string]: design.planGap,
    ["--plan-lead-padding" as string]: design.planLeadPadding,
    ["--investment-columns" as string]: design.investmentColumns,
    ["--investment-gap" as string]: design.investmentGap,
    ["--card-offset" as string]: design.cardOffsetTop,
    ["--next-step-gap" as string]: design.nextStepGap,
    ["--cta-gap" as string]: design.ctaGap,
    ["--signoff-gap" as string]: design.signOffGap,
    ...colourSchemeVars(colours),
    ...colourSchemeVars(phoneColours, { phone: true }),
    ...backgroundStyleVars(pageBg),
    ...backgroundStyleVars(pageBgPhone, { phone: true, pageFallback: phoneColours.pageBg }),
    ...designMobileVars(mobile),
  };
}

function sectionStyle(section: ProposalSection, index: number): CSSProperties {
  const design = section.design;
  const mobile = section.mobile;
  const style: Record<string, string> = {
    ...(sectionMobileStyle(section, index) as Record<string, string>),
    // Phone / stacked default: fit content (no empty card bottoms).
    "--card-align-m": "start",
    "--card-min-height-m": "0",
    "--card-height-m": "auto",
  };
  Object.assign(style, cardLayoutVars(design));
  Object.assign(
    style,
    cardLayoutVars(
      {
        cardHeight: mobile?.cardHeight,
        cardHeightValue: mobile?.cardHeightValue,
        cardPadding: mobile?.cardPadding,
        cardTextSize: mobile?.cardTextSize,
        gap: mobile?.gap,
        columns: mobile?.columns,
      },
      { phone: true },
    ),
  );
  if (!design && !mobile) return style;
  if (design?.padding) style.padding = design.padding;
  if (design?.marginTop) style.marginTop = design.marginTop;
  if (design?.offsetX && design.offsetX !== "0") style.marginLeft = design.offsetX;
  if (design?.align) style.textAlign = design.align;
  if (design?.background) {
    Object.assign(
      style,
      backgroundStyleVars(resolveBackground(design.background), { pageFallback: "transparent" }),
    );
    style.background = "var(--p-bg-layer)";
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (mobile?.background) {
    Object.assign(
      style,
      backgroundStyleVars(resolveBackground(mobile.background), {
        phone: true,
        pageFallback: "transparent",
      }),
    );
  }
  if (design?.columns) {
    style["--block-columns"] = design.columns;
    if (section.type === "plan") style["--plan-columns"] = design.columns;
    if (section.type === "investment") style["--investment-columns"] = design.columns;
  }
  if (design?.gap) {
    style["--block-gap"] = design.gap;
    if (section.type === "plan") style["--plan-gap"] = design.gap;
    if (section.type === "investment") style["--investment-gap"] = design.gap;
  }
  if (mobile?.columns) {
    style["--block-columns-m"] = mobile.columns;
    if (section.type === "plan") style["--plan-columns-m"] = mobile.columns;
  }
  if (mobile?.gap) style["--block-gap-m"] = mobile.gap;
  if (section.type === "investment" && design?.cardOffsetTop) {
    style["--card-offset"] = design.cardOffsetTop;
  }
  if (section.type === "nextStep" && design?.marginTop) style["--next-step-gap"] = design.marginTop;
  if (section.type === "signOff" && design?.marginTop) style["--signoff-gap"] = design.marginTop;
  return style;
}

function Paragraphs({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (!blocks.length) return null;
  return blocks.map((block, blockIndex) => (
    <p key={`${blockIndex}-${block.slice(0, 24)}`}>
      {block.split("\n").map((line, index) => (
        <span key={`${blockIndex}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  ));
}

function Title({
  section,
  children,
}: {
  section: ProposalSection;
  children: ReactNode;
}) {
  if (!sectionTitleVisible(section.design) || !String(children || "").trim()) return null;
  const emphasis = resolveHeadingEmphasis(section);
  const size = emphasis === "xl" ? "is-xl" : emphasis === "large" ? "is-large" : "";
  return (
    <h2 className={`proposal-title ${size}`.trim()}>
      <span>{children}</span>
    </h2>
  );
}

function Dots({ items }: { items: string[] }) {
  return (
    <ul className="proposal-dots">
      {items.filter(Boolean).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function headlineNode(headline: string, emphasis?: string) {
  const lines = headline.split("\n");
  return lines.map((line, index) => {
    const mark = emphasis?.trim();
    let content: ReactNode = line;
    if (mark && line.includes(mark)) {
      const [before, after] = line.split(mark);
      content = (
        <>
          {before}
          <em>{mark}</em>
          {after}
        </>
      );
    }
    return (
      <span key={`${line}-${index}`}>
        {index > 0 ? <br /> : null}
        {content}
      </span>
    );
  });
}

function Cover({
  section,
  index,
  imageSide,
  onSelect,
}: {
  section: ProposalSectionOf<"cover">;
  index: number;
  imageSide?: "behind" | "top";
  onSelect?: (id: string) => void;
}) {
  const { data } = section;
  const src = imageSrc(data.heroImage);
  const hasDesktopCrop = hasImageCrop(data.heroImage);
  const hasMobileCrop = hasMobileImageCrop(data.heroImage);
  // Keep Awake desktop look (background-size: auto 100%) until a desktop crop
  // is saved. Phone-only crops must not force the desktop onto object-fit:cover.
  const useDesktopBackground = Boolean(src && !hasDesktopCrop);
  const showCroppedMedia = Boolean(src && (hasDesktopCrop || hasMobileCrop));
  const style: CSSProperties = {
    ...(useDesktopBackground ? { backgroundImage: `url("${src}")` } : {}),
    ...sectionStyle(section, index),
    cursor: onSelect ? "pointer" : undefined,
  };
  const phoneClass = sectionPhoneClass(section);
  const topClass = imageSide === "top" ? "is-phone-top" : "";
  const imageHidden = imagePhoneHiddenClass(data.heroImage);
  const mediaClass = [
    "proposal-hero-media",
    !hasDesktopCrop && hasMobileCrop ? "is-phone-crop-only" : "",
    imageHidden,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <header
      id={`proposal-section-${section.id}`}
      data-section-id={section.id}
      className={`proposal-hero ${phoneClass} ${topClass}`.trim()}
      style={style}
      onClick={onSelect ? () => onSelect(section.id) : undefined}
    >
      {showCroppedMedia && src ? (
        <div className={mediaClass} aria-hidden="true">
          <Image
            src={src}
            alt=""
            fill
            priority
            className="proposal-hero-photo proposal-cropped"
            style={imageResponsiveStyle(
              data.heroImage,
              hasDesktopCrop ? HERO_CROP_FALLBACK : undefined,
            )}
            sizes="100vw"
            unoptimized={src.startsWith("/api/media/")}
          />
        </div>
      ) : null}
      <div className="proposal-brand">
        <span className="proposal-logo-wrap">
          <OmMark className="h-full w-full" />
        </span>
        <span>Oracle of Freedom</span>
      </div>
      <div className="proposal-hero-copy">
        {data.kicker.trim() ? <p className="proposal-kicker">{data.kicker}</p> : null}
        <h1>{headlineNode(data.headline, data.headlineEmphasis)}</h1>
        {data.subtitle.trim() ? <p className="proposal-sub">{data.subtitle}</p> : null}
        {data.proposalDate ? <p className="proposal-date">{formatDisplayDate(data.proposalDate)}</p> : null}
      </div>
    </header>
  );
}

function SignOffBlock({
  intro,
  align,
}: {
  intro?: string;
  align: DesignAlign;
}) {
  return (
    <div className={`proposal-sign ${alignClass(align, "left")}`}>
      {intro?.trim() ? <p className="proposal-sign-intro">{intro}</p> : null}
      <p className="proposal-with">{SIGN_OFF.withLove}</p>
      <p className="proposal-name">{SIGN_OFF.name}</p>
      <p className="proposal-sign-brand">{SIGN_OFF.brand}</p>
      <a href={SIGN_OFF.urlHref}>{SIGN_OFF.url}</a>
    </div>
  );
}

function ExtraPhotos({ section }: { section: ProposalSection }) {
  const images = (section.images ?? []).filter((img) => imageSrc(img));
  if (!images.length) return null;
  return (
    <div className="proposal-extra-photos">
      {images.map((image, index) => {
        const src = imageSrc(image);
        return (
          <figure
            key={`${image.src || image.mediaId || "extra"}-${index}`}
            className={`proposal-extra-frame ${imagePhoneHiddenClass(image)}`.trim()}
          >
            <Image
              src={src}
              alt={image.alt || ""}
              width={800}
              height={600}
              className="proposal-extra-img proposal-cropped"
              style={imageResponsiveStyle(image)}
              unoptimized={src.startsWith("/api/media/")}
            />
          </figure>
        );
      })}
    </div>
  );
}

function PortfolioLine({ line }: { line: string }) {
  const url = "https://oracleoffreedom.com/portfolio";
  if (!line.trim()) return null;
  if (!line.includes(url)) return <p className="proposal-portfolio">{line}</p>;
  const [before, after] = line.split(url);
  return (
    <p className="proposal-portfolio">
      {before}
      <a href={url}>{url}</a>
      {after}
    </p>
  );
}

function ReviewCard({ slot }: { slot: ReviewSlot }) {
  const src = imageSrc(slot.image);
  return (
    <article className="proposal-review-card">
      {src ? (
        <div className={`proposal-review-photo ${imagePhoneHiddenClass(slot.image)}`.trim()}>
          <Image
            src={src}
            alt={slot.image?.alt || slot.name || ""}
            fill
            className="object-cover proposal-cropped"
            style={imageResponsiveStyle(slot.image)}
            sizes="(max-width: 767px) 100vw, 90mm"
            unoptimized={src.startsWith("/api/media/")}
          />
        </div>
      ) : null}
      <blockquote className="proposal-quote">“{slot.quote}”</blockquote>
      {slot.name.trim() ? <p className="proposal-review-name">{slot.name}</p> : null}
      {slot.service.trim() ? <p className="proposal-review-service">{slot.service}</p> : null}
      {slot.metricsNote?.trim() ? (
        <p className="proposal-review-service">{slot.metricsNote}</p>
      ) : null}
    </article>
  );
}

function renderSection(
  section: ProposalSection,
  proposal: Proposal,
  options: {
    hidePrices: boolean;
    design: ResolvedProposalDesign;
    onChooseReview?: () => void;
    onSelectSection?: (id: string) => void;
    index: number;
    coverImageSide?: "behind" | "top";
  },
) {
  if (!section.enabled) return null;
  const style = sectionStyle(section, options.index);
  const breakClass = PAGE_BREAK_TYPES.has(section.type) ? "proposal-break" : "";
  const phoneClass = sectionPhoneClass(section);
  const shell = `proposal-section proposal-section-${section.type} ${breakClass} ${phoneClass}`.trim();
  const sectionProps = {
    id: `proposal-section-${section.id}`,
    "data-section-id": section.id,
    onClick: options.onSelectSection
      ? (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.closest("a,button,input,textarea,select")) return;
          options.onSelectSection?.(section.id);
        }
      : undefined,
    style: { ...style, cursor: options.onSelectSection ? "pointer" : undefined },
  };

  switch (section.type) {
    case "cover":
      return (
        <Cover
          key={section.id}
          section={section}
          index={options.index}
          imageSide={options.coverImageSide}
          onSelect={options.onSelectSection}
        />
      );
    case "welcome":
      if (!section.data.body.trim() && !(section.images ?? []).some((img) => imageSrc(img))) return null;
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <div className="proposal-intro">
            <Paragraphs text={section.data.body} />
          </div>
          <ExtraPhotos section={section} />
        </section>
      );
    case "noticed":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-why">
            {section.data.cards.map((card) => (
              <article key={card.id} className={card.fullWidth ? "proposal-card is-wide" : "proposal-card"}>
                <h3>{card.title}</h3>
                <Paragraphs text={card.body} />
              </article>
            ))}
          </div>
          {section.data.opportunity.trim() ? (
            <p className="proposal-opportunity">{section.data.opportunity}</p>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    case "divider": {
      const src = imageSrc(section.data.image);
      return (
        <section key={section.id} className={`proposal-divider ${phoneClass}`.trim()} {...sectionProps}>
          {src ? (
            <Image
              src={src}
              alt={section.data.image?.alt || ""}
              fill
              className={`object-cover proposal-cropped ${imagePhoneHiddenClass(section.data.image)}`.trim()}
              style={imageResponsiveStyle(section.data.image)}
              sizes="100vw"
              unoptimized={src.startsWith("/api/media/")}
            />
          ) : null}
          {section.data.line.trim() ? <p>{section.data.line}</p> : null}
        </section>
      );
    }
    case "plan":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          {section.data.intro.trim() ? (
            <div className="proposal-intro">
              <Paragraphs text={section.data.intro} />
            </div>
          ) : null}
          <div
            className={
              section.data.showDates && section.data.datesBody.trim()
                ? "proposal-team"
                : "proposal-team is-single"
            }
          >
            {section.data.showDates && section.data.datesBody.trim() ? (
              <div className="proposal-lead">
                {section.data.datesLabel.trim() ? <p className="proposal-kicker">{section.data.datesLabel}</p> : null}
                <Paragraphs text={section.data.datesBody} />
              </div>
            ) : null}
            <ul className="proposal-dots">
              {section.data.scenes.map((scene) => (
                <li key={scene.id}>
                  {scene.title}
                  {sceneShowsBody(scene) ? <span className="proposal-scene-body">{scene.body}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          {section.data.dayFlow.trim() ? <p className="proposal-follow">{section.data.dayFlow}</p> : null}
          {section.data.consent.trim() ? <p className="proposal-follow">{section.data.consent}</p> : null}
          <ExtraPhotos section={section} />
        </section>
      );
    case "proof": {
      const video = resolveProposalVideo({
        videoUrl: section.data.videoUrl,
        videoMediaId: section.data.videoMediaId,
      });
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <ProposalProofGrid images={section.data.images} />
          <PortfolioLine line={section.data.portfolioLine} />
          {video ? (
            <ProposalVideoBlock
              videoUrl={section.data.videoUrl}
              videoMediaId={section.data.videoMediaId}
              videoCover={section.data.videoCover}
            />
          ) : (
            <div className="proposal-ph proposal-video-ph">
              <span>Your video here</span>
            </div>
          )}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "howIWork":
      return (
        <section key={section.id} className={`${shell} proposal-how`} {...sectionProps}>
          {section.data.kicker.trim() ? <p className="proposal-kicker">{section.data.kicker}</p> : null}
          <Title section={section}>{section.data.heading}</Title>
          <ol className="proposal-steps">
            {section.data.steps.map((step) => (
              <li key={step.id}>
                <h3>{step.title}</h3>
                {sceneShowsBody(step) ? <Paragraphs text={step.body} /> : null}
              </li>
            ))}
          </ol>
          <ExtraPhotos section={section} />
        </section>
      );
    case "deliverables":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-del">
            {section.data.cards.map((card) => (
              <article key={card.id} className={`proposal-dcard is-${card.accent || "terracotta"}`}>
                <h3>{card.title}</h3>
                <Dots items={card.items} />
              </article>
            ))}
          </div>
          {section.data.outOfScope.trim() ? (
            <p className="proposal-fine">
              <span className="proposal-lab">
                {(section.data.outOfScopeLabel || "Out of scope").replace(/\.$/, "")}.{" "}
              </span>
              {section.data.outOfScope}
            </p>
          ) : null}
          {section.data.usage.trim() ? (
            <p className="proposal-fine">
              <span className="proposal-lab">
                {(section.data.usageLabel || "Usage").replace(/\.$/, "")}.{" "}
              </span>
              {section.data.usage}
            </p>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    case "addon": {
      const lines = addonPriceLines(section.data);
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          {section.data.title.trim() ? <h3 className="proposal-addon-title">{section.data.title}</h3> : null}
          {section.data.body.trim() ? (
            <div className="proposal-addon-body">
              <Paragraphs text={section.data.body} />
            </div>
          ) : null}
          {section.data.bullets?.length ? <Dots items={section.data.bullets} /> : null}
          {lines.length && !options.hidePrices ? (
            <div className="proposal-prices">
              {lines.map((line) => (
                <div key={line.id} className="proposal-pricebox">
                  <p className="proposal-pl">{line.label}</p>
                  <p className="proposal-pv">{line.price}</p>
                </div>
              ))}
            </div>
          ) : null}
          {options.hidePrices && lines.length ? (
            <p className="proposal-needed">Price shared when the offer is live.</p>
          ) : null}
          {section.data.note.trim() ? <p className="proposal-needed">{section.data.note}</p> : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "investment": {
      if (options.hidePrices) {
        return (
          <section key={section.id} className={shell} {...sectionProps}>
            <Title section={section}>{section.data.heading}</Title>
            <div className="proposal-inv">
              <p className="proposal-inv-hidden">The package price is shown on the live link once Agota is ready to send it.</p>
            </div>
            <ExtraPhotos section={section} />
          </section>
        );
      }
      const deposit = depositAmount(section.data.packagePriceUsd, section.data.depositPercent);
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-inv">
            <div className="proposal-inv-body">
              <div className="proposal-inv-copy">
                {section.data.compareRows.map((row) => (
                  <div key={row.id} className={row.struck ? "proposal-row is-strike" : "proposal-row"}>
                    <span>{row.label}</span>
                    <span>{row.amount}</span>
                  </div>
                ))}
                {section.data.normalRatesLine.trim() ? (
                  <p className="proposal-normal">{section.data.normalRatesLine}</p>
                ) : null}
                {section.data.sideNote?.trim() ? (
                  <p className="proposal-normal">{section.data.sideNote}</p>
                ) : null}
              </div>
              <div className="proposal-offer">
                {section.data.clientLabel.trim() ? <p className="proposal-kicker">{section.data.clientLabel}</p> : null}
                <p className="proposal-price">{formatUsd(section.data.packagePriceUsd)}</p>
                {section.data.currencyNote.trim() ? <p className="proposal-usd">{section.data.currencyNote}</p> : null}
                {section.data.keyTerms?.trim() ? <p className="proposal-dep">{section.data.keyTerms}</p> : null}
                <p className="proposal-dep">
                  Deposit {section.data.depositPercent}% · {formatUsd(deposit)}
                </p>
              </div>
            </div>
          </div>
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "terms":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <Dots items={section.data.items} />
          <ExtraPhotos section={section} />
        </section>
      );
    case "review": {
      const first: ReviewSlot = {
        quote: section.data.quote,
        name: section.data.name,
        service: section.data.service,
        sourceReviewId: section.data.sourceReviewId,
        metricsNote: section.data.metricsNote,
        image: section.data.image,
      };
      const slots = [first, section.data.second].filter((slot): slot is ReviewSlot =>
        reviewSlotHasContent(slot),
      );
      if (!slots.length) {
        if (options.onChooseReview && isReviewPlaceholder(section.data.quote)) {
          return (
            <section key={section.id} className={`${shell} proposal-no-print`} {...sectionProps}>
              <Title section={section}>{section.data.heading}</Title>
              <div className="proposal-review-ph">
                <button
                  type="button"
                  className="proposal-choose-review"
                  onClick={options.onChooseReview}
                >
                  Choose a review
                </button>
              </div>
            </section>
          );
        }
        return null;
      }
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div
            className={
              slots.length > 1 ? "proposal-review-grid is-pair" : "proposal-review-grid"
            }
          >
            {slots.map((slot, index) => (
              <ReviewCard key={`${slot.sourceReviewId || slot.name}-${index}`} slot={slot} />
            ))}
          </div>
        </section>
      );
    }
    case "nextStep": {
      const position = section.design?.buttonPosition || options.design.buttonPosition;
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-next">
            {section.data.body.trim() ? <Paragraphs text={section.data.body} /> : null}
            <p className="proposal-valid">
              {section.data.validUntilLabel} <strong>{formatDisplayDate(proposal.validUntil)}</strong>
            </p>
            {section.data.closingLine.trim() ? <p className="proposal-closing">{section.data.closingLine}</p> : null}
          </div>
          {section.data.ctaLabel.trim() ? (
            <div className={`proposal-cta-row ${alignClass(position, "left")}`}>
              <a className="proposal-cta" href={section.data.ctaHref || "mailto:agota@oracleoffreedom.com"}>
                {section.data.ctaLabel}
              </a>
            </div>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "signOff":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <SignOffBlock
            intro={section.data.intro}
            align={section.design?.signOffAlign || options.design.signOffAlign}
          />
        </section>
      );
    case "text":
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-intro">
            <Paragraphs text={section.data.body} />
          </div>
          <ExtraPhotos section={section} />
        </section>
      );
    case "photos":
      if (!section.data.images.length && !section.data.heading.trim()) return null;
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <ProposalProofGrid images={section.data.images} lightbox={false} />
        </section>
      );
    case "faq": {
      const items = section.data.items.filter((item) => item.question.trim());
      if (!items.length && !section.data.heading.trim() && !(section.images ?? []).some((img) => imageSrc(img))) {
        return null;
      }
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          {items.length ? (
            <div className="proposal-faq">
              {items.map((item) => (
                <details key={item.id} className="proposal-faq-item">
                  <summary>{item.question}</summary>
                  {item.answer.trim() ? (
                    <div className="proposal-faq-answer">
                      <Paragraphs text={item.answer} />
                    </div>
                  ) : null}
                </details>
              ))}
            </div>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "video": {
      const hasVideo =
        section.data.videoUrl.trim() || section.data.videoMediaId.trim();
      if (!hasVideo) return null;
      if (
        !resolveProposalVideo({
          videoUrl: section.data.videoUrl,
          videoMediaId: section.data.videoMediaId,
        })
      ) {
        return null;
      }
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <ProposalVideoBlock
            videoUrl={section.data.videoUrl}
            videoMediaId={section.data.videoMediaId}
            videoCover={section.data.videoCover}
          />
          {section.data.caption.trim() ? (
            <p className="proposal-follow">{section.data.caption}</p>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "quote": {
      const { quote, name, role, image } = section.data;
      if (!quote.trim() && !imageSrc(image) && !(section.images ?? []).some((img) => imageSrc(img))) {
        return null;
      }
      const photoSrc = imageSrc(image);
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <figure className="proposal-pullquote">
            {quote.trim() ? <blockquote>“{quote}”</blockquote> : null}
            {name.trim() || role.trim() || photoSrc ? (
              <figcaption className="proposal-pullquote-meta">
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={image?.alt || name || ""}
                    width={120}
                    height={120}
                    className={`proposal-pullquote-photo ${imagePhoneHiddenClass(image)}`.trim()}
                    style={image ? imageResponsiveStyle(image) : undefined}
                    unoptimized={photoSrc.startsWith("/api/media/")}
                  />
                ) : null}
                <div>
                  {name.trim() ? <p className="proposal-pullquote-name">{name}</p> : null}
                  {role.trim() ? <p className="proposal-pullquote-role">{role}</p> : null}
                </div>
              </figcaption>
            ) : null}
          </figure>
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "gallery":
      if (!section.data.images.length && !section.data.heading.trim()) return null;
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div
            className="proposal-gallery"
            style={{ ["--gallery-columns" as string]: String(section.data.columns) }}
          >
            <ProposalProofGrid images={section.data.images} lightbox />
          </div>
        </section>
      );
    case "timeline": {
      const items = section.data.items.filter(
        (item) => item.when.trim() || item.title.trim() || item.body.trim(),
      );
      if (!items.length && !section.data.heading.trim() && !(section.images ?? []).some((img) => imageSrc(img))) {
        return null;
      }
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          {items.length ? (
            <ol className="proposal-timeline">
              {items.map((item) => (
                <li key={item.id}>
                  {item.when.trim() ? <p className="proposal-timeline-when">{item.when}</p> : null}
                  {item.title.trim() ? <p className="proposal-timeline-title">{item.title}</p> : null}
                  {item.body.trim() ? <Paragraphs text={item.body} /> : null}
                </li>
              ))}
            </ol>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "cta": {
      const position = section.design?.buttonPosition || options.design.buttonPosition;
      const buttons = section.data.buttons.filter((b) => b.label.trim()).slice(0, 2);
      const hasBody = section.data.body.trim() || section.data.heading.trim() || buttons.length;
      if (!hasBody && !(section.images ?? []).some((img) => imageSrc(img))) return null;
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          {section.data.body.trim() ? (
            <div className="proposal-intro">
              <Paragraphs text={section.data.body} />
            </div>
          ) : null}
          {buttons.length ? (
            <div className={`proposal-cta-row ${alignClass(position, "left")}`}>
              {buttons.map((button) => (
                <a
                  key={button.id}
                  className="proposal-cta"
                  href={button.href.trim() || "mailto:agota@oracleoffreedom.com"}
                >
                  {button.label}
                </a>
              ))}
            </div>
          ) : null}
          <ExtraPhotos section={section} />
        </section>
      );
    }
    case "columns": {
      const { columnCount, columns } = section.data;
      const hasColumnContent = columns.some(
        (col) => col.heading.trim() || col.body.trim() || imageSrc(col.image),
      );
      if (!hasColumnContent && !section.data.heading.trim() && !(section.images ?? []).some((img) => imageSrc(img))) {
        return null;
      }
      return (
        <section key={section.id} className={shell} {...sectionProps}>
          <Title section={section}>{section.data.heading}</Title>
          <div className="proposal-columns" data-count={columnCount}>
            {columns.map((col) => {
              const colSrc = imageSrc(col.image);
              return (
                <div key={col.id} className="proposal-column">
                  {colSrc ? (
                    <Image
                      src={colSrc}
                      alt={col.image?.alt || ""}
                      width={800}
                      height={500}
                      className={`proposal-column-photo proposal-cropped ${col.image ? imagePhoneHiddenClass(col.image) : ""}`.trim()}
                      style={col.image ? imageResponsiveStyle(col.image) : undefined}
                      unoptimized={colSrc.startsWith("/api/media/")}
                    />
                  ) : null}
                  {col.heading.trim() ? <h3>{col.heading}</h3> : null}
                  {col.body.trim() ? <Paragraphs text={col.body} /> : null}
                </div>
              );
            })}
          </div>
          <ExtraPhotos section={section} />
        </section>
      );
    }
    default:
      return null;
  }
}

export function ProposalView({
  proposal,
  mode = "public",
  className,
  showPdfButton = true,
  onChooseReview,
  onSelectSection,
}: {
  proposal: Proposal;
  mode?: ProposalViewMode;
  className?: string;
  showPdfButton?: boolean;
  /** Admin editor only: open the review section picker from the live preview. */
  onChooseReview?: () => void;
  /** Admin editor only: select a section when the preview is clicked. */
  onSelectSection?: (id: string) => void;
}) {
  const hidePrices = mode === "preview";
  const design = resolveProposalDesign(proposal.design);
  const pageBg = resolveBackground(
    proposal.design?.background,
    resolveColourSchemeWithPhone(proposal.design?.colours, proposal.design?.mobile?.colours).desktop
      .pageBg,
  );
  const animateBg =
    pageBg.animate && (pageBg.kind === "gradient" || pageBg.kind === "mesh");
  return (
    <article
      className={`proposal-doc ${animateBg ? "proposal-bg-animate" : ""} ${className || ""}`.trim()}
      style={designVars(design, proposal.design)}
    >
      {showPdfButton ? (
        <div className="proposal-no-print proposal-toolbar">
          <ProposalPdfButton />
        </div>
      ) : null}
      {mode === "admin" ? <p className="proposal-no-print proposal-banner">Admin preview</p> : null}
      {mode === "preview" ? (
        <p className="proposal-no-print proposal-banner is-preview">Draft preview · prices hidden</p>
      ) : null}
      {proposal.sections.map((section, index) =>
        renderSection(section, proposal, {
          hidePrices,
          design,
          index,
          coverImageSide: proposal.design?.mobile?.cover?.imageSide,
          onChooseReview: mode === "admin" ? onChooseReview : undefined,
          onSelectSection: mode === "admin" ? onSelectSection : undefined,
        }),
      )}
    </article>
  );
}
