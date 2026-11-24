"use client";

import Image from "next/image";
import { useRef } from "react";
import { PhoneBadge, useEditorViewport } from "@/components/proposals/editor-viewport";
import {
  IMAGE_CROP_NUDGE,
  IMAGE_CROP_ZOOM_MAX,
  IMAGE_CROP_ZOOM_MIN,
  applyImageCrop,
  clearImageCrop,
  hasImageCrop,
  resolveImageCrop,
  type ImageCrop,
} from "@/lib/proposal-image-crop";
import {
  applyMobileImageCrop,
  clearMobileImageCrop,
  hasMobileImageCrop,
  resolveMobileImageCrop,
} from "@/lib/proposal-mobile";
import { imageSrc, type ProposalImage } from "@/lib/proposals";

type FrameShape = "hero" | "proof" | "video" | "square" | "wide";

const FRAME_CLASS: Record<FrameShape, string> = {
  hero: "aspect-[16/7]",
  proof: "aspect-[4/5]",
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[4/3]",
};

function CropSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink/60">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-terracotta"
      />
    </label>
  );
}

export function ImageCropControl({
  image,
  onChange,
  frame = "wide",
  fallback,
}: {
  image: ProposalImage;
  onChange: (next: ProposalImage) => void;
  frame?: FrameShape;
  /** Used when the image has no stored crop (for example Awake cover right-centre). */
  fallback?: Partial<ImageCrop>;
}) {
  const { isPhone } = useEditorViewport();
  const src = imageSrc(image);
  const crop = isPhone
    ? resolveMobileImageCrop(image, fallback)
    : resolveImageCrop(image, fallback);
  const hasCrop = isPhone ? hasMobileImageCrop(image) : hasImageCrop(image);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    focusX: number;
    focusY: number;
  } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  if (!src) return null;

  function patch(partial: Partial<ImageCrop>) {
    onChange(
      isPhone ? applyMobileImageCrop(image, partial) : applyImageCrop(image, partial),
    );
  }

  function nudge(dx: number, dy: number) {
    patch({
      focusX: crop.focusX + dx,
      focusY: crop.focusY + dy,
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      focusX: crop.focusX,
      focusY: crop.focusY,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // Dragging the image right reveals the left side (lower focusX).
    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100 / crop.zoom;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100 / crop.zoom;
    patch({
      focusX: drag.focusX - deltaX,
      focusY: drag.focusY - deltaY,
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-sand/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.18em] text-ember uppercase">Crop</p>
        <PhoneBadge
          active={isPhone && hasCrop}
          onReset={
            isPhone && hasCrop
              ? () => onChange(clearMobileImageCrop(image))
              : undefined
          }
        />
      </div>
      <div
        ref={frameRef}
        className={`proposal-crop-preview relative w-full overflow-hidden rounded-2xl bg-night ${FRAME_CLASS[frame]} touch-none`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="presentation"
      >
        <Image
          src={src}
          alt=""
          fill
          draggable={false}
          unoptimized={src.startsWith("/api/media/") || src.includes("i.ytimg.com")}
          className="pointer-events-none select-none object-cover"
          style={{
            objectPosition: `${crop.focusX}% ${crop.focusY}%`,
            transform: `scale(${crop.zoom})`,
            transformOrigin: `${crop.focusX}% ${crop.focusY}%`,
          }}
          sizes="280px"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/70 to-transparent px-2 py-1.5 text-center text-[10px] tracking-wide text-sand">
          Drag to reposition
        </span>
      </div>

      <CropSlider
        label="Left / right"
        min={0}
        max={100}
        step={1}
        value={crop.focusX}
        onChange={(focusX) => patch({ focusX })}
      />
      <CropSlider
        label="Up / down"
        min={0}
        max={100}
        step={1}
        value={crop.focusY}
        onChange={(focusY) => patch({ focusY })}
      />
      <CropSlider
        label="Zoom"
        min={IMAGE_CROP_ZOOM_MIN}
        max={IMAGE_CROP_ZOOM_MAX}
        step={0.05}
        value={crop.zoom}
        onChange={(zoom) => patch({ zoom })}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-3 gap-1">
          <span />
          <button
            type="button"
            aria-label="Nudge up"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/80 text-ink hover:border-terracotta"
            onClick={() => nudge(0, -IMAGE_CROP_NUDGE)}
          >
            ↑
          </button>
          <span />
          <button
            type="button"
            aria-label="Nudge left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/80 text-ink hover:border-terracotta"
            onClick={() => nudge(-IMAGE_CROP_NUDGE, 0)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Nudge down"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/80 text-ink hover:border-terracotta"
            onClick={() => nudge(0, IMAGE_CROP_NUDGE)}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Nudge right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/80 text-ink hover:border-terracotta"
            onClick={() => nudge(IMAGE_CROP_NUDGE, 0)}
          >
            →
          </button>
        </div>
        <button
          type="button"
          className="ml-auto text-sm text-terracotta underline-offset-4 hover:underline disabled:opacity-40"
          disabled={!hasCrop}
          onClick={() =>
            onChange(isPhone ? clearMobileImageCrop(image) : clearImageCrop(image))
          }
        >
          Reset crop
        </button>
      </div>
    </div>
  );
}
