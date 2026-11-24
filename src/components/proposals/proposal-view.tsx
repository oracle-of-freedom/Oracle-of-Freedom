import Image from "next/image";
import { OmMark } from "@/components/om-mark";
import { ProposalPdfButton } from "@/components/proposals/proposal-pdf-button";
import { ProposalVideoBlock } from "@/components/proposals/proposal-video";
import { Button } from "@/components/ui/button";
import {
  SIGN_OFF,
  addonPriceLines,
  depositAmount,
  imageSrc,
  resolveHeadingEmphasis,
  resolveLayout,
  sceneShowsBody,
  type HeadingEmphasis,
  type Proposal,
  type ProposalImage,
  type ProposalSection,
  type ProposalSectionOf,
  type SectionLayout,
} from "@/lib/proposals";
import { resolveProposalVideo } from "@/lib/proposal-video";

export type ProposalViewMode = "public" | "preview" | "admin";

function headingEmphasisClass(emphasis: HeadingEmphasis) {
  if (emphasis === "xl") return "text-4xl md:text-6xl";
  if (emphasis === "large") return "text-4xl md:text-5xl";
  return "text-3xl md:text-4xl";
}

function sectionShellClass(layout: SectionLayout) {
  if (layout === "text") return "mx-auto max-w-3xl";
  return "mx-auto max-w-5xl";
}

function labelWithPeriod(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "";
  return trimmed.endsWith(".") ? `${trimmed} ` : `${trimmed}. `;
}

