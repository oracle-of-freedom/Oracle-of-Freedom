import assert from "node:assert/strict";
import test from "node:test";
import { builtinTemplates } from "./proposal-defaults";
import { applyNorteNosaraContentFix } from "./proposal-migrate";
import {
  NORTE_AWAKE_REVISION,
  NORTE_NOSARA_EXAMPLE_ID,
  NORTE_NOSARA_TEMPLATE_ID,
  NORTE_PLAN_SCENES,
  NORTE_TERMS,
  norteNosaraExample,
} from "./proposal-norte-nosara";
import { findSection, parseProposal, type Proposal } from "./proposals";

function oldNorte(): Proposal {
  const proposal = norteNosaraExample(new Date("2026-11-22T12:00:00.000Z"));
  proposal.contentRevision = undefined;
  proposal.templateId = "tmpl_retreat_hotel";
  proposal.templateKind = "retreat";
  proposal.viewCount = 14;
  proposal.lastOpenedAt = "2026-11-23T10:00:00.000Z";
  proposal.validUntil = "2026-12-20";
  proposal.status = "live";
  proposal.previewToken = "norte-example-preview";
  proposal.slug = "norte-nosara-example";
  const cover = findSection(proposal.sections, "cover");
  if (cover) {
    cover.data.kicker = "Prepared for Norte Nosara";
    cover.data.headline = "Video Proposal for Norte Nosara";
    cover.data.headlineEmphasis = "Norte Nosara";
    cover.data.proposalDate = "2026-11-22";
    cover.data.heroImage = null;
  }
  proposal.sections.splice(3, 0, {
    id: "norte_divider",
    type: "divider",
    enabled: true,
    data: { line: "A divider that should not print", image: null },
  });
  const plan = findSection(proposal.sections, "plan");
  if (plan) {
    plan.images = [{ alt: "[EXAMPLE PHOTOS: plan photo placeholder]" }];
    plan.data.scenes = [
      { id: "norte_scene_1", title: "The shala during practice", body: "extra", showBody: true },
      { id: "dup", title: "The shala during practice", body: "dup", showBody: true },
    ];
    plan.data.consent = "Before filming, I agree with the guests and the retreat leader what can be filmed, so everyone feels comfortable.";
  }
  const addon = findSection(proposal.sections, "addon");
  if (addon) {
    addon.headingEmphasis = "xl";
    addon.data.bullets = undefined;
    addon.data.priceLines = [{ id: "norte_price_1", label: "1 reel", price: "US$110" }];
  }
  const investment = findSection(proposal.sections, "investment");
  if (investment) {
    investment.data.sideNote = "My retreat packages usually include accommodation and meals during the shoot days.";
    investment.data.offerNote = "Meals stay in the panel.";
    investment.data.keyTerms = "Balance due on delivery.";
  }
  const review = proposal.sections.findIndex((s) => s.type === "review");
  const terms = proposal.sections.findIndex((s) => s.type === "terms");
  if (review >= 0 && terms >= 0 && review < terms) {
    const [item] = proposal.sections.splice(review, 1);
    proposal.sections.splice(terms, 0, item!);
  }
  return proposal;
}

test("fresh Norte seed is already at the Awake revision and is not rewritten", () => {
  const seed = norteNosaraExample();
  const first = applyNorteNosaraContentFix(seed);
  assert.equal(first.changed, false);
  assert.equal(first.proposal.sections.filter((s) => s.type === "plan")[0]?.data && findSection(first.proposal.sections, "plan")?.data.scenes.length, NORTE_PLAN_SCENES.length);
  const raw = JSON.stringify(seed);
  assert.equal(raw.includes("—"), false);
  assert.equal(raw.includes("–"), false);
});

