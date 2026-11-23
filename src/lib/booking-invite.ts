import { matchesOpenBookingInvite } from "@/lib/calendar-config";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { isBookingInvite } from "@/lib/inquiries";
import { readInquiries } from "@/lib/inquiry-store";

/** Accepts either an inquiry booking token or the studio's open private booking link. */
export async function inviteAllowsBooking(token: string) {
  if (!isBookingInvite(token)) return false;
  const config = await readCalendarConfig();
  if (matchesOpenBookingInvite(token, config)) return true;
  return (await readInquiries()).some((item) => item.bookingToken === token);
}
