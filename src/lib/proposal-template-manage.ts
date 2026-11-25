import type { Proposal, ProposalTemplate } from "@/lib/proposals";

export const LAST_VISIBLE_TEMPLATE_ERROR =
  "Keep at least one template visible so you can still create proposals.";

export function isTemplateVisible(template: ProposalTemplate) {
  return !template.hidden;
}

/** Templates shown in the list and the new-proposal picker. */
export function visibleTemplates(templates: ProposalTemplate[]) {
  return templates.filter(isTemplateVisible);
}

export function hiddenStarterTemplates(templates: ProposalTemplate[]) {
  return templates.filter((template) => Boolean(template.builtin) && Boolean(template.hidden));
}

function remainingVisibleAfter(
  templates: ProposalTemplate[],
  ids: Set<string>,
  mode: "delete" | "hide",
) {
  return templates.filter((template) => {
    if (!ids.has(template.id)) return isTemplateVisible(template);
    if (mode === "delete") return false;
    return false; // hide → not visible
  }).length;
}

function assertKeepsOneVisible(
  templates: ProposalTemplate[],
  ids: Set<string>,
  mode: "delete" | "hide",
) {
  if (remainingVisibleAfter(templates, ids, mode) < 1) {
    throw new Error(LAST_VISIBLE_TEMPLATE_ERROR);
  }
}

export function renameTemplateInList(
  templates: ProposalTemplate[],
  id: string,
  rawName: string,
  now = new Date().toISOString(),
): ProposalTemplate[] {
  const name = rawName.trim().slice(0, 160);
  if (!name) throw new Error("Enter a template name.");
  const index = templates.findIndex((template) => template.id === id);
  if (index < 0) throw new Error("Template not found.");
  const next = [...templates];
  next[index] = { ...next[index]!, name, updatedAt: now };
  return next;
}

/**
 * Soft-hide or unhide templates. Built-in starters are the intended target;
 * custom templates may also be hidden if needed.
 */
export function setTemplatesHiddenInList(
  templates: ProposalTemplate[],
  ids: string[],
  hidden: boolean,
  now = new Date().toISOString(),
): ProposalTemplate[] {
  const idSet = new Set(ids.filter(Boolean));
  if (!idSet.size) return templates;
  if (hidden) assertKeepsOneVisible(templates, idSet, "hide");

  let touched = false;
  const next = templates.map((template) => {
    if (!idSet.has(template.id)) return template;
    touched = true;
    if (hidden) {
      return { ...template, hidden: true, updatedAt: now };
    }
    const copy = { ...template, updatedAt: now };
    delete copy.hidden;
    return copy;
  });
  if (!touched) throw new Error("Template not found.");
  return next;
}

/**
 * Permanently remove custom templates. Built-ins cannot be deleted.
 * Does not mutate proposals — callers must leave the proposals array alone.
 */
export function deleteTemplatesInList(
  templates: ProposalTemplate[],
  ids: string[],
): { templates: ProposalTemplate[]; deletedIds: string[] } {
  const idSet = new Set(ids.filter(Boolean));
  if (!idSet.size) return { templates, deletedIds: [] };

  for (const id of idSet) {
    const target = templates.find((template) => template.id === id);
    if (!target) throw new Error("Template not found.");
    if (target.builtin) {
      throw new Error("Built-in starters can’t be deleted. Hide them instead.");
    }
  }

  assertKeepsOneVisible(templates, idSet, "delete");
  return {
    templates: templates.filter((template) => !idSet.has(template.id)),
    deletedIds: [...idSet],
  };
}

/** Proposals are copies — deleting a template must leave them unchanged. */
export function proposalsUntouchedByTemplateDelete(
  before: Proposal[],
  after: Proposal[],
): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}
