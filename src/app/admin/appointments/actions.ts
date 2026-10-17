"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { readBookings, writeBookings } from "@/lib/booking-store";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { deleteGoogleEvent } from "@/lib/google-calendar";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function refresh() {
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
}

export async function createAcceptanceLink(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking || booking.publicToken) {
    refresh();
    return;
  }
  const next = bookings.map((item) =>
    item.id === id ? { ...item, publicToken: randomBytes(24).toString("base64url") } : item,
  );
  await writeBookings(next);
  refresh();
}

export async function releaseAppointment(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking || booking.status !== "hold") {
    refresh();
    return;
  }
  const next = bookings.map((item) => (item.id === id ? { ...item, status: "cancelled" as const } : item));
  await writeBookings(next);
  try {
    if (booking.googleEventId) {
      await deleteGoogleEvent(await readCalendarConfig(), { ...booking, status: "cancelled" });
    }
  } catch (error) {
    console.error("[appointments] calendar release failed", error);
  }
  refresh();
}
