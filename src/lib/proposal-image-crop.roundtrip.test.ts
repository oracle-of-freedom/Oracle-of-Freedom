import assert from "node:assert/strict";
import test from "node:test";
import {
  HERO_CROP_FALLBACK,
  applyImageCrop,
  hasImageCrop,
  resolveImageCrop,
} from "./proposal-image-crop";
import {
  applyMobileImageCrop,
  hasMobileImageCrop,
  imageResponsiveStyle,
  resolveMobileImageCrop,
} from "./proposal-mobile";
import { parseProposal } from "./proposals";

test("saved focusX/focusY/zoom round-trip unchanged through apply + parse", () => {
  const saved = { focusX: 37.5, focusY: 62, zoom: 1.35 };
  const image = applyImageCrop(
    { src: "/images/proposals/norte-awake-cover-hat.jpg", alt: "Cover" },
    saved,
  );
  assert.deepEqual(
    { focusX: image.focusX, focusY: image.focusY, zoom: image.zoom },
    { focusX: 37.5, focusY: 62, zoom: 1.35 },
  );

  const parsed = parseProposal({
    id: "prop_crop_rt",
    slug: "crop-rt",
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
          heroImage: image,
        },
      },
    ],
  });
  assert.ok(parsed);
  const cover = parsed!.sections.find((s) => s.type === "cover");
  assert.ok(cover && cover.type === "cover");
  if (!cover || cover.type !== "cover") return;
  assert.equal(cover.data.heroImage?.focusX, 37.5);
  assert.equal(cover.data.heroImage?.focusY, 62);
  assert.equal(cover.data.heroImage?.zoom, 1.35);
  assert.deepEqual(resolveImageCrop(cover.data.heroImage), {
    focusX: 37.5,
    focusY: 62,
    zoom: 1.35,
  });
});

test("phone crop round-trips without inventing desktop crop CSS vars", () => {
  const base = {
    src: "/images/proposals/norte-awake-cover-hat.jpg",
    alt: "Cover",
    focusX: undefined as number | undefined,
    focusY: undefined as number | undefined,
    zoom: undefined as number | undefined,
  };
  const withPhone = applyMobileImageCrop(base, { focusX: 0, focusY: 50, zoom: 1 });
  assert.equal(hasImageCrop(withPhone), false);
  assert.equal(hasMobileImageCrop(withPhone), true);
  assert.deepEqual(resolveMobileImageCrop(withPhone, HERO_CROP_FALLBACK), {
    focusX: 0,
    focusY: 50,
    zoom: 1,
  });

  const style = imageResponsiveStyle(withPhone, HERO_CROP_FALLBACK) as Record<string, string>;
  assert.equal(style["--crop-x"], undefined);
  assert.equal(style["--crop-y"], undefined);
  assert.equal(style["--crop-z"], undefined);
  assert.equal(style["--crop-x-m"], "0%");
  assert.equal(style["--crop-y-m"], "50%");
  assert.equal(style["--crop-z-m"], "1");

  const parsed = parseProposal({
    id: "prop_phone_crop",
    slug: "phone-crop",
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
          heroImage: withPhone,
        },
      },
    ],
  });
  assert.ok(parsed);
  const cover = parsed!.sections.find((s) => s.type === "cover");
  assert.ok(cover && cover.type === "cover");
  if (!cover || cover.type !== "cover") return;
  assert.equal(cover.data.heroImage?.focusX, undefined);
  assert.equal(cover.data.heroImage?.mobile?.focusX, 0);
  assert.equal(cover.data.heroImage?.mobile?.focusY, 50);
});

test("desktop crop CSS vars emit only stored desktop values", () => {
  const image = applyImageCrop(
    { src: "/images/x.jpg", alt: "X" },
    { focusX: 22, focusY: 78, zoom: 1.2 },
  );
  const style = imageResponsiveStyle(image) as Record<string, string>;
  assert.equal(style["--crop-x"], "22%");
  assert.equal(style["--crop-y"], "78%");
  assert.equal(style["--crop-z"], "1.2");
});
