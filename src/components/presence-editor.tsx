"use client";

import { useState, useTransition } from "react";
import { saveStays } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { countriesInRegion, countryName } from "@/lib/countries";
import { MAX_COUNTRIES, placeDetail, placeTitle, shortWhen, staySummary, type PresenceStay } from "@/lib/presence";
import type { Locale } from "@/i18n/routing";

type PresenceCopy = {
  region: string;
  europe: string;
  latin: string;
  city: string;
  cityHint: string;
  country: string;
  chooseCountry: string;
  addCountry: string;
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
    countries: [],
    city: "",
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
  lang,
}: {
  initial: PresenceStay[];
  today: string;
  copy: PresenceCopy;
  homeHref: string;
  lang: Locale;
}) {
  const [stays, setStays] = useState(initial);
  const [draft, setDraft] = useState<PresenceStay>(blankStay);
  const [slots, setSlots] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const chosen = slots.filter(Boolean);
  const ready =
    chosen.length > 0 &&
    chosen.length === slots.length &&
    new Set(chosen).size === chosen.length &&
    draft.starts.length === 10 &&
    draft.ends >= draft.starts;
  const options = countriesInRegion(draft.region);

  function load(stay: PresenceStay) {
    setDraft(stay);
    setSlots(stay.countries.length > 0 ? stay.countries : [""]);
  }

  function persist(next: PresenceStay[], resetDraft: boolean, message: string) {
    setNote("");
    startTransition(async () => {
      const result = await saveStays(next);
      if (result?.error) {
        setNote(result.error);
        return;
      }
      setStays(next);
      if (resetDraft) {
        setDraft(blankStay());
        setSlots([""]);
      }
      setNote(message);
    });
  }

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    const stay: PresenceStay = {
      ...draft,
      countries: chosen,
      city: draft.city.trim(),
    };
    const next = stays.some((item) => item.id === stay.id)
      ? stays.map((item) => (item.id === stay.id ? stay : item))
      : [stay, ...stays];
    persist(next, true, copy.saved);
  }

  function setSlot(index: number, code: string) {
    setSlots(slots.map((item, itemIndex) => (itemIndex === index ? code : item)));
  }

  return (
    <div className="mt-4 grid gap-4">
      <form onSubmit={onSave} className="grid gap-3 rounded-3xl bg-white p-4">
        <label className="grid gap-1 text-sm">
          {copy.region}
          <select
            value={draft.region}
            onChange={(event) => {
              const region = event.target.value === "latin-america" ? "latin-america" : "europe";
              setDraft({ ...draft, region, countries: [] });
              setSlots([""]);
            }}
            className="h-12 rounded-2xl border border-ink/15 bg-white/70 px-4 text-base"
          >
            <option value="europe">{copy.europe}</option>
            <option value="latin-america">{copy.latin}</option>
          </select>
        </label>
        <div className="grid gap-2">
          {slots.map((code, index) => (
            <label key={index} className="grid gap-1 text-sm">
              {copy.country}
              <span className="flex gap-2">
                <select
                  value={code}
                  onChange={(event) => setSlot(index, event.target.value)}
                  required
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-ink/15 bg-white/70 px-4 text-base"
                >
                  <option value="">{copy.chooseCountry}</option>
                  {options
                    .filter((country) => country.code === code || !slots.includes(country.code))
                    .map((country) => (
                      <option key={country.code} value={country.code}>
                        {countryName(lang, country.code)}
                      </option>
                    ))}
                </select>
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSlots(slots.filter((_, itemIndex) => itemIndex !== index))}
                    className="inline-flex min-h-12 items-center rounded-full border border-ink/15 px-4 text-sm"
                  >
                    {copy.remove}
                  </button>
                ) : null}
              </span>
            </label>
          ))}
          {slots.length < MAX_COUNTRIES ? (
            <button
              type="button"
              onClick={() => setSlots([...slots, ""])}
              className="inline-flex min-h-12 w-fit items-center rounded-full border border-ink/15 px-4 text-sm"
            >
              + {copy.addCountry}
            </button>
          ) : null}
        </div>
        <label className="grid gap-1 text-sm">
          {copy.city}
          <Input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} maxLength={80} />
          <span className="text-xs text-ink/55">{copy.cityHint}</span>
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
            <ul className="mt-2 grid gap-2">
              {chosen.map((code) => {
                const stay = { ...draft, countries: chosen, city: draft.city.trim() };
                const detail = placeDetail(lang, stay, code);
                const place = detail ? `${placeTitle(lang, stay, code)}, ${detail}` : placeTitle(lang, stay, code);
                return (
                  <li key={code}>
                    {shortWhen(lang, draft.starts, draft.ends)} · {place}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-ink/70">{copy.example}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending || !ready} className="inline-flex min-h-12 items-center rounded-full bg-terracotta px-5 text-sm font-medium text-white disabled:opacity-60">
            {copy.save}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(blankStay());
              setSlots([""]);
            }}
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
            <button type="button" onClick={() => load(stay)} className="min-h-12 flex-1 text-left">
              <span className="block font-medium">{staySummary(lang, stay)}</span>
              <span className="block text-sm text-ink/60">
                {stay.region === "europe" ? copy.europe : copy.latin}
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
