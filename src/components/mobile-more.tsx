"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Disclosure for extra items that stay in the caller's own layout.
 * `mobile` hides them only below md. `any` hides them at every width when
 * the list is longer than `visible`. Pass `desktopVisible` to fold phones
 * after `visible` and larger screens after that second count. The button is
 * omitted when there is nothing further to show.
 */
export function MobileMore({
  enabled,
  total,
  visible,
  desktopVisible,
  more,
  less,
  tone = "light",
  scope = "mobile",
  children,
}: {
  enabled: boolean;
  total: number;
  visible: number;
  /** When set, fold larger screens after this many items (e.g. two rows). */
  desktopVisible?: number;
  more: string;
  less: string;
  tone?: "light" | "night";
  /** mobile: phones only. any: every viewport, once the list passes `visible`. Ignored when `desktopVisible` is set. */
  scope?: "mobile" | "any";
  children: (api: {
    hide: (index: number) => boolean;
    hiddenClass: string;
    /** Prefer this when mobile and desktop thresholds differ. */
    itemClass: (index: number) => string;
    itemId: (index: number) => string | undefined;
  }) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const prefix = useId().replace(/:/g, "");
  const responsive = desktopVisible != null && desktopVisible > 0;
  const foldingMobile = enabled && visible > 0 && total > visible;
  const foldingDesktop = enabled && responsive && total > desktopVisible;
  const folding = foldingMobile || foldingDesktop;
  const hiddenClass = scope === "mobile" ? "max-md:hidden" : "hidden";
  const threshold = responsive
    ? Math.min(visible > 0 ? visible : total, desktopVisible)
    : visible;
  const hide = (index: number) => folding && !expanded && index >= threshold;
  const itemClass = (index: number) => {
    if (!folding || expanded) return "";
    if (!responsive) return hide(index) ? hiddenClass : "";
    return cn(
      foldingMobile && index >= visible && "max-md:hidden",
      foldingDesktop && index >= desktopVisible && "md:hidden",
    );
  };
  const itemId = (index: number) => (hide(index) ? `${prefix}-more-${index}` : undefined);
  const controls = folding
    ? Array.from({ length: Math.max(0, total - threshold) }, (_, offset) => `${prefix}-more-${threshold + offset}`).join(
        " ",
      )
    : undefined;
  const buttonClass = cn(
    "mt-6 w-full",
    !responsive && scope === "mobile" && "md:hidden",
    responsive && foldingMobile && !foldingDesktop && "md:hidden",
    responsive && !foldingMobile && foldingDesktop && "max-md:hidden",
  );

  return (
    <>
      {children({ hide, hiddenClass, itemClass, itemId })}
      {folding ? (
        <Button
          type="button"
          variant={tone === "night" ? "ghost" : "outline"}
          className={buttonClass}
          aria-expanded={expanded}
          aria-controls={controls}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? less : more}
        </Button>
      ) : null}
    </>
  );
}
