import assert from "node:assert/strict";
import test from "node:test";
import {
  clampStep,
  columnsToCss,
  countGridColumns,
  cssLengthToPx,
  cssLengthToUnit,
  cssPaddingToUniformPx,
  formatCssLength,
  parseCssLength,
} from "./proposal-visual-units";

test("parseCssLength reads mm px pt and first of a shorthand", () => {
  assert.deepEqual(parseCssLength("70mm"), { amount: 70, unit: "mm" });
  assert.deepEqual(parseCssLength("46px"), { amount: 46, unit: "px" });
  assert.deepEqual(parseCssLength("8pt"), { amount: 8, unit: "pt" });
  assert.equal(parseCssLength("4.5mm 5mm 6.7mm")?.amount, 4.5);
  assert.equal(parseCssLength("bad"), null);
});

test("cssLengthToPx converts common proposal units", () => {
  assert.ok(Math.abs(cssLengthToPx("25.4mm", 0) - 96) < 0.1);
  assert.ok(Math.abs(cssLengthToPx("72pt", 0) - 96) < 0.1);
  assert.equal(cssLengthToPx("40px", 0), 40);
  assert.equal(cssLengthToPx(undefined, 12), 12);
});

test("round-trip unit helpers and clamp", () => {
  assert.equal(formatCssLength(46, "px"), "46px");
  assert.equal(formatCssLength(8, "pt"), "8pt");
  assert.equal(cssLengthToUnit("46px", "px", 0), 46);
  assert.equal(clampStep(17, 0, 64, 4), 16);
});

test("padding average and column helpers", () => {
  assert.ok(cssPaddingToUniformPx("10px 20px", 0) === 15);
  assert.equal(countGridColumns("1fr"), 1);
  assert.equal(countGridColumns("1fr 1fr"), 2);
  assert.equal(countGridColumns("1fr 1fr 1fr"), 3);
  assert.equal(columnsToCss(2, ".79fr 1.21fr"), ".79fr 1.21fr");
  assert.equal(columnsToCss(1), "1fr");
});
