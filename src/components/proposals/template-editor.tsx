"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  deleteTemplateAction,
  duplicateTemplateAction,
  saveTemplateAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ProposalDesignFields } from "@/components/proposals/design-fields";
import {
  EditorViewportProvider,
  EditorViewportToggle,
  useEditorViewport,
} from "@/components/proposals/editor-viewport";
import { ProposalView } from "@/components/proposals/proposal-view";
import { blankSection, SectionFields } from "@/components/proposals/section-fields";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Film } from "@/lib/content";
import { resetDesignDefaults } from "@/lib/proposal-design";
import { resetAllImageCrops } from "@/lib/proposal-image-crop";
import { moveSectionPhoneOrder, resetAllPhoneSettings } from "@/lib/proposal-mobile";
import type { ProposalStudioReview } from "@/lib/proposal-reviews";
import {
  SECTION_TYPES,
  findSection,
  sectionLabel,
  todayIsoDate,
  type Proposal,
  type ProposalTemplate,
  type SectionType,
} from "@/lib/proposals";

function asPreviewProposal(template: ProposalTemplate): Proposal {
  const stamp = new Date().toISOString();
  return {
    id: "preview",
    slug: "template-preview",
    previewToken: "preview",
    templateId: template.id,
    templateKind: template.kind,
    clientName: "[Client name]",
    projectTitle: template.name,
    status: "draft",
    createdAt: stamp,
    updatedAt: stamp,
    proposalDate: todayIsoDate(),
    validUntil: todayIsoDate(),
    viewCount: 0,
    lastOpenedAt: "",
    design: template.design,
    sections: template.sections,
  };
}

export function TemplateEditor({
  initial,
  films = [],
  reviews = [],
}: {
  initial: ProposalTemplate;
  films?: Film[];
  reviews?: ProposalStudioReview[];
}) {
  return (
    <EditorViewportProvider>
      <TemplateEditorInner initial={initial} films={films} reviews={reviews} />
    </EditorViewportProvider>
  );
}

