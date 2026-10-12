import { promises as fs } from "node:fs";
import path from "node:path";
import type { StudioLang } from "@/lib/studio-locale";
import { storageMode } from "@/lib/store";

const BLOB_PATH = "site/push-subscriptions.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "push-subscriptions.json");

export type StoredPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  lang: StudioLang;
  createdAt: string;
};

function isSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StoredPushSubscription>;
  const keys = item.keys;
  return (
    typeof item.endpoint === "string" &&
    item.endpoint.startsWith("https://") &&
    item.endpoint.length <= 2000 &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    keys.p256dh.length > 0 &&
    keys.p256dh.length <= 200 &&
    typeof keys.auth === "string" &&
    keys.auth.length > 0 &&
    keys.auth.length <= 200 &&
    (item.lang === "en" || item.lang === "es") &&
    typeof item.createdAt === "string"
  );
}

function asList(value: unknown): StoredPushSubscription[] {
  const raw =
    value && typeof value === "object" && "subscriptions" in value
      ? (value as { subscriptions: unknown }).subscriptions
      : value;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSubscription);
}

async function readBlob(): Promise<StoredPushSubscription[]> {
  const { get } = await import("@vercel/blob");
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  return asList(JSON.parse(await new Response(result.stream).text()));
}

async function readLocal(): Promise<StoredPushSubscription[]> {
  try {
    return asList(JSON.parse(await fs.readFile(LOCAL_PATH, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function readSubscriptions(): Promise<StoredPushSubscription[]> {
  const mode = storageMode();
  if (mode === "readonly") return [];
  return mode === "blob" ? readBlob() : readLocal();
}

export async function writeSubscriptions(subscriptions: StoredPushSubscription[]) {
  const mode = storageMode();
  if (mode === "readonly") {
    throw new Error("Conecta Vercel Blob antes de guardar notificaciones.");
  }
  const json = JSON.stringify({ subscriptions }, null, 2);
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
