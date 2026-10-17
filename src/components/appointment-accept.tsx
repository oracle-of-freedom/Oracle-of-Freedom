"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BookingCopy } from "@/content/booking";

export function AppointmentAccept({
  token,
  copy,
}: {
  token: string;
  copy: BookingCopy;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [calendarUrl, setCalendarUrl] = useState("");

  async function accept() {
    setState("sending");
    const response = await fetch(`/api/bookings/${encodeURIComponent(token)}/accept`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; calendarUrl?: string } | null;
    if (!response.ok || !data?.ok) {
      setState("error");
      return;
    }
    setCalendarUrl(data.calendarUrl || `/api/bookings/${token}/calendar`);
    setState("done");
  }

  if (state === "done") {
    return (
      <div>
        <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptedTitle}</h1>
        <p className="mt-5 text-lg text-ink/70">{copy.acceptedBody}</p>
        {calendarUrl ? (
          <Button asChild className="mt-8">
            <a href={calendarUrl}>{copy.download}</a>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptTitle}</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/70">{copy.acceptBody}</p>
      {state === "error" ? (
        <p className="mt-4 text-sm text-terracotta-ink" role="alert">
          {copy.error}
        </p>
      ) : null}
      <Button type="button" className="mt-8" disabled={state === "sending"} onClick={accept}>
        {state === "sending" ? copy.accepting : copy.acceptButton}
      </Button>
    </div>
  );
}