test("live Norte record is patched once and a second read does not duplicate content", () => {
  const original = oldNorte();
  const first = applyNorteNosaraContentFix(original);
  assert.equal(first.changed, true);
  const norte = first.proposal;
  assert.equal(norte.viewCount, 14);
  assert.equal(norte.lastOpenedAt, "2026-11-23T10:00:00.000Z");
  assert.equal(norte.slug, "norte-nosara-example");
  assert.equal(norte.previewToken, "norte-example-preview");
  assert.equal(norte.status, "live");
  assert.equal(norte.validUntil, "2026-12-20");
  assert.equal(norte.id, NORTE_NOSARA_EXAMPLE_ID);
  assert.equal(norte.templateId, NORTE_NOSARA_TEMPLATE_ID);
  assert.equal(norte.contentRevision, NORTE_AWAKE_REVISION);
  assert.equal(findSection(norte.sections, "cover")?.data.kicker, "");
  assert.equal(findSection(norte.sections, "cover")?.data.proposalDate, "2026-11-24");

  const plan = findSection(norte.sections, "plan");
  assert.deepEqual(plan?.data.scenes.map((s) => s.title), [...NORTE_PLAN_SCENES]);
  assert.equal(new Set(plan?.data.scenes.map((s) => s.id)).size, NORTE_PLAN_SCENES.length);
  assert.equal(plan?.images, undefined);
  assert.equal(plan?.data.scenes.every((s) => s.showBody === false && s.body === ""), true);

  const addon = findSection(norte.sections, "addon");
  assert.equal(addon?.headingEmphasis, undefined);
  assert.equal(addon?.data.bullets?.length, 2);
  assert.equal(addon?.data.priceLines?.length, 2);

  const investment = findSection(norte.sections, "investment");
  assert.equal(investment?.data.sideNote, undefined);
  assert.equal(investment?.data.offerNote, "");
  assert.equal(investment?.data.keyTerms, undefined);
  assert.equal(investment?.data.packagePriceUsd, 1100);

  assert.deepEqual(findSection(norte.sections, "terms")?.data.items, [...NORTE_TERMS]);
  const enabled = norte.sections.filter((s) => s.enabled).map((s) => s.type);
  assert.deepEqual(enabled, [
    "cover",
    "welcome",
    "noticed",
    "plan",
    "proof",
    "deliverables",
    "addon",
    "review",
    "investment",
    "terms",
    "nextStep",
    "signOff",
  ]);
  assert.equal(enabled.includes("howIWork"), false);
  assert.equal(enabled.includes("divider"), false);
  assert.equal(enabled.includes("photos"), false);

  const second = applyNorteNosaraContentFix(norte);
  assert.equal(second.changed, false);
  assert.equal(findSection(second.proposal.sections, "plan")?.data.scenes.length, NORTE_PLAN_SCENES.length);
  assert.equal(findSection(second.proposal.sections, "terms")?.data.items.length, NORTE_TERMS.length);
});

test("other proposals are left untouched", () => {
  const other = norteNosaraExample();
  other.id = "prop_awake_real";
  other.slug = "awake-retreat";
  other.example = undefined;
  other.contentRevision = undefined;
  const result = applyNorteNosaraContentFix(other);
  assert.equal(result.changed, false);
  assert.equal(result.proposal, other);
});

test("design and bullets survive a save round trip", () => {
  const parsed = parseProposal(JSON.parse(JSON.stringify(norteNosaraExample())));
  assert.ok(parsed);
  assert.equal(parsed.design?.planColumns, ".79fr 1.21fr");
  assert.equal(parsed.design?.cover?.heroHeight, "70mm");
  assert.equal(parsed.contentRevision, NORTE_AWAKE_REVISION);
  assert.equal(findSection(parsed.sections, "addon")?.data.bullets?.length, 2);
  assert.equal(parsed.viewCount, 0);
});

test("Awake style is a builtin template and is not capped", () => {
  const templates = builtinTemplates(new Date("2026-11-24T12:00:00.000Z"));
  const awake = templates.find((t) => t.id === NORTE_NOSARA_TEMPLATE_ID);
  assert.ok(awake);
  assert.equal(awake.name, "Awake style");
  assert.equal(awake.builtin, true);
  assert.equal(awake.design?.planColumns, ".79fr 1.21fr");
  const enabled = awake.sections.filter((s) => s.enabled);
  assert.ok(enabled.length > 10);
  assert.equal(enabled.some((s) => s.type === "howIWork"), false);
  assert.equal(enabled.some((s) => s.type === "divider"), false);
  const raw = JSON.stringify(awake.sections);
  assert.equal(raw.includes("—"), false);
  assert.equal(raw.includes("–"), false);
});
