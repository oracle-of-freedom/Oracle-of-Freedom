import { promises as fs } from "node:fs";
import path from "node:path";
import { builtinTemplates } from "@/lib/proposal-defaults";
import {
  addDaysIso,
  buildSlug,
  cloneSections,
  coverClientName,
  effectiveStatus,
  findSection,
  newId,
  newPreviewToken,
  parseProposal,
  parseTemplate,
  todayIsoDate,
  type Proposal,
  type ProposalStatus,
  type ProposalTemplate,
} from "@/lib/proposals";
import { storageMode } from "@/lib/store";

const TEMPLATES_BLOB = "site/proposal-templates.json";
const PROPOSALS_BLOB = "site/proposals.json";
const TEMPLATES_LOCAL = path.join(process.cwd(), "data", "proposal-templates.json");
const PROPOSALS_LOCAL = path.join(process.cwd(), "data", "proposals.json");

type TemplatesFile = { templates: ProposalTemplate[] };
type ProposalsFile = { proposals: Proposal[] };

async function readJsonBlob(blobPath: string): Promise<unknown | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(blobPath, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return JSON.parse(await new Response(result.stream).text());
}

async function writeJsonBlob(blobPath: string, value: unknown) {
  const { put } = await import("@vercel/blob");
  await put(blobPath, JSON.stringify(value, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function readJsonLocal(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJsonLocal(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function asTemplates(value: unknown): ProposalTemplate[] {
  const raw =
    value && typeof value === "object" && "templates" in value
      ? (value as TemplatesFile).templates
      : value;
  if (!Array.isArray(raw)) return [];
  return raw.map(parseTemplate).filter((t): t is ProposalTemplate => Boolean(t));
}

function asProposals(value: unknown): Proposal[] {
  const raw =
    value && typeof value === "object" && "proposals" in value
      ? (value as ProposalsFile).proposals
      : value;
  if (!Array.isArray(raw)) return [];
  return raw.map(parseProposal).filter((p): p is Proposal => Boolean(p));
}

function mergeBuiltins(saved: ProposalTemplate[]): ProposalTemplate[] {
  const builtins = builtinTemplates();
  const byId = new Map(saved.map((t) => [t.id, t]));
  const merged: ProposalTemplate[] = builtins.map((b) => {
    const existing = byId.get(b.id);
    // Keep Agota's edits to builtin templates; refresh only if missing.
    if (existing) return existing;
    return b;
  });
  for (const t of saved) {
    if (!merged.some((m) => m.id === t.id)) merged.push(t);
  }
  return merged;
}

export async function readTemplates(): Promise<ProposalTemplate[]> {
  const mode = storageMode();
  if (mode === "readonly") return builtinTemplates();
  const raw = mode === "blob" ? await readJsonBlob(TEMPLATES_BLOB) : await readJsonLocal(TEMPLATES_LOCAL);
  return mergeBuiltins(asTemplates(raw));
}

export async function writeTemplates(templates: ProposalTemplate[]) {
  const mode = storageMode();
  if (mode === "readonly") {
    throw new Error("Connect Vercel Blob before saving proposal templates.");
  }
  const payload: TemplatesFile = { templates };
  if (mode === "blob") await writeJsonBlob(TEMPLATES_BLOB, payload);
  else await writeJsonLocal(TEMPLATES_LOCAL, payload);
}

export async function readProposals(): Promise<Proposal[]> {
  const mode = storageMode();
  if (mode === "readonly") return [];
  const raw = mode === "blob" ? await readJsonBlob(PROPOSALS_BLOB) : await readJsonLocal(PROPOSALS_LOCAL);
  return asProposals(raw).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function writeProposals(proposals: Proposal[]) {
  const mode = storageMode();
  if (mode === "readonly") {
    throw new Error("Connect Vercel Blob before saving proposals.");
  }
  const payload: ProposalsFile = {
    proposals: proposals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  };
  if (mode === "blob") await writeJsonBlob(PROPOSALS_BLOB, payload);
  else await writeJsonLocal(PROPOSALS_LOCAL, payload);
}

export async function getTemplate(id: string) {
  return (await readTemplates()).find((t) => t.id === id) || null;
}

export async function getProposal(id: string) {
  return (await readProposals()).find((p) => p.id === id) || null;
}

export async function getProposalBySlug(slug: string) {
  return (await readProposals()).find((p) => p.slug === slug) || null;
}

export async function saveTemplate(template: ProposalTemplate) {
  const list = await readTemplates();
  const stamp = new Date().toISOString();
  const next = { ...template, updatedAt: stamp };
  const index = list.findIndex((t) => t.id === next.id);
  if (index >= 0) list[index] = next;
  else list.push({ ...next, createdAt: next.createdAt || stamp });
  await writeTemplates(list);
  return next;
}

export async function deleteTemplate(id: string) {
  const list = await readTemplates();
  const target = list.find((t) => t.id === id);
  if (!target) return false;
  if (target.builtin) throw new Error("Built-in templates cannot be deleted.");
  await writeTemplates(list.filter((t) => t.id !== id));
  return true;
}

export async function duplicateTemplate(id: string, name?: string) {
  const source = await getTemplate(id);
  if (!source) throw new Error("Template not found.");
  const stamp = new Date().toISOString();
  const copy: ProposalTemplate = {
    ...source,
    id: newId("tmpl"),
    name: name || `${source.name} copy`,
    kind: "custom",
    builtin: false,
    createdAt: stamp,
    updatedAt: stamp,
    sections: cloneSections(source.sections),
  };
  await saveTemplate(copy);
  return copy;
}

function uniqueSlug(clientName: string, existing: Proposal[]) {
  let slug = buildSlug(clientName);
  const taken = new Set(existing.map((p) => p.slug));
  let guard = 0;
  while (taken.has(slug) && guard < 8) {
    slug = buildSlug(clientName);
    guard += 1;
  }
  return slug;
}

export async function createProposalFromTemplate(templateId: string, clientName = "[Client name]") {
  const template = await getTemplate(templateId);
  if (!template) throw new Error("Template not found.");
  const list = await readProposals();
  const stamp = new Date().toISOString();
  const proposalDate = todayIsoDate();
  const sections = cloneSections(template.sections);
  const cover = findSection(sections, "cover");
  if (cover) {
    cover.data.clientName = clientName;
    cover.data.kicker = `Prepared for ${clientName}`;
    cover.data.proposalDate = proposalDate;
  }
  const investment = findSection(sections, "investment");
  if (investment) investment.data.clientLabel = `For ${clientName}`;

  const proposal: Proposal = {
    id: newId("prop"),
    slug: uniqueSlug(clientName === "[Client name]" ? "proposal" : clientName, list),
    previewToken: newPreviewToken(),
    templateId: template.id,
    templateKind: template.kind,
    clientName,
    projectTitle: cover?.data.headline || template.name,
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
    proposalDate,
    validUntil: addDaysIso(proposalDate, 30),
    sections,
  };
  list.unshift(proposal);
  await writeProposals(list);
  return proposal;
}

export async function saveProposal(proposal: Proposal) {
  const list = await readProposals();
  const stamp = new Date().toISOString();
  const coverName = coverClientName(proposal.sections) || proposal.clientName;
  const next: Proposal = {
    ...proposal,
    clientName: coverName,
    updatedAt: stamp,
  };
  const index = list.findIndex((p) => p.id === next.id);
  if (index >= 0) {
    // Keep slug stable unless empty.
    next.slug = list[index]!.slug || next.slug;
    list[index] = next;
  } else {
    list.unshift(next);
  }
  await writeProposals(list);
  return next;
}

export async function setProposalStatus(id: string, status: ProposalStatus) {
  const proposal = await getProposal(id);
  if (!proposal) throw new Error("Proposal not found.");
  proposal.status = status;
  return saveProposal(proposal);
}

export async function reopenProposal(id: string, validUntil: string) {
  const proposal = await getProposal(id);
  if (!proposal) throw new Error("Proposal not found.");
  proposal.validUntil = validUntil;
  proposal.status = "live";
  return saveProposal(proposal);
}

export async function duplicateProposal(id: string, clientName: string) {
  const source = await getProposal(id);
  if (!source) throw new Error("Proposal not found.");
  const list = await readProposals();
  const stamp = new Date().toISOString();
  const proposalDate = todayIsoDate();
  const sections = cloneSections(source.sections);
  const cover = findSection(sections, "cover");
  if (cover) {
    cover.data.clientName = clientName;
    cover.data.kicker = `Prepared for ${clientName}`;
    cover.data.proposalDate = proposalDate;
  }
  const investment = findSection(sections, "investment");
  if (investment) investment.data.clientLabel = `For ${clientName}`;

  const copy: Proposal = {
    ...source,
    id: newId("prop"),
    slug: uniqueSlug(clientName, list),
    previewToken: newPreviewToken(),
    clientName,
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
    proposalDate,
    validUntil: addDaysIso(proposalDate, 30),
    sections,
  };
  list.unshift(copy);
  await writeProposals(list);
  return copy;
}

export async function deleteProposal(id: string) {
  const list = await readProposals();
  if (!list.some((p) => p.id === id)) return false;
  await writeProposals(list.filter((p) => p.id !== id));
  return true;
}

/** When a live offer is past validUntil, mark it archived so it sits in Archive. */
export async function archiveIfExpired(proposal: Proposal) {
  if (effectiveStatus(proposal) !== "expired") return proposal;
  if (proposal.status === "archived") return proposal;
  proposal.status = "archived";
  return saveProposal(proposal);
}
