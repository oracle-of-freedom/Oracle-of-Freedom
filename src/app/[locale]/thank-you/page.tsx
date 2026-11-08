import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCopy } from "@/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = getCopy(locale);
  return pageMetadata({
    locale,
    title: copy.thankYou.title,
    description: copy.thankYou.body,
    hrefForLocale: () => "/thank-you",
    noIndex: true,
  });
}

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  setRequestLocale(locale);
  const copy = getCopy(locale);

  return (
    <article className="mx-auto max-w-3xl px-4 py-24 md:px-6">
      <h1 className="font-serif text-5xl leading-[1.05] md:text-6xl">{copy.thankYou.title}</h1>
      <p className="mt-6 text-lg text-ink/80">{copy.thankYou.body}</p>
      {sent === "0" ? (
        <p className="mt-6 rounded-3xl bg-clay/40 p-5 text-sm">{copy.thankYou.notSent}</p>
      ) : null}
      <p className="mt-6 text-lg whitespace-pre-line text-ink/80">{copy.thankYou.signOff}</p>
      <p className="mt-10">
        <Link href="/" className="text-sm underline underline-offset-4">
          {copy.thankYou.again}
        </Link>
      </p>
    </article>
  );
}
