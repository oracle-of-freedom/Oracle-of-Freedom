import { isMediaId } from "@/lib/live-content";
import { readMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";

/** Pictures Agota uploads in the studio. The id is a random UUID that never changes its picture. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMediaId(id)) return new Response("Not found", { status: 404 });
  const body = await readMedia(id);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
