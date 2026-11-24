import { NORTE_NOSARA_EXAMPLE_ID } from "./proposal-norte-nosara";
import type { Proposal, ProposalImage, ProposalSection } from "./proposals";
import { ensureSignOffSection, findSection, newId } from "./proposals";

const MIGRATED_PLAN_SCENES: { id: string; title: string }[] = [
  { id: "norte_scene_1", title: "The shala during practice" },
  { id: "norte_scene_2", title: "Surf coaching" },
  { id: "norte_scene_3", title: "The Jungle Bar, from morning bowls to evening cocktails" },
  { id: "norte_scene_4", title: "The rooms, the pool and the cozy corners" },
  { id: "norte_scene_5", title: "How a retreat day flows, from sunrise to evening" },
  { id: "norte_scene_6", title: "Lifestyle footage that shows how the property really feels" },
  { id: "norte_scene_7", title: "Drone footage of the property and how it sits in town" },
];

const ADDON_BODY =
  "I travel, so I can't commit to a monthly package, but I can edit remotely whenever you need more content.\n\nEach reel is cut from the clip library we build together or from footage your team films on a phone, depending on your idea or vision.\n\nCaptions or subtitles and music, formatted for Instagram and TikTok, with one round of changes.";

const INVESTMENT_SIDE_NOTE =
  "My retreat packages usually include accommodation and meals during the shoot days. I'd like to discuss that with you as part of this rate. Being on site from sunrise to evening means I'd live the guest experience, so I can catch the golden-hour light on the rooms, breakfast at the Jungle Bar and the quiet moments a day visit would miss. That gives you more content at no extra cost.";

function planHasExampleImage(images: ProposalImage[] | undefined) {
  return (images ?? []).some((img) => {
    const alt = img.alt.toLowerCase();
    return alt.includes("example photos") || alt.includes("plan photo");
  });
}

function isNorteContentMigrated(sections: ProposalSection[]): boolean {
  const deliverables = findSection(sections, "deliverables");
  if (deliverables?.data.outOfScopeLabel !== "Delivery and changes") return false;

  const addon = findSection(sections, "addon");
  if ((addon?.data.priceLines?.length ?? 0) !== 2) return false;
  if (addon?.headingEmphasis !== "xl") return false;

  const plan = findSection(sections, "plan");
  const scenes = plan?.data.scenes ?? [];
  if (scenes.length !== MIGRATED_PLAN_SCENES.length) return false;
  for (let i = 0; i < MIGRATED_PLAN_SCENES.length; i++) {
    const expected = MIGRATED_PLAN_SCENES[i]!;
    const scene = scenes[i];
    if (!scene || scene.title !== expected.title || scene.showBody !== false || scene.body !== "") return false;
  }

  const investment = findSection(sections, "investment");
  if (investment?.data.keyTerms !== "Balance due on delivery.") return false;
  if (investment?.data.sideNote !== INVESTMENT_SIDE_NOTE) return false;

  const last = sections[sections.length - 1];
  if (last?.type !== "signOff" || !last.enabled) return false;

  return true;
}

function moveSignOffToEnd(sections: ProposalSection[]): ProposalSection[] {
  const without = sections.filter((s) => s.type !== "signOff");
  const existing = sections.find((s) => s.type === "signOff");
  const signOff: ProposalSection = existing
    ? { ...existing, enabled: true }
    : { id: newId("sec"), type: "signOff", enabled: true, data: { intro: "" } };
  return [...without, signOff];
}

/** Idempotent content fix for the live Norte Nosara example. Preserves viewCount/slug/status/validUntil. */
export function applyNorteNosaraContentFix(proposal: Proposal): { proposal: Proposal; changed: boolean } {
  if (proposal.id !== NORTE_NOSARA_EXAMPLE_ID && proposal.slug !== "norte-nosara-example") {
    return { proposal, changed: false };
  }

  if (isNorteContentMigrated(proposal.sections)) {
    return { proposal, changed: false };
  }

  let sections = structuredClone(proposal.sections) as ProposalSection[];

  const deliverables = findSection(sections, "deliverables");
  if (deliverables) {
    deliverables.data = {
      ...deliverables.data,
      outOfScopeLabel: "Delivery and changes",
    };
  }

  const plan = findSection(sections, "plan");
  if (plan) {
    plan.data.scenes = MIGRATED_PLAN_SCENES.map((expected) => ({
      id: expected.id,
      title: expected.title,
      body: "",
      showBody: false,
    }));
    if (!planHasExampleImage(plan.images)) {
      const extra: ProposalImage = { alt: "[EXAMPLE PHOTOS: plan photo placeholder]" };
      plan.images = [...(plan.images ?? []), extra];
    }
  }

  const addon = findSection(sections, "addon");
  if (addon) {
    addon.headingEmphasis = "xl";
    addon.data = {
      ...addon.data,
      heading: "Later, if you need it",
      title: "Social media editing",
      body: ADDON_BODY,
      priceUsd: 0,
      note: "Booked only when needed",
      priceLines: [
        { id: "norte_price_1", label: "1 reel", price: "US$110" },
        { id: "norte_price_2", label: "3 reels", price: "US$285" },
      ],
    };
  }

  const investment = findSection(sections, "investment");
  if (investment) {
    investment.data = {
      ...investment.data,
      offerNote: "",
      keyTerms: "Balance due on delivery.",
      sideNote: INVESTMENT_SIDE_NOTE,
    };
  }

  sections = moveSignOffToEnd(sections);

  return {
    proposal: {
      ...proposal,
      sections,
    },
    changed: true,
  };
}

export function normalizeProposalSections(proposal: Proposal): Proposal {
  return { ...proposal, sections: ensureSignOffSection(proposal.sections) };
}