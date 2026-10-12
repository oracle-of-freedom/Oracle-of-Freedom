"use client";

import { useEffect, useState } from "react";
import { useStudioCopy } from "@/components/studio-lang";

const SNOOZE = "oof-notify-later";

type Phase = "pending" | "ask" | "denied" | "working" | "on" | "failed" | "unconfigured";

function urlBase64ToUint8Array(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function subscribe(): Promise<"ok" | "unconfigured" | "failed"> {
  try {
    const response = await fetch("/api/admin/push");
    if (!response.ok) return "failed";
    const data = (await response.json()) as { publicKey?: string | null };
    if (!data.publicKey) return "unconfigured";
    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
    let subscription: PushSubscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch {
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }
    const saved = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (saved.ok) return "ok";
    const body = (await saved.json().catch(() => null)) as { error?: string } | null;
    return body?.error === "unconfigured" ? "unconfigured" : "failed";
  } catch {
    return "failed";
  }
}

export function NotificationPrompt() {
  const t = useStudioCopy();
  const [phase, setPhase] = useState<Phase>("pending");
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const onAndroid = /Android/i.test(navigator.userAgent);
    setAndroid(onAndroid);
    if (Notification.permission === "granted") {
      void subscribe().then((result) => {
        if (result === "unconfigured") setPhase("unconfigured");
        else if (result === "failed") setPhase("failed");
      });
      return;
    }
    if (sessionStorage.getItem(SNOOZE) === "1") return;
    setPhase(Notification.permission === "denied" ? "denied" : "ask");
  }, []);

  function enable() {
    sessionStorage.removeItem(SNOOZE);
    const asked = Notification.requestPermission();
    setPhase("working");
    asked
      .then(async (permission) => {
        if (permission === "denied") {
          setPhase("denied");
          return;
        }
        if (permission !== "granted") {
          setPhase("ask");
          return;
        }
        const result = await subscribe();
        setPhase(result === "ok" ? "on" : result);
      })
      .catch(() => setPhase("failed"));
  }

  function later() {
    sessionStorage.setItem(SNOOZE, "1");
    setPhase("pending");
  }

  if (phase === "pending") return null;

  const ask = android ? t.notify.askAndroid : t.notify.askDevice;
  const denied = android ? t.notify.deniedAndroid : t.notify.deniedDevice;
  const unconfigured = android ? t.notify.unconfiguredAndroid : t.notify.unconfiguredDevice;
  const body =
    phase === "denied" ? denied : phase === "on" ? t.notify.ready : phase === "unconfigured" ? unconfigured : phase === "failed" ? t.notify.failed : ask;

  return (
    <section className="mt-4 rounded-3xl bg-white px-5 py-5 shadow-sm" aria-labelledby="studio-notify-title">
      <p id="studio-notify-title" className="text-xs tracking-[0.16em] text-ember uppercase">
        {t.notify.kicker}
      </p>
      <p className="mt-2 font-serif text-2xl leading-snug">{android ? t.notify.titleAndroid : t.notify.titleDevice}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/70" role="status">
        {body}
      </p>
      {phase === "on" || phase === "unconfigured" ? null : (
        <div className="mt-4 flex flex-wrap gap-2">
          {phase === "denied" ? null : (
            <button
              type="button"
              onClick={enable}
              disabled={phase === "working"}
              className="min-h-12 rounded-full bg-terracotta px-5 text-sm font-medium text-white"
            >
              {phase === "working" ? t.notify.enabling : t.notify.enable}
            </button>
          )}
          <button type="button" onClick={later} className="min-h-12 rounded-full px-4 text-sm underline underline-offset-4">
            {t.notify.later}
          </button>
        </div>
      )}
    </section>
  );
}
