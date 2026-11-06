import { promises as fs } from "node:fs";
import path from "node:path";
import { emptyLiveContent, parseLiveContent, type LiveContent } from "@/lib/live-content";
import { storageMode } from "@/lib/store";

const BLOB_PATH = "site/live-content.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "live-content.json");

async function readBlob(): Promise<LiveContent | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return parseLiveContent(JSON.parse(await new Response(result.stream).text()));
}

async function readLocal(): Promise<LiveContent | null> {
  try {
    return parseLiveContent(JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readLiveContent(): Promise<LiveContent> {
  const mode = storageMode();
  if (mode === "readonly") return emptyLiveContent();
  const saved = mode === "blob" ? await readBlob() : await readLocal();
  return saved ?? emptyLiveContent();
}

export async function writeLiveContent(content: LiveContent) {
  const mode = storageMode();
  if (mode === "readonly") {
    throw new Error("Connect Vercel Blob before saving. The public site cannot take new content yet.");
  }
  const json = JSON.stringify(content, null, 2);
  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, json, "utf8");
}
