"use client";

import { useState } from "react";

export function CopyAcceptanceLink({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 grid gap-2">
      <input readOnly value={url} className="w-full rounded-2xl border border-ink/10 bg-sand/40 px-3 py-2 text-sm" />
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-terracotta px-4 text-sm font-medium text-white"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
