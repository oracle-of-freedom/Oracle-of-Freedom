import { setRequestLocale } from "next-intl/server";
import { TokenText } from "@/components/token-text";
import { getCopy } from "@/content";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = getCopy(locale);
  return pageMetadata({
    locale,
    title: copy.meta.privacy.title,
    description: copy.meta.privacy.description,
    keywords: copy.meta.privacy.keywords,
    hrefForLocale: () => "/privacy",
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = (locale === "es" || locale === "pt" ? locale : "en") as Locale;
  const copy = getCopy(locale);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <h1 className="font-serif text-5xl leading-[1.05] md:text-6xl">{copy.privacy.title}</h1>
      <p className="mt-4 text-sm text-ink/60">{copy.privacy.updated}</p>
      <div className="mt-10 space-y-10">
        {copy.privacy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-serif text-3xl">{section.title}</h2>
            <div className="mt-3 space-y-3 text-ink/85">
              {section.body.map((paragraph) => (
                <p key={paragraph}>
                  <TokenText text={paragraph} locale={loc} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