function TemplateEditorInner({
  initial,
  films = [],
  reviews = [],
}: {
  initial: ProposalTemplate;
  films?: Film[];
  reviews?: ProposalStudioReview[];
}) {
  const { viewport, isPhone } = useEditorViewport();
  const [template, setTemplate] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || "");
  const [state, action, pending] = useActionState(saveTemplateAction, null as ActionState);
  const reviewSelectRef = useRef<HTMLSelectElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const skipPreviewScroll = useRef(false);
  const selected = template.sections.find((s) => s.id === selectedId) || template.sections[0];

  useEffect(() => {
    if (!selectedId || skipPreviewScroll.current) {
      skipPreviewScroll.current = false;
      return;
    }
    const root = previewScrollRef.current;
    if (!root) return;
    const el = root.querySelector(`#proposal-section-${CSS.escape(selectedId)}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  function updateSection(next: NonNullable<typeof selected>) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setTemplate((prev) => {
      if (isPhone) {
        return { ...prev, sections: moveSectionPhoneOrder(prev.sections, id, dir) };
      }
      const index = prev.sections.findIndex((s) => s.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [item] = sections.splice(index, 1);
      sections.splice(target, 0, item!);
      return { ...prev, sections };
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-full lg:overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-ink/10 px-1 pb-4 lg:max-h-[38vh] lg:overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/proposals/templates" className="text-sm underline underline-offset-4">
            Back to templates
          </Link>
          <p className="text-sm text-ink/55">
            {isPhone
              ? "Phone edits apply under 768px only."
              : "Desktop is the default. Use the preview toggle for Phone."}
          </p>
        </div>

        <div className="rounded-3xl bg-white/70 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Template name</Label>
              <Input
                value={template.name}
                onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kind</Label>
              <select
                className="h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4"
                value={template.kind}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    kind: e.target.value as ProposalTemplate["kind"],
                  }))
                }
              >
                <option value="retreat">Retreat / Hotel</option>
                <option value="festival">Festival / Event</option>
                <option value="quick">Quick Offer</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={action}>
              <input type="hidden" name="templateJson" value={JSON.stringify(template)} />
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save template"}
              </Button>
            </form>
            <form action={duplicateTemplateAction}>
              <input type="hidden" name="id" value={template.id} />
              <Button type="submit" variant="outline">
                Duplicate template
              </Button>
            </form>
            {!template.builtin ? (
              <form action={deleteTemplateAction}>
                <input type="hidden" name="id" value={template.id} />
                <Button type="submit" variant="outline">
                  Delete
                </Button>
              </form>
            ) : (
              <p className="self-center text-sm text-ink/50">Built-in starter · can edit, not delete</p>
            )}
          </div>
          {state?.ok === false ? <p className="mt-3 text-sm text-terracotta-ink">{state.error}</p> : null}
          {state?.ok === true ? <p className="mt-3 text-sm text-moss">{state.message}</p> : null}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 pt-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-0 lg:overflow-hidden">
        <aside className="min-h-0 space-y-4 lg:overflow-y-auto lg:pr-4">
          <div className="rounded-3xl bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs tracking-[0.2em] text-ember uppercase">Design</p>
              {isPhone ? (
                <button
                  type="button"
                  className="text-xs text-terracotta underline-offset-4 hover:underline"
                  onClick={() => setTemplate((prev) => resetAllPhoneSettings(prev))}
                >
                  Reset all phone settings
                </button>
              ) : (
                <button
                  type="button"
                  className="text-xs text-terracotta underline-offset-4 hover:underline"
                  onClick={() =>
                    setTemplate((prev) => resetAllImageCrops(resetDesignDefaults(prev)))
                  }
                >
                  Reset to default
                </button>
              )}
            </div>
            <div className="mt-4">
              <ProposalDesignFields
                design={template.design}
                onChange={(design) => setTemplate((prev) => ({ ...prev, design }))}
                heroImage={findSection(template.sections, "cover")?.data.heroImage || null}
                onHeroImageChange={(heroImage) =>
                  setTemplate((prev) => ({
                    ...prev,
                    sections: prev.sections.map((section) =>
                      section.type === "cover"
                        ? { ...section, data: { ...section.data, heroImage } }
                        : section,
                    ),
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">
              Sections{isPhone ? " · phone order" : ""}
            </p>
            <ul className="mt-3 space-y-2">
              {template.sections.map((section) => (
                <li
                  key={section.id}
                  className={`flex items-center gap-2 rounded-2xl px-2 py-2 ${
                    selected?.id === section.id ? "bg-clay/70" : "hover:bg-sand"
                  }`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-sm"
                    onClick={() => setSelectedId(section.id)}
                  >
                    <span
                      className={
                        section.enabled && !section.mobile?.hidden
                          ? ""
                          : "text-ink/40 line-through"
                      }
                    >
                      {sectionLabel(section.type)}
                      {isPhone && section.mobile?.hidden ? " · hidden" : ""}
                    </span>
                  </button>
                  <button type="button" className="text-xs" onClick={() => moveSection(section.id, -1)}>
                    ↑
                  </button>
                  <button type="button" className="text-xs" onClick={() => moveSection(section.id, 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-xs text-terracotta"
                    onClick={() =>
                      setTemplate((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) => {
                          if (s.id !== section.id) return s;
                          if (isPhone) {
                            const mobile = { ...(s.mobile || {}) };
                            if (mobile.hidden) delete mobile.hidden;
                            else mobile.hidden = true;
                            if (!Object.keys(mobile).length) {
                              const { mobile: _drop, ...rest } = s;
                              return rest;
                            }
                            return { ...s, mobile };
                          }
                          return { ...s, enabled: !s.enabled };
                        }),
                      }))
                    }
                  >
                    {isPhone
                      ? section.mobile?.hidden
                        ? "Hidden"
                        : "Show"
                      : section.enabled
                        ? "On"
                        : "Off"}
                  </button>
                  {!isPhone ? (
                    <button
                      type="button"
                      className="text-xs text-ink/45"
                      onClick={() =>
                        setTemplate((prev) => ({
                          ...prev,
                          sections: prev.sections.filter((s) => s.id !== section.id),
                        }))
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {!isPhone ? (
              <div className="mt-4">
                <Label>Add section</Label>
                <select
                  className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
                  defaultValue=""
                  onChange={(e) => {
                    const type = e.target.value as SectionType;
                    if (!type) return;
                    const section = blankSection(type);
                    setTemplate((prev) => ({ ...prev, sections: [...prev.sections, section] }));
                    setSelectedId(section.id);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Choose type…
                  </option>
                  {SECTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {sectionLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          {selected ? (
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="mb-4 text-xs tracking-[0.2em] text-ember uppercase">
                Edit · {sectionLabel(selected.type)}
              </p>
              <SectionFields
                section={selected}
                onChange={updateSection}
                films={films}
                reviews={reviews}
                reviewSelectRef={reviewSelectRef}
              />
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 flex-col rounded-3xl bg-white/70 p-4 lg:overflow-hidden lg:rounded-none lg:border-l lg:border-ink/10 lg:pl-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">
              Live preview · {viewport}
            </p>
            <EditorViewportToggle />
          </div>
          <div
            ref={previewScrollRef}
            className={`mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-ink/10 bg-sand ${
              isPhone ? "mx-auto w-full max-w-[390px]" : ""
            }`}
          >
            <ProposalView
              proposal={asPreviewProposal(template)}
              mode="admin"
              showPdfButton={false}
              onSelectSection={(id) => {
                skipPreviewScroll.current = true;
                setSelectedId(id);
              }}
              onChooseReview={() => {
                const reviewSection = template.sections.find((s) => s.type === "review");
                if (reviewSection) {
                  skipPreviewScroll.current = true;
                  setSelectedId(reviewSection.id);
                }
                requestAnimationFrame(() => {
                  reviewSelectRef.current?.focus();
                  reviewSelectRef.current?.showPicker?.();
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
