import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankSection } from "../components/proposals/section-fields";
import {
  buildTemplateExport,
  importTemplateFromJson,
  templateExportFilename,
  templatesEqualAsideFromMeta,
} from "./proposal-template-io";
import {
  TEMPLATE_FORMAT_VERSION,
  parseTemplate,
  type ProposalTemplate,
  type SectionType,
} from "./proposals";

const NEW_TYPES: SectionType[] = [
  "faq",
  "video",
  "quote",
  "gallery",
  "timeline",
  "cta",
  "columns",
];

describe("new block blankSection + parse round-trip", () => {
  for (const type of NEW_TYPES) {
    it(`${type} blankSection survives parseTemplate`, () => {
      const blank = blankSection(type);
      const parsed = parseTemplate({
        id: "tmpl_round",
        name: "Round trip",
        kind: "custom",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        sections: [blank],
      });
      assert.ok(parsed);
      const section = parsed!.sections.find((s) => s.type === type);
      assert.ok(section, `missing ${type}`);
      assert.equal(section!.id, blank.id);
      assert.deepEqual(section!.data, blank.data);
    });
  }
});

describe("template import / export", () => {
  it("builds a slug filename", () => {
    assert.equal(templateExportFilename("Norte Nosara Retreat"), "norte-nosara-retreat.oot.json");
  });

  it("export then import matches aside from id and dates", () => {
    const now = new Date("2026-11-25T12:00:00.000Z");
    const sections = [
      ...NEW_TYPES.map((type) => blankSection(type)),
      blankSection("signOff"),
    ];
    const original: ProposalTemplate = {
      id: "tmpl_original",
      name: "Builder sample",
      kind: "custom",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      formatVersion: TEMPLATE_FORMAT_VERSION,
      sections,
    };
    // Normalize through parseTemplate so defaults match import output.
    const normalized = parseTemplate(original)!;
    const exported = buildTemplateExport(normalized, now);
    assert.equal(exported.formatVersion, TEMPLATE_FORMAT_VERSION);
    assert.equal(exported.exportedAt, now.toISOString());
    assert.equal(exported.builtin, undefined);

    const imported = importTemplateFromJson(exported, { now });
    assert.equal(imported.ok, true);
    if (!imported.ok) return;
    assert.notEqual(imported.template.id, normalized.id);
    assert.equal(imported.template.createdAt, now.toISOString());
    assert.ok(
      templatesEqualAsideFromMeta(
        { ...normalized, formatVersion: TEMPLATE_FORMAT_VERSION },
        imported.template,
      ),
    );
    assert.match(imported.message, /Imported \d+ blocks/);
  });

  it("skips unknown block types with a friendly summary", () => {
    const raw = {
      formatVersion: 1,
      name: "Partial",
      kind: "custom",
      sections: [
        blankSection("faq"),
        { id: "x", type: "hologram", enabled: true, data: {} },
        blankSection("cta"),
        { id: "y", type: "warpDrive", enabled: true, data: {} },
        blankSection("signOff"),
      ],
    };
    const result = importTemplateFromJson(raw, {
      now: new Date("2026-11-25T12:00:00.000Z"),
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const types = result.template.sections.map((s) => s.type);
    assert.ok(types.includes("faq"));
    assert.ok(types.includes("cta"));
    assert.ok(!types.includes("hologram" as SectionType));
    assert.equal(result.skippedBlocks, 2);
    assert.ok(result.skippedTypes.includes("hologram"));
    assert.match(result.message, /Imported \d+ blocks, skipped 2 unknown blocks/);
  });

  it("rejects newer format versions", () => {
    const result = importTemplateFromJson({
      formatVersion: 99,
      name: "Future",
      kind: "custom",
      sections: [],
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /newer/i);
  });

  it("parseTemplate accepts optional formatVersion", () => {
    const parsed = parseTemplate({
      id: "t1",
      name: "Legacy",
      kind: "custom",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      sections: [blankSection("text")],
    });
    assert.ok(parsed);
    assert.equal(parsed!.formatVersion, undefined);
  });
});
