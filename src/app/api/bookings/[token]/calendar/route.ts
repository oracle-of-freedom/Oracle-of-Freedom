import { readBookings } from "@/lib/booking-store";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { bookingsIcal, icalResponse } from "@/lib/ical";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const booking = (await readBookings()).find(
    (item) =>
      item.publicToken === token && (item.status === "confirmed" || item.status === "done"),
  );
  if (!booking) return new Response("Not found", { status: 404 });
  const config = await readCalendarConfig();
  return icalResponse(
    bookingsIcal([booking], booking.title, config.meetingUrl),
    "oracle-of-freedom-booking.ics",
  );
}
