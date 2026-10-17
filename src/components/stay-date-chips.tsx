"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

const VISIBLE = 3;

type Chip = {
  key: string;
  place: string;
  from: string;
  to: string;
  when: string;
  prefix: string;
};

function groupsOf(chips: Chip[]) {
  const groups: Chip[][] = [];
  for (const chip of chips) {
    const last = groups[groups.length - 1];
    if (last && last[0].when === chip.when) last.push(chip);
    else groups.push([chip]);
  }
  return groups;
}

function labelFor(group: Chip[]) {
  const places = group.map((chip) => chip.place).join(", ");
  return `${group[0].prefix}: ${places}, ${group[0].when}`;
}

export function StayDateChips({
  chips,
  chipClass,
  moreClass,
  more,
  less,
}: {
  chips: Chip[];
  chipClass: string;
  moreClass: string;
  more: string;
  less: string;
}) {
  const [open, setOpen] = useState(false);
  const groups = groupsOf(chips);
  const shown = open ? groups : groups.slice(0, VISIBLE);
  const canToggle = groups.length > VISIBLE;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((group) => (
        <Link
          key={group.map((chip) => chip.key).join("-")}
          href={{
            pathname: "/inquire",
            query: {
              place: group.map((chip) => chip.place).join(", "),
              from: group[0].from,
              to: group[0].to,
            },
            hash: "form",
          }}
          className={`${chipClass} max-w-full`}
        >
          {labelFor(group)}
        </Link>
      ))}
      {canToggle ? (
        <button type="button" className={moreClass} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
