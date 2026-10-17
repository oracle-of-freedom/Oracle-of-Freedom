import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { CopyAcceptanceLink } from "@/components/copy-acceptance-link";
import { createAcceptanceLink, releaseAppointment } from "@/app/admin/appointments/actions";
import { isAdmin } from "@/lib/admin-auth";
import { readBookings } from "@/lib/booking-store";
import { acceptanceUrl, dayLabel, type Booking } from "@/lib/bookings";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

function isClientAppointment(booking: Booking) {
  if (booking.origin === "google" || booking.origin === "ical") return false;
  return booking.origin === "web" || booking.status === "hold" || Boolean(booking.publicToken);
}

export default async function AppointmentsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const lang = await studioLang();
  const t = studioCopy(lang);
  const appointments = (await readBookings())
    .filter(isClientAppointment)
    .sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start));

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="appointments" title={t.appointments.title} />
      <p className="mt-3 max-w-xl text-sm text-ink/65">{t.appointments.intro}</p>
      <ul className="mt-6 grid gap-3">
        {appointments.length === 0 ? <li className="text-sm text-ink/60">{t.appointments.empty}</li> : null}
        {appointments.map((booking) => {
          const status =
            booking.status === "hold"
              ? t.appointments.hold
              : booking.status === "confirmed"
                ? t.appointments.confirmed
                : booking.status === "done"
                  ? t.appointments.done
                  : t.appointments.cancelled;
          const url = booking.publicToken ? acceptanceUrl(booking.locale, booking.publicToken) : "";
          return (
            <li key={booking.id} className="rounded-3xl bg-white/80 px-4 py-4">
              <span className="text-xs tracking-[0.14em] text-ember uppercase">{status}</span>
              <span className="mt-1 block font-medium">{booking.client || booking.title}</span>
              <span className="mt-1 block text-sm text-ink/65">
                {dayLabel(booking.date, lang)} · {booking.allDay ? t.home.allDay : `${booking.start}–${booking.end}`}
                {booking.place ? ` · ${booking.place}` : ""}
              </span>
              <span className="mt-1 block text-sm text-ink/55">{booking.contact}</span>
              {url ? (
                <CopyAcceptanceLink url={url} copyLabel={t.appointments.copy} copiedLabel={t.appointments.copied} />
              ) : (
                <form action={createAcceptanceLink} className="mt-3">
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm text-sand">
                    {t.appointments.generate}
                  </button>
                </form>
              )}
              {booking.status === "hold" ? (
                <form action={releaseAppointment} className="mt-2">
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="text-sm underline underline-offset-4">
                    {t.appointments.release}
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
