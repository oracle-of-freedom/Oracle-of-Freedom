import {
  buildAvailability,
  lisbonDateTimeToUtc,
  type BusyInterval,
} from "@/lib/availability";
import { readBookings, writeBookings } from "@/lib/booking-store";
import { calendarToday, studioTimeZone } from "@/lib/calendar-config";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { activeBookingType } from "@/lib/availability";
import { googleBusy, reconcileGoogleBookings } from "@/lib/google-calendar";
import { importInboundIcal } from "@/lib/inbound-ical";

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function publicAvailability(typeId: string) {
  const config = await readCalendarConfig();
  const bookingType = activeBookingType(config, typeId);
  if (!bookingType) return null;
  const zone = studioTimeZone(config);
  const today = calendarToday(zone);
  const to = addDays(today, Math.min(config.daysAhead, 35));
  let bookings = await readBookings();

  try {
    const synced = await reconcileGoogleBookings(config, bookings, today, to);
    bookings = synced.bookings;
    if (synced.changed) await writeBookings(bookings);
  } catch (error) {
    console.error("[calendar] linked Google event sync failed", error);
  }

  if (config.inboundIcalUrl) {
    try {
      const inbound = await importInboundIcal(config.inboundIcalUrl, bookings, today, to, zone);
      bookings = inbound.bookings;
      if (inbound.changed) await writeBookings(bookings);
    } catch (error) {
      console.error("[calendar] inbound iCal sync failed", error);
    }
  }

  let externalBusy: BusyInterval[] = [];
  try {
    externalBusy = await googleBusy(
      config,
      lisbonDateTimeToUtc(today, "00:00", zone),
      lisbonDateTimeToUtc(addDays(to, 1), "00:00", zone),
    );
  } catch (error) {
    console.error("[calendar] Google availability failed", error);
  }

  return {
    config,
    bookingType,
    bookings,
    slots: buildAvailability({
      config,
      bookingType,
      bookings,
      externalBusy,
      today,
      limitDays: 35,
    }),
  };
}
