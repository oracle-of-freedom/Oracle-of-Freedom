import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  duplicateSectionInList,
  insertSectionAt,
  removeSectionById,
  reorderSectionsByIds,
  setPhoneSectionOrder,
} from "./proposal-section-order";
import { phoneSectionOrder } from "./proposal-mobile";
import type { ProposalSection } from "./proposals";

function stub(id: string, order?: number): ProposalSection {
  return {
    id,
    type: "text",
    enabled: true,
    data: { heading: id, body: "" },
    ...(order != null ? { mobile: { order } } : {}),
  };
}

describe("proposal-section-order", () => {
  it("reorders the desktop list by ids", () => {
    const sections = [stub("a"), stub("b"), stub("c")];
    const next = reorderSectionsByIds(sections, ["c", "a", "b"]);
    assert.deepEqual(
      next.map((s) => s.id),
      ["c", "a", "b"],
    );
  });

  it("keeps desktop order when writing phone order", () => {
    const sections = [stub("a"), stub("b"), stub("c")];
    const next = setPhoneSectionOrder(sections, ["c", "a", "b"]);
    assert.deepEqual(
      next.map((s) => s.id),
      ["a", "b", "c"],
    );
    assert.deepEqual(
      phoneSectionOrder(next).map((s) => s.id),
      ["c", "a", "b"],
    );
  });

  it("phone reorder does not change desktop array order", () => {
    const desktop = [stub("a"), stub("b"), stub("c"), stub("d")];
    const phoned = setPhoneSectionOrder(desktop, ["d", "b", "a", "c"]);
    assert.deepEqual(
      phoned.map((s) => s.id),
      ["a", "b", "c", "d"],
    );
    const again = setPhoneSectionOrder(phoned, ["a", "d", "c", "b"]);
    assert.deepEqual(
      again.map((s) => s.id),
      ["a", "b", "c", "d"],
    );
    assert.deepEqual(
      phoneSectionOrder(again).map((s) => s.id),
      ["a", "d", "c", "b"],
    );
  });

  it("inserts, duplicates and removes sections", () => {
    const base = [stub("a"), stub("b")];
    const inserted = insertSectionAt(base, stub("x"), 1);
    assert.deepEqual(
      inserted.map((s) => s.id),
      ["a", "x", "b"],
    );
    const { sections: duped, duplicatedId } = duplicateSectionInList(inserted, "x", "x2");
    assert.equal(duplicatedId, "x2");
    assert.deepEqual(
      duped.map((s) => s.id),
      ["a", "x", "x2", "b"],
    );
    assert.deepEqual(
      removeSectionById(duped, "x").map((s) => s.id),
      ["a", "x2", "b"],
    );
  });
});
