import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { OmMark } from "@/components/om-mark";
import { ProposalPdfButton } from "@/components/proposals/proposal-pdf-button";
import { ProposalVideoBlock } from "@/components/proposals/proposal-video";
import {
  resolveProposalDesign,
  sectionTitleVisible,
  type DesignAlign,
  type ResolvedProposalDesign,
} from "@/lib/proposal-design";
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

function photoSlotLabel(alt: string) {
  const trimmed = alt.trim();
  if (!trimmed || /EXAMPLE PHOTOS|Agota to supply/i.test(trimmed)) return "Your photo here";
  return trimmed;
}

function alignClass(align: DesignAlign | undefined, fallback: DesignAlign) {
  const value = align || fallback;
  if (value === "center") return "is-center";
  if (value === "right") return "is-right";
  return "is-left";
}

function designVars(design: ResolvedProposalDesign): CSSProperties {
  const [stop1, stop2, stop3] = design.cover.gradientStops;
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
  };
}

function sectionStyle(section: ProposalSection): CSSProperties {
  const design = section.design;
  if (!design) return {};
  const style: Record<string, string> = {};
  if (design.padding) style.padding = design.padding;
  if (design.marginTop) style.marginTop = design.marginTop;
  if (design.offsetX && design.offsetX !== "0") style.marginLeft = design.offsetX;
  if (design.align) style.textAlign = design.align;
  if (design.columns) {
    style["--block-columns"] = design.columns;
    if (section.type === "plan") style["--plan-columns"] = design.columns;
    if (section.type === "investment") style["--investment-columns"] = design.columns;
  }
  if (design.gap) {
    style["--block-gap"] = design.gap;
    if (section.type === "plan") style["--plan-gap"] = design.gap;
    if (section.type === "investment") style["--investment-gap"] = design.gap;
  }
  if (section.type === "investment" && design.cardOffsetTop) {
    style["--card-offset"] = design.cardOffsetTop;
  }
  if (section.type === "nextStep" && design.marginTop) style["--next-step-gap"] = design.marginTop;
  if (section.type === "signOff" && design.marginTop) style["--signoff-gap"] = design.marginTop;
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
}: {
  section: ProposalSectionOf<"cover">;
}) {
  const { data } = section;
  const src = imageSrc(data.heroImage);
  const style: CSSProperties = {
    ...(src ? { backgroundImage: `url("${src}")` } : {}),
    ...sectionStyle(section),
  };
  return (
    <header className="proposal-hero" style={style}>
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
      {images.map((image, index) => (
        <figure key={`${image.src || image.mediaId || "extra"}-${index}`}>
          <Image
            src={imageSrc(image)}
            alt={image.alt || ""}
            width={800}
            height={600}
            className="proposal-extra-img"
            unoptimized={imageSrc(image).startsWith("/api/media/")}
          />
        </figure>
      ))}
    </div>
  );
}

