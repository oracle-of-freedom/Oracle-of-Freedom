import assert from "node:assert/strict";
import test from "node:test";
import { emptyLiveContent } from "./live-content";
import { bundledReviews } from "./live-public";
import {
  formatReviewOptionLabel,
  isReviewPlaceholder,
  listProposalStudioReviews,
  reviewSectionHasContent,
} from "./proposal-reviews";
import { parseProposal } from "./proposals";

test("placeholder quotes are detected", () => {
  assert.equal(isReviewPlaceholder(""), true);
  assert.equal(isReviewPlaceholder("[REVIEW: Agota to supply]"), true);
  assert.equal(isReviewPlaceholder("Loved working with Agota."), false);
});

test("listProposalStudioReviews includes bundled and hidden reviews", () => {
  const live = emptyLiveContent();
  live.reviewTweaks = {
    india: { hidden: true, name: "India, Ireland" },
  };
  live.reviews = [
    {
      id: "rev_new",
      createdAt: "2026-11-24T00:00:00.000Z",
      quote: { en: "Beautiful work.", es: "Trabajo hermoso.", pt: "Trabalho lindo." },
      name: "New Client",
      service: { en: "Retreat film", es: "Film del retiro", pt: "Filme do retiro" },
      pages: ["home"],
      first: true,
      hidden: false,
    },
  ];

  const en = listProposalStudioReviews(live, bundledReviews(), "en");
  assert.ok(en.some((r) => r.id === "rev_new" && r.quote === "Beautiful work."));
  assert.ok(en.some((r) => r.id === "india" && r.hidden && r.optionLabel.includes("(hidden on site)")));

  const es = listProposalStudioReviews(live, bundledReviews(), "es");
  const added = es.find((r) => r.id === "rev_new");
  assert.equal(added?.quote, "Trabajo hermoso.");
  assert.equal(added?.service, "Film del retiro");
});

test("option labels include name, service and quote preview", () => {
  const label = formatReviewOptionLabel({
    name: "Sage Farris, US",
    service: "DJ press kit",
    quote: "The photos are exactly what I had envisioned. Agota nailed it!",
  });
  assert.match(label, /Sage Farris/);
  assert.match(label, /DJ press kit/);
  assert.match(label, /The photos are exactly/);
});

test("review second slot and image survive parseProposal", () => {
  const parsed = parseProposal({
    id: "prop_review",
    slug: "review-client",
    previewToken: "tok",
    templateId: "tmpl_awake_style",
    templateKind: "custom",
    clientName: "Test",
    projectTitle: "Test",
    status: "draft",
    createdAt: "2026-11-24T00:00:00.000Z",
    updatedAt: "2026-11-24T00:00:00.000Z",
    proposalDate: "2026-11-24",
    validUntil: "2026-12-20",
    viewCount: 0,
    lastOpenedAt: "",
    sections: [
      {
        id: "review",
        type: "review",
        enabled: true,
        data: {
          heading: "A word from a recent client",
          quote: "First quote",
          name: "First",
          service: "Portrait",
          sourceReviewId: "india",
          metricsNote: "",
          image: { src: "/images/portfolio/portrait-01.jpg", alt: "First" },
          second: {
            quote: "Second quote",
            name: "Second",
            service: "Retreat",
            sourceReviewId: "rewild",
          },
        },
      },
    ],
  });
  assert.ok(parsed);
  const review = parsed!.sections.find((s) => s.type === "review");
  assert.ok(review && review.type === "review");
  if (!review || review.type !== "review") return;
  assert.equal(review.data.quote, "First quote");
  assert.equal(review.data.image?.src, "/images/portfolio/portrait-01.jpg");
  assert.equal(review.data.second?.quote, "Second quote");
  assert.equal(review.data.second?.sourceReviewId, "rewild");
  assert.equal(reviewSectionHasContent(review.data), true);
});

test("empty and placeholder review sections have no public content", () => {
  assert.equal(
    reviewSectionHasContent({
      heading: "A word",
      quote: "[REVIEW: Agota to supply]",
      name: "",
      service: "",
      metricsNote: "",
    }),
    false,
  );
});
