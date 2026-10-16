"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useStudioCopy } from "@/components/studio-lang";

const SEEN = "oof-notice-seen";

type Notice = {
  id: string;
  kind: "inquiry" | "consultation" | "appointment";
  name: string;
  detail: string;
  href: string;
};

function readSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN) || "[]") as unknown;
    return new Set(Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function NotificationBell() {
  const t = useStudioCopy();
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [testing, setTesting] = useState(false);
  const [testNote, setTestNote] = useState("");

  useEffect(() => {
    let stopped = false;
    async function load() {
      const response = await fetch("/api/admin/notices");
      if (!response.ok || stopped) return;
      const data = (await response.json()) as { items?: Notice[] };
      const next = data.items || [];
      const seen = readSeen();
      if (stopped) return;
      setItems(next);
      setUnseen(next.filter((item) => !seen.has(item.id)).length);
    }
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    window.addEventListener("focus", load);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        const seen = readSeen();
        for (const item of items) seen.add(item.id);
        localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-200)));
        setUnseen(0);
      }
      return next;
    });
  }

  async function sendTest() {
    setTesting(true);
    setTestNote("");
    try {
      const response = await fetch("/api/admin/notices", { method: "POST" });
      setTestNote(response.ok ? t.bell.testSent : t.notify.failed);
    } catch {
      setTestNote(t.notify.failed);
    } finally {
      setTesting(false);
    }
  }

  const labels = {
    inquiry: t.bell.inquiry,
    consultation: t.bell.consultation,
    appointment: t.bell.appointment,
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink"
        aria-label={t.bell.label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unseen > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-medium text-white">
            {unseen > 9 ? "9+" : unseen}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id={panelId}
          className="fixed inset-x-4 top-16 z-50 rounded-3xl bg-white p-3 shadow-lg md:absolute md:inset-x-auto md:top-auto md:right-0 md:mt-2 md:w-80"
        >
          <p className="px-2 py-1 text-xs tracking-[0.16em] text-ember uppercase">{t.bell.label}</p>
          {items.length === 0 ? <p className="px-2 py-3 text-sm text-ink/70">{t.bell.empty}</p> : null}
          <ul className="max-h-80 overflow-auto">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="block rounded-2xl px-2 py-3 hover:bg-sand">
                  <span className="block text-xs tracking-[0.14em] text-ember uppercase">{labels[item.kind]}</span>
                  <span className="mt-1 block font-medium">{item.name}</span>
                  {item.detail ? <span className="mt-0.5 block text-sm text-ink/65">{item.detail}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={sendTest}
            disabled={testing}
            className="mt-1 min-h-11 w-full rounded-full px-3 text-sm underline underline-offset-4"
          >
            {testing ? t.bell.testing : t.bell.test}
          </button>
          {testNote ? <p className="px-2 py-2 text-sm text-ink/70">{testNote}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
