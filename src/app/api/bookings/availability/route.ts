import { NextResponse } from "next/server";
import { publicAvailability } from "@/lib/booking-service";
import { isBookingInvite } from "@/lib/inquiries";
import { readInquiries } from "@/lib/inquiry-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeId = url.searchParams.get("type")?.trim() || "";
  const invite = url.searchParams.get("invite")?.trim() || "";
  if (!/^[a-z0-9-]{1,60}$/.test(typeId) || !isBookingInvite(invite)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const invited = (await readInquiries()).some((item) => item.bookingToken === invite);
  if (!invited) return NextResponse.json({ ok: false }, { status: 404 });
  const result = await publicAvailability(typeId);
  if (!result) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({
    ok: true,
    timeZone: "Europe/Lisbon",
    slots: result.slots,
  });
}
