import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { jpegSize } from "@/lib/jpeg";
import { saveMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

/** Take one picture the studio has already shrunk to a JPEG, and keep it. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "size" }, { status: 413 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const size = jpegSize(bytes);
  if (!size || size.width > 12000 || size.height > 12000) {
    return NextResponse.json({ ok: false, error: "type" }, { status: 415 });
  }
  const id = randomUUID();
  try {
    await saveMedia(id, bytes);
  } catch (error) {
    console.error("[media] upload failed", error);
    return NextResponse.json({ ok: false, error: "storage" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, id, width: size.width, height: size.height });
}
