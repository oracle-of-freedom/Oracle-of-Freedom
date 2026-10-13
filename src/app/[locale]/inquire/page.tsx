import { setRequestLocale } from "next-intl/server";
import { InquiryForm } from "@/components/inquiry-form";
import { StayBanners } from "@/components/stay-banners";
import { TokenText } from "@/components/token-text";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { getCopy } from "@/content";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { settings } from "@/lib/content";
import { getSettings } from "@/lib/offers";
import { hasPromoCode, mediaForPackage, packageById } from "@/lib/pricing";
import { applyTokens } from "@/lib/delivery";
import { liveTokenMap } from "@/components/token-text";
import { pageMetadata } from "@/lib/seo";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || "";
}

function packageTitle(locale: string, id: string) {
  const copy = getCopy(locale);
  for (const section of Object.values(copy)) {
    if (!section || typeof section !== "object" || !("packages" in section)) continue;
    const packages = (section as { packages?: Record<string, { name?: string }> }).packages;
    const name = packages?.[id]?.name;
    if (name) return name;
  }
  return packageById(id)?.label || id;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = getCopy(locale);
  return pageMetadata({
    locale,
    title: copy.meta.inquire.title,
    description: copy.meta.inquire.description,
    keywords: copy.meta.inquire.keywords,
    hrefForLocale: () => "/inquire",
  });
}

export default async function InquirePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    service?: string | string[];
    package?: string | string[];
    place?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const service = one(query.service);
  const chosen = packageById(one(query.package));
  const place = one(query.place).slice(0, 300);
  const from = DAY.test(one(query.from)) ? one(query.from) : "";
  const to = DAY.test(one(query.to)) ? one(query.to) : "";
  setRequestLocale(locale);
  const loc = (locale === "es" || locale === "pt" ? locale : "en") as Locale;
  const copy = getCopy(locale);
  const tokens = await liveTokenMap(loc);
  const showPromoCode = hasPromoCode(await getSettings());
  const thankYouPath = getPathname({ locale: loc, href: "/thank-you" });

  return (
    <article className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:px-6 md:py-24">
      <div>
        <h1 className="font-serif text-5xl leading-[1.05] md:text-6xl">{copy.inquire.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-ink/80">{copy.inquire.dek}</p>
        <StayBanners locale={loc} tone="page" />
        <div className="mt-8">
          <InquiryForm
            key={[service, chosen?.id, place, from, to].join("|")}
            copy={{ ...copy.form, place: applyTokens(copy.form.place, tokens) }}
            locale={loc}
            initialService={service || chosen?.inquiry}
            initialPackage={chosen?.id}
            initialPackageLabel={chosen ? packageTitle(loc, chosen.id) : undefined}
            packageService={chosen?.inquiry}
            initialMedia={mediaForPackage(chosen?.id) || undefined}
            initialPlace={place || undefined}
            initialDate={from || undefined}
            initialDateEnd={to && (!from || to >= from) ? to : undefined}
            thankYouPath={thankYouPath}
            showPromoCode={showPromoCode}
          />
        </div>
      </div>
      <aside className="h-fit rounded-3xl bg-clay/50 p-6 md:sticky md:top-24">
        <h2 className="font-serif text-3xl">{copy.inquire.prefer}</h2>
        <p className="mt-4">
          <WhatsAppLink text={copy.whatsapp.general} codeLabel={copy.form.promoCode} wishLabel={copy.form.wish} className="text-terracotta-ink underline underline-offset-4">
            WhatsApp
            {settings.whatsappIsPlaceholder ? ` (${settings.whatsappDisplay})` : ""}
          </WhatsAppLink>
        </p>
        <p className="mt-3">
          <span className="text-ink/60">{copy.inquire.email}: </span>
          <a className="text-terracotta-ink underline underline-offset-4" href={`mailto:${settings.email}`}>
            {settings.email}
          </a>
        </p>
        <h2 className="mt-10 font-serif text-3xl">{copy.inquire.nextTitle}</h2>
        <ol className="mt-4 space-y-3">
          {copy.inquire.next.map((step, index) => (
            <li key={step} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-serif text-2xl text-ember">{index + 1}</span>
              <span>
                <TokenText text={step} />
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </article>
  );
}
