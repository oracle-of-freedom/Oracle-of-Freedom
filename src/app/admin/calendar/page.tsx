import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { CalendarBoard } from "@/components/calendar-board";
import { PrivateBookingLink } from "@/components/private-booking-link";
import { isAdmin } from "@/lib/admin-auth";
import { bookingInviteUrl, parseMonth } from "@/lib/bookings";
import { readBookings, writeBookings } from "@/lib/booking-store";
import { calendarToday, openBookingInviteActive, studioTimeZone } from "@/lib/calendar-config";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { reconcileGoogleBookings } from "@/lib/google-calendar";
import { importInboundIcal } from "@/lib/inbound-ical";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const lang = await studioLang();
  const t = studioCopy(lang);
  const { month: requested } = await searchParams;
  const config = await readCalendarConfig();
  const zone = studioTimeZone(config);
  const today = calendarToday(zone);
  const month = parseMonth(requested, today.slice(0, 7));
  let bookings = await readBookings();
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const from = `${month}-01`;
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;
  try {
    const synced = await reconcileGoogleBookings(config, bookings, from, to);
    bookings = synced.bookings;
    if (synced.changed) await writeBookings(bookings);
  } catch (error) {
    console.error("[calendar] Google event sync failed", error);
  }
  if (config.inboundIcalUrl) {
    try {
      const inbound = await importInboundIcal(config.inboundIcalUrl, bookings, from, to, zone);
      bookings = inbound.bookings;
      if (inbound.changed) await writeBookings(bookings);
    } catch (error) {
      console.error("[calendar] inbound iCal sync failed", error);
    }
  }
  const inviteUrl =
    openBookingInviteActive(config) && config.bookingInviteToken
      ? bookingInviteUrl(lang, config.bookingInviteToken)
      : "";

  return (
    <main className="studio-page-dock mx-auto max-w-6xl px-4 py-4 md:py-12">
      <AdminHeader current="calendar" title={t.calendar.title} />
      <div className="mt-4 md:mt-6">
        <PrivateBookingLink url={inviteUrl} />
      </div>
      <CalendarBoard bookings={bookings} today={today} month={month} mode={storageMode()} />
    </main>
  );
}
