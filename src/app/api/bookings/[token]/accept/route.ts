import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bookingCopy } from "@/content/booking";
import type { Locale } from "@/i18n/routing";
import { readBookings, writeBookings } from "@/lib/booking-store";
import type { Booking } from "@/lib/bookings";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { settings } from "@/lib/content";
import { upsertGoogleEvent } from "@/lib/google-calendar";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function sendAcceptedEmail(booking: Booking, meetingUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.RESEND_FROM_EMAIL || "Oracle of Freedom <onboarding@resend.dev>";
  const replyTo = process.env.INQUIRY_TO_EMAIL || settings.email;
  const locale = (booking.locale || "en") as Locale;
  const copy = bookingCopy[locale] || bookingCopy.en;
  const lines = [
    copy.acceptedBody,
    "",
    `${booking.date} · ${booking.start}–${booking.end}`,
    booking.title,
  ];
  if (meetingUrl) {
    lines.push("", `${copy.joinMeeting}: ${meetingUrl}`);
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: booking.contact,
    replyTo,
    subject: copy.acceptedTitle,
    text: lines.join("\n"),
  });
  if (result.error) {
    console.error("[booking] accept email failed", result.error);
  }
}

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

  const config = await readCalendarConfig();
  const meetingUrl = config.meetingUrl || "";

  if (booking.status === "confirmed" || booking.status === "done") {
    return NextResponse.json({
      ok: true,
      already: true,
      calendarUrl: `/api/bookings/${token}/calendar`,
      meetingUrl: meetingUrl || undefined,
    });
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
    const synced = await upsertGoogleEvent(config, confirmed);
    if (synced.googleEventId && synced.googleEventId !== confirmed.googleEventId) {
      await writeBookings(updated.map((item) => (item.id === confirmed.id ? synced : item)));
    }
  } catch (error) {
    console.error("[booking] accept calendar sync failed", error);
  }
  try {
    await sendAcceptedEmail(confirmed, meetingUrl);
  } catch (error) {
    console.error("[booking] accept email failed", error);
  }
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
  return NextResponse.json({
    ok: true,
    calendarUrl: `/api/bookings/${token}/calendar`,
    meetingUrl: meetingUrl || undefined,
  });
}
