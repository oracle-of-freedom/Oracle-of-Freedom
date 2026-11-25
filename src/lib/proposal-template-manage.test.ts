import assert from "node:assert/strict";
import test from "node:test";
import {
  LAST_VISIBLE_TEMPLATE_ERROR,
  deleteTemplatesInList,
  hiddenStarterTemplates,
  proposalsUntouchedByTemplateDelete,
  renameTemplateInList,
  setTemplatesHiddenInList,
  visibleTemplates,
} from "./proposal-template-manage";
import type { Proposal, ProposalTemplate } from "./proposals";

function stubTemplate(
  overrides: Partial<ProposalTemplate> & Pick<ProposalTemplate, "id" | "name">,
): ProposalTemplate {
  return {
    kind: "custom",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sections: [],
    ...overrides,
  };
}

function stubProposal(id: string, templateId: string): Proposal {
  return {
    id,
    slug: id,
    previewToken: "tok",
    templateId,
    templateKind: "custom",
    clientName: "Client",
    projectTitle: "Title",
    status: "draft",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    proposalDate: "2026-01-01",
    validUntil: "2026-02-01",
    viewCount: 0,
    lastOpenedAt: "",
    sections: [],
  };
}

test("deleting a custom template removes it and leaves proposals untouched", () => {
  const templates = [
    stubTemplate({ id: "tmpl_a", name: "Custom A" }),
    stubTemplate({ id: "tmpl_starter", name: "Starter", builtin: true }),
  ];
  const proposalsBefore = [
    stubProposal("prop_1", "tmpl_a"),
    stubProposal("prop_2", "tmpl_starter"),
  ];
  const proposalsAfter = structuredClone(proposalsBefore);

  const { templates: next, deletedIds } = deleteTemplatesInList(templates, ["tmpl_a"]);
  assert.deepEqual(deletedIds, ["tmpl_a"]);
  assert.equal(next.length, 1);
  assert.equal(next[0]?.id, "tmpl_starter");
  assert.ok(proposalsUntouchedByTemplateDelete(proposalsBefore, proposalsAfter));
  assert.equal(proposalsAfter[0]?.templateId, "tmpl_a");
});

test("built-in starters cannot be deleted", () => {
  const templates = [stubTemplate({ id: "tmpl_starter", name: "Starter", builtin: true })];
  assert.throws(
    () => deleteTemplatesInList(templates, ["tmpl_starter"]),
    /Hide them instead/,
  );
});

test("hiding and unhiding a starter toggles visibility for the picker", () => {
  const templates = [
    stubTemplate({ id: "tmpl_a", name: "Custom A" }),
    stubTemplate({ id: "tmpl_starter", name: "Starter", builtin: true }),
  ];
  const hidden = setTemplatesHiddenInList(templates, ["tmpl_starter"], true, "2026-02-01T00:00:00.000Z");
  assert.equal(hidden.find((t) => t.id === "tmpl_starter")?.hidden, true);
  assert.deepEqual(
    visibleTemplates(hidden).map((t) => t.id),
    ["tmpl_a"],
  );
  assert.equal(hiddenStarterTemplates(hidden).length, 1);

  const restored = setTemplatesHiddenInList(hidden, ["tmpl_starter"], false, "2026-02-02T00:00:00.000Z");
  assert.equal(restored.find((t) => t.id === "tmpl_starter")?.hidden, undefined);
  assert.deepEqual(
    visibleTemplates(restored).map((t) => t.id),
    ["tmpl_a", "tmpl_starter"],
  );
});

test("last visible template cannot be deleted or hidden", () => {
  const onlyCustom = [stubTemplate({ id: "tmpl_a", name: "Only" })];
  assert.throws(
    () => deleteTemplatesInList(onlyCustom, ["tmpl_a"]),
    (error: unknown) =>
      error instanceof Error && error.message === LAST_VISIBLE_TEMPLATE_ERROR,
  );

  const onlyStarter = [stubTemplate({ id: "tmpl_starter", name: "Starter", builtin: true })];
  assert.throws(
    () => setTemplatesHiddenInList(onlyStarter, ["tmpl_starter"], true),
    (error: unknown) =>
      error instanceof Error && error.message === LAST_VISIBLE_TEMPLATE_ERROR,
  );

  const mixed = [
    stubTemplate({ id: "tmpl_a", name: "Custom" }),
    stubTemplate({ id: "tmpl_starter", name: "Starter", builtin: true, hidden: true }),
  ];
  assert.throws(
    () => deleteTemplatesInList(mixed, ["tmpl_a"]),
    (error: unknown) =>
      error instanceof Error && error.message === LAST_VISIBLE_TEMPLATE_ERROR,
  );
});

test("hidden starters are excluded from the new-proposal picker list", () => {
  const templates = [
    stubTemplate({ id: "tmpl_a", name: "Custom" }),
    stubTemplate({ id: "tmpl_b", name: "Retreat", builtin: true, hidden: true }),
    stubTemplate({ id: "tmpl_c", name: "Festival", builtin: true }),
  ];
  assert.deepEqual(
    visibleTemplates(templates).map((t) => t.id),
    ["tmpl_a", "tmpl_c"],
  );
});

test("rename only changes the name", () => {
  const templates = [
    stubTemplate({
      id: "tmpl_a",
      name: "Old",
      kind: "retreat",
      builtin: true,
      sections: [{ id: "sec", type: "welcome", enabled: true, data: { body: "Hi" } }],
    }),
  ];
  const next = renameTemplateInList(templates, "tmpl_a", "  New name  ", "2026-03-01T00:00:00.000Z");
  assert.equal(next[0]?.name, "New name");
  assert.equal(next[0]?.kind, "retreat");
  assert.equal(next[0]?.builtin, true);
  assert.equal(next[0]?.sections.length, 1);
  assert.equal(next[0]?.updatedAt, "2026-03-01T00:00:00.000Z");
});
