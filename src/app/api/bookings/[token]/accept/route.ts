import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { readBookings, writeBookings } from "@/lib/booking-store";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await rateLimited(ip, "booking")) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(token)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.publicToken === token);
  if (!booking || booking.status === "cancelled") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (booking.status === "confirmed" || booking.status === "done") {
    return NextResponse.json({ ok: true, already: true });
  }

  const confirmed = { ...booking, status: "confirmed" as const };
  const updated = bookings.map((item) => (item.id === confirmed.id ? confirmed : item));
  try {
    await writeBookings(updated);
  } catch (error) {
    console.error("[booking] accept save failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  try {
    const config = await readCalendarConfig();
    const synced = await upsertGoogleEvent(config, confirmed);
    if (synced.googleEventId && synced.googleEventId !== confirmed.googleEventId) {
      await writeBookings(updated.map((item) => (item.id === confirmed.id ? synced : item)));
    }
  } catch (error) {
    console.error("[booking] accept calendar sync failed", error);
  }
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
  return NextResponse.json({
    ok: true,
    calendarUrl: `/api/bookings/${token}/calendar`,
  });
}
