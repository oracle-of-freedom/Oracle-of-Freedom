"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createFromTemplateAction, type ActionState } from "@/app/admin/proposals/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { effectiveStatus, type EffectiveStatus, type Proposal, type ProposalTemplate } from "@/lib/proposals";

const filters: { id: "all" | EffectiveStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "live", label: "Live" },
  { id: "expired", label: "Expired" },
  { id: "archived", label: "Archive" },
];

function statusClass(status: EffectiveStatus) {
  if (status === "live") return "bg-moss text-sand";
  if (status === "draft") return "bg-clay text-ink";
  if (status === "expired") return "bg-ember/30 text-ink";
  return "bg-ink/10 text-ink/70";
}

export function ProposalsList({
  proposals,
  templates,
}: {
  proposals: Proposal[];
  templates: ProposalTemplate[];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [state, action, pending] = useActionState(createFromTemplateAction, null as ActionState);

  const visible = useMemo(() => {
    return proposals.filter((p) => {
      const status = effectiveStatus(p);
      if (filter === "all") return true;
      if (filter === "archived") return status === "archived" || status === "expired";
      if (filter === "expired") return status === "expired";
      return status === filter;
    });
  }, [proposals, filter]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/70 p-5 md:p-6">
        <h2 className="font-serif text-2xl md:text-3xl">New proposal</h2>
        <p className="mt-2 text-sm text-ink/70">
          Start from a template. Templates are only layout and starter copy; each proposal is one
          client&apos;s private deck.
        </p>
        <form action={action} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label>Template</Label>
            <select
              name="templateId"
              required
              className="h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-4"
              defaultValue={templates[0]?.id || ""}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Client name</Label>
            <Input name="clientName" placeholder="Client name" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending} className="w-full md:w-auto">
              {pending ? "Creating…" : "Create proposal"}
            </Button>
          </div>
        </form>
        {state?.ok === false ? <p className="mt-3 text-sm text-terracotta-ink">{state.error}</p> : null}
        <p className="mt-4 text-sm">
          <Link href="/admin/proposals/templates" className="text-terracotta underline-offset-4 hover:underline">
            Manage templates
          </Link>
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === item.id ? "bg-ink text-sand" : "bg-white/70 text-ink/80"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl bg-white/60 px-5 py-8 text-ink/60">Nothing in this list yet.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((proposal) => {
            const status = effectiveStatus(proposal);
            return (
              <li key={proposal.id}>
                <Link
                  href={`/admin/proposals/${proposal.id}`}
                  className="block rounded-3xl bg-white px-5 py-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-2xl">{proposal.clientName || "Untitled client"}</p>
                      <p className="mt-1 text-sm text-ink/60">{proposal.projectTitle}</p>
                      <p className="mt-2 text-xs text-ink/45">/{proposal.slug}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs tracking-wide uppercase ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink/55">
                    Valid until {proposal.validUntil || "—"} · updated{" "}
                    {new Date(proposal.updatedAt).toLocaleDateString("en-GB")}
                  </p>
                  <p className="mt-1 text-sm text-ink/55">
                    {proposal.viewCount || 0}{" "}
                    {(proposal.viewCount || 0) === 1 ? "open" : "opens"}
                    {proposal.lastOpenedAt
                      ? ` · last ${new Date(proposal.lastOpenedAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : " · not opened yet"}
                    {proposal.example ? " · example" : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
