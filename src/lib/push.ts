import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { readSubscriptions, writeSubscriptions, type StoredPushSubscription } from "@/lib/push-store";
import type { StudioLang } from "@/lib/studio-locale";

export type StudioNoticeKind = "inquiry" | "consultation" | "appointment" | "test";

export type StudioNotice = {
  kind: StudioNoticeKind;
  name: string;
  detail: Record<StudioLang, string>;
  url: string;
  tag: string;
};

const titles: Record<StudioNoticeKind, Record<StudioLang, string>> = {
  inquiry: { en: "New request", es: "Solicitud nueva" },
  consultation: { en: "New consultation", es: "Consulta nueva" },
  appointment: { en: "New appointment", es: "Cita nueva" },
  test: { en: "Test", es: "Prueba" },
};

function vapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

export function pushPublicKey() {
  return vapid()?.publicKey ?? null;
}

function statusCode(error: unknown) {
  if (error instanceof WebPushError) return error.statusCode;
  if (error && typeof error === "object" && "statusCode" in error) {
    const code = (error as { statusCode: unknown }).statusCode;
    if (typeof code === "number") return code;
  }
  return 0;
}

export async function notifyStudio(notice: StudioNotice) {
  const keys = vapid();
  if (!keys) {
    console.info("[push] not configured");
    return;
  }
  let subscriptions: StoredPushSubscription[];
  try {
    subscriptions = await readSubscriptions();
  } catch (error) {
    console.error("[push] could not read subscriptions", error);
    return;
  }
  if (subscriptions.length === 0) return;

  setVapidDetails(process.env.VAPID_SUBJECT || "mailto:agota@oracleoffreedom.com", keys.publicKey, keys.privateKey);
  const gone = new Set<string>();
  await Promise.all(
    subscriptions.map(async (subscription) => {
      const lang: StudioLang = subscription.lang === "en" ? "en" : "es";
      const detail = notice.detail[lang];
      const payload = JSON.stringify({
        title: titles[notice.kind][lang],
        body: detail ? `${notice.name} · ${detail}` : notice.name,
        url: notice.url,
        tag: notice.tag,
      });
      try {
        await sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, payload, {
          urgency: "high",
          TTL: 60 * 60 * 12,
        });
      } catch (error) {
        const code = statusCode(error);
        if (code === 404 || code === 410) gone.add(subscription.endpoint);
        else console.error("[push] send failed", code || error);
      }
    }),
  );
  if (gone.size === 0) return;
  try {
    await writeSubscriptions(subscriptions.filter((subscription) => !gone.has(subscription.endpoint)));
  } catch (error) {
    console.error("[push] could not drop expired subscriptions", error);
  }
}
