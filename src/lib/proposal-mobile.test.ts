import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMobileImageCrop,
  clearImageMobile,
  moveSectionPhoneOrder,
  parseImageMobile,
  parseProposalDesignMobile,
  parseSectionMobile,
  phoneSectionOrder,
  resetAllPhoneSettings,
  resolveMobileImageCrop,
  resolveResponsive,
} from "./proposal-mobile";
import { parseProposalDesign as parseDesign } from "./proposal-design";
import { parseProposal } from "./proposals";

test("resolveResponsive keeps desktop when mobile is empty", () => {
  assert.deepEqual(resolveResponsive({ a: 1, b: "x" }, undefined), { a: 1, b: "x" });
  assert.deepEqual(resolveResponsive({ a: 1, b: "x" }, { b: "y" }), { a: 1, b: "y" });
});

test("mobile image crop falls back to desktop then centre", () => {
  assert.deepEqual(resolveMobileImageCrop({ alt: "Still" } as never), {
    focusX: 50,
    focusY: 50,
    zoom: 1,
  });
  assert.deepEqual(
    resolveMobileImageCrop({ focusX: 10, focusY: 90, zoom: 1.2, mobile: { focusX: 80 } } as never),
    { focusX: 80, focusY: 90, zoom: 1.2 },
  );
});

test("applyMobileImageCrop writes only the mobile slot", () => {
  const image = applyMobileImageCrop(
    { src: "/images/a.jpg", alt: "A", focusX: 20, focusY: 30 } as {
      src: string;
      alt: string;
      focusX: number;
      focusY: number;
      mobile?: { focusX?: number; focusY?: number; zoom?: number };
    },
    { focusX: 70, focusY: 15, zoom: 1.5 },
  );
  assert.equal(image.focusX, 20);
  assert.equal(image.mobile?.focusX, 70);
  assert.equal(image.mobile?.focusY, 15);
  assert.equal(image.mobile?.zoom, 1.5);
});

test("phone section order uses mobile.order and move updates it", () => {
  const sections = [
    { id: "a", type: "welcome" },
    { id: "b", type: "proof", mobile: { order: 0 } },
    { id: "c", type: "plan", mobile: { order: 1 } },
  ];
  // a falls back to index 0, ties with b's explicit 0, then index breaks the tie.
  assert.deepEqual(
    phoneSectionOrder(sections).map((s) => s.id),
    ["a", "b", "c"],
  );
  const reordered = [
    { id: "a", type: "welcome", mobile: { order: 2 } },
    { id: "b", type: "proof", mobile: { order: 0 } },
    { id: "c", type: "plan", mobile: { order: 1 } },
  ];
  assert.deepEqual(
    phoneSectionOrder(reordered).map((s) => s.id),
    ["b", "c", "a"],
  );
  const moved = moveSectionPhoneOrder(reordered, "b", 1);
  assert.equal(moved.find((s) => s.id === "b")?.mobile?.order, 1);
  assert.equal(moved.find((s) => s.id === "c")?.mobile?.order, 0);
});

test("parseProposal keeps image and section mobile overrides", () => {
  const parsed = parseProposal({
    id: "prop_phone",
    slug: "phone-client",
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
    design: {
      cover: { heroHeight: "70mm" },
      mobile: {
        cover: { heroHeight: "52mm", titleSize: "24pt", imageSide: "top" },
        proofColumns: 1,
        reviewLayout: "stack",
      },
    },
    sections: [
      {
        id: "cover",
        type: "cover",
        enabled: true,
        mobile: { hidden: false, order: 0 },
        data: {
          kicker: "",
          clientName: "Test",
          headline: "Hello",
          headlineEmphasis: "",
          subtitle: "",
          proposalDate: "2026-11-24",
          heroImage: {
            src: "/images/x.jpg",
            alt: "Cover",
            focusX: 100,
            mobile: { focusX: 20, focusY: 40, zoom: 1.4, aspect: "4:5", hidden: false },
          },
        },
      },
      {
        id: "proof",
        type: "proof",
        enabled: true,
        mobile: { order: 1, headingSize: "large", marginTop: "4mm" },
        data: {
          heading: "Proof",
          images: [
            {
              src: "/images/p.jpg",
              alt: "Still",
              mobile: { height: "58mm", aspect: "1:1", hidden: true },
            },
          ],
          videoUrl: "",
          videoMediaId: "",
          portfolioLine: "You can see my work here: https://oracleoffreedom.com/portfolio",
        },
      },
    ],
  });
  assert.ok(parsed);
  assert.equal(parsed!.design?.mobile?.cover?.heroHeight, "52mm");
  assert.equal(parsed!.design?.mobile?.proofColumns, 1);
  const cover = parsed!.sections.find((s) => s.type === "cover");
  assert.ok(cover && cover.type === "cover");
  if (!cover || cover.type !== "cover") return;
  assert.equal(cover.data.heroImage?.focusX, 100);
  assert.equal(cover.data.heroImage?.mobile?.focusX, 20);
  assert.equal(cover.data.heroImage?.mobile?.aspect, "4:5");
  const proof = parsed!.sections.find((s) => s.type === "proof");
  assert.ok(proof && proof.type === "proof");
  if (!proof || proof.type !== "proof") return;
  assert.equal(proof.mobile?.headingSize, "large");
  assert.equal(proof.data.images[0]?.mobile?.hidden, true);

  const cleared = resetAllPhoneSettings(parsed!);
  assert.equal(cleared.design?.mobile, undefined);
  const clearedCover = cleared.sections.find((s) => s.type === "cover");
  assert.ok(clearedCover && clearedCover.type === "cover");
  if (!clearedCover || clearedCover.type !== "cover") return;
  assert.equal(clearedCover.data.heroImage?.mobile, undefined);
  assert.equal(clearedCover.data.heroImage?.focusX, 100);
  assert.equal(clearImageMobile({ alt: "x", mobile: { hidden: true } }).mobile, undefined);
});

test("mobile parsers reject unsafe css and clamp crop", () => {
  assert.equal(parseImageMobile({ focusX: -5, height: "70mm;color:red" })?.focusX, 0);
  assert.equal(parseImageMobile({ height: "70mm;color:red" })?.height, undefined);
  assert.equal(parseImageMobile({ height: "62mm", aspect: "4:5" })?.aspect, "4:5");
  assert.equal(parseSectionMobile({ order: 2.6, headingSize: "small" })?.order, 3);
  assert.equal(parseProposalDesignMobile({ proofColumns: 3 }), undefined);
  assert.equal(parseProposalDesignMobile({ proofColumns: 2 })?.proofColumns, 2);
  const design = parseDesign({
    mobile: { cover: { heroHeight: "48mm" }, reviewLayout: "side" },
  });
  assert.equal(design?.mobile?.cover?.heroHeight, "48mm");
  assert.equal(design?.mobile?.reviewLayout, "side");
});
