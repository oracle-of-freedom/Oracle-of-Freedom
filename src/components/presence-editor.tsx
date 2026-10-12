"use client";

import { useState, useTransition } from "react";
import { saveStays } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { stayLine, type PresenceStay } from "@/lib/presence";

type PresenceCopy = {
  region: string;
  europe: string;
  latin: string;
  city: string;
  country: string;
  from: string;
  to: string;
  visible: string;
  save: string;
  remove: string;
  saved: string;
  removed: string;
  cleared: string;
  empty: string;
  preview: string;
  example: string;
  hidden: string;
  past: string;
  newStay: string;
  seeHome: string;
};

function blankStay(): PresenceStay {
  return {
    id: crypto.randomUUID(),
    region: "europe",
    city: "",
    country: "",
    starts: "",
    ends: "",
    visible: true,
  };
}

export function PresenceEditor({
  initial,
  today,
  copy,
  homeHref,
}: {
  initial: PresenceStay[];
  today: string;
  copy: PresenceCopy;
  homeHref: string;
}) {
  const [stays, setStays] = useState(initial);
  const [draft, setDraft] = useState<PresenceStay>(blankStay);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const ready =
    draft.city.trim().length > 0 &&
    draft.country.trim().length > 0 &&
    draft.starts.length === 10 &&
    draft.ends >= draft.starts;

  function persist(next: PresenceStay[], resetDraft: boolean, message: string) {
    setNote("");
    startTransition(async () => {
      const result = await saveStays(next);
      if (result?.error) {
        setNote(result.error);
        return;
      }
      setStays(next);
      if (resetDraft) setDraft(blankStay());
      setNote(message);
    });
  }

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    const stay: PresenceStay = { ...draft, city: draft.city.trim(), country: draft.country.trim() };
    const next = stays.some((item) => item.id === stay.id)
      ? stays.map((item) => (item.id === stay.id ? stay : item))
      : [stay, ...stays];
    persist(next, true, copy.saved);
  }

  return (
    <div className="mt-4 grid gap-4">
      <form onSubmit={onSave} className="grid gap-3 rounded-3xl bg-white p-4">
        <label className="grid gap-1 text-sm">
          {copy.region}
          <select
            value={draft.region}
            onChange={(event) => setDraft({ ...draft, region: event.target.value === "latin-america" ? "latin-america" : "europe" })}
            className="h-12 rounded-2xl border border-ink/15 bg-white/70 px-4 text-base"
          >
            <option value="europe">{copy.europe}</option>
            <option value="latin-america">{copy.latin}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {copy.city}
          <Input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} required maxLength={80} />
        </label>
        <label className="grid gap-1 text-sm">
          {copy.country}
          <Input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} required maxLength={80} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            {copy.from}
            <Input type="date" value={draft.starts} onChange={(event) => setDraft({ ...draft, starts: event.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            {copy.to}
            <Input type="date" value={draft.ends} onChange={(event) => setDraft({ ...draft, ends: event.target.value })} required />
          </label>
        </div>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input
            type="checkbox"
            checked={draft.visible}
            onChange={(event) => setDraft({ ...draft, visible: event.target.checked })}
            className="size-5"
          />
          {copy.visible}
        </label>
        <div className="rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed">
          <p className="text-xs tracking-[0.16em] text-ember uppercase">{copy.preview}</p>
          {ready ? (
            <>
              <p className="mt-2">{stayLine("es", draft)}</p>
              <p>{stayLine("en", draft)}</p>
              <p>{stayLine("pt", draft)}</p>
            </>
          ) : (
            <p className="mt-2 text-ink/70">{copy.example}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-full bg-terracotta px-5 text-sm font-medium text-white disabled:opacity-60">
            {copy.save}
          </button>
          <button
            type="button"
            onClick={() => setDraft(blankStay())}
            className="inline-flex min-h-12 items-center rounded-full border border-ink/15 px-5 text-sm"
          >
            {copy.newStay}
          </button>
        </div>
        {note ? <p className="text-sm">{note}</p> : null}
        <a href={homeHref} className="inline-flex min-h-12 items-center text-sm underline underline-offset-4">
          {copy.seeHome}
        </a>
      </form>

      {stays.length === 0 ? <p className="text-sm text-ink/60">{copy.empty}</p> : null}
      <ul className="grid gap-2">
        {stays.map((stay) => (
          <li key={stay.id} className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3">
            <button type="button" onClick={() => setDraft(stay)} className="min-h-12 flex-1 text-left">
              <span className="block font-medium">
                {stay.city}, {stay.country}
              </span>
              <span className="block text-sm text-ink/60">
                {stay.region === "europe" ? copy.europe : copy.latin}
                {" · "}
                {stay.starts} – {stay.ends}
                {!stay.visible ? ` · ${copy.hidden}` : ""}
                {stay.ends < today ? ` · ${copy.past}` : ""}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = stays.filter((item) => item.id !== stay.id);
                persist(next, draft.id === stay.id, next.length === 0 ? copy.cleared : copy.removed);
              }}
              disabled={pending}
              className="inline-flex min-h-12 items-center rounded-full border border-ink/15 px-4 text-sm"
            >
              {copy.remove}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
