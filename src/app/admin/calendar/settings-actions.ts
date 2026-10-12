"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { isAdmin } from "@/lib/admin-auth";
import {
  newCalendarToken,
  normalizeInboundIcalUrl,
  parseCalendarConfig,
  type CalendarConfig,
} from "@/lib/calendar-config";
import {
  readCalendarConfig,
  writeCalendarConfig,
} from "@/lib/calendar-config-store";
import { readBookings, writeBookings } from "@/lib/booking-store";
import { encryptGoogleToken, listGoogleCalendars } from "@/lib/google-calendar";
import { importInboundIcal } from "@/lib/inbound-ical";
import { lisbonToday } from "@/lib/pricing";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value || "").trim().slice(0, max);
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/calendar/settings");
  revalidatePath("/book");
  revalidatePath("/es/reservar");
  revalidatePath("/pt/reservar");
}

export async function saveCalendarSettings(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const current = await readCalendarConfig();
  let submitted: unknown;
  try {
    submitted = JSON.parse(String(formData.get("settings") || ""));
  } catch {
    return { error: t.errors.settingsInvalid };
  }
  const candidate = parseCalendarConfig({
    ...(submitted as Partial<CalendarConfig>),
    icalToken: current.icalToken,
    google: current.google,
    googleApp: current.googleApp,
  });
  if (!candidate) {
    return {
      error: t.errors.settingsCheck,
    };
  }
  if (current.inboundIcalUrl) candidate.inboundIcalUrl = current.inboundIcalUrl;
  try {
    await writeCalendarConfig(candidate);
    refresh();
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : t.errors.settingsSave,
    };
  }
}

export async function regenerateIcalToken() {
  await guard();
  const current = await readCalendarConfig();
  await writeCalendarConfig({ ...current, icalToken: newCalendarToken() });
  refresh();
}

export async function selectGoogleCalendar(formData: FormData) {
  await guard();
  const current = await readCalendarConfig();
  if (!current.google) return;
  const id = String(formData.get("calendarId") || "").slice(0, 500);
  if (!id) return;
  const calendars = await listGoogleCalendars(current);
  const selected = calendars.find((calendar) => calendar.id === id);
  if (!selected) return;
  await writeCalendarConfig({
    ...current,
    google: {
      ...current.google,
      calendarId: id,
      calendarSummary: selected.summary,
    },
  });
  refresh();
}

export async function saveGoogleAppSettings(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const clientId = clean(formData.get("clientId"), 200);
  const clientSecret = String(formData.get("clientSecret") || "").trim().slice(0, 300);
  const redirectUri = clean(formData.get("redirectUri"), 300);
  if (!/^[A-Za-z0-9._-]{8,200}$/.test(clientId)) {
    return { error: t.errors.clientId };
  }
  let redirect: URL;
  try {
    redirect = new URL(redirectUri);
  } catch {
    return { error: t.errors.redirectUrl };
  }
  const local = redirect.hostname === "localhost";
  if (
    (redirect.protocol !== "https:" && !(local && redirect.protocol === "http:")) ||
    redirect.pathname !== "/api/admin/google/callback"
  ) {
    return { error: t.errors.redirectPath };
  }
  const current = await readCalendarConfig();
  let encrypted = current.googleApp?.encryptedClientSecret || "";
  if (clientSecret) {
    try {
      encrypted = encryptGoogleToken(clientSecret);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : t.errors.secretSave,
      };
    }
  }
  if (!encrypted) return { error: t.errors.secretMissing };
  try {
    await writeCalendarConfig({
      ...current,
      googleApp: { clientId, encryptedClientSecret: encrypted, redirectUri },
    });
    refresh();
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : t.errors.googleSave,
    };
  }
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function saveInboundIcal(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();
  const t = studioCopy(await studioLang());
  const current = await readCalendarConfig();
  const normalized = normalizeInboundIcalUrl(clean(formData.get("url"), 2000));
  if (normalized === null) return { error: t.errors.inboundUrl };
  const next = { ...current };
  if (normalized) next.inboundIcalUrl = normalized;
  else delete next.inboundIcalUrl;
  await writeCalendarConfig(next);
  try {
    const bookings = await readBookings();
    if (!normalized) {
      const kept = bookings.filter((item) => item.origin !== "ical");
      if (kept.length !== bookings.length) await writeBookings(kept);
    } else {
      const today = lisbonToday();
      const synced = await importInboundIcal(
        normalized,
        bookings,
        addDays(today, -14),
        addDays(today, Math.min(current.daysAhead || 60, 90)),
      );
      if (synced.changed) await writeBookings(synced.bookings);
    }
  } catch (error) {
    console.error("[calendar] inbound iCal sync failed", error);
    refresh();
    return { error: t.errors.inboundRead };
  }
  refresh();
  return { ok: true };
}

export async function disconnectGoogleCalendar() {
  await guard();
  const current = await readCalendarConfig();
  const withoutGoogle = { ...current };
  delete withoutGoogle.google;
  await writeCalendarConfig(withoutGoogle);
  refresh();
}