function ProofGrid({ images }: { images: ProposalImage[] }) {
  const cells = images.length ? [...images] : [{ alt: "Your photo here" }];
  if (cells.every((image) => !imageSrc(image)) && cells.length < 4) {
    while (cells.length < 4) cells.push({ alt: "Your photo here" });
  }
  return (
    <div className="proposal-proof-grid">
      {cells.map((image, index) => {
        const src = imageSrc(image);
        if (!src) {
          return (
            <div key={`ph-${index}`} className="proposal-ph proposal-proof-cell">
              <span>{photoSlotLabel(image.alt)}</span>
            </div>
          );
        }
        return (
          <figure key={`${src}-${index}`} className="proposal-proof-cell has-photo">
            <Image
              src={src}
              alt={image.alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 720px) 100vw, 90mm"
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

function renderSection(
  section: ProposalSection,
  proposal: Proposal,
  options: { hidePrices: boolean; design: ResolvedProposalDesign },
) {
  if (!section.enabled) return null;
  const style = sectionStyle(section);
  const breakClass = PAGE_BREAK_TYPES.has(section.type) ? "proposal-break" : "";
  const shell = `proposal-section proposal-section-${section.type} ${breakClass}`.trim();

  switch (section.type) {
    case "cover":
      return <Cover key={section.id} section={section} />;
    case "welcome":
      if (!section.data.body.trim() && !(section.images ?? []).some((img) => imageSrc(img))) return null;
      return (
        <section key={section.id} className={shell} style={style}>
          <div className="proposal-intro">
            <Paragraphs text={section.data.body} />
          </div>
          <ExtraPhotos section={section} />
        </section>
      );
    case "noticed":
      return (
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className="proposal-divider" style={style}>
          {src ? (
            <Image src={src} alt={section.data.image?.alt || ""} fill className="object-cover" sizes="100vw" unoptimized={src.startsWith("/api/media/")} />
          ) : null}
          {section.data.line.trim() ? <p>{section.data.line}</p> : null}
        </section>
      );
    }
    case "plan":
      return (
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
          <Title section={section}>{section.data.heading}</Title>
          <ProofGrid images={section.data.images} />
          <PortfolioLine line={section.data.portfolioLine} />
          {video ? (
            <ProposalVideoBlock videoUrl={section.data.videoUrl} videoMediaId={section.data.videoMediaId} />
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
        <section key={section.id} className={`${shell} proposal-how`} style={style}>
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
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
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
          <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
          <Title section={section}>{section.data.heading}</Title>
          <Dots items={section.data.items} />
          <ExtraPhotos section={section} />
        </section>
      );
    case "review":
      if (!section.data.quote.trim()) return null;
      if (/\[REVIEW:/i.test(section.data.quote)) {
        return (
          <section key={section.id} className={shell} style={style}>
            <Title section={section}>{section.data.heading}</Title>
            <p className="proposal-review-ph">{section.data.quote}</p>
          </section>
        );
      }
      return (
        <section key={section.id} className={shell} style={style}>
          <Title section={section}>{section.data.heading}</Title>
          <blockquote className="proposal-quote">“{section.data.quote}”</blockquote>
          {section.data.name.trim() ? <p className="proposal-review-name">{section.data.name}</p> : null}
          {section.data.service.trim() ? <p className="proposal-review-service">{section.data.service}</p> : null}
          {section.data.metricsNote.trim() ? <p className="proposal-review-service">{section.data.metricsNote}</p> : null}
        </section>
      );
    case "nextStep": {
      const position = section.design?.buttonPosition || options.design.buttonPosition;
      return (
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
          <SignOffBlock
            intro={section.data.intro}
            align={section.design?.signOffAlign || options.design.signOffAlign}
          />
        </section>
      );
    case "text":
      return (
        <section key={section.id} className={shell} style={style}>
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
        <section key={section.id} className={shell} style={style}>
          <Title section={section}>{section.data.heading}</Title>
          <ProofGrid images={section.data.images} />
        </section>
      );
    default:
      return null;
  }
}

export function ProposalView({
  proposal,
  mode = "public",
  className,
  showPdfButton = true,
}: {
  proposal: Proposal;
  mode?: ProposalViewMode;
  className?: string;
  showPdfButton?: boolean;
}) {
  const hidePrices = mode === "preview";
  const design = resolveProposalDesign(proposal.design);
  return (
    <article className={`proposal-doc ${className || ""}`.trim()} style={designVars(design)}>
      {showPdfButton ? (
        <div className="proposal-no-print proposal-toolbar">
          <ProposalPdfButton />
        </div>
      ) : null}
      {mode === "admin" ? <p className="proposal-no-print proposal-banner">Admin preview</p> : null}
      {mode === "preview" ? (
        <p className="proposal-no-print proposal-banner is-preview">Draft preview · prices hidden</p>
      ) : null}
      {proposal.sections.map((section) => renderSection(section, proposal, { hidePrices, design }))}
    </article>
  );
}
