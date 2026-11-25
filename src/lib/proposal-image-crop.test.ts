import assert from "node:assert/strict";
import test from "node:test";
import {
  applyImageCrop,
  clearImageCrop,
  clampFocus,
  clampZoom,
  hasImageCrop,
  imageCropStyle,
  resetAllImageCrops,
  resolveImageCrop,
} from "./proposal-image-crop";
import { parseProposal } from "./proposals";

test("missing crop fields resolve to centre with zoom 1", () => {
  const crop = resolveImageCrop({});
  assert.deepEqual(crop, { focusX: 50, focusY: 50, zoom: 1 });
  assert.equal(hasImageCrop({}), false);
});

test("clamp keeps focus and zoom in range", () => {
  assert.equal(clampFocus(-10), 0);
  assert.equal(clampFocus(150), 100);
  assert.equal(clampZoom(0.2), 1);
  assert.equal(clampZoom(9), 3);
});

test("imageCropStyle uses object-position and optional scale", () => {
  const plain = imageCropStyle({ focusX: 20, focusY: 80 });
  assert.equal(plain.objectFit, "cover");
  assert.equal(plain.objectPosition, "20% 80%");
  assert.equal(plain.transform, undefined);

  const zoomed = imageCropStyle({ focusX: 10, focusY: 90, zoom: 1.5 });
  assert.equal(zoomed.transform, "scale(1.5)");
  assert.equal(zoomed.transformOrigin, "10% 90%");
});

test("apply and clear crop round-trip through parseProposal", () => {
  const cropped = applyImageCrop(
    { src: "/images/portfolio/film-01.jpg", alt: "Proof" },
    { focusX: 12.34, focusY: 88.8, zoom: 2.456 },
  );
  assert.equal(cropped.focusX, 12.3);
  assert.equal(cropped.focusY, 88.8);
  assert.equal(cropped.zoom, 2.46);

  const parsed = parseProposal({
    id: "prop_crop",
    slug: "crop-client",
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
        id: "proof",
        type: "proof",
        enabled: true,
        data: {
          heading: "Proof",
          images: [cropped],
          videoUrl: "",
          videoMediaId: "",
          videoCover: { src: "/images/portfolio/film-04.jpg", alt: "Reel", focusX: 0, focusY: 100, zoom: 1.2 },
          portfolioLine: "You can see my work here: https://oracleoffreedom.com/portfolio",
        },
      },
    ],
  });
  assert.ok(parsed);
  const proof = parsed!.sections.find((s) => s.type === "proof");
  assert.ok(proof && proof.type === "proof");
  if (!proof || proof.type !== "proof") return;
  assert.equal(proof.data.images[0]?.focusX, 12.3);
  assert.equal(proof.data.images[0]?.focusY, 88.8);
  assert.equal(proof.data.images[0]?.zoom, 2.46);
  assert.equal(proof.data.videoCover?.focusX, 0);
  assert.equal(proof.data.videoCover?.zoom, 1.2);

  const cleared = resetAllImageCrops(parsed!);
  const clearedProof = cleared.sections.find((s) => s.type === "proof");
  assert.ok(clearedProof && clearedProof.type === "proof");
  if (!clearedProof || clearedProof.type !== "proof") return;
  assert.equal(clearedProof.data.images[0]?.focusX, undefined);
  assert.equal(clearedProof.data.images[0]?.zoom, undefined);
  assert.equal(clearedProof.data.videoCover?.focusX, undefined);
  assert.equal(hasImageCrop(clearImageCrop(cropped)), false);
});

test("out of range crop values are clamped by the image normaliser", () => {
  const parsed = parseProposal({
    id: "prop_clamp",
    slug: "clamp-client",
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
        id: "cover",
        type: "cover",
        enabled: true,
        data: {
          kicker: "",
          clientName: "Test",
          headline: "Hello",
          headlineEmphasis: "",
          subtitle: "",
          proposalDate: "2026-11-24",
          heroImage: { src: "/images/x.jpg", alt: "Cover", focusX: -20, focusY: 200, zoom: 99 },
        },
      },
    ],
  });
  assert.ok(parsed);
  const cover = parsed!.sections.find((s) => s.type === "cover");
  assert.ok(cover && cover.type === "cover");
  if (!cover || cover.type !== "cover") return;
  assert.equal(cover.data.heroImage?.focusX, 0);
  assert.equal(cover.data.heroImage?.focusY, 100);
  assert.equal(cover.data.heroImage?.zoom, 3);
});
