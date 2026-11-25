"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  confirmTone = "danger",
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  confirmTone?: "danger" | "default";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-night/50"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl bg-sand p-5 shadow-lg md:p-6"
      >
        <h2 id={titleId} className="font-serif text-2xl text-ink">
          {title}
        </h2>
        <p className="mt-3 text-sm text-ink/75 whitespace-pre-wrap">{body}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-full border border-ink/20 px-4 text-sm text-ink disabled:opacity-50"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <Button
            type="button"
            size="sm"
            className={
              confirmTone === "danger"
                ? "bg-terracotta text-white hover:bg-[#9a4522]"
                : undefined
            }
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
