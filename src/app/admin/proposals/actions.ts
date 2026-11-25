"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { emptyCustomTemplate } from "@/lib/proposal-defaults";
import {
  archiveIfExpired,
  createProposalFromTemplate,
  deleteProposal,
  deleteTemplate,
  deleteTemplates,
  duplicateProposal,
  duplicateTemplate,
  getProposal,
  getTemplate,
  reopenProposal,
  renameTemplate,
  saveProposal,
  saveTemplate,
  setProposalStatus,
  setTemplatesHidden,
  updateProposalSlug,
} from "@/lib/proposal-store";
import {
  TEMPLATE_EXPORT_MAX_BYTES,
  importTemplateFromJson,
} from "@/lib/proposal-template-io";
import {
  cloneSections,
  newId,
  parseProposal,
  parseTemplate,
  type Proposal,
  type ProposalStatus,
  type ProposalTemplate,
} from "@/lib/proposals";
import { storageMode } from "@/lib/store";

export type ActionState =
  | {
      ok: true;
      message?: string;
      id?: string;
      ids?: string[];
      name?: string;
      hidden?: boolean;
      slug?: string;
    }
  | { ok: false; error: string }
  | null;

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
  if (storageMode() === "readonly") {
    throw new Error("Connect Vercel Blob before saving proposals.");
  }
}

function revalidateProposals(id?: string) {
  revalidatePath("/admin/proposals");
  revalidatePath("/admin/proposals/templates");
  if (id) {
    revalidatePath(`/admin/proposals/${id}`);
    revalidatePath(`/admin/proposals/templates/${id}`);
  }
  revalidatePath("/p", "layout");
}

export async function createFromTemplateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const templateId = String(formData.get("templateId") || "");
    const clientName = String(formData.get("clientName") || "[Client name]").trim() || "[Client name]";
    if (!templateId) return { ok: false, error: "Choose a template." };
    const proposal = await createProposalFromTemplate(templateId, clientName);
    revalidateProposals(proposal.id);
    redirect(`/admin/proposals/${proposal.id}`);
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { ok: false, error: error instanceof Error ? error.message : "Could not create." };
  }
}

export async function saveProposalAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const raw = String(formData.get("proposalJson") || "");
    const parsed = parseProposal(JSON.parse(raw));
    if (!parsed) return { ok: false, error: "The proposal data is not valid." };
    const saved = await saveProposal(parsed);
    revalidateProposals(saved.id);
    revalidatePath(`/p/${saved.slug}`);
    return { ok: true, message: "Saved.", id: saved.id, slug: saved.slug };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
  }
}

/** Change only the public /p/… slug. Does not touch content or stats. */
export async function updateProposalSlugAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const id = String(formData.get("id") || "").trim();
    const slug = String(formData.get("slug") || "");
    if (!id) return { ok: false, error: "Proposal not found." };
    const result = await updateProposalSlug(id, slug);
    revalidateProposals(result.proposal.id);
    if (result.changed) {
      revalidatePath(`/p/${result.previousSlug}`);
      revalidatePath(`/p/${result.proposal.slug}`);
    } else {
      revalidatePath(`/p/${result.proposal.slug}`);
    }
    return {
      ok: true,
      message: result.changed ? "Link saved." : "Link unchanged.",
      id: result.proposal.id,
      slug: result.proposal.slug,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the link.",
    };
  }
}

export async function setStatusAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ProposalStatus;
  if (!id || !["draft", "live", "archived"].includes(status)) {
    throw new Error("Invalid status.");
  }
  const saved = await setProposalStatus(id, status);
  revalidateProposals(saved.id);
  revalidatePath(`/p/${saved.slug}`);
}

export async function reopenAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const validUntil = String(formData.get("validUntil") || "");
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) throw new Error("Pick a new valid-until date.");
  const saved = await reopenProposal(id, validUntil);
  revalidateProposals(saved.id);
  revalidatePath(`/p/${saved.slug}`);
}

export async function duplicateProposalAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const clientName = String(formData.get("clientName") || "New client").trim() || "New client";
  const copy = await duplicateProposal(id, clientName);
  revalidateProposals(copy.id);
  redirect(`/admin/proposals/${copy.id}`);
}

export async function saveProposalAsTemplateAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim() || "Saved template";
  const proposal = await getProposal(id);
  if (!proposal) throw new Error("Proposal not found.");
  const stamp = new Date().toISOString();
  const template: ProposalTemplate = {
    id: newId("tmpl"),
    name,
    kind: "custom",
    createdAt: stamp,
    updatedAt: stamp,
    ...(proposal.design ? { design: structuredClone(proposal.design) } : {}),
    sections: cloneSections(proposal.sections),
  };
  await saveTemplate(template);
  revalidateProposals(template.id);
  redirect(`/admin/proposals/templates/${template.id}`);
}

