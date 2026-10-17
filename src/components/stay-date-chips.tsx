"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

const VISIBLE = 3;

export function StayDateChips({
  chips,
  chipClass,
  moreClass,
  more,
  less,
}: {
  chips: { key: string; place: string; from: string; to: string; label: string }[];
  chipClass: string;
  moreClass: string;
  more: string;
  less: string;
}) {
  const [open, setOpen] = useState(false);
  const folded = chips.length > VISIBLE;
  const shown = folded && !open ? chips.slice(0, VISIBLE) : chips;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((chip) => (
        <Link
          key={chip.key}
          href={{
            pathname: "/inquire",
            query: { place: chip.place, from: chip.from, to: chip.to },
            hash: "form",
          }}
          className={chipClass}
        >
          {chip.label}
        </Link>
      ))}
      {folded ? (
        <button type="button" className={moreClass} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
