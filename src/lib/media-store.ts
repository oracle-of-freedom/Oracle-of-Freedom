import { promises as fs } from "node:fs";
import path from "node:path";
import { isMediaId } from "@/lib/live-content";
import { sniffMediaType } from "@/lib/media-compress";
import { storageMode } from "@/lib/store";

const LOCAL_DIR = path.join(process.cwd(), "data", "media");

function blobPath(id: string) {
  return `media/${id}`;
}

function assertId(id: string) {
  if (!isMediaId(id)) throw new Error("Invalid media id.");
}

export async function saveMedia(
  id: string,
  bytes: Buffer,
  contentType = "image/jpeg",
) {
  assertId(id);
  const mode = storageMode();
  if (mode === "readonly") {
    throw new Error("Connect Vercel Blob before uploading.");
  }
  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(blobPath(id), bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, id), bytes);
  await fs.writeFile(path.join(LOCAL_DIR, `${id}.type`), contentType, "utf8");
}

export type MediaBody = {
  body: BodyInit;
  contentType: string;
};

/** The stored file as a web response body, or null when it is missing. */
export async function readMedia(id: string): Promise<MediaBody | null> {
  if (!isMediaId(id)) return null;
  const mode = storageMode();
  if (mode === "blob") {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPath(id), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return {
      body: result.stream,
      contentType: result.blob.contentType || "application/octet-stream",
    };
  }
  if (mode === "readonly") return null;
  try {
    const bytes = await fs.readFile(path.join(LOCAL_DIR, id));
    let contentType = sniffMediaType(bytes);
    try {
      const saved = (await fs.readFile(path.join(LOCAL_DIR, `${id}.type`), "utf8")).trim();
      if (saved) contentType = saved;
    } catch {
      // Older local uploads have no sidecar type file.
    }
    return { body: new Uint8Array(bytes), contentType };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteMedia(id: string) {
  if (!isMediaId(id)) return;
  const mode = storageMode();
  if (mode === "blob") {
    const { del } = await import("@vercel/blob");
    await del(blobPath(id));
    return;
  }
  if (mode === "readonly") return;
  await fs.rm(path.join(LOCAL_DIR, id), { force: true });
  await fs.rm(path.join(LOCAL_DIR, `${id}.type`), { force: true });
}
