import { isMediaId } from "@/lib/live-content";
import { readMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";

/** Pictures and films Agota uploads in the studio. The id is a random UUID that never changes its file. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMediaId(id)) return new Response("Not found", { status: 404 });
  const media = await readMedia(id);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(media.body, {
    headers: {
      "content-type": media.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      ...(media.contentType.startsWith("video/")
        ? { "accept-ranges": "bytes" }
        : {}),
    },
  });
}
