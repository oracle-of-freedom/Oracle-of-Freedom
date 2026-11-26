import assert from "node:assert/strict";
import test from "node:test";
import { lisbonDateTimeToUtc } from "@/lib/availability";
import {
  bookingTimeZone,
  canonicalTimeZone,
  googleTimedBound,
  guestConfirmedText,
  guestHoldText,
  icalGuestSpan,
  parseGoogleDateTime,
  studioWhenLines,
  zonedDateTimeToUtc,
} from "@/lib/booking-time";
import { acceptanceUrl, isBooking, type Booking } from "@/lib/bookings";
import { CALENDAR_TIME_ZONE } from "@/lib/calendar-config";
import { bookingsIcal } from "@/lib/ical";

const DASH = /\u2013|\u2014/;

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    title: "Intro call · Ana",
    kind: "meeting",
    status: "hold",
    date: "2026-07-15",
    allDay: false,
    start: "15:00",
    end: "16:00",
    place: "Online",
    client: "Ana",
    contact: "ana@example.com",
    notes: "",
    origin: "web",
    locale: "en",
    timeZone: "America/New_York",
    publicToken: "abcdefghijklmnopqrstuvwx",
    ...overrides,
  };
}

function unfold(value: string) {
  return value.replace(/\r\n[ \t]/g, "");
}

test("accepts a real IANA zone and falls back when it is missing or invalid", () => {
  assert.equal(canonicalTimeZone(" America/New_York "), "America/New_York");
  assert.equal(canonicalTimeZone("US/Eastern"), "America/New_York");
  assert.equal(canonicalTimeZone("Europe/Lisbon"), CALENDAR_TIME_ZONE);
  assert.equal(canonicalTimeZone("Not/AZone"), undefined);
  assert.equal(canonicalTimeZone("America/New York"), undefined);
  assert.equal(canonicalTimeZone(""), undefined);
  assert.equal(canonicalTimeZone(undefined), undefined);
  assert.equal(bookingTimeZone({}), CALENDAR_TIME_ZONE);
  assert.equal(bookingTimeZone({ timeZone: "Mars/Base" }), CALENDAR_TIME_ZONE);
  assert.equal(isBooking(booking()), true);
  assert.equal(isBooking({ ...booking(), timeZone: 4 }), false);
});

test("guest wall time is the same instant as the studio Lisbon time", () => {
  const summer = lisbonDateTimeToUtc("2026-07-15", "15:00");
  const winter = lisbonDateTimeToUtc("2026-01-15", "15:00");
  assert.equal(zonedDateTimeToUtc("2026-07-15", "15:00", "Europe/Lisbon").toISOString(), summer.toISOString());
  assert.equal(zonedDateTimeToUtc("2026-01-15", "15:00", "Europe/Lisbon").toISOString(), winter.toISOString());
  assert.equal(zonedDateTimeToUtc("2026-07-15", "10:00", "America/New_York").toISOString(), summer.toISOString());
  assert.equal(zonedDateTimeToUtc("2026-07-15", "19:30", "Asia/Kolkata").toISOString(), summer.toISOString());
  assert.equal(zonedDateTimeToUtc("2026-01-16", "04:00", "Pacific/Auckland").toISOString(), winter.toISOString());
});

test("guest emails use the booked zone, language, and sign-off", () => {
  const meetUrl = "https://us05web.zoom.us/j/example";
  const held = guestHoldText(booking(), "en", undefined, meetUrl);
  assert.equal(
    held,
    [
      "That time is held for you. The email has a link so you can accept it, and the call link when one is saved.",
      "",
      "When: Wednesday, 15 July 2026, 10:00 to 11:00 (Eastern Time)",
      "[Studio time: Wednesday, 15 July 2026, 15:00 to 16:00 (Western European Time)]",
      "",
      `Accept this appointment: ${acceptanceUrl("en", "abcdefghijklmnopqrstuvwx")}`,
      "",
      "Join the call: https://us05web.zoom.us/j/example",
      "",
      "With love,",
      "Agota",
    ].join("\n"),
  );

  const spanish = guestHoldText(booking({ locale: "es" }), "es", undefined, meetUrl);
  assert.equal(
    spanish,
    [
      "Esa hora queda reservada para ti. El email incluye un enlace para aceptarla, y el enlace de la llamada cuando hay uno guardado.",
      "",
      "Cuándo: miércoles, 15 de julio de 2026, 10:00 a 11:00 (hora oriental)",
      "[Hora del estudio: miércoles, 15 de julio de 2026, 15:00 a 16:00 (hora de Europa occidental)]",
      "",
      `Aceptar esta cita: ${acceptanceUrl("es", "abcdefghijklmnopqrstuvwx")}`,
      "",
      "Unirse a la llamada: https://us05web.zoom.us/j/example",
      "",
      "Con amor,",
      "Agota",
    ].join("\n"),
  );

  const portuguese = guestHoldText(booking({ locale: "pt" }), "pt", undefined, meetUrl);
  assert.equal(
    portuguese,
    [
      "Essa hora fica reservada para ti. O email inclui um link para a aceitares, e o link da chamada quando há um guardado.",
      "",
      "Quando: quarta-feira, 15 de julho de 2026, 10:00 às 11:00 (Hora oriental norte-americana)",
      "[Hora do estúdio: quarta-feira, 15 de julho de 2026, 15:00 às 16:00 (Hora da Europa Ocidental)]",
      "",
      `Aceitar esta marcação: ${acceptanceUrl("pt", "abcdefghijklmnopqrstuvwx")}`,
      "",
      "Entrar na chamada: https://us05web.zoom.us/j/example",
      "",
      "Com amor,",
      "Agota",
    ].join("\n"),
  );

  const confirmed = guestConfirmedText(booking({ status: "confirmed" }), "https://meet.example/abc");
  assert.equal(
    confirmed,
    [
      "This appointment is confirmed. You can add it to your calendar.",
      "",
      "When: Wednesday, 15 July 2026, 10:00 to 11:00 (Eastern Time)",
      "[Studio time: Wednesday, 15 July 2026, 15:00 to 16:00 (Western European Time)]",
      "",
      "Intro call · Ana",
      "",
      "Join the call: https://meet.example/abc",
      "",
      "With love,",
      "Agota",
    ].join("\n"),
  );

  const sameZone = guestHoldText(booking({ timeZone: "Europe/Lisbon" }), "en");
  assert.equal(sameZone.includes("Studio time"), false);
  assert.match(sameZone, /15:00 to 16:00 \(Western European Time\)/);
  assert.match(sameZone, /With love,\nAgota$/);
  assert.match(sameZone, /Accept this appointment: /);
  assert.equal(sameZone.includes("Join the call"), false);

  for (const text of [held, spanish, portuguese, confirmed, sameZone]) {
    assert.equal(DASH.test(text), false);
    assert.equal(/instagram/i.test(text), false);
  }
});

