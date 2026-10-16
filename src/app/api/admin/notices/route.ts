import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readBookings } from "@/lib/booking-store";
import { readInquiries } from "@/lib/inquiry-store";
import { notifyStudio } from "@/lib/push";
import { lisbonToday } from "@/lib/pricing";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const today = lisbonToday();
  const [inquiries, bookings] = await Promise.all([readInquiries(), readBookings()]);
  const items: {
    id: string;
    kind: "inquiry" | "consultation" | "appointment";
    name: string;
    detail: string;
    href: string;
    at: string;
  }[] = [];

  for (const inquiry of inquiries) {
    if (inquiry.status !== "new") continue;
    items.push({
      id: `inquiry-${inquiry.id}`,
      kind: "inquiry",
      name: inquiry.name,
      detail: inquiry.serviceLabel,
      href: `/admin/inquiries/${inquiry.id}`,
      at: inquiry.createdAt,
    });
  }

  for (const booking of bookings) {
    if (booking.status === "cancelled" || booking.status === "done") continue;
    const fromWeb = booking.origin === "web" && booking.date >= today;
    const todayItem = booking.date === today;
    if (!fromWeb && !todayItem) continue;
    items.push({
      id: `booking-${booking.id}`,
      kind: booking.kind === "meeting" ? "consultation" : "appointment",
      name: booking.client || booking.title,
      detail: booking.allDay ? booking.date : `${booking.date} ${booking.start}`,
      href: "/admin/calendar",
      at: `${booking.date}T${booking.allDay ? "00:00" : booking.start}`,
    });
  }

  items.sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json({ ok: true, items: items.slice(0, 20) });
}

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  await notifyStudio({
    kind: "test",
    name: "Studio",
    detail: { en: "If you see this, notifications work.", es: "Si ves esto, las notificaciones funcionan." },
    url: "/admin",
    tag: `studio-test-${Date.now()}`,
  });
  return NextResponse.json({ ok: true });
}
