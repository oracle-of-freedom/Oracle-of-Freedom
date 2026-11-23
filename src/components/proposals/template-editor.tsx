"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  deleteTemplateAction,
  duplicateTemplateAction,
  saveTemplateAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ProposalView } from "@/components/proposals/proposal-view";
import { blankSection, SectionFields } from "@/components/proposals/section-fields";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  SECTION_TYPES,
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
    sections: template.sections,
  };
}

export function TemplateEditor({ initial }: { initial: ProposalTemplate }) {
  const [template, setTemplate] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || "");
  const [state, action, pending] = useActionState(saveTemplateAction, null as ActionState);
  const selected = template.sections.find((s) => s.id === selectedId) || template.sections[0];

  function updateSection(next: NonNullable<typeof selected>) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setTemplate((prev) => {
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
    <div className="space-y-6">
      <Link href="/admin/proposals/templates" className="text-sm underline underline-offset-4">
        Back to templates
      </Link>

      <div className="rounded-3xl bg-white/70 p-4 md:p-6">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">Sections</p>
            <ul className="mt-3 space-y-2">
              {template.sections.map((section) => (
                <li key={section.id} className="flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-sand">
                  <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={() => setSelectedId(section.id)}>
                    <span className={section.enabled ? "" : "text-ink/40 line-through"}>
                      {sectionLabel(section.type)}
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
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, enabled: !s.enabled } : s,
                        ),
                      }))
                    }
                  >
                    {section.enabled ? "On" : "Off"}
                  </button>
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
                </li>
              ))}
            </ul>
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
          </div>
          {selected ? (
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="mb-4 text-xs tracking-[0.2em] text-ember uppercase">
                Edit · {sectionLabel(selected.type)}
              </p>
              <SectionFields section={selected} onChange={updateSection} />
            </div>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-sand">
          <ProposalView proposal={asPreviewProposal(template)} mode="admin" showPdfButton={false} />
        </div>
      </div>
    </div>
  );
}
