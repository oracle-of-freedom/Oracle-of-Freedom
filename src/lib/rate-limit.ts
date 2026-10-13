import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { storageMode } from "@/lib/store";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const memory = new Map<string, number[]>();

type Bucket = "inquiry" | "booking";

function digest(bucket: Bucket, ip: string) {
  return createHash("sha256").update(`${bucket}\n${ip}`).digest("hex").slice(0, 32);
}

function asTimes(value: unknown) {
  if (!value || typeof value !== "object" || !("times" in value)) return [];
  const times = (value as { times: unknown }).times;
  if (!Array.isArray(times)) return [];
  return times.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
}

function decide(times: number[], now: number) {
  const recent = times.filter((time) => now - time < WINDOW_MS).slice(-30);
  recent.push(now);
  return { recent, limited: recent.length > LIMIT };
}

function localPath(id: string) {
  return path.join(process.cwd(), "data", "rates", `${id}.json`);
}

async function readTimes(mode: "blob" | "local", id: string) {
  if (mode === "blob") {
    const { get } = await import("@vercel/blob");
    const result = await get(`site/rates/${id}.json`, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    return asTimes(JSON.parse(await new Response(result.stream).text()));
  }
  return asTimes(JSON.parse(await fs.readFile(localPath(id), "utf8")));
}

async function writeTimes(mode: "blob" | "local", id: string, times: number[]) {
  const json = JSON.stringify({ times });
  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(`site/rates/${id}.json`, json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }
  const file = localPath(id);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, json, "utf8");
}

function remember(id: string, now: number) {
  const next = decide(memory.get(id) || [], now);
  memory.set(id, next.recent);
  return next.limited;
}

export async function rateLimited(ip: string, bucket: Bucket) {
  const now = Date.now();
  const id = digest(bucket, ip);
  const mode = storageMode();
  if (mode !== "blob" && mode !== "local") return remember(id, now);

  try {
    const next = decide(await readTimes(mode, id), now);
    await writeTimes(mode, id, next.recent);
    memory.set(id, next.recent);
    return next.limited;
  } catch (error) {
    const missing =
      (error as NodeJS.ErrnoException).code === "ENOENT" ||
      (error as { name?: string }).name === "BlobNotFoundError";
    if (!missing) console.error("[rate] store failed", error);
    if (missing) {
      try {
        const next = decide([], now);
        await writeTimes(mode, id, next.recent);
        memory.set(id, next.recent);
        return next.limited;
      } catch (writeError) {
        console.error("[rate] store failed", writeError);
      }
    }
    return remember(id, now);
  }
}
