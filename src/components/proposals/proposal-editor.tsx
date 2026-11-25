"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteProposalAction,
  duplicateProposalAction,
  reopenAction,
  saveProposalAction,
  saveProposalAsTemplateAction,
  setStatusAction,
  updateProposalSlugAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ProposalDesignFields } from "@/components/proposals/design-fields";
import {
  EditorViewportProvider,
  EditorViewportToggle,
  useEditorViewport,
} from "@/components/proposals/editor-viewport";
import { ProposalPdfButton } from "@/components/proposals/proposal-pdf-button";
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
  PROPOSAL_SLUG_MAX,
  cleanProposalSlug,
  depositAmount,
  effectiveStatus,
  findSection,
  previewUrl,
  proposalWarnings,
  publicUrl,
  sectionLabel,
  suggestProposalSlug,
  type Proposal,
  type SectionType,
} from "@/lib/proposals";

const hints = [
  "No em dashes in client-facing copy.",
  "Portfolio line and sign-off must match the exact wording.",
  "Never write “I'm a photographer”. She is a photo and film storyteller.",
  "Lead with the client. About me stays short and late, or off.",
];

export function ProposalEditor({
  initial,
  origin,
  reviews,
  films = [],
  takenSlugs = [],
}: {
  initial: Proposal;
  origin: string;
  reviews: ProposalStudioReview[];
  films?: Film[];
  /** Other proposals' current and previous slugs, for Suggest uniqueness. */
  takenSlugs?: string[];
}) {
  return (
    <EditorViewportProvider>
      <ProposalEditorInner
        initial={initial}
        origin={origin}
        reviews={reviews}
        films={films}
        takenSlugs={takenSlugs}
      />
    </EditorViewportProvider>
  );
}