test("studio notice lists the guest time and the studio time", () => {
  assert.deepEqual(studioWhenLines(booking()), [
    "Guest time: Wednesday, 15 July 2026, 10:00 to 11:00 (Eastern Time)",
    "Studio time: Wednesday, 15 July 2026, 15:00 to 16:00 (Western European Time)",
  ]);
  const shifted = booking({ date: "2026-01-15", timeZone: "Pacific/Auckland" });
  assert.deepEqual(studioWhenLines(shifted), [
    "Guest time: Friday, 16 January 2026, 04:00 to 05:00 (New Zealand Time)",
    "Studio time: Thursday, 15 January 2026, 15:00 to 16:00 (Western European Time)",
  ]);
});

test("calendar payloads keep the Lisbon instant and name the guest zone", () => {
  const instant = lisbonDateTimeToUtc("2026-07-15", "15:00").toISOString();
  const bound = googleTimedBound("2026-07-15", "15:00", "America/New_York");
  assert.deepEqual(bound, { dateTime: "2026-07-15T10:00:00", timeZone: "America/New_York" });
  assert.equal(parseGoogleDateTime(bound.dateTime, bound.timeZone).toISOString(), instant);
  assert.deepEqual(googleTimedBound("2026-07-15", "15:00", "Europe/Lisbon"), {
    dateTime: instant,
    timeZone: "Europe/Lisbon",
  });
  assert.deepEqual(googleTimedBound("2026-07-15", "15:00"), {
    dateTime: instant,
    timeZone: "Europe/Lisbon",
  });
  assert.equal(parseGoogleDateTime(instant).toISOString(), instant);

  const india = googleTimedBound("2026-07-15", "15:00", "Asia/Kolkata");
  assert.equal(india.dateTime, "2026-07-15T19:30:00");
  assert.equal(parseGoogleDateTime(india.dateTime, india.timeZone).toISOString(), instant);

  const span = icalGuestSpan(booking());
  assert.equal(span.zone, "America/New_York");
  assert.equal(span.start, "20260715T100000");
  assert.equal(span.end, "20260715T110000");
  assert.match(span.vtimezone, /TZID:America\/New_York/);
  assert.match(span.vtimezone, /TZOFFSETTO:-0400/);

  const guest = unfold(bookingsIcal([booking()], "Intro call · Ana", "https://meet.example/abc", { forGuest: true }));
  assert.match(guest, /DTSTART;TZID="America\/New_York":20260715T100000/);
  assert.match(guest, /DTEND;TZID="America\/New_York":20260715T110000/);
  assert.match(guest, /X-WR-TIMEZONE:America\/New_York/);
  assert.match(guest, /Eastern Time/);
  assert.doesNotMatch(guest, /DTSTART:\d{8}T\d{6}Z/);

  const studio = bookingsIcal([booking()]);
  assert.match(studio, /DTSTART:20260715T140000Z/);
  assert.match(studio, /DTEND:20260715T150000Z/);
  assert.match(studio, /X-WR-TIMEZONE:Europe\/Lisbon/);
  assert.doesNotMatch(studio, /TZID=/);

  const kolkata = icalGuestSpan(booking({ timeZone: "Asia/Kolkata" }));
  assert.equal(kolkata.start, "20260715T193000");
  assert.match(kolkata.vtimezone, /TZOFFSETTO:\+0530/);

  const auckland = icalGuestSpan(booking({ date: "2026-01-15", timeZone: "Pacific/Auckland" }));
  assert.equal(auckland.start, "20260116T040000");
  assert.match(auckland.vtimezone, /TZOFFSETTO:\+1300/);
});
