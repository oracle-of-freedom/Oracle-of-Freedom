import { applyNorteNosaraContentFix, normalizeProposalSections } from "../src/lib/proposal-migrate";
import { NORTE_NOSARA_EXAMPLE_ID, norteNosaraExample } from "../src/lib/proposal-norte-nosara";
import { findSection } from "../src/lib/proposals";
import { readProposals, writeProposals } from "../src/lib/proposal-store";

async function main() {
  const list = await readProposals();
  console.log("count", list.length);
  console.log(
    "ids",
    list.map((p) => `${p.id}:${p.slug}:views=${p.viewCount}:status=${p.status}`),
  );

  let changedAny = false;
  let next = list.map((p) => {
    const normalized = normalizeProposalSections(p);
    const { proposal, changed } = applyNorteNosaraContentFix(normalized);
    if (changed || JSON.stringify(normalized.sections) !== JSON.stringify(p.sections)) {
      changedAny = true;
    }
    return proposal;
  });

  let norte = next.find((p) => p.id === NORTE_NOSARA_EXAMPLE_ID || p.slug === "norte-nosara-example");
  if (!norte) {
    console.log("Norte missing in store — writing fixed seed");
    norte = applyNorteNosaraContentFix(norteNosaraExample()).proposal;
    next = [norte, ...next];
    changedAny = true;
  }

  const d = findSection(norte.sections, "deliverables");
  const a = findSection(norte.sections, "addon");
  const inv = findSection(norte.sections, "investment");
  const plan = findSection(norte.sections, "plan");
  const cover = findSection(norte.sections, "cover");
  const terms = findSection(norte.sections, "terms");
  const enabled = norte.sections.filter((s) => s.enabled).map((s) => s.type);
  console.log("label", d?.data.outOfScopeLabel);
  console.log("priceLines", JSON.stringify(a?.data.priceLines));
  console.log("bullets", a?.data.bullets?.length);
  console.log("emphasis", a?.headingEmphasis);
  console.log("keyTerms", inv?.data.keyTerms);
  console.log("sideNote", inv?.data.sideNote || "");
  console.log("offerNote", inv?.data.offerNote);
  console.log("kicker", JSON.stringify(cover?.data.kicker));
  console.log("date", cover?.data.proposalDate);
  console.log("terms", terms?.data.items.length);
  console.log(
    "scenes",
    plan?.data.scenes.map((s) => `${s.title}|show=${s.showBody}|body=${s.body}`),
  );
  console.log("plan images", plan?.images?.length ?? 0);
  console.log("enabled", enabled.join(" > "));
  console.log("revision", norte.contentRevision);
  console.log("template", norte.templateId);
  console.log("last section", norte.sections.at(-1)?.type);
  console.log("preserved", {
    viewCount: norte.viewCount,
    lastOpenedAt: norte.lastOpenedAt,
    validUntil: norte.validUntil,
    status: norte.status,
    slug: norte.slug,
    previewToken: norte.previewToken,
  });

  if (changedAny) {
    await writeProposals(next);
    console.log("WROTE proposals to blob/local");
  } else {
    console.log("Already migrated — no write");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
