"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { addPhotos, deletePhoto, savePhoto } from "@/app/admin/content/actions";
import { DeleteForm, Notice, OtherLanguages, PagePicker } from "@/components/admin-content/controls";
import { useStudioCopy } from "@/components/studio-lang";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { prepareImage, uploadImage, type UploadedImage } from "@/lib/client-image";
import {
  LIMITS,
  PHOTO_PAGE_IDS,
  PORTFOLIO_TAB_IDS,
  mediaSrc,
  type LocalText,
} from "@/lib/live-content";
import type { StorageMode } from "@/lib/pricing";

export type AdminPhoto = {
  id: string;
  mediaId: string;
  width: number;
  height: number;
  pages: string[];
  tabs: string[];
  first: boolean;
  alt: LocalText;
};

type Staged = {
  key: string;
  name: string;
  preview: string;
  status: "working" | "done" | "error";
  upload?: UploadedImage;
  blur?: string;
};

const blank: LocalText = { en: "", es: "", pt: "" };

function Placement({
  pages,
  setPages,
  tabs,
  setTabs,
}: {
  pages: string[];
  setPages: (next: string[]) => void;
  tabs: string[];
  setTabs: (next: string[]) => void;
}) {
  const t = useStudioCopy();
  return (
    <>
      <PagePicker
        name="pages"
        ids={PHOTO_PAGE_IDS}
        labels={t.content.pages}
        value={pages}
        onChange={setPages}
        legend={t.content.photos.pages}
        help={t.content.photos.pagesHelp}
      />
      {pages.includes("portfolio") ? (
        <PagePicker
          name="tabs"
          ids={PORTFOLIO_TAB_IDS}
          labels={t.content.tabs}
          value={tabs}
          onChange={setTabs}
          legend={t.content.photos.tabs}
          help={t.content.photos.tabsHelp}
        />
      ) : null}
    </>
  );
}

function Details({
  alt,
  setAlt,
  first,
  idPrefix,
}: {
  alt: LocalText;
  setAlt: (next: LocalText) => void;
  first: boolean;
  idPrefix: string;
}) {
  const t = useStudioCopy();
  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-alt`}>{t.content.photos.alt}</Label>
        <Input
          id={`${idPrefix}-alt`}
          name="altEn"
          maxLength={LIMITS.alt}
          value={alt.en}
          onChange={(event) => setAlt({ ...alt, en: event.target.value })}
        />
        <p className="mt-2 text-sm text-ink/60">{t.content.photos.altHelp}</p>
        <div className="mt-3">
          <OtherLanguages
            prefix="alt"
            label={t.content.otherLanguages}
            value={alt}
            onChange={setAlt}
            max={LIMITS.alt}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-position`}>{t.content.position}</Label>
        <select
          id={`${idPrefix}-position`}
          name="position"
          defaultValue={first ? "first" : "last"}
          className="h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 text-base"
        >
          <option value="last">{t.content.positionLast}</option>
          <option value="first">{t.content.positionFirst}</option>
        </select>
        <p className="mt-2 text-sm text-ink/60">{t.content.photos.positionHelp}</p>
      </div>
    </>
  );
}

