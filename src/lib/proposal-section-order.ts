import { phoneSectionOrder } from "@/lib/proposal-mobile";
import type { ProposalSection } from "@/lib/proposals";

/** Reorder the main (desktop) section list to match ordered ids. */
export function reorderSectionsByIds(
  sections: ProposalSection[],
  orderedIds: string[],
): ProposalSection[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const next: ProposalSection[] = [];
  for (const id of orderedIds) {
    const section = byId.get(id);
    if (section) {
      next.push(section);
      byId.delete(id);
    }
  }
  for (const section of sections) {
    if (byId.has(section.id)) next.push(section);
  }
  return next;
}

/** Write phone-only order from a full sequence of section ids. */
export function setPhoneSectionOrder(
  sections: ProposalSection[],
  orderedIds: string[],
): ProposalSection[] {
  const orderById = new Map(orderedIds.map((id, order) => [id, order]));
  // Append any missing ids in their current phone order.
  const missing = phoneSectionOrder(sections)
    .map((section) => section.id)
    .filter((id) => !orderById.has(id));
  missing.forEach((id, index) => orderById.set(id, orderedIds.length + index));

  return sections.map((section) => ({
    ...section,
    mobile: {
      ...(section.mobile || {}),
      order: orderById.get(section.id) ?? 0,
    },
  }));
}

export function insertSectionAt(
  sections: ProposalSection[],
  section: ProposalSection,
  index: number,
): ProposalSection[] {
  const next = [...sections];
  const at = Math.max(0, Math.min(index, next.length));
  next.splice(at, 0, section);
  return next;
}

export function duplicateSectionInList(
  sections: ProposalSection[],
  id: string,
  newId: string,
): { sections: ProposalSection[]; duplicatedId: string | null } {
  const index = sections.findIndex((section) => section.id === id);
  if (index < 0) return { sections, duplicatedId: null };
  const source = sections[index]!;
  const copy = structuredClone(source) as ProposalSection;
  copy.id = newId;
  const next = [...sections];
  next.splice(index + 1, 0, copy);
  return { sections: next, duplicatedId: newId };
}

export function removeSectionById(sections: ProposalSection[], id: string): ProposalSection[] {
  return sections.filter((section) => section.id !== id);
}
