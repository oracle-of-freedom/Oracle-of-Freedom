"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/inquiries";
import { readInquiries, writeInquiries } from "@/lib/inquiry-store";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function setInquiryStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "").slice(0, 80);
  const status = String(formData.get("status") || "");
  if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) return;
  const current = await readInquiries();
  if (!current.some((item) => item.id === id)) return;
  await writeInquiries(
    current.map((item) => (item.id === id ? { ...item, status: status as InquiryStatus } : item)),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function acceptInquiry(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "").slice(0, 80);
  const current = await readInquiries();
  const inquiry = current.find((item) => item.id === id);
  if (!inquiry) return;
  const bookingToken = inquiry.bookingToken || randomBytes(24).toString("base64url");
  await writeInquiries(
    current.map((item) =>
      item.id === id ? { ...item, status: "replied" as const, bookingToken } : item,
    ),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}
