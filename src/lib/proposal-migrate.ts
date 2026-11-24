import {
  NORTE_AWAKE_REVISION,
  NORTE_NOSARA_EXAMPLE_ID,
  norteNosaraExample,
} from "./proposal-norte-nosara";
import type { Proposal } from "./proposals";
import { ensureSignOffSection } from "./proposals";

function isNorteExample(proposal: Proposal) {
  return proposal.id === NORTE_NOSARA_EXAMPLE_ID || proposal.slug === "norte-nosara-example";
}

function deckSignature(proposal: Proposal) {
  return JSON.stringify({
    templateId: proposal.templateId,
    templateKind: proposal.templateKind,
    proposalDate: proposal.proposalDate,
    projectTitle: proposal.projectTitle,
    clientName: proposal.clientName,
    design: proposal.design ?? null,
    sections: proposal.sections,
  });
}

/**
 * Idempotent content fix for the live Norte Nosara example.
 * Preserves viewCount, lastOpenedAt, slug, previewToken, status, and validUntil.
 * Once contentRevision reaches NORTE_AWAKE_REVISION, later edits are left alone.
 */
export function applyNorteNosaraContentFix(proposal: Proposal): { proposal: Proposal; changed: boolean } {
  if (!isNorteExample(proposal)) return { proposal, changed: false };
  if ((proposal.contentRevision ?? 0) >= NORTE_AWAKE_REVISION) {
    return { proposal, changed: false };
  }

  const seed = norteNosaraExample();
  const already = deckSignature(proposal) === deckSignature(seed);
  if (already) {
    return {
      proposal: { ...proposal, contentRevision: NORTE_AWAKE_REVISION },
      changed: proposal.contentRevision !== NORTE_AWAKE_REVISION,
    };
  }

  return {
    proposal: {
      ...proposal,
      templateId: seed.templateId,
      templateKind: seed.templateKind,
      projectTitle: seed.projectTitle,
      proposalDate: seed.proposalDate,
      clientName: seed.clientName,
      design: structuredClone(seed.design),
      sections: structuredClone(seed.sections),
      contentRevision: NORTE_AWAKE_REVISION,
      id: proposal.id,
      slug: proposal.slug,
      previewToken: proposal.previewToken,
      status: proposal.status,
      validUntil: proposal.validUntil,
      viewCount: proposal.viewCount,
      lastOpenedAt: proposal.lastOpenedAt,
      createdAt: proposal.createdAt,
      example: proposal.example ?? true,
    },
    changed: true,
  };
}

export function normalizeProposalSections(proposal: Proposal): Proposal {
  return { ...proposal, sections: ensureSignOffSection(proposal.sections) };
}
