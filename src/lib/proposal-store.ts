import { promises as fs } from "node:fs";
import path from "node:path";
import { builtinTemplates } from "@/lib/proposal-defaults";
import {
  NORTE_NOSARA_EXAMPLE_ID,
  norteNosaraExample,
} from "@/lib/proposal-norte-nosara";
import { applyNorteNosaraContentFix, normalizeProposalSections } from "@/lib/proposal-migrate";
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

function mergeExamples(saved: Proposal[]): Proposal[] {
  const example = norteNosaraExample();
  const existing = saved.find((p) => p.id === NORTE_NOSARA_EXAMPLE_ID);
  if (!existing) return [example, ...saved];
  // Keep Agota's edits / view stats; refresh only if the seed was never saved.
  return saved;
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
  if (mode === "readonly") {
    return mergeExamples([]).map((p) => normalizeOnRead(p).proposal);
  }
  const raw = mode === "blob" ? await readJsonBlob(PROPOSALS_BLOB) : await readJsonLocal(PROPOSALS_LOCAL);
  const merged = mergeExamples(asProposals(raw));
  let persist = false;
  const list = merged.map((proposal) => {
    const { proposal: next, changed } = normalizeOnRead(proposal);
    if (changed) persist = true;
    return next;
  });
  if (persist) await persistProposals(list);
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function persistProposals(proposals: Proposal[]) {
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

export async function writeProposals(proposals: Proposal[]) {
  await persistProposals(proposals);
}

function proposalSectionsNeedPersistence(before: Proposal, after: Proposal) {
  if (before.sections.length !== after.sections.length) return true;
  return JSON.stringify(before.sections) !== JSON.stringify(after.sections);
}

function normalizeOnRead(proposal: Proposal): { proposal: Proposal; changed: boolean } {
  let next = normalizeProposalSections(proposal);
  let changed = proposalSectionsNeedPersistence(proposal, next);
  const fix = applyNorteNosaraContentFix(next);
  if (fix.changed) {
    next = fix.proposal;
    changed = true;
  }
  return { proposal: next, changed };
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
    ...(source.design ? { design: structuredClone(source.design) } : {}),
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
    const templateKicker = cover.data.kicker.trim();
    cover.data.clientName = clientName;
    cover.data.kicker = templateKicker ? `Prepared for ${clientName}` : "";
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
    projectTitle: cover?.data.headline.replace(/\s*\n\s*/g, " ") || template.name,
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
    proposalDate,
    validUntil: addDaysIso(proposalDate, 30),
    viewCount: 0,
    lastOpenedAt: "",
    ...(template.design ? { design: structuredClone(template.design) } : {}),
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
    viewCount: proposal.viewCount || 0,
    lastOpenedAt: proposal.lastOpenedAt || "",
  };
  const index = list.findIndex((p) => p.id === next.id);
  if (index >= 0) {
    const existing = list[index]!;
    // Keep slug and open stats stable across editor saves.
    next.slug = existing.slug || next.slug;
    next.viewCount = existing.viewCount || 0;
    next.lastOpenedAt = existing.lastOpenedAt || "";
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
    const hadKicker = Boolean(cover.data.kicker.trim());
    cover.data.clientName = clientName;
    cover.data.kicker = hadKicker ? `Prepared for ${clientName}` : "";
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
    viewCount: 0,
    lastOpenedAt: "",
    example: undefined,
    contentRevision: undefined,
    ...(source.design ? { design: structuredClone(source.design) } : {}),
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

/**
 * Count a public open of a live proposal. Skips drafts, expired, archived,
 * and callers that already decided this hit should not count (admin / preview).
 */
export async function recordProposalView(slug: string) {
  const list = await readProposals();
  const index = list.findIndex((p) => p.slug === slug);
  if (index < 0) return null;
  const proposal = list[index]!;
  if (effectiveStatus(proposal) !== "live") return proposal;
  const next: Proposal = {
    ...proposal,
    viewCount: (proposal.viewCount || 0) + 1,
    lastOpenedAt: new Date().toISOString(),
  };
  list[index] = next;
  await writeProposals(list);
  return next;
}
