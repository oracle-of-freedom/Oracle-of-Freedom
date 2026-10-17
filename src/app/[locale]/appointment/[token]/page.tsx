import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppointmentAccept } from "@/components/appointment-accept";
import { bookingCopy } from "@/content/booking";
import type { Locale } from "@/i18n/routing";
import { readBookings } from "@/lib/booking-store";
import { dayLabel } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale } = await params;
  const copy = bookingCopy[locale] || bookingCopy.en;
  return { title: `${copy.acceptTitle} · Oracle of Freedom` };
}

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(token)) notFound();
  const booking = (await readBookings()).find((item) => item.publicToken === token);
  const copy = bookingCopy[booking?.locale || locale] || bookingCopy.en;
  const lang = booking?.locale === "es" ? "es" : "en";

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs tracking-[0.22em] text-ember uppercase">{copy.acceptEyebrow}</p>
      {!booking ? (
        <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptMissing}</h1>
      ) : booking.status === "cancelled" ? (
        <>
          <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptClosed}</h1>
        </>
      ) : booking.status === "confirmed" || booking.status === "done" ? (
        <>
          <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptedTitle}</h1>
          <p className="mt-5 text-lg text-ink/70">{copy.acceptedBody}</p>
          <p className="mt-6 font-serif text-3xl">
            {dayLabel(booking.date, lang)} · {booking.start}–{booking.end}
          </p>
          <p className="mt-2 text-ink/70">{booking.title}</p>
          <a className="mt-8 inline-flex h-12 items-center rounded-full bg-terracotta px-6 font-medium text-white" href={`/api/bookings/${token}/calendar`}>
            {copy.download}
          </a>
        </>
      ) : (
        <>
          <p className="mt-6 font-serif text-3xl">
            {dayLabel(booking.date, lang)} · {booking.start}–{booking.end}
          </p>
          <p className="mt-2 text-ink/70">
            {booking.title}
            {booking.place ? ` · ${booking.place}` : ""}
          </p>
          <div className="mt-8">
            <AppointmentAccept token={token} copy={copy} />
          </div>
        </>
      )}
    </div>
  );
}
