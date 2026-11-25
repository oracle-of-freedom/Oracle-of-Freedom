import {
  TEMPLATE_FORMAT_VERSION,
  newId,
  parseTemplate,
  type ProposalTemplate,
  SECTION_TYPES,
} from "@/lib/proposals";

export const TEMPLATE_EXPORT_MAX_BYTES = 1_000_000;

export type TemplateImportResult =
  | {
      ok: true;
      template: ProposalTemplate;
      importedBlocks: number;
      skippedBlocks: number;
      skippedTypes: string[];
      message: string;
    }
  | { ok: false; error: string };

export type TemplateExportPayload = ProposalTemplate & {
  formatVersion: number;
  exportedAt: string;
};

export function buildTemplateExport(template: ProposalTemplate, now = new Date()): TemplateExportPayload {
  const clone = structuredClone(template);
  delete clone.builtin;
  delete clone.hidden;
  return {
    ...clone,
    formatVersion: TEMPLATE_FORMAT_VERSION,
    exportedAt: now.toISOString(),
  };
}

export function templateExportFilename(name: string) {
  const stem =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "template";
  return `${stem}.oot.json`;
}

/**
 * Parse an uploaded template JSON. Unknown section types are dropped.
 * Always assigns a fresh id so imports never overwrite an existing record.
 */
export function importTemplateFromJson(
  raw: unknown,
  options?: { now?: Date },
): TemplateImportResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "That file is not valid template JSON." };
  }
  const record = raw as Record<string, unknown>;
  const formatVersion = Number(record.formatVersion ?? 0);
  if (formatVersion && (!Number.isFinite(formatVersion) || formatVersion > TEMPLATE_FORMAT_VERSION)) {
    return {
      ok: false,
      error: `This file uses format version ${formatVersion}, which is newer than this site supports.`,
    };
  }

  const known = new Set<string>(SECTION_TYPES);
  const sectionsRaw = Array.isArray(record.sections) ? record.sections : [];
  const skippedTypes: string[] = [];
  let skippedBlocks = 0;
  const keptSections = sectionsRaw.filter((section) => {
    if (!section || typeof section !== "object") {
      skippedBlocks += 1;
      return false;
    }
    const type = String((section as { type?: unknown }).type || "");
    if (!known.has(type)) {
      skippedBlocks += 1;
      if (type) skippedTypes.push(type);
      return false;
    }
    return true;
  });

  const stamp = (options?.now || new Date()).toISOString();
  const candidate = {
    ...record,
    id: newId("tmpl"),
    name: typeof record.name === "string" && record.name.trim() ? record.name : "Imported template",
    kind: record.kind || "custom",
    createdAt: stamp,
    updatedAt: stamp,
    builtin: false,
    hidden: undefined,
    formatVersion: TEMPLATE_FORMAT_VERSION,
    sections: keptSections,
  };

  const parsed = parseTemplate(candidate);
  if (!parsed) {
    return { ok: false, error: "Could not read that template. Check the file and try again." };
  }

  // Count blocks from the file (before ensureSignOff may append a closing block).
  const importedBlocks = keptSections.length;
  const uniqueSkipped = [...new Set(skippedTypes)];
  const message =
    skippedBlocks > 0
      ? `Imported ${importedBlocks} blocks, skipped ${skippedBlocks} unknown block${skippedBlocks === 1 ? "" : "s"}${
          uniqueSkipped.length ? ` (${uniqueSkipped.join(", ")})` : ""
        }.`
      : `Imported ${importedBlocks} blocks.`;

  const template: ProposalTemplate = {
    ...parsed,
    formatVersion: TEMPLATE_FORMAT_VERSION,
  };
  delete template.builtin;
  delete template.hidden;

  return {
    ok: true,
    template,
    importedBlocks,
    skippedBlocks,
    skippedTypes: uniqueSkipped,
    message,
  };
}

export function templatesEqualAsideFromMeta(
  a: ProposalTemplate,
  b: ProposalTemplate,
): boolean {
  const strip = (template: ProposalTemplate) => {
    const { id: _id, createdAt: _c, updatedAt: _u, builtin: _b, hidden: _h, ...rest } = template;
    return rest;
  };
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
