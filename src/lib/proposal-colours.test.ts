import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COLOUR_PALETTES,
  DEFAULT_COLOUR_SCHEME,
  WCAG_AA_BODY,
  colourContrastIssues,
  contrastRatio,
  fixColourSchemeContrast,
  fixContrastColour,
  parseColourScheme,
  resolveColourScheme,
  resolveColourSchemeWithPhone,
} from "./proposal-colours";
import { parseProposalDesign } from "./proposal-design";

describe("proposal colours", () => {
  it("parseColourScheme round-trips known fields and drops junk", () => {
    const parsed = parseColourScheme({
      pageBg: "#F4ECE1",
      cardBg: "#fbf6ef",
      border: "#d9913a",
      borderOpacity: 80,
      heading: "#b4532a",
      text: "#2a211c",
      muted: "#5c534c",
      accent: "#b4532a",
      buttonBg: "#b4532a",
      buttonText: "#ffffff",
      mystery: "nope",
    });
    assert.ok(parsed);
    assert.equal(parsed!.pageBg, "#f4ece1");
    assert.equal(parsed!.borderOpacity, 80);
    assert.equal((parsed as { mystery?: string }).mystery, undefined);
  });

  it("rejects invalid hex", () => {
    assert.equal(parseColourScheme({ pageBg: "red", text: "not-a-colour" }), undefined);
  });

  it("resolveColourScheme uses Awake defaults when empty", () => {
    assert.deepEqual(resolveColourScheme(), DEFAULT_COLOUR_SCHEME);
  });

  it("phone colours fall back to desktop field by field", () => {
    const { desktop, phone } = resolveColourSchemeWithPhone(
      { pageBg: "#112233", text: "#eeeeee" },
      { heading: "#ffcc00" },
    );
    assert.equal(desktop.pageBg, "#112233");
    assert.equal(phone.pageBg, "#112233");
    assert.equal(phone.heading, "#ffcc00");
    assert.equal(phone.text, "#eeeeee");
  });

  it("survives parseProposalDesign round-trip", () => {
    const design = parseProposalDesign({
      colours: COLOUR_PALETTES.find((p) => p.id === "oceanMist")!.colours,
      mobile: {
        colours: { pageBg: "#001122" },
      },
    });
    assert.ok(design?.colours);
    assert.equal(design!.colours!.pageBg, "#eef3f4");
    assert.equal(design!.mobile?.colours?.pageBg, "#001122");
  });

  it("contrastRatio matches WCAG math", () => {
    const blackWhite = contrastRatio("#000000", "#ffffff");
    assert.ok(blackWhite && blackWhite > 20);
    const low = contrastRatio("#cccccc", "#dddddd");
    assert.ok(low != null && low < WCAG_AA_BODY);
  });

  it("colourContrastIssues flags poor body contrast", () => {
    const issues = colourContrastIssues({
      ...DEFAULT_COLOUR_SCHEME,
      pageBg: "#f4ece1",
      text: "#e7d6c3",
      heading: "#e7c4a4",
    });
    assert.ok(issues.some((issue) => issue.pair === "body"));
  });

  it("fixContrastColour and fixColourSchemeContrast improve ratio", () => {
    const before = contrastRatio("#e7d6c3", "#f4ece1") || 0;
    const fixed = fixContrastColour("#e7d6c3", "#f4ece1", WCAG_AA_BODY);
    const after = contrastRatio(fixed, "#f4ece1") || 0;
    assert.ok(after > before);
    const scheme = fixColourSchemeContrast({
      ...DEFAULT_COLOUR_SCHEME,
      text: "#e7d6c3",
      heading: "#e7c4a4",
    });
    assert.equal(colourContrastIssues(scheme).length, 0);
  });
});
