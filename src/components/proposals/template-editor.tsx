"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  deleteTemplatesAction,
  duplicateTemplateAction,
  saveTemplateAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ConfirmDialog } from "@/components/proposals/confirm-dialog";
import { ProposalDesignFields } from "@/components/proposals/design-fields";
import {
  EditorViewportProvider,
  EditorViewportToggle,
  useEditorViewport,
} from "@/components/proposals/editor-viewport";
import { ProposalView } from "@/components/proposals/proposal-view";
import { SectionFields } from "@/components/proposals/section-fields";
import { SectionListEditor } from "@/components/proposals/section-list-editor";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Film } from "@/lib/content";
import { resetDesignDefaults } from "@/lib/proposal-design";
import { resetAllImageCrops } from "@/lib/proposal-image-crop";
import { resetAllPhoneSettings } from "@/lib/proposal-mobile";
import type { ProposalStudioReview } from "@/lib/proposal-reviews";
import {
  buildTemplateExport,
  templateExportFilename,
} from "@/lib/proposal-template-io";
import {
  findSection,
  sectionLabel,
  todayIsoDate,
  type Proposal,
  type ProposalTemplate,
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
  const router = useRouter();
  const { viewport, isPhone } = useEditorViewport();
  const [template, setTemplate] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(saveTemplateAction, null as ActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTemplatesAction,
    null as ActionState,
  );
  const reviewSelectRef = useRef<HTMLSelectElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);
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

  useEffect(() => {
    if (deleteState?.ok === true) {
      router.push("/admin/proposals/templates");
      router.refresh();
      return;
    }
    if (deleteState?.ok === false) {
      setConfirmDelete(false);
      setDeleteError(deleteState.error);
    }
  }, [deleteState, router]);

  function updateSection(next: NonNullable<typeof selected>) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  }

  function exportTemplateFile() {
    const payload = buildTemplateExport(template);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = templateExportFilename(template.name);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="space-y-3 border-b border-ink/10 px-1 pb-4">
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
            <Button type="button" variant="outline" onClick={exportTemplateFile}>
              Export
            </Button>
            {!template.builtin ? (
              <>
                <form ref={deleteFormRef} action={deleteAction} className="hidden" aria-hidden="true">
                  <input type="hidden" name="id" value={template.id} />
                </form>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDelete(true);
                  }}
                >
                  Delete
                </Button>
              </>
            ) : (
              <p className="self-center text-sm text-ink/50">
                Built-in starter · can edit, not delete
                {template.hidden ? " · hidden from list" : ""}
              </p>
            )}
          </div>
          {state?.ok === false ? <p className="mt-3 text-sm text-terracotta-ink">{state.error}</p> : null}
          {state?.ok === true ? <p className="mt-3 text-sm text-moss">{state.message}</p> : null}
          {deleteError ? <p className="mt-3 text-sm text-terracotta-ink">{deleteError}</p> : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete template?"
        body={`Delete '${template.name}'? This can't be undone.`}
        confirmLabel="Delete"
        confirmTone="danger"
        pending={deletePending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteFormRef.current?.requestSubmit()}
      />

      <div className="relative mt-4 lg:min-h-[calc(100dvh-16px+10rem)]">
        <div className="grid items-stretch gap-4 lg:sticky lg:top-0 lg:h-[calc(100dvh-16px)] lg:min-h-[70dvh] lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-0">
        <aside className="space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-4">
          <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 border-b border-ink/10 bg-sand/95 px-1 py-2 backdrop-blur-sm">
            <form action={action}>
              <input type="hidden" name="templateJson" value={JSON.stringify(template)} />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </form>
            {state?.ok === false ? (
              <p className="text-xs text-terracotta-ink">{state.error}</p>
            ) : null}
            {state?.ok === true ? (
              <p className="text-xs text-moss">{state.message || "Saved."}</p>
            ) : null}
          </div>
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
            <SectionListEditor
              sections={template.sections}
              selectedId={selected?.id}
              isPhone={isPhone}
              onChange={(sections) => setTemplate((prev) => ({ ...prev, sections }))}
              onSelect={setSelectedId}
            />
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

        <div
          ref={previewScrollRef}
          className="rounded-3xl bg-white/70 p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-none lg:border-l lg:border-ink/10 lg:pl-4"
        >
          <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-sand/95 px-1 py-2 backdrop-blur-sm lg:bg-white/95">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">
              Live preview · {viewport}
            </p>
            <EditorViewportToggle />
          </div>
          <div
            className={`rounded-2xl border border-ink/10 bg-sand ${
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
    </div>
  );
}