function Uploader({ disabled }: { disabled: boolean }) {
  const t = useStudioCopy();
  const [staged, setStaged] = useState<Staged[]>([]);
  const [pages, setPages] = useState<string[]>(["portfolio"]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [alt, setAlt] = useState<LocalText>(blank);
  const [added, setAdded] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState(
    async (previous: Awaited<ReturnType<typeof addPhotos>> | null, formData: FormData) => {
      const result = await addPhotos(previous, formData);
      if (result?.ok) {
        // The photos are saved, so clear the form for the next batch.
        let count = 0;
        try {
          count = (JSON.parse(String(formData.get("photos") ?? "[]")) as unknown[]).length;
        } catch {
          count = 0;
        }
        setAdded(count);
        setStaged([]);
        setAlt(blank);
        setFormKey((key) => key + 1);
      }
      return result;
    },
    null,
  );
  const counter = useRef(0);
  const working = staged.filter((item) => item.status === "working").length;
  const done = staged.filter((item) => item.status === "done" && item.upload);

  async function choose(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAdded(0);
    const list = Array.from(files).slice(0, 40);
    const entries = list.map((file) => ({ file, key: `${Date.now()}-${counter.current++}` }));
    setStaged((current) => [
      ...current,
      ...entries.map(({ file, key }) => ({ key, name: file.name, preview: "", status: "working" as const })),
    ]);
    for (const { file, key } of entries) {
      try {
        const prepared = await prepareImage(file);
        const preview = URL.createObjectURL(prepared.blob);
        setStaged((current) => current.map((item) => (item.key === key ? { ...item, preview } : item)));
        const upload = await uploadImage(prepared.blob);
        setStaged((current) =>
          current.map((item) =>
            item.key === key ? { ...item, status: "done", upload, blur: prepared.blur } : item,
          ),
        );
      } catch {
        setStaged((current) => current.map((item) => (item.key === key ? { ...item, status: "error" } : item)));
      }
    }
  }

  function remove(key: string) {
    setStaged((current) => {
      const gone = current.find((item) => item.key === key);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return current.filter((item) => item.key !== key);
    });
  }

  const payload = JSON.stringify(
    done.map((item) => ({ id: item.upload!.id, width: item.upload!.width, height: item.upload!.height, blur: item.blur })),
  );

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
      <h2 className="font-serif text-2xl md:text-3xl">{t.content.photos.addTitle}</h2>

      <label
        className={`mt-5 flex min-h-14 w-full cursor-pointer items-center justify-center rounded-full bg-terracotta px-6 font-medium text-white sm:inline-flex sm:w-auto ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {t.content.photos.choose}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const input = event.currentTarget;
            void choose(input.files).finally(() => {
              input.value = "";
            });
          }}
        />
      </label>
      <p className="mt-2 text-sm text-ink/60">{t.content.photos.chooseHelp}</p>

      {staged.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium" aria-live="polite">
            {working > 0
              ? t.content.photos.preparing(staged.length - working, staged.length)
              : t.content.photos.ready(done.length)}
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {staged.map((item) => (
              <li key={item.key} className="relative aspect-square overflow-hidden rounded-2xl bg-clay/60">
                {item.preview ? (
                  <Image src={item.preview} alt="" fill unoptimized sizes="120px" className="object-cover" />
                ) : null}
                {item.status === "working" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/50 text-xs">…</span>
                ) : null}
                {item.status === "error" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-clay/90 p-1 text-center text-xs text-terracotta-ink">
                    {t.content.photos.failed(item.name)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(item.key)}
                  aria-label={t.content.photos.remove}
                  className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-sand text-sm"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {added > 0 ? (
        <p className="mt-5 rounded-2xl bg-moss/15 px-4 py-3 text-sm text-moss" role="status">
          {t.content.photos.added(added)}
        </p>
      ) : null}

      {staged.length > 0 ? (
        <form key={formKey} action={action} className="mt-6 space-y-6">
          <input type="hidden" name="photos" value={payload} />
          <Placement pages={pages} setPages={setPages} tabs={tabs} setTabs={setTabs} />
          <Details alt={alt} setAlt={setAlt} first={false} idPrefix="new-photo" />
          <Notice state={state?.error ? state : null} saved="" />
          <Button type="submit" disabled={pending || disabled || working > 0 || done.length === 0} className="w-full sm:w-auto">
            {pending ? t.content.saving : t.content.photos.add}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function PhotoCard({ photo, disabled }: { photo: AdminPhoto; disabled: boolean }) {
  const t = useStudioCopy();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(savePhoto, null);
  const [pages, setPages] = useState(photo.pages);
  const [tabs, setTabs] = useState(photo.tabs);
  const [alt, setAlt] = useState<LocalText>(photo.alt);

  return (
    <li className="rounded-3xl bg-white p-3 shadow-sm md:p-4">
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-clay/60">
          <Image
            src={mediaSrc(photo.mediaId)}
            alt={photo.alt.en}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {photo.pages.length === 0 ? (
              <span className="rounded-full bg-clay px-3 py-1">{t.content.noPages}</span>
            ) : (
              photo.pages.map((page) => (
                <span key={page} className="rounded-full bg-clay/70 px-3 py-1">
                  {t.content.pages[page] ?? page}
                </span>
              ))
            )}
          </div>
          {photo.alt.en ? <p className="mt-2 line-clamp-2 text-sm text-ink/70">{photo.alt.en}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              disabled={disabled}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? t.content.close : t.content.edit}
            </Button>
          </div>
        </div>
      </div>
      {open ? (
        <div className="mt-5 space-y-6">
          <form action={action} className="space-y-6">
            <input type="hidden" name="id" value={photo.id} />
            <Placement pages={pages} setPages={setPages} tabs={tabs} setTabs={setTabs} />
            <Details alt={alt} setAlt={setAlt} first={photo.first} idPrefix={photo.id} />
            <Notice state={state} saved={t.content.photos.saved} />
            <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto">
              {pending ? t.content.saving : t.content.photos.save}
            </Button>
          </form>
          <DeleteForm action={deletePhoto} id={photo.id} />
        </div>
      ) : null}
    </li>
  );
}

export function PhotosManager({ photos, mode }: { photos: AdminPhoto[]; mode: StorageMode }) {
  const t = useStudioCopy();
  const disabled = mode === "readonly";
  return (
    <div className="space-y-10">
      {disabled ? <p className="rounded-2xl bg-clay px-4 py-3 text-sm">{t.content.readonly}</p> : null}
      <Uploader disabled={disabled} />
      <section>
        <h2 className="font-serif text-2xl md:text-3xl">{t.content.photos.listTitle}</h2>
        {photos.length === 0 ? <p className="mt-4 text-ink/70">{t.content.photos.empty}</p> : null}
        <ul className="mt-4 space-y-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} disabled={disabled} />
          ))}
        </ul>
      </section>
    </div>
  );
}
