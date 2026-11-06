"use client";

import { useState, type ReactNode } from "react";
import { useStudioCopy } from "@/components/studio-lang";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/app/admin/actions";
import type { LocalText } from "@/lib/live-content";

export function Notice({ state, saved }: { state: ActionState; saved: string }) {
  if (!state?.ok && !state?.error) return null;
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm ${state.error ? "bg-clay text-terracotta-ink" : "bg-moss/15 text-moss"}`}
      role={state.error ? "alert" : "status"}
    >
      {state.error || saved}
    </p>
  );
}

/** A row of tick boxes for the pages something can go on. */
export function PagePicker({
  name,
  ids,
  labels,
  value,
  onChange,
  legend,
  help,
}: {
  name: string;
  ids: readonly string[];
  labels: Record<string, string>;
  value: string[];
  onChange: (next: string[]) => void;
  legend: string;
  help?: string;
}) {
  const t = useStudioCopy();
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : ids.filter((item) => item === id || value.includes(item)));
  }
  return (
    <fieldset>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend className="text-sm font-medium text-ink">{legend}</legend>
        <span className="flex gap-3 text-sm">
          <button type="button" className="min-h-9 underline underline-offset-4" onClick={() => onChange([...ids])}>
            {t.content.selectAll}
          </button>
          <button type="button" className="min-h-9 underline underline-offset-4" onClick={() => onChange([])}>
            {t.content.clear}
          </button>
        </span>
      </div>
      {help ? <p className="mt-1 text-sm text-ink/60">{help}</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ids.map((id) => (
          <label
            key={id}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-ink/10 bg-white/70 px-4 text-base has-[:checked]:border-terracotta has-[:checked]:bg-clay/60"
          >
            <input
              type="checkbox"
              name={name}
              value={id}
              checked={value.includes(id)}
              onChange={() => toggle(id)}
              className="h-5 w-5 shrink-0 accent-terracotta"
            />
            <span>{labels[id] ?? id}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckRow({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 text-base">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-terracotta"
      />
      <span>{label}</span>
    </label>
  );
}

/** Spanish and Portuguese wording, folded away because English is the one that must be there. */
export function OtherLanguages({
  prefix,
  label,
  value,
  onChange,
  multiline,
  max,
}: {
  prefix: string;
  label: string;
  value: LocalText;
  onChange: (next: LocalText) => void;
  multiline?: boolean;
  max: number;
}) {
  const t = useStudioCopy();
  const Field = multiline ? Textarea : Input;
  const [startOpen] = useState(() => Boolean(value.es || value.pt));
  return (
    <details className="rounded-2xl border border-ink/10 bg-white/50 px-4 py-3" open={startOpen}>
      <summary className="min-h-9 cursor-pointer text-sm font-medium">{label}</summary>
      <p className="mt-2 text-sm text-ink/60">{t.content.otherLanguagesHelp}</p>
      <div className="mt-3 space-y-4">
        <div>
          <Label htmlFor={`${prefix}-es`}>{t.content.spanish}</Label>
          <Field
            id={`${prefix}-es`}
            name={`${prefix}Es`}
            value={value.es}
            maxLength={max}
            onChange={(event) => onChange({ ...value, es: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-pt`}>{t.content.portuguese}</Label>
          <Field
            id={`${prefix}-pt`}
            name={`${prefix}Pt`}
            value={value.pt}
            maxLength={max}
            onChange={(event) => onChange({ ...value, pt: event.target.value })}
          />
        </div>
      </div>
    </details>
  );
}

/** A delete button that asks first. */
export function DeleteForm({
  action,
  id,
  label,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  children?: ReactNode;
}) {
  const t = useStudioCopy();
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t.content.confirmDelete)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" className="min-h-11 w-full text-terracotta-ink sm:w-auto">
        {children ?? label ?? t.content.delete}
      </Button>
    </form>
  );
}
