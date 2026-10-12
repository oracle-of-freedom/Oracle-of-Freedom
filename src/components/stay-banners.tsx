import { Link } from "@/i18n/navigation";
import { getCopy } from "@/content";
import { JsonLd } from "@/components/json-ld";
import { getSettings } from "@/lib/offers";
import { absoluteUrl } from "@/lib/seo";
import { getPathname } from "@/i18n/navigation";
import { settings } from "@/lib/content";
import { lisbonToday } from "@/lib/pricing";
import {
  chipLabel,
  placeDetail,
  placeTitle,
  shortWhen,
  stayEvents,
  visibleStays,
} from "@/lib/presence";
import type { Locale } from "@/i18n/routing";

export async function StayBanners({
  locale,
  tone,
}: {
  locale: Locale;
  tone: "photo" | "page";
}) {
  const copy = getCopy(locale).home;
  const stored = await getSettings();
  const stays = visibleStays(stored.stays, lisbonToday());
  if (stays.length === 0) return null;
  const [featured, ...later] = stays;
  const onPhoto = tone === "photo";
  const bannerClass = onPhoto
    ? "rounded-2xl bg-sand px-4 py-3 text-ink"
    : "rounded-2xl bg-white px-4 py-3 text-ink shadow-sm";
  const buttonClass = onPhoto
    ? "mt-3 inline-flex min-h-11 items-center rounded-full bg-terracotta px-4 text-sm font-medium text-white"
    : "mt-3 inline-flex min-h-11 items-center rounded-full bg-terracotta px-4 text-sm font-medium text-white";
  const chipClass = onPhoto
    ? "rounded-full bg-sand/90 px-3 py-1 text-sm text-ink"
    : "rounded-full bg-white px-3 py-1 text-sm text-ink shadow-sm";
  const elsewhereClass = onPhoto
    ? "max-w-xl text-sm leading-relaxed text-sand underline decoration-white/40 underline-offset-4"
    : "max-w-xl text-sm leading-relaxed text-ink underline decoration-ink/30 underline-offset-4";

  const several = featured.countries.length > 1;

  return (
    <div className={several ? "mt-5 grid max-w-xl gap-3 md:max-w-3xl" : "mt-5 grid max-w-xl gap-3"}>
      <div className={several ? "grid gap-2 md:grid-cols-2" : "grid gap-2"}>
        {featured.countries.map((code) => (
          <div key={code} className={bannerClass}>
            <p className="font-serif text-2xl leading-tight">{placeTitle(locale, featured, code)}</p>
            {placeDetail(locale, featured, code) ? (
              <p className="text-sm text-ink/70">{placeDetail(locale, featured, code)}</p>
            ) : null}
            <p className="mt-1 text-sm font-medium">{shortWhen(locale, featured.starts, featured.ends)}</p>
            <Link href="/inquire" className={buttonClass}>
              {copy.bookDates}
            </Link>
          </div>
        ))}
      </div>
      {later.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {later.flatMap((stay) =>
            stay.countries.map((code) => (
              <Link key={`${stay.id}-${code}`} href="/inquire" className={chipClass}>
                {copy.also}: {chipLabel(locale, stay, code)}
              </Link>
            )),
          )}
        </div>
      ) : null}
      <Link href="/inquire" className={elsewhereClass}>
        {copy.elsewhere}
      </Link>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": stays.flatMap((stay) =>
            stayEvents(locale, stay).map((event) => ({
              "@type": "Event",
              name: event.name,
              startDate: stay.starts,
              endDate: stay.ends,
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              eventStatus: "https://schema.org/EventScheduled",
              location: {
                "@type": "Place",
                name: event.placeName,
                address: {
                  "@type": "PostalAddress",
                  ...(event.locality ? { addressLocality: event.locality } : {}),
                  addressCountry: event.code,
                },
              },
              organizer: { "@type": "Person", name: settings.founder },
              url: absoluteUrl(getPathname({ locale, href: "/inquire" })),
            })),
          ),
        }}
      />
    </div>
  );
}