export async function deleteProposalAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const proposal = await getProposal(id);
  await deleteProposal(id);
  revalidateProposals(id);
  if (proposal) revalidatePath(`/p/${proposal.slug}`);
  redirect("/admin/proposals");
}

export async function createTemplateAction() {
  await guard();
  const template = emptyCustomTemplate();
  await saveTemplate(template);
  revalidateProposals(template.id);
  redirect(`/admin/proposals/templates/${template.id}`);
}

export async function importTemplateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "Choose a .oot.json template file." };
    }
    if (file.size <= 0) return { ok: false, error: "That file is empty." };
    if (file.size > TEMPLATE_EXPORT_MAX_BYTES) {
      return { ok: false, error: "Template files must be 1 MB or smaller." };
    }
    const text = await file.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, error: "That file is not valid JSON." };
    }
    const result = importTemplateFromJson(raw);
    if (!result.ok) return { ok: false, error: result.error };
    const saved = await saveTemplate(result.template);
    revalidateProposals(saved.id);
    return {
      ok: true,
      message: result.message,
      id: saved.id,
      name: saved.name,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not import template.",
    };
  }
}

export async function saveTemplateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const raw = String(formData.get("templateJson") || "");
    const parsed = parseTemplate(JSON.parse(raw));
    if (!parsed) return { ok: false, error: "The template data is not valid." };
    const saved = await saveTemplate(parsed);
    revalidateProposals(saved.id);
    return { ok: true, message: "Template saved.", id: saved.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
  }
}

export async function duplicateTemplateAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const copy = await duplicateTemplate(id);
  revalidateProposals(copy.id);
  redirect(`/admin/proposals/templates/${copy.id}`);
}

export async function deleteTemplateAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  await deleteTemplate(id);
  revalidateProposals(id);
  redirect("/admin/proposals/templates");
}

/** List/editor confirmation path that returns state instead of redirecting. */
export async function deleteTemplatesAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const ids = formData
      .getAll("ids")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const single = String(formData.get("id") || "").trim();
    if (single) ids.push(single);
    const unique = [...new Set(ids)];
    if (!unique.length) return { ok: false, error: "Choose a template to delete." };
    const deleted = await deleteTemplates(unique);
    for (const id of deleted) revalidateProposals(id);
    revalidatePath("/admin/proposals");
    revalidatePath("/admin/proposals/templates");
    return {
      ok: true,
      message: deleted.length === 1 ? "Template deleted." : "Templates deleted.",
      ids: deleted,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete.",
    };
  }
}

export async function renameTemplateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "");
    if (!id) return { ok: false, error: "Template not found." };
    const saved = await renameTemplate(id, name);
    revalidateProposals(saved.id);
    return { ok: true, message: "Renamed.", id: saved.id, name: saved.name };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not rename.",
    };
  }
}

export async function setTemplatesHiddenAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const ids = formData
      .getAll("ids")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const single = String(formData.get("id") || "").trim();
    if (single) ids.push(single);
    const unique = [...new Set(ids)];
    const hiddenRaw = String(formData.get("hidden") || "true");
    const hidden = hiddenRaw !== "false" && hiddenRaw !== "0";
    if (!unique.length) {
      return { ok: false, error: hidden ? "Choose a template to hide." : "Choose a template to unhide." };
    }
    const saved = await setTemplatesHidden(unique, hidden);
    for (const template of saved) revalidateProposals(template.id);
    revalidatePath("/admin/proposals");
    revalidatePath("/admin/proposals/templates");
    return {
      ok: true,
      message: hidden
        ? saved.length === 1
          ? "Starter hidden."
          : "Starters hidden."
        : saved.length === 1
          ? "Starter restored."
          : "Starters restored.",
      ids: saved.map((template) => template.id),
      hidden,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update templates.",
    };
  }
}

/** Duplicate without leaving the templates list (returns the new id). */
export async function duplicateTemplateListAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guard();
    const id = String(formData.get("id") || "").trim();
    if (!id) return { ok: false, error: "Template not found." };
    const copy = await duplicateTemplate(id);
    revalidateProposals(copy.id);
    return { ok: true, message: "Duplicated.", id: copy.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not duplicate.",
    };
  }
}

/** Used by the public page when a live offer ages out. */
export async function markExpiredIfNeeded(proposal: Proposal) {
  return archiveIfExpired(proposal);
}

export async function touchTemplateMeta(template: ProposalTemplate) {
  return saveTemplate(template);
}

export async function loadTemplateOrThrow(id: string) {
  const template = await getTemplate(id);
  if (!template) throw new Error("Template not found.");
  return template;
}
