"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  imageFrameMobileStyle,
  imagePhoneHiddenClass,
  imageResponsiveStyle,
} from "@/lib/proposal-mobile";
import {
  lightboxIndexForGrid,
  proofLightboxItems,
  visibleProofLightboxItems,
  wrapLightboxIndex,
  type ProofLightboxItem,
} from "@/lib/proposal-proof-lightbox";
import { imageSrc, type ProposalImage } from "@/lib/proposals";

const PHONE_MQ = "(max-width: 767px)";

function photoSlotLabel(alt: string) {
  const trimmed = alt.trim();
  if (!trimmed || /EXAMPLE PHOTOS|Agota to supply/i.test(trimmed)) return "Your photo here";
  return trimmed;
}

function useIsPhoneViewport() {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(PHONE_MQ);
    const sync = () => setIsPhone(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return isPhone;
}

function preloadNeighbors(items: ProofLightboxItem[], index: number) {
  if (typeof window === "undefined" || items.length < 2) return;
  const prev = items[wrapLightboxIndex(index - 1, items.length)];
  const next = items[wrapLightboxIndex(index + 1, items.length)];
  for (const item of [prev, next]) {
    if (!item) continue;
    const img = new window.Image();
    img.src = item.src;
  }
}

export function ProposalProofGrid({
  images,
  lightbox = true,
}: {
  images: ProposalImage[];
  /** Proof section opens a full-size lightbox. Other grids can opt out. */
  lightbox?: boolean;
}) {
  const cells = images.length ? [...images] : [{ alt: "Your photo here" }];
  if (cells.every((image) => !imageSrc(image)) && cells.length < 4) {
    while (cells.length < 4) cells.push({ alt: "Your photo here" });
  }

  const allItems = proofLightboxItems(cells);
  const isPhone = useIsPhoneViewport();
  const visible = visibleProofLightboxItems(allItems, isPhone);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef(new Map<number, HTMLButtonElement>());
  const lastTriggerGrid = useRef<number | null>(null);
  const titleId = useId();

  const openAtGrid = useCallback(
    (gridIndex: number) => {
      const index = lightboxIndexForGrid(allItems, gridIndex, isPhone);
      if (index < 0) return;
      lastTriggerGrid.current = gridIndex;
      setOpenIndex(index);
    },
    [allItems, isPhone],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  return (
    <>
      <div className="proposal-proof-grid">
        {cells.map((image, index) => {
          const src = imageSrc(image);
          const phoneHidden = imagePhoneHiddenClass(image);
          if (!src) {
            return (
              <div
                key={`ph-${index}`}
                className={`proposal-ph proposal-proof-cell ${phoneHidden}`.trim()}
              >
                <span>{photoSlotLabel(image.alt)}</span>
              </div>
            );
          }
          const imageNode = (
            <Image
              src={src}
              alt={image.alt || ""}
              fill
              className="object-cover proposal-cropped"
              style={imageResponsiveStyle(image)}
              sizes="(max-width: 767px) 100vw, 90mm"
              unoptimized={src.startsWith("/api/media/")}
            />
          );
          return (
            <figure
              key={`${src}-${index}`}
              className={`proposal-proof-cell has-photo ${phoneHidden}`.trim()}
              style={imageFrameMobileStyle(image)}
            >
              {lightbox ? (
                <button
                  type="button"
                  className="proposal-proof-open"
                  aria-label={image.alt?.trim() || "Open photo full size"}
                  ref={(node) => {
                    if (node) triggerRefs.current.set(index, node);
                    else triggerRefs.current.delete(index);
                  }}
                  onClick={() => openAtGrid(index)}
                >
                  {imageNode}
                </button>
              ) : (
                imageNode
              )}
            </figure>
          );
        })}
      </div>
      {lightbox && openIndex != null && visible[openIndex] ? (
        <ProofLightbox
          items={visible}
          index={openIndex}
          titleId={titleId}
          onIndexChange={setOpenIndex}
          onClose={close}
          onClosed={() => {
            const grid = lastTriggerGrid.current;
            if (grid == null) return;
            // preventScroll keeps the restored page offset after body unlock.
            triggerRefs.current.get(grid)?.focus({ preventScroll: true });
          }}
        />
      ) : null}
    </>
  );
}

function ProofLightbox({
  items,
  index,
  titleId,
  onIndexChange,
  onClose,
  onClosed,
}: {
  items: ProofLightboxItem[];
  index: number;
  titleId: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const current = items[index]!;
  const total = items.length;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const indexRef = useRef(index);
  const totalRef = useRef(total);
  indexRef.current = index;
  totalRef.current = total;

  useEffect(() => {
    preloadNeighbors(items, index);
  }, [items, index]);

  useEffect(() => {
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const length = totalRef.current;
      if (length < 2) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange(wrapLightboxIndex(indexRef.current - 1, length));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange(wrapLightboxIndex(indexRef.current + 1, length));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      const previousScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      html.style.scrollBehavior = previousScrollBehavior;
      onClosed();
    };
  }, [onClose, onClosed, onIndexChange]);

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onTouchStart(event: ReactTouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || total < 2) return;
    const end = event.changedTouches[0]?.clientX;
    if (end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) onIndexChange(wrapLightboxIndex(index - 1, total));
    else onIndexChange(wrapLightboxIndex(index + 1, total));
  }

  if (!mounted) return null;

  const style = {
    ["--proof-lightbox-z" as string]: "80",
  } as CSSProperties;

  return createPortal(
    <div
      ref={dialogRef}
      className="proposal-proof-lightbox"
      style={style}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onDialogKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="proposal-proof-lightbox-backdrop"
        aria-label="Close photo"
        onClick={onClose}
      />
      <p id={titleId} className="sr-only">
        {current.alt}
      </p>
      <button
        ref={closeRef}
        type="button"
        className="proposal-proof-lightbox-close"
        aria-label="Close"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      {total > 1 ? (
        <>
          <button
            type="button"
            className="proposal-proof-lightbox-nav is-prev"
            aria-label="Previous photo"
            onClick={() => onIndexChange(wrapLightboxIndex(index - 1, total))}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="proposal-proof-lightbox-nav is-next"
            aria-label="Next photo"
            onClick={() => onIndexChange(wrapLightboxIndex(index + 1, total))}
          >
            <span aria-hidden="true">›</span>
          </button>
        </>
      ) : null}
      <div className="proposal-proof-lightbox-stage">
        {/* Plain img so the original file shows uncropped at natural size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className="proposal-proof-lightbox-image"
          draggable={false}
        />
      </div>
      {total > 1 ? (
        <p className="proposal-proof-lightbox-counter" aria-live="polite">
          {index + 1} / {total}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
