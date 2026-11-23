"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  deleteProposalAction,
  duplicateProposalAction,
  reopenAction,
  saveProposalAction,
  setStatusAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ProposalView } from "@/components/proposals/proposal-view";
import { blankSection, SectionFields } from "@/components/proposals/section-fields";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  SECTION_TYPES,
  depositAmount,
  effectiveStatus,
  findSection,
  previewUrl,
  proposalWarnings,
  publicUrl,
  sectionLabel,
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
}: {
  initial: Proposal;
  origin: string;
  reviews: { id: string; name: string; quote: string; service: string }[];
}) {
  const [proposal, setProposal] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || "");
  const [previewMode, setPreviewMode] = useState<"desktop" | "phone">("desktop");
  const [copied, setCopied] = useState<"live" | "preview" | null>(null);
  const [state, action, pending] = useActionState(saveProposalAction, null as ActionState);

  const selected = proposal.sections.find((s) => s.id === selectedId) || proposal.sections[0];
  const warnings = useMemo(() => proposalWarnings(proposal), [proposal]);
  const status = effectiveStatus(proposal);
  const liveLink = publicUrl(proposal.slug, origin);
  const draftPreview = previewUrl(proposal.slug, proposal.previewToken, origin);
  const investment = findSection(proposal.sections, "investment");
  const deposit = investment
    ? depositAmount(investment.data.packagePriceUsd, investment.data.depositPercent)
    : 0;

  function updateSection(next: typeof selected) {
    if (!next) return;
    setProposal((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setProposal((prev) => {
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

  return (
    <div className="space-y-6">
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
      </div>

      <div className="rounded-3xl bg-white/70 p-4 md:p-6">
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
                      return {
                        ...s,
                        data: {
                          ...s.data,
                          clientName,
                          kicker: `Prepared for ${clientName}`,
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
          <p className="mt-4 text-sm text-ink/60">
            Deposit auto-calc: {investment.data.depositPercent}% = ${deposit || "—"}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="rounded-3xl bg-white/70 p-4 md:p-6">
        <p className="text-xs tracking-[0.2em] text-ember uppercase">Links</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            <p className="text-sm text-ink/60">
              Draft preview (no prices) · token-gated
            </p>
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
        <p className="mt-3 text-xs text-ink/50">
          Admin session also opens any draft at the live URL with full prices. Public visitors need the
          preview token for drafts, and never see prices there.
        </p>
      </div>

      <div className="rounded-3xl border border-ember/30 bg-ember/10 p-4 md:p-5">
        <p className="text-xs tracking-[0.2em] text-ember uppercase">Editor hints</p>
        <ul className="mt-3 space-y-1 text-sm text-ink/75">
          {hints.map((hint) => (
            <li key={hint}>· {hint}</li>
          ))}
        </ul>
        {warnings.length ? (
          <ul className="mt-4 space-y-1 text-sm text-terracotta-ink">
            {warnings.map((w) => (
              <li key={w.id}>⚠ {w.message}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-moss">No structural warnings right now.</p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/70 p-4">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">Sections</p>
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
                      <span className={section.enabled ? "" : "text-ink/40 line-through"}>
                        {sectionLabel(section.type)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="text-xs text-ink/50"
                      onClick={() => moveSection(section.id, -1)}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs text-ink/50"
                      onClick={() => moveSection(section.id, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-xs text-terracotta"
                      onClick={() =>
                        setProposal((prev) => ({
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
                      onClick={() => {
                        setProposal((prev) => ({
                          ...prev,
                          sections: prev.sections.filter((s) => s.id !== section.id),
                        }));
                      }}
                    >
                      ×
                    </button>
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
                <SectionFields section={selected} onChange={updateSection} />
              </div>
              {selected.type === "review" && reviews.length ? (
                <div className="mt-4">
                  <Label>Pick from studio reviews</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
                    defaultValue=""
                    onChange={(e) => {
                      const review = reviews.find((r) => r.id === e.target.value);
                      if (!review || selected.type !== "review") return;
                      updateSection({
                        ...selected,
                        data: {
                          ...selected.data,
                          quote: review.quote,
                          name: review.name,
                          service: review.service,
                          sourceReviewId: review.id,
                        },
                      });
                      e.target.value = "";
                    }}
                  >
                    <option value="">Choose a review…</option>
                    {reviews.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl bg-white/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tracking-[0.2em] text-ember uppercase">Live preview</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  previewMode === "desktop" ? "bg-ink text-sand" : "bg-sand text-ink"
                }`}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  previewMode === "phone" ? "bg-ink text-sand" : "bg-sand text-ink"
                }`}
                onClick={() => setPreviewMode("phone")}
              >
                Phone
              </button>
            </div>
          </div>
          <div
            className={`mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-sand ${
              previewMode === "phone" ? "mx-auto max-w-[390px]" : ""
            }`}
          >
            <div className={previewMode === "phone" ? "max-h-[80vh] overflow-y-auto" : ""}>
              <ProposalView proposal={proposal} mode="admin" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
