import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { pushPublicKey } from "@/lib/push";
import { readSubscriptions, writeSubscriptions, type StoredPushSubscription } from "@/lib/push-store";
import { parseStudioLang, STUDIO_LANG_COOKIE } from "@/lib/studio-locale";

const subscriptionSchema = z.object({
  endpoint: z.string().startsWith("https://").max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, publicKey: pushPublicKey() });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = subscriptionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  if (!pushPublicKey()) return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 503 });

  const jar = await cookies();
  const record: StoredPushSubscription = {
    endpoint: parsed.data.endpoint,
    keys: parsed.data.keys,
    lang: parseStudioLang(jar.get(STUDIO_LANG_COOKIE)?.value),
    createdAt: new Date().toISOString(),
  };
  try {
    const current = await readSubscriptions();
    const next = [record, ...current.filter((item) => item.endpoint !== record.endpoint)].slice(0, 8);
    await writeSubscriptions(next);
  } catch (error) {
    console.error("[push] could not save subscription", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
