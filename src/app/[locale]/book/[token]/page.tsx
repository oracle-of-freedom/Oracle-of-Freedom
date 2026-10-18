import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BookingWidget } from "@/components/booking-widget";
import { bookingCopy } from "@/content/booking";
import type { Locale } from "@/i18n/routing";
import { isBookingInvite } from "@/lib/inquiries";
import { readInquiries } from "@/lib/inquiry-store";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale } = await params;
  const copy = bookingCopy[locale] || bookingCopy.en;
  return {
    title: `${copy.title} · Oracle of Freedom`,
    robots: { index: false, follow: false },
  };
}

export default async function PrivateBookPage({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  if (!isBookingInvite(token)) notFound();
  const invited = (await readInquiries()).some((item) => item.bookingToken === token);
  if (!invited) notFound();
  const copy = bookingCopy[locale] || bookingCopy.en;
  const config = await readCalendarConfig();
  const types = config.bookingTypes.filter((item) => item.active);
  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 md:px-6 md:py-20">
      <header className="max-w-3xl">
        <p className="text-xs tracking-[0.22em] text-ember uppercase">{copy.eyebrow}</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight md:text-7xl">{copy.title}</h1>
        <p className="mt-5 text-lg text-ink/70">{copy.dek}</p>
      </header>
      <div className="mt-10 min-w-0">
        <BookingWidget
          types={types}
          locale={locale}
          copy={copy}
          canSave={storageMode() !== "readonly"}
          invite={token}
        />
      </div>
    </div>
  );
}
