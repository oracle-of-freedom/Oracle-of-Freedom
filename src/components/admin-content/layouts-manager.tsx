"use client";

import { useActionState, useEffect, useState } from "react";
import { resetGalleryLayout, saveGalleryLayout } from "@/app/admin/content/actions";
import type { ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { useStudioCopy } from "@/components/studio-lang";
import {
  DEFAULT_GALLERY_LAYOUT,
  GALLERY_COLUMNS,
  GALLERY_GAPS,
  GALLERY_LAYOUT_PAGE_IDS,
  GALLERY_MOBILE_VISIBLE,
  GALLERY_STYLES,
  type GalleryLayout,
  type GalleryLayoutPageId,
} from "@/lib/live-content";
import type { StorageMode } from "@/lib/pricing";

export function LayoutsManager({
  initial,
  mode,
}: {
  initial: Partial<Record<GalleryLayoutPageId, GalleryLayout>>;
  mode: StorageMode;
}) {
  const t = useStudioCopy();
  const [page, setPage] = useState<GalleryLayoutPageId>("home");
  const [layout, setLayout] = useState<GalleryLayout>(
    () => initial.home || DEFAULT_GALLERY_LAYOUT,
  );
  const [state, action, pending] = useActionState(saveGalleryLayout, null as ActionState);

  useEffect(() => {
    setLayout(initial[page] || DEFAULT_GALLERY_LAYOUT);
  }, [initial, page]);

  const customized = Boolean(initial[page]);

  return (
    <section className="grid gap-6">
      <p className="text-ink/70">{t.content.layouts.intro}</p>
      <div>
        <Label htmlFor="layout-page">{t.content.layouts.page}</Label>
        <select
          id="layout-page"
          value={page}
          onChange={(event) => setPage(event.target.value as GalleryLayoutPageId)}
          className="mt-2 h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4"
        >
          {GALLERY_LAYOUT_PAGE_IDS.map((id) => (
            <option key={id} value={id}>
              {t.content.pages[id] || id}
            </option>
          ))}
        </select>
      </div>

      <form action={action} className="grid gap-5 rounded-3xl bg-white/80 p-4 md:p-6">
        <input type="hidden" name="page" value={page} />
        <fieldset className="grid gap-3">
          <legend className="font-serif text-2xl">{t.content.layouts.style}</legend>
          {GALLERY_STYLES.map((style) => (
            <label key={style} className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="style"
                value={style}
                checked={layout.style === style}
                onChange={() => setLayout((current) => ({ ...current, style }))}
                className="mt-1"
              />
              <span>{t.content.layouts.styles[style]}</span>
            </label>
          ))}
        </fieldset>

        <div>
          <Label htmlFor="layout-columns">{t.content.layouts.columns}</Label>
          <select
            id="layout-columns"
            name="columns"
            value={layout.columns}
            onChange={(event) =>
              setLayout((current) => ({
                ...current,
                columns: Number(event.target.value) as GalleryLayout["columns"],
              }))
            }
            className="mt-2 h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4"
          >
            {GALLERY_COLUMNS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">{t.content.layouts.gap}</legend>
          <div className="flex flex-wrap gap-3">
            {GALLERY_GAPS.map((gap) => (
              <label key={gap} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="gap"
                  value={gap}
                  checked={layout.gap === gap}
                  onChange={() => setLayout((current) => ({ ...current, gap }))}
                />
                {t.content.layouts.gaps[gap]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Label htmlFor="layout-mobile">{t.content.layouts.mobile}</Label>
          <select
            id="layout-mobile"
            name="mobileVisible"
            value={layout.mobileVisible}
            onChange={(event) =>
              setLayout((current) => ({
                ...current,
                mobileVisible: Number(event.target.value) as GalleryLayout["mobileVisible"],
              }))
            }
            className="mt-2 h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4"
          >
            {GALLERY_MOBILE_VISIBLE.map((count) => (
              <option key={count} value={count}>
                {count === 0 ? t.content.layouts.mobileAll : count}
              </option>
            ))}
          </select>
        </div>

        {state?.error ? (
          <p className="rounded-2xl bg-clay px-4 py-3 text-sm text-terracotta-ink" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-2xl bg-moss/15 px-4 py-3 text-sm text-moss" role="status">
            {t.content.layouts.saved}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={pending || mode === "readonly"} className="w-full sm:w-auto">
            {pending ? t.content.layouts.saving : t.content.layouts.save}
          </Button>
          {customized ? (
            <Button
              type="submit"
              formAction={resetGalleryLayout}
              variant="outline"
              disabled={mode === "readonly"}
              className="w-full sm:w-auto"
            >
              {t.content.layouts.reset}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
