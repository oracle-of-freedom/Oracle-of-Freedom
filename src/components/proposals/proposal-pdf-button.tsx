"use client";

import { Button } from "@/components/ui/button";

/** Opens the browser print dialog; A4 PDF comes from the print stylesheet. */
export function ProposalPdfButton({
  label = "Download PDF",
  className,
  variant = "outline",
}: {
  label?: string;
  className?: string;
  variant?: "outline" | "primary" | "light" | "ghost" | "moss";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className={`proposal-no-print ${className || ""}`}
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
