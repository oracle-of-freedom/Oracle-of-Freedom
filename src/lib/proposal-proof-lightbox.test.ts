import assert from "node:assert/strict";
import test from "node:test";
import {
  lightboxIndexForGrid,
  proofLightboxItems,
  visibleProofLightboxItems,
  wrapLightboxIndex,
} from "./proposal-proof-lightbox";
import type { ProposalImage } from "./proposals";

const images: ProposalImage[] = [
  { alt: "One", src: "/images/portfolio/a.jpg" },
  { alt: "Placeholder" },
  { alt: "Two", src: "/images/portfolio/b.jpg", mobile: { hidden: true } },
  { alt: "Three", src: "/images/portfolio/c.jpg" },
];

test("proofLightboxItems skips empty placeholders and keeps grid indexes", () => {
  const items = proofLightboxItems(images);
  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((item) => ({ gridIndex: item.gridIndex, src: item.src, phoneHidden: item.phoneHidden })),
    [
      { gridIndex: 0, src: "/images/portfolio/a.jpg", phoneHidden: false },
      { gridIndex: 2, src: "/images/portfolio/b.jpg", phoneHidden: true },
      { gridIndex: 3, src: "/images/portfolio/c.jpg", phoneHidden: false },
    ],
  );
});

test("visibleProofLightboxItems skips phone-hidden photos on phone only", () => {
  const items = proofLightboxItems(images);
  assert.equal(visibleProofLightboxItems(items, false).length, 3);
  const phone = visibleProofLightboxItems(items, true);
  assert.equal(phone.length, 2);
  assert.deepEqual(
    phone.map((item) => item.src),
    ["/images/portfolio/a.jpg", "/images/portfolio/c.jpg"],
  );
});

test("lightboxIndexForGrid maps a clicked cell into the visible sequence", () => {
  const items = proofLightboxItems(images);
  assert.equal(lightboxIndexForGrid(items, 0, false), 0);
  assert.equal(lightboxIndexForGrid(items, 2, false), 1);
  assert.equal(lightboxIndexForGrid(items, 3, true), 1);
  assert.equal(lightboxIndexForGrid(items, 2, true), -1);
  assert.equal(lightboxIndexForGrid(items, 1, false), -1);
});

test("wrapLightboxIndex cycles through the sequence", () => {
  assert.equal(wrapLightboxIndex(0, 3), 0);
  assert.equal(wrapLightboxIndex(3, 3), 0);
  assert.equal(wrapLightboxIndex(-1, 3), 2);
  assert.equal(wrapLightboxIndex(0, 0), 0);
});