function ProposalEditorInner({
  initial,
  origin,
  reviews,
  films = [],
  takenSlugs = [],
}: {
  initial: Proposal;
  origin: string;
  reviews: ProposalStudioReview[];
  films?: Film[];
  takenSlugs?: string[];
}) {
  const { viewport, isPhone } = useEditorViewport();
  const [proposal, setProposal] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || "");
  const [copied, setCopied] = useState<"live" | "preview" | null>(null);
  const [slugDraft, setSlugDraft] = useState(initial.slug);
  const [state, action, pending] = useActionState(saveProposalAction, null as ActionState);
  const [slugState, slugAction, slugPending] = useActionState(
    updateProposalSlugAction,
    null as ActionState,
  );
  const reviewSelectRef = useRef<HTMLSelectElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const skipPreviewScroll = useRef(false);

  const selected = proposal.sections.find((s) => s.id === selectedId) || proposal.sections[0];
  const warnings = useMemo(() => proposalWarnings(proposal), [proposal]);
  const status = effectiveStatus(proposal);
  const liveLink = publicUrl(proposal.slug, origin);
  const draftPreview = previewUrl(proposal.slug, proposal.previewToken, origin);
  const investment = findSection(proposal.sections, "investment");
  const deposit = investment
    ? depositAmount(investment.data.packagePriceUsd, investment.data.depositPercent)
    : 0;

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
    if (slugState?.ok === true && slugState.slug) {
      const nextSlug = slugState.slug;
      setProposal((prev) => (prev.slug === nextSlug ? prev : { ...prev, slug: nextSlug }));
      setSlugDraft(nextSlug);
    }
  }, [slugState]);

  function updateSection(next: typeof selected) {
    if (!next) return;
    setProposal((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setProposal((prev) => {
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

  function addSection(type: SectionType) {
    const section = blankSection(type);
    setProposal((prev) => ({ ...prev, sections: [...prev.sections, section] }));
    setSelectedId(section.id);
  }

  async function copy(kind: "live" | "preview") {
    const url = kind === "live" ? liveLink : draftPreview;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  function onSlugDraftChange(value: string) {
    setSlugDraft(cleanProposalSlug(value).slice(0, PROPOSAL_SLUG_MAX));
  }

  function suggestSlug() {
    try {
      setSlugDraft(suggestProposalSlug(proposal.clientName || "proposal", takenSlugs));
    } catch {
      // Keep the current draft if nothing free is available.
    }
  }

  return (
    <div>
      <div className="space-y-3 border-b border-ink/10 px-1 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/proposals" className="text-sm underline underline-offset-4">
            Back to proposals
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs tracking-wide uppercase ${
              status === "live"
                ? "bg-moss text-sand"
                : status === "draft"
                  ? "bg-clay text-ink"
                  : status === "expired"
                    ? "bg-ember/30 text-ink"
                    : "bg-ink/10 text-ink/70"
            }`}
          >
            {status}
          </span>
          <span className="text-sm text-ink/60">
            {proposal.viewCount || 0} {(proposal.viewCount || 0) === 1 ? "open" : "opens"}
            {proposal.lastOpenedAt
              ? ` · last ${new Date(proposal.lastOpenedAt).toLocaleString("en-GB")}`
              : " · not opened yet"}
          </span>
          <ProposalPdfButton />
          <p className="text-sm text-ink/55">
            {isPhone
              ? "Phone edits apply under 768px only."
              : "Desktop is the default. Use the preview toggle for Phone."}
          </p>
        </div>

        <div className="rounded-3xl bg-white/70 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Client name</Label>
              <Input
                value={proposal.clientName}
                onChange={(e) => {
                  const clientName = e.target.value;
                  setProposal((prev) => {
                    const sections = prev.sections.map((s) => {
                      if (s.type === "cover") {
                        const previousKicker = `Prepared for ${prev.clientName}`;
                        const keepCustom =
                          s.data.kicker.trim() !== "" &&
                          s.data.kicker !== previousKicker &&
                          s.data.kicker !== "Prepared for [Client name]";
                        return {
                          ...s,
                          data: {
                            ...s.data,
                            clientName,
                            kicker: keepCustom
                              ? s.data.kicker
                              : s.data.kicker.trim()
                                ? `Prepared for ${clientName}`
                                : "",
                          },
                        };
                      }
                      if (s.type === "investment") {
                        return { ...s, data: { ...s.data, clientLabel: `For ${clientName}` } };
                      }
                      return s;
                    });
                    return { ...prev, clientName, sections };
                  });
                }}
              />
            </div>
            <div>
              <Label>Project title</Label>
              <Input
                value={proposal.projectTitle}
                onChange={(e) => setProposal((prev) => ({ ...prev, projectTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label>Proposal date</Label>
              <Input
                type="date"
                value={proposal.proposalDate}
                onChange={(e) => {
                  const proposalDate = e.target.value;
                  setProposal((prev) => {
                    const sections = prev.sections.map((s) =>
                      s.type === "cover" ? { ...s, data: { ...s.data, proposalDate } } : s,
                    );
                    return { ...prev, proposalDate, sections };
                  });
                }}
              />
            </div>
            <div>
              <Label>Offer valid until</Label>
              <Input
                type="date"
                value={proposal.validUntil}
                onChange={(e) => setProposal((prev) => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
          </div>
          {investment ? (
            <p className="mt-3 text-sm text-ink/60">
              Deposit auto-calc: {investment.data.depositPercent}% = ${deposit || "0"}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={action}>
              <input type="hidden" name="proposalJson" value={JSON.stringify(proposal)} />
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save proposal"}
              </Button>
            </form>
            {proposal.status === "draft" ? (
              <form action={setStatusAction}>
                <input type="hidden" name="id" value={proposal.id} />
                <input type="hidden" name="status" value="live" />
                <Button type="submit" variant="moss">
                  Make live
                </Button>
              </form>
            ) : null}
            {proposal.status === "live" ? (
              <form action={setStatusAction}>
                <input type="hidden" name="id" value={proposal.id} />
                <input type="hidden" name="status" value="draft" />
                <Button type="submit" variant="outline">
                  Back to draft
                </Button>
              </form>
            ) : null}
            {(status === "expired" || proposal.status === "archived") && (
              <form action={reopenAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={proposal.id} />
                <Input
                  type="date"
                  name="validUntil"
                  defaultValue={proposal.validUntil}
                  className="w-auto"
                  required
                />
                <Button type="submit" variant="moss">
                  Reopen with new date
                </Button>
              </form>
            )}
            <form action={setStatusAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <input type="hidden" name="status" value="archived" />
              <Button type="submit" variant="outline">
                Archive
              </Button>
            </form>
            <form action={duplicateProposalAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={proposal.id} />
              <Input name="clientName" placeholder="New client name" className="w-40" required />
              <Button type="submit" variant="outline">
                Duplicate for client
              </Button>
            </form>
            <form action={saveProposalAsTemplateAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={proposal.id} />
              <Input
                name="name"
                placeholder="Template name"
                className="w-48"
                defaultValue={`${proposal.clientName} template`}
              />
              <Button type="submit" variant="outline">
                Save as template
              </Button>
            </form>
            <form action={deleteProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <Button type="submit" variant="outline">
                Delete
              </Button>
            </form>
          </div>
          {state?.ok === false ? <p className="mt-3 text-sm text-terracotta-ink">{state.error}</p> : null}
          {state?.ok === true ? <p className="mt-3 text-sm text-moss">{state.message || "Saved."}</p> : null}
        </div>

        <details className="rounded-3xl bg-white/70 p-4">
          <summary className="cursor-pointer text-xs tracking-[0.2em] text-ember uppercase">
            Links & hints
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="proposal-slug">Proposal link</Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink/60">oracleoffreedom.com/p/</span>
                <Input
                  id="proposal-slug"
                  value={slugDraft}
                  onChange={(e) => onSlugDraftChange(e.target.value)}
                  className="max-w-xs font-mono text-sm"
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="proposal-slug-hint"
                />
              </div>
              <p id="proposal-slug-hint" className="mt-1 text-xs text-ink/50">
                Lowercase letters, numbers and hyphens · 3–60 characters
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={slugAction}>
                  <input type="hidden" name="id" value={proposal.id} />
                  <input type="hidden" name="slug" value={slugDraft} />
                  <Button type="submit" size="sm" disabled={slugPending || !slugDraft}>
                    {slugPending ? "Saving…" : "Save link"}
                  </Button>
                </form>
                <Button type="button" size="sm" variant="outline" onClick={() => copy("live")}>
                  {copied === "live" ? "Copied" : "Copy link"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={suggestSlug}>
                  Suggest
                </Button>
              </div>
              {slugState?.ok === false ? (
                <p className="mt-2 text-sm text-terracotta-ink">{slugState.error}</p>
              ) : null}
              {slugState?.ok === true ? (
                <p className="mt-2 text-sm text-moss">{slugState.message || "Link saved."}</p>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-ink/60">Private live link</p>
                <p className="mt-1 break-all text-sm">{liveLink}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => copy("live")}>
                    {copied === "live" ? "Copied" : "Copy link"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a href={liveLink} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-ink/60">Draft preview (no prices) · token-gated</p>
                <p className="mt-1 break-all text-sm">{draftPreview}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => copy("preview")}>
                    {copied === "preview" ? "Copied" : "Copy preview"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a href={draftPreview} target="_blank" rel="noreferrer">
                      Open preview
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-ink/75">
            {hints.map((hint) => (
              <li key={hint}>· {hint}</li>
            ))}
          </ul>
          {warnings.length ? (
            <ul className="mt-3 space-y-1 text-sm text-terracotta-ink">
              {warnings.map((w) => (
                <li key={w.id}>⚠ {w.message}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-moss">No structural warnings right now.</p>
          )}
        </details>
      </div>

      {/*
        Tall wrapper gives sticky travel so the panes can pin under the viewport
        top after the chrome scrolls away (equal-height sticky children alone cannot).
      */}
      <div className="relative mt-4 lg:min-h-[calc(100dvh-16px+10rem)]">
        <div className="grid items-stretch gap-4 lg:sticky lg:top-0 lg:h-[calc(100dvh-16px)] lg:min-h-[70dvh] lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-0">
        <aside className="space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-4">
          <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 border-b border-ink/10 bg-sand/95 px-1 py-2 backdrop-blur-sm">
            <form action={action}>
              <input type="hidden" name="proposalJson" value={JSON.stringify(proposal)} />
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
              <div className="flex flex-wrap gap-3">
                {isPhone ? (
                  <button
                    type="button"
                    className="text-xs text-terracotta underline-offset-4 hover:underline"
                    onClick={() => setProposal((prev) => resetAllPhoneSettings(prev))}
                  >
                    Reset all phone settings
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-terracotta underline-offset-4 hover:underline"
                    onClick={() =>
                      setProposal((prev) => resetAllImageCrops(resetDesignDefaults(prev)))
                    }
                  >
                    Reset to default
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <ProposalDesignFields
                design={proposal.design}
                onChange={(design) => setProposal((prev) => ({ ...prev, design }))}
                heroImage={findSection(proposal.sections, "cover")?.data.heroImage || null}
                onHeroImageChange={(heroImage) =>
                  setProposal((prev) => ({
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
              {proposal.sections.map((section) => (
                <li key={section.id}>
                  <div
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
                    <button
                      type="button"
                      className="text-xs text-ink/50"
                      onClick={() => moveSection(section.id, -1)}
                      aria-label={isPhone ? "Move up on phone" : "Move up"}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs text-ink/50"
                      onClick={() => moveSection(section.id, 1)}
                      aria-label={isPhone ? "Move down on phone" : "Move down"}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-xs text-terracotta"
                      onClick={() =>
                        setProposal((prev) => ({
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
                        onClick={() => {
                          setProposal((prev) => ({
                            ...prev,
                            sections: prev.sections.filter((s) => s.id !== section.id),
                          }));
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
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
                  if (type) addSection(type);
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
              <p className="text-xs tracking-[0.2em] text-ember uppercase">
                Edit · {sectionLabel(selected.type)}
              </p>
              <div className="mt-4">
                <SectionFields
                  section={selected}
                  onChange={updateSection}
                  films={films}
                  reviews={reviews}
                  reviewSelectRef={reviewSelectRef}
                />
              </div>
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
              proposal={proposal}
              mode="admin"
              showPdfButton={false}
              onSelectSection={(id) => {
                skipPreviewScroll.current = true;
                setSelectedId(id);
              }}
              onChooseReview={() => {
                const reviewSection = proposal.sections.find((s) => s.type === "review");
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