function SectionHeading({
  children,
  emphasis = "default",
}: {
  children: React.ReactNode;
  emphasis?: HeadingEmphasis;
}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <h2 className={`shrink-0 font-serif text-terracotta ${headingEmphasisClass(emphasis)}`}>
        {children}
      </h2>
      <span
        className="h-px min-w-12 flex-1 bg-gradient-to-r from-clay to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

function SectionWithExtras({
  section,
  className,
  children,
}: {
  section: ProposalSection;
  className?: string;
  children: React.ReactNode;
}) {
  const layout = resolveLayout(section);
  const extras = (section.images ?? []).filter((img) => imageSrc(img));
  const shell = sectionShellClass(layout);

  if (layout === "textPhoto" && extras.length) {
    return (
      <section className={`${shell} px-5 py-14 md:py-20 ${className || ""}`}>
        <div className="md:grid md:grid-cols-2 md:items-start md:gap-8">
          <div>{children}</div>
          <PhotoStrip images={extras} />
        </div>
      </section>
    );
  }

  return (
    <section className={`${shell} px-5 py-14 md:py-20 ${className || ""}`}>
      {children}
      {extras.length ? (
        <div className="mt-10">
          <PhotoStrip images={extras} />
        </div>
      ) : null}
    </section>
  );
}

function ExtraSectionImages({ section }: { section: ProposalSection }) {
  if (resolveLayout(section) === "textPhoto") return null;
  const extras = (section.images ?? []).filter((img) => imageSrc(img));
  if (!extras.length) return null;
  return (
    <div className="mt-10">
      <PhotoStrip images={extras} />
    </div>
  );
}

function EmberList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-ink/85">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PhotoFigure({
  image,
  className,
  sizes,
}: {
  image: ProposalImage;
  className?: string;
  sizes?: string;
}) {
  const src = imageSrc(image);
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-clay/60 text-sm text-ink/45 ${className || ""}`}>
        Add a photograph
      </div>
    );
  }
  return (
    <figure className={className}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-night/10 md:aspect-[3/4]">
        <Image
          src={src}
          alt={image.alt || ""}
          fill
          className="object-cover"
          sizes={sizes || "(max-width: 768px) 50vw, 25vw"}
          unoptimized={src.startsWith("/api/media/")}
        />
      </div>
      {image.caption ? (
        <figcaption className="mt-2 text-center text-xs tracking-wide text-ink/55">
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function PhotoStrip({ images }: { images: ProposalImage[] }) {
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {images.slice(0, 8).map((image, index) => (
        <PhotoFigure key={`${image.mediaId || image.src || "img"}-${index}`} image={image} />
      ))}
    </div>
  );
}

function formatMoney(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return "—";
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

function Cover({ section }: { section: ProposalSectionOf<"cover"> }) {
  const { data } = section;
  const src = imageSrc(data.heroImage);
  const emphasis = data.headlineEmphasis?.trim();
  let headlineNode: React.ReactNode = data.headline;
  if (emphasis && data.headline.includes(emphasis)) {
    const [before, after] = data.headline.split(emphasis);
    headlineNode = (
      <>
        {before}
        <em className="font-serif text-ember not-italic md:italic">{emphasis}</em>
        {after}
      </>
    );
  }

  return (
    <header className="relative min-h-[88vh] overflow-hidden bg-night text-sand">
      {src ? (
        <Image
          src={src}
          alt={data.heroImage?.alt || ""}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={src.startsWith("/api/media/")}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-night via-moss/40 to-terracotta-ink/50" />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-r from-night via-night/85 to-transparent"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-[88vh] flex-col px-5 py-8 md:px-12 md:py-10 lg:px-16">
        <div className="flex items-center gap-3">
          <OmMark className="h-8 w-8 brightness-0 invert" />
          <p className="text-[11px] tracking-[0.28em] text-sand/90 uppercase">Oracle of Freedom</p>
        </div>
        <div className="mt-auto max-w-2xl pb-10 pt-24 md:pb-16">
          <p className="text-xs tracking-[0.22em] text-sand/75 uppercase">{data.kicker}</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight md:text-6xl lg:text-7xl">{headlineNode}</h1>
          {data.subtitle ? <p className="mt-5 max-w-lg text-lg text-sand/85 md:text-xl">{data.subtitle}</p> : null}
          <p className="mt-8 text-sm text-sand/60">{formatDisplayDate(data.proposalDate)}</p>
        </div>
      </div>
    </header>
  );
}

function SignOff({ intro }: { intro?: string }) {
  return (
    <div className="text-right">
      {intro?.trim() ? <p className="mb-5 text-lg text-ink/80">{intro}</p> : null}
      <p className="font-quote text-2xl text-terracotta italic">{SIGN_OFF.withLove}</p>
      <p className="mt-2 font-serif text-4xl text-ink">{SIGN_OFF.name}</p>
      <p className="mt-1 text-sm tracking-[0.18em] text-ink/70 uppercase">{SIGN_OFF.brand}</p>
      <a
        href={SIGN_OFF.urlHref}
        className="mt-3 inline-block text-terracotta underline-offset-4 hover:underline"
      >
        {SIGN_OFF.url}
      </a>
    </div>
  );
}

function renderSection(
  section: ProposalSection,
  proposal: Proposal,
  options: { hidePrices: boolean },
) {
  if (!section.enabled) return null;

  switch (section.type) {
    case "cover":
      return <Cover key={section.id} section={section} />;
    case "welcome":
      return (
        <SectionWithExtras key={section.id} section={section}>
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-ink/85 md:text-xl">
            {section.data.body}
          </p>
        </SectionWithExtras>
      );
    case "noticed":
      return (
        <SectionWithExtras key={section.id} section={section}>
          <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            {section.data.cards.map((card) => (
              <article
                key={card.id}
                className={`rounded-3xl border-l-[3px] border-ember bg-[#f7efe4] p-6 md:p-7 ${
                  card.fullWidth ? "md:col-span-2" : ""
                }`}
              >
                <h3 className="font-serif text-2xl text-terracotta">{card.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-ink/80">{card.body}</p>
              </article>
            ))}
          </div>
          {section.data.opportunity ? (
            <p className="mt-8 max-w-2xl text-lg text-ink/75">{section.data.opportunity}</p>
          ) : null}
        </SectionWithExtras>
      );
    case "divider": {
      const src = imageSrc(section.data.image);
      return (
        <section key={section.id} className="relative my-6 min-h-[42vh] overflow-hidden bg-night">
          {src ? (
            <Image
              src={src}
              alt={section.data.image?.alt || ""}
              fill
              className="object-cover opacity-80"
              sizes="100vw"
              unoptimized={src.startsWith("/api/media/")}
            />
          ) : null}
          <div className="absolute inset-0 bg-night/45" aria-hidden="true" />
          <div className="relative z-10 flex min-h-[42vh] items-center justify-center px-6 py-16">
            <p className="max-w-2xl text-center font-serif text-2xl text-sand md:text-4xl">
              {section.data.line}
            </p>
          </div>
        </section>
      );
    }
    case "plan":
      return (
        <SectionWithExtras key={section.id} section={section}>
          <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          {section.data.intro ? (
            <p className="max-w-2xl whitespace-pre-wrap text-lg text-ink/80">{section.data.intro}</p>
          ) : null}
          {section.data.showDates && section.data.datesBody ? (
            <div className="mt-8 rounded-3xl bg-white/70 px-5 py-4 md:px-6">
              <p className="text-xs tracking-[0.2em] text-ember uppercase">{section.data.datesLabel}</p>
              <p className="mt-2 font-serif text-2xl text-ink">{section.data.datesBody}</p>
            </div>
          ) : null}
          <ol className="mt-10 grid gap-5 md:grid-cols-2">
            {section.data.scenes.map((scene, index) => (
              <li key={scene.id} className="rounded-3xl bg-white/60 p-5 md:p-6">
                <p className="text-xs tracking-[0.2em] text-ink/45 uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-terracotta">{scene.title}</h3>
                {sceneShowsBody(scene) ? (
                  <p className="mt-3 whitespace-pre-wrap text-ink/80">{scene.body}</p>
                ) : null}
              </li>
            ))}
          </ol>
          {section.data.dayFlow ? (
            <p className="mt-8 max-w-2xl whitespace-pre-wrap text-ink/75">{section.data.dayFlow}</p>
          ) : null}
          {section.data.consent ? (
            <p className="mt-4 max-w-2xl text-sm text-ink/60">{section.data.consent}</p>
          ) : null}
        </SectionWithExtras>
      );
    case "proof": {
      const video = resolveProposalVideo({
        videoUrl: section.data.videoUrl,
        videoMediaId: section.data.videoMediaId,
      });
      const hasPlaceholderMedia = section.data.images.some((img) =>
        /EXAMPLE PHOTOS|Agota to supply/i.test(`${img.alt} ${img.caption || ""}`),
      );
      return (
        <section key={section.id} className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <SectionHeading>{section.data.heading}</SectionHeading>
          {hasPlaceholderMedia && !video ? (
            <p className="rounded-3xl border border-dashed border-ember/50 bg-ember/10 px-5 py-8 text-center text-ink/70">
              [EXAMPLE PHOTOS / VIDEO: Agota to supply]
            </p>
          ) : (
            <PhotoStrip images={section.data.images.filter((img) => imageSrc(img))} />
          )}
          <ProposalVideoBlock videoUrl={section.data.videoUrl} videoMediaId={section.data.videoMediaId} />
          <p className="mt-8 text-ink/80">
            You can see my work here:{" "}
            <a
              href="https://oracleoffreedom.com/portfolio"
              className="text-terracotta underline-offset-4 hover:underline"
            >
              https://oracleoffreedom.com/portfolio
            </a>
          </p>
          <ExtraSectionImages section={section} />
        </section>
      );
    }
    case "howIWork":
      return (
        <section key={section.id} className="bg-moss px-5 py-14 text-sand md:py-20">
          <div className="mx-auto max-w-5xl">
            {section.data.kicker ? (
              <p className="text-xs tracking-[0.22em] text-clay uppercase">{section.data.kicker}</p>
            ) : null}
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">{section.data.heading}</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {section.data.steps.map((step, index) => (
                <li key={step.id}>
                  <p className="text-xs tracking-[0.2em] text-clay/80 uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl">{step.title}</h3>
                  {sceneShowsBody(step) ? (
                    <p className="mt-3 whitespace-pre-wrap text-sand/85">{step.body}</p>
                  ) : null}
                </li>
              ))}
            </ol>
            <ExtraSectionImages section={section} />
          </div>
        </section>
      );
    case "deliverables":
      return (
        <SectionWithExtras key={section.id} section={section}>
          <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          <div className="grid gap-4 md:grid-cols-3">
            {section.data.cards.map((card) => {
              const bar =
                card.accent === "moss"
                  ? "bg-moss"
                  : card.accent === "ember"
                    ? "bg-ember"
                    : "bg-terracotta";
              return (
                <article key={card.id} className="overflow-hidden rounded-3xl bg-[#f7efe4]">
                  <div className={`h-1 ${bar}`} aria-hidden="true" />
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-terracotta">{card.title}</h3>
                    <div className="mt-4">
                      <EmberList items={card.items} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {section.data.outOfScope ? (
            <p className="mt-8 max-w-2xl text-sm text-ink/65">
              <span className="font-medium text-ink">
                {labelWithPeriod(section.data.outOfScopeLabel || "Out of scope")}
              </span>
              {section.data.outOfScope}
            </p>
          ) : null}
          {section.data.usage ? (
            <p className="mt-3 max-w-2xl text-sm text-ink/65">
              <span className="font-medium text-ink">
                {labelWithPeriod(section.data.usageLabel || "Usage")}
              </span>
              {section.data.usage}
            </p>
          ) : null}
        </SectionWithExtras>
      );
    case "addon": {
      const emphasis = resolveHeadingEmphasis(section);
      const lines = addonPriceLines(section.data);
      const headingClass =
        emphasis === "xl"
          ? "font-serif text-4xl text-terracotta md:text-6xl"
          : emphasis === "large"
            ? "font-serif text-4xl text-terracotta md:text-5xl"
            : "text-xs tracking-[0.2em] text-ember uppercase";
      return (
        <SectionWithExtras key={section.id} section={section} className="py-10 md:py-14">
          <p className={headingClass}>{section.data.heading}</p>
          <h3 className="mt-3 font-serif text-2xl text-terracotta md:text-3xl">{section.data.title}</h3>
          <p className="mt-4 whitespace-pre-wrap text-ink/75">{section.data.body}</p>
          {lines.length && !options.hidePrices ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {lines.map((line) => (
                <div key={line.id} className="rounded-2xl bg-white/60 px-5 py-4 text-center">
                  <p className="text-sm text-ink/60">{line.label}</p>
                  <p className="mt-1 font-serif text-3xl text-ink md:text-4xl">{line.price}</p>
                </div>
              ))}
            </div>
          ) : null}
          {options.hidePrices && lines.length ? (
            <p className="mt-6 text-sm text-ink/55">Price shared when the offer is live.</p>
          ) : null}
          {section.data.note ? <p className="mt-6 text-sm text-ink/55">{section.data.note}</p> : null}
        </SectionWithExtras>
      );
    }
    case "investment": {
      if (options.hidePrices) {
        return (
          <section key={section.id} className="px-5 py-14 md:py-20">
            <div className="mx-auto max-w-5xl rounded-3xl bg-night px-6 py-12 text-center text-sand md:px-10">
              <SectionHeading>
                <span className="text-sand">{section.data.heading}</span>
              </SectionHeading>
              <p className="mt-4 text-sand/75">
                The package price is shown on the live link once Agota is ready to send it.
              </p>
            </div>
          </section>
        );
      }
      const deposit = depositAmount(section.data.packagePriceUsd, section.data.depositPercent);
      const { sideNote, keyTerms, offerNote } = section.data;
      const offerPanelCopy = keyTerms?.trim()
        ? keyTerms
        : !sideNote?.trim() && offerNote?.trim()
          ? offerNote
          : "";
      const nightCopy = sideNote?.trim() || "";
      return (
        <section key={section.id} className="px-5 py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl bg-night p-6 text-sand md:grid-cols-2 md:p-10">
            <div className="order-2 md:order-1">
              <h2 className="font-serif text-3xl text-sand/90">{section.data.heading}</h2>
              <ul className="mt-8 space-y-0">
                {section.data.compareRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-baseline justify-between gap-4 border-b border-sand/15 py-4 text-sand/55"
                  >
                    <span className={row.struck ? "line-through" : ""}>{row.label}</span>
                    <span className={row.struck ? "line-through" : ""}>{row.amount}</span>
                  </li>
                ))}
              </ul>
              {section.data.normalRatesLine ? (
                <p className="mt-6 text-sm text-sand/55">{section.data.normalRatesLine}</p>
              ) : null}
              {nightCopy ? (
                <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-sand/75">{nightCopy}</p>
              ) : null}
              {(section.images ?? []).filter((img) => imageSrc(img)).length ? (
                <div className="mt-8">
                  <PhotoStrip images={section.images!.filter((img) => imageSrc(img))} />
                </div>
              ) : null}
            </div>
            <div className="order-1 flex items-center justify-center md:order-2">
              <div className="w-full rounded-3xl bg-gradient-to-br from-terracotta to-ember px-6 py-10 text-center text-white shadow-lg md:px-8">
                <p className="text-xs tracking-[0.22em] uppercase">{section.data.clientLabel}</p>
                <p className="mt-4 font-serif text-5xl md:text-6xl">
                  {formatMoney(section.data.packagePriceUsd)}
                </p>
                <p className="mt-2 text-sm text-white/85">{section.data.currencyNote}</p>
                {offerPanelCopy ? (
                  <p className="mx-auto mt-5 max-w-sm text-sm text-white/90">{offerPanelCopy}</p>
                ) : null}
                <p className="mt-6 text-sm text-white/90">
                  Deposit {section.data.depositPercent}% · {formatMoney(deposit)}
                </p>
              </div>
            </div>
          </div>
        </section>
      );
    }
    case "terms":
      return (
        <SectionWithExtras key={section.id} section={section} className="py-10 md:py-14">
          <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          <EmberList items={section.data.items} />
        </SectionWithExtras>
      );
    case "review":
      if (!section.data.quote.trim()) return null;
      if (/\[REVIEW:/i.test(section.data.quote)) {
        return (
          <section key={section.id} className="mx-auto max-w-3xl px-5 py-14 md:py-20">
            <p className="text-xs tracking-[0.22em] text-ember uppercase">{section.data.heading}</p>
            <p className="mt-6 rounded-3xl border border-dashed border-ember/50 bg-ember/10 px-5 py-8 text-center text-ink/70">
              {section.data.quote}
            </p>
          </section>
        );
      }
      return (
        <section key={section.id} className="mx-auto max-w-3xl px-5 py-14 md:py-20">
          <p className="text-xs tracking-[0.22em] text-ember uppercase">{section.data.heading}</p>
          <blockquote className="mt-6 font-quote text-3xl leading-snug text-ink italic md:text-4xl">
            “{section.data.quote}”
          </blockquote>
          <p className="mt-6 font-serif text-xl text-terracotta">{section.data.name}</p>
          {section.data.service ? <p className="text-sm text-ink/55">{section.data.service}</p> : null}
          {section.data.metricsNote ? (
            <p className="mt-4 text-sm text-ink/55">{section.data.metricsNote}</p>
          ) : null}
        </section>
      );
    case "nextStep":
      return (
        <SectionWithExtras key={section.id} section={section} className="py-16 md:py-24">
          <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          <p className="whitespace-pre-wrap text-lg text-ink/80">{section.data.body}</p>
          <p className="mt-6 text-sm tracking-wide text-ink/60 uppercase">
            {section.data.validUntilLabel}{" "}
            <span className="font-serif text-lg normal-case tracking-normal text-terracotta">
              {formatDisplayDate(proposal.validUntil)}
            </span>
          </p>
          {section.data.ctaLabel ? (
            <div className="mt-8">
              <Button asChild>
                <a href={section.data.ctaHref || "mailto:agota@oracleoffreedom.com"}>
                  {section.data.ctaLabel}
                </a>
              </Button>
            </div>
          ) : null}
          {section.data.closingLine ? (
            <p className="mt-10 text-ink/75">{section.data.closingLine}</p>
          ) : null}
        </SectionWithExtras>
      );
    case "signOff":
      return (
        <section key={section.id} className="mx-auto max-w-5xl px-5 py-10 md:py-14">
          <SignOff intro={section.data.intro} />
        </section>
      );
    case "text":
      return (
        <SectionWithExtras key={section.id} section={section} className="py-12">
          {section.data.heading ? (
            <SectionHeading emphasis={resolveHeadingEmphasis(section)}>{section.data.heading}</SectionHeading>
          ) : null}
          <p className="whitespace-pre-wrap text-lg text-ink/80">{section.data.body}</p>
        </SectionWithExtras>
      );
    case "photos":
      return (
        <section key={section.id} className="mx-auto max-w-5xl px-5 py-10">
          {section.data.heading ? <SectionHeading>{section.data.heading}</SectionHeading> : null}
          <PhotoStrip images={section.data.images} />
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
  return (
    <article className={`proposal-doc bg-sand text-ink ${className || ""}`}>
      {showPdfButton ? (
        <div className="proposal-no-print sticky top-0 z-20 flex justify-end gap-2 bg-sand/90 px-4 py-3 backdrop-blur md:px-8">
          <ProposalPdfButton />
        </div>
      ) : null}
      {mode === "admin" ? (
        <p className="proposal-no-print bg-clay/80 px-4 py-2 text-center text-xs tracking-wide text-ink/70 uppercase">
          Admin preview
        </p>
      ) : null}
      {mode === "preview" ? (
        <p className="proposal-no-print bg-ember/20 px-4 py-2 text-center text-xs tracking-wide text-ink/70 uppercase">
          Draft preview · prices hidden
        </p>
      ) : null}
      {proposal.sections.map((section) => renderSection(section, proposal, { hidePrices }))}
    </article>
  );
}
