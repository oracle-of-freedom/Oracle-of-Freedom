"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { MobileMore } from "@/components/mobile-more";
import type { GalleryImage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_GALLERY_LAYOUT,
  type GalleryLayout,
} from "@/lib/live-content";
import { cn, isPublishedPhoto } from "@/lib/utils";

const moreCopy = {
  en: { more: "View more photos", less: "Show less" },
  es: { more: "Ver más fotos", less: "Ver menos" },
  pt: { more: "Ver mais fotos", less: "Ver menos" },
} as const;

const gapClass = {
  snug: "gap-2",
  normal: "gap-3",
  roomy: "gap-5",
} as const;

const masonryMargin = {
  snug: "mb-2",
  normal: "mb-3",
  roomy: "mb-5",
} as const;

const masonryColumns = {
  2: "columns-1 sm:columns-2",
  3: "columns-1 sm:columns-2 lg:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
} as const;

const gridColumns = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export function GalleryGrid({
  images,
  locale,
  labels,
  foldMobile = false,
  mobileVisible,
  layout = DEFAULT_GALLERY_LAYOUT,
}: {
  images: GalleryImage[];
  locale: Locale;
  labels: { open: string; close: string; previous: string; next: string; placeholder: string };
  /** Below md, show the first visible photos and a button that reveals the rest. */
  foldMobile?: boolean;
  /** Override layout.mobileVisible when a page still passes an explicit count. */
  mobileVisible?: number;
  layout?: GalleryLayout;
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const photos = images.filter((image) => isPublishedPhoto(image));
  const visibleCount = mobileVisible ?? layout.mobileVisible;
  /** Two rows on large screens, based on the chosen column count. */
  const desktopVisible = layout.columns * 2;
  const fold = foldMobile && (visibleCount > 0 || desktopVisible > 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active == null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [active]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (active == null) return;
      if (event.key === "ArrowRight") {
        setActive((index) => (index == null ? index : (index + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setActive((index) =>
          index == null ? index : (index - 1 + photos.length) % photos.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, photos.length]);

  const current = active == null ? null : photos[active];
  const words = moreCopy[locale];
  const gap = gapClass[layout.gap];

  function photoButton(
    image: GalleryImage,
    index: number,
    className?: string,
    imageClassName?: string,
  ) {
    return (
      <button
        key={image.id}
        type="button"
        className={cn(
          "group block w-full cursor-zoom-in overflow-hidden rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2",
          className,
        )}
        onClick={() => setActive(index)}
      >
        <Image
          src={image.src}
          alt={image.alt[locale]}
          width={image.width}
          height={image.height}
          sizes={
            layout.style === "spotlight" && index === 0
              ? "(max-width: 1024px) 100vw, 66vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          placeholder="blur"
          blurDataURL={image.blur}
          className={cn(
            "h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.015]",
            imageClassName,
          )}
        />
        <span className="sr-only">{labels.open}</span>
      </button>
    );
  }

  return (
    <>
      <MobileMore
        enabled={fold}
        total={photos.length}
        visible={visibleCount || photos.length}
        desktopVisible={desktopVisible}
        more={words.more}
        less={words.less}
      >
        {({ itemClass, itemId }) => {
          if (layout.style === "spotlight" && photos.length > 0) {
            const [hero, ...rest] = photos;
            return (
              <div className={cn("grid", gap)}>
                <div id={itemId(0)} className={itemClass(0)}>
                  {photoButton(hero, 0, undefined, "max-h-[70vh] object-cover")}
                </div>
                {rest.length > 0 ? (
                  <div className={cn("grid", gap, gridColumns[layout.columns])}>
                    {rest.map((image, offset) => {
                      const index = offset + 1;
                      return (
                        <div key={image.id} id={itemId(index)} className={itemClass(index)}>
                          {photoButton(image, index, undefined, "aspect-[4/5] object-cover")}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          if (layout.style === "grid") {
            return (
              <div className={cn("grid", gap, gridColumns[layout.columns])}>
                {photos.map((image, index) => (
                  <div key={image.id} id={itemId(index)} className={itemClass(index)}>
                    {photoButton(image, index, undefined, "aspect-[4/5] object-cover")}
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div className={cn(masonryColumns[layout.columns], gap)}>
              {photos.map((image, index) => (
                <div
                  key={image.id}
                  id={itemId(index)}
                  className={cn(masonryMargin[layout.gap], "break-inside-avoid", itemClass(index))}
                >
                  {photoButton(image, index)}
                </div>
              ))}
            </div>
          );
        }}
      </MobileMore>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fx-dialog m-auto max-h-[100dvh] max-w-[100vw] bg-transparent p-0 backdrop:bg-night/85"
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setActive(null);
        }}
      >
        {current ? (
          <div className="fx-lightbox-in relative flex max-h-[100dvh] max-w-[100vw] items-center justify-center p-3 md:p-8">
            <p id={titleId} className="sr-only">
              {current.alt[locale]}
            </p>
            <Image
              src={current.src}
              alt={current.alt[locale]}
              width={current.width}
              height={current.height}
              className="max-h-[82dvh] w-auto max-w-[92vw] rounded-xl object-contain"
              sizes="92vw"
              priority
            />
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-sand px-4 py-2 text-sm text-ink transition duration-300 hover:scale-105 hover:bg-white"
              onClick={() => setActive(null)}
            >
              {labels.close}
            </button>
            <button
              type="button"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-sand px-3 py-2 text-sm transition duration-300 hover:scale-105 hover:bg-white"
              onClick={() =>
                setActive((index) =>
                  index == null ? index : (index - 1 + photos.length) % photos.length,
                )
              }
            >
              {labels.previous}
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-sand px-3 py-2 text-sm transition duration-300 hover:scale-105 hover:bg-white"
              onClick={() =>
                setActive((index) => (index == null ? index : (index + 1) % photos.length))
              }
            >
              {labels.next}
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
