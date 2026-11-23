import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { compressPhoto, compressVideo, sniffMediaType } from "@/lib/media-compress";
import { saveMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";
/** Long enough for a short film to compress on the studio machine. */
export const maxDuration = 300;

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** Compress and store one photo or film from the studio. */
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

  const declared = (file.type || "").toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMediaType(bytes);
  const kind =
    declared.startsWith("video/") || sniffed.startsWith("video/")
      ? "video"
      : declared.startsWith("image/") || sniffed.startsWith("image/")
        ? "image"
        : "unknown";

  if (kind === "unknown") {
    return NextResponse.json({ ok: false, error: "type" }, { status: 415 });
  }
  if (kind === "image" && file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ ok: false, error: "size" }, { status: 413 });
  }
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ ok: false, error: "size" }, { status: 413 });
  }

  const id = randomUUID();
  try {
    if (kind === "image") {
      const photo = await compressPhoto(bytes);
      if (photo.width > 12000 || photo.height > 12000) {
        return NextResponse.json({ ok: false, error: "type" }, { status: 415 });
      }
      await saveMedia(id, photo.bytes, photo.contentType);
      return NextResponse.json({
        ok: true,
        id,
        kind: "image",
        width: photo.width,
        height: photo.height,
        contentType: photo.contentType,
      });
    }

    const video = await compressVideo(bytes, declared || sniffed);
    await saveMedia(id, video.bytes, video.contentType);
    return NextResponse.json({
      ok: true,
      id,
      kind: "video",
      contentType: video.contentType,
      compressed: video.compressed,
    });
  } catch (error) {
    console.error("[media] upload failed", error);
    return NextResponse.json({ ok: false, error: "storage" }, { status: 503 });
  }
}
