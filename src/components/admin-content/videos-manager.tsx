"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { deleteVideo, saveVideo } from "@/app/admin/content/actions";
import { DeleteForm, Notice, OtherLanguages, PagePicker } from "@/components/admin-content/controls";
import { useStudioCopy } from "@/components/studio-lang";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { prepareImage, uploadImage, type UploadedImage } from "@/lib/client-image";
import { LIMITS, VIDEO_PAGE_IDS, mediaSrc, parseVideoUrl, type LocalText } from "@/lib/live-content";
import type { StorageMode } from "@/lib/pricing";

export type AdminVideo = {
  id: string;
  platform: "youtube" | "instagram";
  url: string;
  posterMediaId: string;
  posterWidth: number;
  posterHeight: number;
  caption: LocalText;
  pages: string[];
  first: boolean;
};

const blank: LocalText = { en: "", es: "", pt: "" };

function VideoForm({
  video,
  disabled,
  onSaved,
  onCancel,
}: {
  video?: AdminVideo;
  disabled: boolean;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const t = useStudioCopy();
  const [state, action, pending] = useActionState(saveVideo, null);
  const [url, setUrl] = useState(video?.url ?? "");
  const [caption, setCaption] = useState<LocalText>(video?.caption ?? blank);
  const [pages, setPages] = useState<string[]>(video?.pages ?? ["portfolio"]);
  const [poster, setPoster] = useState<UploadedImage | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const known = parseVideoUrl(url);
  const shownCover = preview || (video ? mediaSrc(video.posterMediaId) : "");

  useEffect(() => {
    if (state?.ok) onSaved();
    // onSaved only changes parent state; run once per saved result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function chooseCover(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setCoverError(false);
    try {
      const prepared = await prepareImage(file);
      setPreview(URL.createObjectURL(prepared.blob));
      setPoster(await uploadImage(prepared.blob));
    } catch {
      setCoverError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}
      {poster ? (
        <>
          <input type="hidden" name="posterId" value={poster.id} />
          <input type="hidden" name="posterWidth" value={poster.width} />
          <input type="hidden" name="posterHeight" value={poster.height} />
        </>
      ) : null}

      <div>
        <Label htmlFor={`video-url-${video?.id ?? "new"}`}>{t.content.videos.link}</Label>
        <Input
          id={`video-url-${video?.id ?? "new"}`}
          name="url"
          type="url"
          inputMode="url"
          required
          maxLength={500}
          value={url}
          placeholder="https://www.youtube.com/watch?v=…"
          onChange={(event) => setUrl(event.target.value)}
        />
        <p className="mt-2 text-sm text-ink/60">{t.content.videos.linkHelp}</p>
        {url && !known ? (
          <p className="mt-2 text-sm text-terracotta-ink" role="alert">
            {t.content.errors.link}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={`video-caption-${video?.id ?? "new"}`}>{t.content.videos.caption}</Label>
        <Input
          id={`video-caption-${video?.id ?? "new"}`}
          name="captionEn"
          maxLength={LIMITS.caption}
          value={caption.en}
          placeholder="Festival aftermovie"
          onChange={(event) => setCaption({ ...caption, en: event.target.value })}
        />
        <p className="mt-2 text-sm text-ink/60">{t.content.videos.captionHelp}</p>
        <div className="mt-3">
          <OtherLanguages
            prefix="caption"
            label={t.content.otherLanguages}
            value={caption}
            onChange={setCaption}
            max={LIMITS.caption}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">{t.content.videos.poster}</p>
        <p className="mt-1 text-sm text-ink/60">{t.content.videos.posterHelp}</p>
        <div className="mt-3 flex items-center gap-4">
          {shownCover ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-clay/60">
              <Image src={shownCover} alt="" fill unoptimized sizes="96px" className="object-cover" />
            </div>
          ) : null}
          <label
            className={`inline-flex min-h-12 cursor-pointer items-center rounded-full border border-ink/20 px-5 text-base ${
              disabled || busy ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {busy ? t.content.saving : shownCover ? t.content.videos.posterChange : t.content.videos.posterChoose}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || busy}
              onChange={(event) => {
                const input = event.currentTarget;
                void chooseCover(input.files?.[0]).finally(() => {
                  input.value = "";
                });
              }}
            />
          </label>
        </div>
        {coverError ? (
          <p className="mt-2 text-sm text-terracotta-ink" role="alert">
            {t.content.photos.failed("")}
          </p>
        ) : null}
      </div>

      <PagePicker
        name="pages"
        ids={VIDEO_PAGE_IDS}
        labels={t.content.videos.filmPages}
        value={pages}
        onChange={setPages}
        legend={t.content.videos.pages}
        help={t.content.videos.pagesHelp}
      />

      <div>
        <Label htmlFor={`video-position-${video?.id ?? "new"}`}>{t.content.position}</Label>
        <select
          id={`video-position-${video?.id ?? "new"}`}
          name="position"
          defaultValue={video?.first ? "first" : "last"}
          className="h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4 text-base"
        >
          <option value="last">{t.content.positionLast}</option>
          <option value="first">{t.content.positionFirst}</option>
        </select>
      </div>

      <Notice state={state?.error ? state : null} saved="" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending || disabled || busy || !known} className="w-full sm:w-auto">
          {pending ? t.content.saving : video ? t.content.videos.save : t.content.videos.add}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            {t.content.close}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function VideosManager({ videos, mode }: { videos: AdminVideo[]; mode: StorageMode }) {
  const t = useStudioCopy();
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [note, setNote] = useState(false);
  const disabled = mode === "readonly";

  return (
    <div className="space-y-10">
      {disabled ? <p className="rounded-2xl bg-clay px-4 py-3 text-sm">{t.content.readonly}</p> : null}

      <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
        <h2 className="font-serif text-2xl md:text-3xl">{t.content.videos.addTitle}</h2>
        {note ? (
          <p className="mt-4 rounded-2xl bg-moss/15 px-4 py-3 text-sm text-moss" role="status">
            {t.content.videos.saved}
          </p>
        ) : null}
        <div className="mt-5">
          <VideoForm
            key={formKey}
            disabled={disabled}
            onSaved={() => {
              setNote(true);
              setFormKey((key) => key + 1);
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl md:text-3xl">{t.content.videos.listTitle}</h2>
        {videos.length === 0 ? <p className="mt-4 text-ink/70">{t.content.videos.empty}</p> : null}
        <ul className="mt-4 space-y-4">
          {videos.map((video) => (
            <li key={video.id} className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
              {editing === video.id ? (
                <>
                  <h3 className="mb-5 font-serif text-xl">{t.content.videos.editTitle}</h3>
                  <VideoForm
                    video={video}
                    disabled={disabled}
                    onSaved={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-clay/60">
                      <Image
                        src={mediaSrc(video.posterMediaId)}
                        alt=""
                        fill
                        unoptimized
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{video.caption.en || video.url}</p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-sm text-ink/60 underline underline-offset-4"
                      >
                        {video.platform === "youtube" ? "YouTube" : "Instagram"} · {video.url}
                      </a>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        {video.pages.length === 0 ? (
                          <span className="rounded-full bg-clay px-3 py-1">{t.content.noPages}</span>
                        ) : (
                          video.pages.map((page) => (
                            <span key={page} className="rounded-full bg-clay/70 px-3 py-1">
                              {t.content.videos.filmPages[page] ?? page}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full sm:w-auto"
                      disabled={disabled}
                      onClick={() => {
                        setNote(false);
                        setEditing(video.id);
                      }}
                    >
                      {t.content.edit}
                    </Button>
                    <DeleteForm action={deleteVideo} id={video.id} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
