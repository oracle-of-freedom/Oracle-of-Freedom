"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BookingCopy } from "@/content/booking";

export function AppointmentAccept({
  token,
  copy,
  meetingUrl = "",
}: {
  token: string;
  copy: BookingCopy;
  meetingUrl?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState(meetingUrl);

  async function accept() {
    setState("sending");
    const response = await fetch(`/api/bookings/${encodeURIComponent(token)}/accept`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; calendarUrl?: string; meetingUrl?: string }
      | null;
    if (!response.ok || !data?.ok) {
      setState("error");
      return;
    }
    setCalendarUrl(data.calendarUrl || `/api/bookings/${token}/calendar`);
    if (data.meetingUrl) setJoinUrl(data.meetingUrl);
    setState("done");
  }

  if (state === "done") {
    return (
      <div>
        <h1 className="mt-3 font-serif text-5xl leading-tight">{copy.acceptedTitle}</h1>
        <p className="mt-5 text-lg text-ink/70">{copy.acceptedBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {joinUrl ? (
            <Button asChild>
              <a href={joinUrl} target="_blank" rel="noreferrer">
                {copy.joinMeeting}
              </a>
            </Button>
          ) : null}
          {calendarUrl ? (
            <Button asChild variant={joinUrl ? "outline" : "default"}>
              <a href={calendarUrl}>{copy.download}</a>
            </Button>
          ) : null}
        </div>
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
