import assert from "node:assert/strict";
import test from "node:test";
import {
  cardLayoutVars,
  cardPaddingToCss,
  parseSectionDesign,
} from "./proposal-design";
import { parseSectionMobile } from "./proposal-mobile";

test("cardLayoutVars auto fits content", () => {
  assert.deepEqual(cardLayoutVars({ cardHeight: "auto" }), {
    "--card-align": "start",
    "--card-min-height": "0",
    "--card-height": "auto",
  });
});

test("cardLayoutVars equal stretches the row", () => {
  assert.deepEqual(cardLayoutVars({ cardHeight: "equal" }), {
    "--card-align": "stretch",
    "--card-min-height": "0",
    "--card-height": "auto",
  });
});

test("cardLayoutVars fixed uses the given length", () => {
  assert.deepEqual(cardLayoutVars({ cardHeight: "fixed", cardHeightValue: "120px" }), {
    "--card-align": "stretch",
    "--card-min-height": "120px",
    "--card-height": "120px",
  });
});

test("cardLayoutVars phone suffix and padding presets", () => {
  const vars = cardLayoutVars(
    {
      cardHeight: "auto",
      cardPadding: "compact",
      cardTextSize: "small",
      gap: "3mm",
      columns: "1fr",
    },
    { phone: true },
  );
  assert.equal(vars["--card-align-m"], "start");
  assert.equal(vars["--card-padding-m"], cardPaddingToCss("compact", "5.5mm 4.5mm 8mm"));
  assert.equal(vars["--card-text-size-m"], "11pt");
  assert.equal(vars["--card-gap-m"], "3mm");
  assert.equal(vars["--block-columns-m"], "1fr");
});

test("parseSectionDesign keeps card layout fields", () => {
  const design = parseSectionDesign({
    cardHeight: "fixed",
    cardHeightValue: "48mm",
    cardPadding: "roomy",
    cardTextSize: "large",
    gap: "4mm",
    columns: "1fr 1fr",
  });
  assert.equal(design?.cardHeight, "fixed");
  assert.equal(design?.cardHeightValue, "48mm");
  assert.equal(design?.cardPadding, "roomy");
  assert.equal(design?.cardTextSize, "large");
  assert.equal(design?.gap, "4mm");
  assert.equal(design?.columns, "1fr 1fr");
});

test("parseSectionMobile keeps phone card layout fields", () => {
  const mobile = parseSectionMobile({
    cardHeight: "equal",
    cardHeightValue: "90px",
    cardPadding: "compact",
    cardTextSize: "small",
    gap: "2mm",
    columns: "1fr",
  });
  assert.equal(mobile?.cardHeight, "equal");
  assert.equal(mobile?.cardHeightValue, "90px");
  assert.equal(mobile?.cardPadding, "compact");
  assert.equal(mobile?.cardTextSize, "small");
  assert.equal(mobile?.gap, "2mm");
  assert.equal(mobile?.columns, "1fr");
});
