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
  showElsewhere = true,
}: {
  locale: Locale;
  tone: "photo" | "page" | "peach";
  showElsewhere?: boolean;
}) {
  const copy = getCopy(locale).home;
  const stored = await getSettings();
  const stays = visibleStays(stored.stays, lisbonToday());
  if (stays.length === 0) return null;
  const [featured, ...later] = stays;
  const onPhoto = tone === "photo";
  const warm = tone === "peach";
  const bannerClass = onPhoto
    ? "flex items-center justify-between gap-3 rounded-2xl bg-sand/55 px-4 py-2.5 text-ink backdrop-blur-sm"
    : warm
      ? "flex items-center justify-between gap-3 rounded-2xl bg-terracotta/10 px-4 py-2.5 text-ink ring-1 ring-terracotta/30 backdrop-blur-sm"
      : "flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-2.5 text-ink shadow-sm backdrop-blur-sm";
  const placeClass = warm ? "font-serif text-2xl leading-tight text-terracotta" : "font-serif text-2xl leading-tight";
  const whenClass = warm ? "mt-0.5 text-sm font-medium text-terracotta" : "mt-0.5 text-sm font-medium";
  const buttonClass =
    "inline-flex shrink-0 items-center rounded-full bg-terracotta px-4 py-2.5 text-sm font-medium text-white";
  const chipClass = onPhoto
    ? "rounded-full bg-sand/45 px-3 py-1 text-sm text-ink backdrop-blur-sm"
    : warm
      ? "rounded-full bg-terracotta/10 px-3 py-1 text-sm text-terracotta ring-1 ring-terracotta/30 backdrop-blur-sm"
      : "rounded-full bg-white/45 px-3 py-1 text-sm text-ink shadow-sm backdrop-blur-sm";
  const elsewhereClass = onPhoto
    ? "max-w-xl text-sm leading-relaxed text-sand underline decoration-white/40 underline-offset-4"
    : "max-w-xl text-sm leading-relaxed text-ink underline decoration-ink/30 underline-offset-4";

  const several = featured.countries.length > 1;

  return (
    <div className={several ? "mt-5 grid max-w-xl gap-3 md:max-w-3xl" : "mt-5 grid max-w-xl gap-3"}>
      <div className={several ? "grid gap-2 md:grid-cols-2" : "grid gap-2"}>
        {featured.countries.map((code) => (
          <div key={code} className={bannerClass}>
            <div className="min-w-0">
              <p className={placeClass}>{placeTitle(locale, featured, code)}</p>
              {placeDetail(locale, featured, code) ? (
                <p className="text-sm text-ink/70">{placeDetail(locale, featured, code)}</p>
              ) : null}
              <p className={whenClass}>{shortWhen(locale, featured.starts, featured.ends)}</p>
            </div>
            <Link
              href={{
                pathname: "/inquire",
                query: { place: placeTitle(locale, featured, code), from: featured.starts, to: featured.ends },
                hash: "form",
              }}
              className={buttonClass}
            >
              {copy.bookDates}
            </Link>
          </div>
        ))}
      </div>
      {later.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {later
            .flatMap((stay) => stay.countries.map((code) => ({ stay, code })))
            .map(({ stay, code }, index) => (
              <Link
                key={`${stay.id}-${code}`}
                href={{
                  pathname: "/inquire",
                  query: { place: placeTitle(locale, stay, code), from: stay.starts, to: stay.ends },
                  hash: "form",
                }}
                className={chipClass}
              >
                {index === 0 ? copy.next : copy.after}: {chipLabel(locale, stay, code)}
              </Link>
            ))}
        </div>
      ) : null}
      {showElsewhere ? (
        <Link href={{ pathname: "/inquire", hash: "form" }} className={elsewhereClass}>
          {copy.elsewhere}
        </Link>
      ) : null}
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
