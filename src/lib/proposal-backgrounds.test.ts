import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BACKGROUND_PRESETS,
  backgroundStyleVars,
  gradientCss,
  meshLayerCss,
  parseProposalBackground,
  resolveBackground,
  shuffleMeshSeed,
} from "./proposal-backgrounds";
import { parseProposalDesign, parseSectionDesign } from "./proposal-design";
import { parseSectionMobile } from "./proposal-mobile";

describe("proposal backgrounds", () => {
  it("parse + resolve round-trip for gradient", () => {
    const raw = {
      kind: "gradient",
      gradient: {
        kind: "linear",
        angle: 165,
        stops: [
          { colour: "#f7d7b8", position: 0 },
          { colour: "#f4ece1", position: 50 },
          { colour: "#e7d6c3", position: 100 },
        ],
      },
      texture: { enabled: true, intensity: 18 },
      animate: true,
    };
    const parsed = parseProposalBackground(raw);
    assert.ok(parsed);
    const resolved = resolveBackground(parsed);
    assert.equal(resolved.kind, "gradient");
    assert.equal(resolved.gradient.angle, 165);
    assert.equal(resolved.gradient.stops.length, 3);
    assert.equal(resolved.texture.enabled, true);
    assert.equal(resolved.animate, true);
    assert.match(gradientCss(resolved.gradient), /linear-gradient\(165deg/);
  });

  it("mesh seed is stable in CSS output", () => {
    const resolved = resolveBackground({
      kind: "mesh",
      solid: "#1c211c",
      mesh: { colours: ["#5b4368", "#9a4522", "#1b1512"], seed: 42, softness: 70 },
    });
    const a = meshLayerCss(resolved.mesh, resolved.solid);
    const b = meshLayerCss(resolved.mesh, resolved.solid);
    assert.equal(a, b);
    assert.match(a, /radial-gradient/);
  });

  it("shuffleMeshSeed changes the value", () => {
    const next = shuffleMeshSeed(10);
    assert.notEqual(next, 10);
  });

  it("backgroundStyleVars expose print solid and layer", () => {
    const vars = backgroundStyleVars(
      resolveBackground(BACKGROUND_PRESETS.find((p) => p.id === "sunriseOmbre")!.background),
    );
    assert.ok(vars["--p-bg-layer"]);
    assert.ok(vars["--p-bg-print"]);
    assert.equal(vars["--p-bg-animate"], "0");
  });

  it("phone background falls through parse on design and section", () => {
    const design = parseProposalDesign({
      background: { kind: "solid", solid: "#f4ece1" },
      mobile: { background: { kind: "gradient", gradient: { angle: 90, stops: [
        { colour: "#ffffff", position: 0 },
        { colour: "#eeeeee", position: 100 },
      ] } } },
    });
    assert.equal(design?.background?.kind, "solid");
    assert.equal(design?.mobile?.background?.kind, "gradient");

    const section = parseSectionDesign({
      background: { kind: "texture", texture: { enabled: true, intensity: 12 } },
    });
    assert.equal(section?.background?.kind, "texture");

    const mobile = parseSectionMobile({
      background: { kind: "mesh", mesh: { seed: 3, colours: ["#111111", "#222222"] } },
    });
    assert.equal(mobile?.background?.kind, "mesh");
  });

  it("defaults to solid page colour when unset", () => {
    const resolved = resolveBackground(undefined, "#f4ece1");
    assert.equal(resolved.kind, "solid");
    assert.equal(resolved.solid, "#f4ece1");
  });
});
