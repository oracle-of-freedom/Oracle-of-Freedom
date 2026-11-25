import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanProposalSlug,
  collectedProposalSlugs,
  findProposalForSlug,
  isReservedProposalSlug,
  isValidProposalSlug,
  parseProposal,
  previousSlugRedirectPath,
  suggestProposalSlug,
  type Proposal,
} from "./proposals";

function stubProposal(overrides: Partial<Proposal> & Pick<Proposal, "id" | "slug">): Proposal {
  return {
    previewToken: "tok",
    templateId: "tmpl",
    templateKind: "custom",
    clientName: "Client",
    projectTitle: "Title",
    status: "draft",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    proposalDate: "2026-01-01",
    validUntil: "2026-02-01",
    viewCount: 0,
    lastOpenedAt: "",
    sections: [],
    ...overrides,
  };
}

test("cleanProposalSlug lowercases, hyphenates spaces, strips accents and junk", () => {
  assert.equal(cleanProposalSlug("Norte Nosara"), "norte-nosara");
  assert.equal(cleanProposalSlug("  Café  Déjà  "), "cafe-deja");
  assert.equal(cleanProposalSlug("Hello_World!!"), "helloworld");
  assert.equal(cleanProposalSlug("a---b--c-"), "a-b-c");
  assert.equal(cleanProposalSlug("Álvaro & Co."), "alvaro-co");
});

test("isValidProposalSlug enforces length, cleaning, and reserved words", () => {
  assert.equal(isValidProposalSlug("norte-nosara"), true);
  assert.equal(isValidProposalSlug("ab"), false);
  assert.equal(isValidProposalSlug("a".repeat(61)), false);
  assert.equal(isValidProposalSlug("Norte"), false);
  assert.equal(isValidProposalSlug("bad_slug"), false);
  assert.equal(isValidProposalSlug("admin"), false);
  assert.equal(isValidProposalSlug("api"), false);
  assert.equal(isValidProposalSlug("new"), false);
  assert.equal(isValidProposalSlug("edit"), false);
  assert.ok(isReservedProposalSlug("admin"));
  assert.ok(!isReservedProposalSlug("norte-nosara"));
});

test("suggestProposalSlug builds a clean stem without random codes or example", () => {
  assert.equal(suggestProposalSlug("Norte Nosara", []), "norte-nosara");
  assert.equal(suggestProposalSlug("Norte Nosara Example", []), "norte-nosara");
  assert.equal(suggestProposalSlug("Norte Nosara", ["norte-nosara"]), "norte-nosara-2");
  assert.equal(
    suggestProposalSlug("Norte Nosara", ["norte-nosara", "norte-nosara-2"]),
    "norte-nosara-3",
  );
  const suggested = suggestProposalSlug("Client", []);
  assert.equal(suggested, "client");
  assert.ok(!/[a-z0-9]{7}$/.test(suggested) || suggested === "client");
});

test("uniqueness treats other proposals' current and previous slugs as taken", () => {
  const proposals = [
    stubProposal({ id: "a", slug: "alpha", previousSlugs: ["old-alpha"] }),
    stubProposal({ id: "b", slug: "beta", previousSlugs: ["legacy-beta"] }),
  ];
  const takenForB = collectedProposalSlugs(proposals, "b");
  assert.ok(takenForB.has("alpha"));
  assert.ok(takenForB.has("old-alpha"));
  assert.ok(!takenForB.has("beta"));
  assert.ok(!takenForB.has("legacy-beta"));

  const takenAll = collectedProposalSlugs(proposals);
  assert.ok(takenAll.has("beta"));
  assert.ok(takenAll.has("legacy-beta"));
});

test("old slug resolves as previous and redirect keeps the preview query", () => {
  const proposal = stubProposal({
    id: "a",
    slug: "norte-nosara",
    previousSlugs: ["norte-nosara-example"],
  });
  const match = findProposalForSlug([proposal], "norte-nosara-example");
  assert.ok(match);
  assert.equal(match?.matchedBy, "previous");
  assert.equal(match?.proposal.slug, "norte-nosara");
  assert.equal(
    previousSlugRedirectPath(match!.proposal.slug, "secret-token"),
    "/p/norte-nosara?preview=secret-token",
  );
  assert.equal(previousSlugRedirectPath(match!.proposal.slug), "/p/norte-nosara");

  const current = findProposalForSlug([proposal], "norte-nosara");
  assert.equal(current?.matchedBy, "current");
});

test("parseProposal keeps previousSlugs and drops the active slug from the list", () => {
  const parsed = parseProposal({
    id: "prop_1",
    slug: "norte-nosara",
    previousSlugs: ["norte-nosara-example", "norte-nosara", ""],
    previewToken: "tok",
    templateId: "tmpl",
    templateKind: "custom",
    clientName: "Norte",
    projectTitle: "Video",
    status: "live",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    proposalDate: "2026-01-01",
    validUntil: "2026-02-01",
    viewCount: 3,
    lastOpenedAt: "",
    sections: [],
  });
  assert.ok(parsed);
  assert.deepEqual(parsed?.previousSlugs, ["norte-nosara-example"]);
});
