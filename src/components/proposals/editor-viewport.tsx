"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type EditorViewport = "desktop" | "phone";

type EditorViewportContextValue = {
  viewport: EditorViewport;
  setViewport: (viewport: EditorViewport) => void;
  isPhone: boolean;
};

const EditorViewportContext = createContext<EditorViewportContextValue>({
  viewport: "desktop",
  setViewport: () => undefined,
  isPhone: false,
});

export function EditorViewportProvider({
  children,
  initial = "desktop",
}: {
  children: ReactNode;
  initial?: EditorViewport;
}) {
  const [viewport, setViewport] = useState<EditorViewport>(initial);
  const value = useMemo(
    () => ({ viewport, setViewport, isPhone: viewport === "phone" }),
    [viewport],
  );
  return (
    <EditorViewportContext.Provider value={value}>{children}</EditorViewportContext.Provider>
  );
}

export function useEditorViewport() {
  return useContext(EditorViewportContext);
}

export function EditorViewportToggle({ className = "" }: { className?: string }) {
  const { viewport, setViewport } = useEditorViewport();
  return (
    <div className={`flex gap-2 ${className}`.trim()}>
      <button
        type="button"
        className={`rounded-full px-3 py-1 text-sm ${
          viewport === "desktop" ? "bg-ink text-sand" : "bg-sand text-ink"
        }`}
        onClick={() => setViewport("desktop")}
      >
        Desktop
      </button>
      <button
        type="button"
        className={`rounded-full px-3 py-1 text-sm ${
          viewport === "phone" ? "bg-ink text-sand" : "bg-sand text-ink"
        }`}
        onClick={() => setViewport("phone")}
      >
        Phone
      </button>
    </div>
  );
}

export function PhoneBadge({
  active,
  onReset,
}: {
  active: boolean;
  onReset?: () => void;
}) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[10px] tracking-[0.16em] text-ember uppercase">
        Phone
      </span>
      {onReset ? (
        <button
          type="button"
          className="text-xs text-terracotta underline-offset-4 hover:underline"
          onClick={onReset}
        >
          Reset to desktop
        </button>
      ) : null}
    </span>
  );
}
