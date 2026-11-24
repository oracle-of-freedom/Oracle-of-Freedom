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
  duplicateProposal,
  duplicateTemplate,
  getProposal,
  getTemplate,
  reopenProposal,
  saveProposal,
  saveTemplate,
  setProposalStatus,
} from "@/lib/proposal-store";
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

export type ActionState = { ok: true; message?: string; id?: string } | { ok: false; error: string } | null;

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
    return { ok: true, message: "Saved.", id: saved.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
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
