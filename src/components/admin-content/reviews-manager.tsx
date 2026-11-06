"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteReview, saveReview } from "@/app/admin/content/actions";
import {
  CheckRow,
  DeleteForm,
  Notice,
  OtherLanguages,
  PagePicker,
} from "@/components/admin-content/controls";
import { useStudioCopy, useStudioLang } from "@/components/studio-lang";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  LIMITS,
  REVIEW_PAGE_IDS,
  SERVICE_PRESETS,
  type LocalText,
} from "@/lib/live-content";
import type { StorageMode } from "@/lib/pricing";

export type AdminReview = {
  id: string;
  /** True for a review that ships with the site. Its words cannot be changed here. */
  bundled: boolean;
  quote: LocalText;
  name: string;
  service: LocalText;
  pages: string[];
  first: boolean;
  hidden: boolean;
};

const blank: LocalText = { en: "", es: "", pt: "" };

function ReviewForm({
  review,
  disabled,
  onSaved,
  onCancel,
}: {
  review?: AdminReview;
  disabled: boolean;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const t = useStudioCopy();
  const lang = useStudioLang();
  const [state, action, pending] = useActionState(saveReview, null);
  const [quote, setQuote] = useState<LocalText>(review?.quote ?? blank);
  const [name, setName] = useState(review?.name ?? "");
  const [service, setService] = useState<LocalText>(review?.service ?? blank);
  const [pages, setPages] = useState<string[]>(review?.pages ?? []);
  const [first, setFirst] = useState(review?.first ?? false);
  const [hidden, setHidden] = useState(review?.hidden ?? false);
  const locked = review?.bundled === true;

  useEffect(() => {
    if (state?.ok) onSaved();
    // onSaved only bumps parent state; run once per saved result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      {review ? <input type="hidden" name="id" value={review.id} /> : null}
      {locked ? <input type="hidden" name="bundled" value="1" /> : null}

      <div>
        <Label htmlFor={`quote-${review?.id ?? "new"}`}>{t.content.reviews.quote}</Label>
        {locked ? (
          <>
            <p className="rounded-2xl bg-clay/50 px-4 py-3 font-quote text-lg leading-snug">{quote.en}</p>
            <p className="mt-2 text-sm text-ink/60">{t.content.reviews.quoteLocked}</p>
          </>
        ) : (
          <>
            <Textarea
              id={`quote-${review?.id ?? "new"}`}
              name="quoteEn"
              required
              maxLength={LIMITS.quote}
              value={quote.en}
              onChange={(event) => setQuote({ ...quote, en: event.target.value })}
              className="min-h-40"
            />
            <p className="mt-2 text-sm text-ink/60">{t.content.reviews.quoteHelp}</p>
            <div className="mt-3">
              <OtherLanguages
                prefix="quote"
                label={t.content.otherLanguages}
                value={quote}
                onChange={setQuote}
                multiline
                max={LIMITS.quote}
              />
            </div>
          </>
        )}
      </div>

      <div>
        <Label htmlFor={`name-${review?.id ?? "new"}`}>{t.content.reviews.name}</Label>
        <Input
          id={`name-${review?.id ?? "new"}`}
          name="name"
          maxLength={LIMITS.name}
          value={name}
          placeholder={lang === "en" ? "Quinton, Ireland" : "Quinton, Irlanda"}
          onChange={(event) => setName(event.target.value)}
        />
        <p className="mt-2 text-sm text-ink/60">{t.content.reviews.nameHelp}</p>
      </div>

      <div>
        <Label htmlFor={`service-${review?.id ?? "new"}`}>{t.content.reviews.service}</Label>
        <Input
          id={`service-${review?.id ?? "new"}`}
          name="serviceEn"
          maxLength={LIMITS.service}
          value={service.en}
          placeholder="Festival aftermovie"
          onChange={(event) => setService({ ...service, en: event.target.value })}
        />
        <p className="mt-2 text-sm text-ink/60">{t.content.reviews.serviceHelp}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICE_PRESETS.map((preset) => (
            <button
              key={preset.en}
              type="button"
              onClick={() => setService(preset)}
              className={`min-h-10 rounded-full border px-4 text-sm ${
                service.en === preset.en ? "border-terracotta bg-clay/60" : "border-ink/15 bg-white/70"
              }`}
            >
              {lang === "en" ? preset.en : preset.es}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <OtherLanguages
            prefix="service"
            label={t.content.otherLanguages}
            value={service}
            onChange={setService}
            max={LIMITS.service}
          />
        </div>
      </div>

      <PagePicker
        name="pages"
        ids={REVIEW_PAGE_IDS}
        labels={t.content.pages}
        value={pages}
        onChange={setPages}
        legend={t.content.reviews.pages}
        help={t.content.reviews.pagesHelp}
      />

      <div>
        {locked ? null : (
          <CheckRow name="first" label={t.content.reviews.first} checked={first} onChange={setFirst} />
        )}
        {review ? (
          <CheckRow name="hidden" label={t.content.reviews.hide} checked={hidden} onChange={setHidden} />
        ) : null}
      </div>

      <figure className="rounded-3xl bg-clay/70 p-6">
        <p className="text-xs tracking-[0.16em] text-ember uppercase">{t.content.reviews.preview}</p>
        <blockquote className="mt-3 font-quote text-xl leading-snug break-words text-ink">
          {quote.en || "…"}
        </blockquote>
        <figcaption className="mt-4">
          <span className="text-sm font-medium break-words text-ink">{name}</span>
          {service.en ? (
            <span className="mt-1 block text-xs font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
              {service.en}
            </span>
          ) : null}
        </figcaption>
      </figure>

      <Notice state={state} saved={t.content.reviews.saved} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto">
          {pending ? t.content.saving : review ? t.content.reviews.save : t.content.reviews.add}
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

export function ReviewsManager({
  reviews,
  mode,
}: {
  reviews: AdminReview[];
  mode: StorageMode;
}) {
  const t = useStudioCopy();
  const lang = useStudioLang();
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [note, setNote] = useState(false);
  const disabled = mode === "readonly";

  return (
    <div className="space-y-10">
      {disabled ? <p className="rounded-2xl bg-clay px-4 py-3 text-sm">{t.content.readonly}</p> : null}

      <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
        <h2 className="font-serif text-2xl md:text-3xl">{t.content.reviews.addTitle}</h2>
        {note ? (
          <p className="mt-4 rounded-2xl bg-moss/15 px-4 py-3 text-sm text-moss" role="status">
            {t.content.reviews.saved}
          </p>
        ) : null}
        <div className="mt-5">
          <ReviewForm
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
        <h2 className="font-serif text-2xl md:text-3xl">{t.content.reviews.listTitle}</h2>
        {reviews.length === 0 ? <p className="mt-4 text-ink/70">{t.content.reviews.empty}</p> : null}
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
              {editing === review.id ? (
                <ReviewForm
                  review={review}
                  disabled={disabled}
                  onSaved={() => setEditing(null)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <p className="line-clamp-4 font-quote text-lg leading-snug">
                    {lang === "es" && review.quote.es ? review.quote.es : review.quote.en}
                  </p>
                  <p className="mt-3 text-sm font-medium">{review.name}</p>
                  {review.service.en ? (
                    <p className="text-xs font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
                      {lang === "es" && review.service.es ? review.service.es : review.service.en}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {review.hidden ? (
                      <span className="rounded-full bg-ink px-3 py-1 text-sand">{t.content.hidden}</span>
                    ) : review.pages.length === 0 ? (
                      <span className="rounded-full bg-clay px-3 py-1">{t.content.noPages}</span>
                    ) : (
                      review.pages.map((page) => (
                        <span key={page} className="rounded-full bg-clay/70 px-3 py-1">
                          {t.content.pages[page] ?? page}
                        </span>
                      ))
                    )}
                    {review.bundled ? (
                      <span className="rounded-full border border-ink/15 px-3 py-1 text-ink/60">
                        {t.content.reviews.fromSite}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full sm:w-auto"
                      disabled={disabled}
                      onClick={() => {
                        setNote(false);
                        setEditing(review.id);
                      }}
                    >
                      {t.content.edit}
                    </Button>
                    {review.bundled ? null : <DeleteForm action={deleteReview} id={review.id} />}
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
