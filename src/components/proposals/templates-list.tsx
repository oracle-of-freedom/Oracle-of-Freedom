"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteTemplatesAction,
  duplicateTemplateAction,
  renameTemplateAction,
  setTemplatesHiddenAction,
  type ActionState,
} from "@/app/admin/proposals/actions";
import { ConfirmDialog } from "@/components/proposals/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hiddenStarterTemplates,
  visibleTemplates,
} from "@/lib/proposal-template-manage";
import type { ProposalTemplate } from "@/lib/proposals";

type ConfirmKind = "delete" | "hide" | null;

export function TemplatesList({ initial }: { initial: ProposalTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; ids: string[] }>({
    kind: null,
    ids: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTemplatesAction,
    null as ActionState,
  );
  const [hideState, hideAction, hidePending] = useActionState(
    setTemplatesHiddenAction,
    null as ActionState,
  );
  const [renameState, renameAction, renamePending] = useActionState(
    renameTemplateAction,
    null as ActionState,
  );

  const deleteFormRef = useRef<HTMLFormElement>(null);
  const hideFormRef = useRef<HTMLFormElement>(null);
  const renameFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setTemplates(initial);
  }, [initial]);

  useEffect(() => {
    if (deleteState?.ok === true && deleteState.ids?.length) {
      const removed = new Set(deleteState.ids);
      setTemplates((prev) => prev.filter((template) => !removed.has(template.id)));
      setSelected((prev) => new Set([...prev].filter((id) => !removed.has(id))));
      setConfirm({ kind: null, ids: [] });
      setMessage(deleteState.message || "Deleted.");
      setError(null);
      router.refresh();
    } else if (deleteState?.ok === false) {
      setError(deleteState.error);
      setConfirm({ kind: null, ids: [] });
    }
  }, [deleteState, router]);

  useEffect(() => {
    if (hideState?.ok === true && hideState.ids?.length) {
      const ids = new Set(hideState.ids);
      const hidden = Boolean(hideState.hidden);
      setTemplates((prev) =>
        prev.map((template) => {
          if (!ids.has(template.id)) return template;
          if (hidden) return { ...template, hidden: true };
          const next = { ...template };
          delete next.hidden;
          return next;
        }),
      );
      setSelected((prev) => new Set([...prev].filter((id) => !ids.has(id))));
      setConfirm({ kind: null, ids: [] });
      setMessage(hideState.message || (hidden ? "Hidden." : "Restored."));
      setError(null);
      router.refresh();
    } else if (hideState?.ok === false) {
      setError(hideState.error);
      setConfirm({ kind: null, ids: [] });
    }
  }, [hideState, router]);

  useEffect(() => {
    if (renameState?.ok === true && renameState.id && renameState.name) {
      const { id, name } = renameState;
      setTemplates((prev) =>
        prev.map((template) => (template.id === id ? { ...template, name } : template)),
      );
      setRenamingId(null);
      setMessage(renameState.message || "Renamed.");
      setError(null);
      router.refresh();
    } else if (renameState?.ok === false) {
      setError(renameState.error);
    }
  }, [renameState, router]);

  const mainList = useMemo(() => visibleTemplates(templates), [templates]);
  const hiddenStarters = useMemo(() => hiddenStarterTemplates(templates), [templates]);

  const selectedTemplates = useMemo(
    () => templates.filter((template) => selected.has(template.id)),
    [templates, selected],
  );
  const selectedCustoms = selectedTemplates.filter((template) => !template.builtin);
  const selectedStarters = selectedTemplates.filter((template) => template.builtin);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function beginRename(template: ProposalTemplate) {
    setRenamingId(template.id);
    setRenameValue(template.name);
    setError(null);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  function submitRename() {
    if (!renamingId) return;
    const form = renameFormRef.current;
    if (!form) return;
    const idInput = form.elements.namedItem("id") as HTMLInputElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    idInput.value = renamingId;
    nameInput.value = renameValue;
    form.requestSubmit();
  }

  function openConfirm(kind: ConfirmKind, ids: string[]) {
    setError(null);
    setConfirm({ kind, ids });
  }

  function confirmBody() {
    const names = confirm.ids.map(
      (id) => templates.find((template) => template.id === id)?.name || id,
    );
    if (confirm.kind === "delete") {
      if (names.length === 1) {
        return `Delete '${names[0]}'? This can't be undone.`;
      }
      return `Delete these templates? This can't be undone.\n\n${names.map((name) => `· ${name}`).join("\n")}`;
    }
    if (confirm.kind === "hide") {
      if (names.length === 1) {
        return `Hide '${names[0]}'? You can bring it back from Show hidden starters.`;
      }
      return `Hide these starters? You can bring them back later.\n\n${names.map((name) => `· ${name}`).join("\n")}`;
    }
    return "";
  }

  function runConfirm() {
    if (confirm.kind === "delete") {
      const form = deleteFormRef.current;
      if (!form) return;
      form.querySelectorAll('input[name="ids"]').forEach((node) => node.remove());
      for (const id of confirm.ids) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "ids";
        input.value = id;
        form.appendChild(input);
      }
      form.requestSubmit();
      return;
    }
    if (confirm.kind === "hide") {
      const form = hideFormRef.current;
      if (!form) return;
      form.querySelectorAll('input[name="ids"]').forEach((node) => node.remove());
      (form.elements.namedItem("hidden") as HTMLInputElement).value = "true";
      for (const id of confirm.ids) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "ids";
        input.value = id;
        form.appendChild(input);
      }
      form.requestSubmit();
    }
  }

  function unhide(ids: string[]) {
    const form = hideFormRef.current;
    if (!form) return;
    form.querySelectorAll('input[name="ids"]').forEach((node) => node.remove());
    (form.elements.namedItem("hidden") as HTMLInputElement).value = "false";
    for (const id of ids) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "ids";
      input.value = id;
      form.appendChild(input);
    }
    form.requestSubmit();
  }

  const busy = deletePending || hidePending || renamePending;

  return (
    <div className="space-y-4">
      <form ref={deleteFormRef} action={deleteAction} className="hidden" aria-hidden="true" />
      <form ref={hideFormRef} action={hideAction} className="hidden" aria-hidden="true">
        <input type="hidden" name="hidden" defaultValue="true" />
      </form>
      <form ref={renameFormRef} action={renameAction} className="hidden" aria-hidden="true">
        <input type="hidden" name="id" defaultValue="" />
        <input type="hidden" name="name" defaultValue="" />
      </form>

      {selected.size > 0 ? (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-3xl bg-ink px-4 py-3 text-sand shadow-md">
          <p className="mr-auto text-sm">{selected.size} selected</p>
          {selectedCustoms.length ? (
            <Button
              type="button"
              size="sm"
              className="bg-terracotta text-white hover:bg-[#9a4522]"
              disabled={busy}
              onClick={() => openConfirm("delete", selectedCustoms.map((t) => t.id))}
            >
              Delete selected
            </Button>
          ) : null}
          {selectedStarters.length ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-sand/40 text-sand hover:border-sand hover:text-sand"
              disabled={busy}
              onClick={() => openConfirm("hide", selectedStarters.map((t) => t.id))}
            >
              Hide selected
            </Button>
          ) : null}
          <button
            type="button"
            className="text-sm text-sand/70 underline-offset-4 hover:underline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-terracotta-ink">{error}</p> : null}
      {message ? <p className="text-sm text-moss">{message}</p> : null}

      <ul className="space-y-3">
        {mainList.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            checked={selected.has(template.id)}
            renaming={renamingId === template.id}
            renameValue={renameValue}
            busy={busy}
            onToggle={() => toggleSelected(template.id)}
            onRenameValue={setRenameValue}
            onBeginRename={() => beginRename(template)}
            onCancelRename={cancelRename}
            onSaveRename={submitRename}
            onDelete={() => openConfirm("delete", [template.id])}
            onHide={() => openConfirm("hide", [template.id])}
          />
        ))}
      </ul>

      {mainList.length === 0 ? (
        <p className="rounded-3xl bg-white/60 px-5 py-8 text-ink/60">
          No visible templates. Restore a hidden starter below, or create a new template.
        </p>
      ) : null}

      {hiddenStarters.length ? (
        <div className="pt-2">
          <button
            type="button"
            className="text-sm text-terracotta underline-offset-4 hover:underline"
            onClick={() => setShowHidden((prev) => !prev)}
          >
            {showHidden
              ? "Hide hidden starters"
              : `Show hidden starters (${hiddenStarters.length})`}
          </button>
          {showHidden ? (
            <ul className="mt-3 space-y-3">
              {hiddenStarters.map((template) => (
                <li
                  key={template.id}
                  className="rounded-3xl bg-white/50 px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-2xl text-ink/70">{template.name}</p>
                      <p className="mt-1 text-sm text-ink/50">
                        Hidden starter · {template.kind}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => unhide([template.id])}
                    >
                      Unhide
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.kind != null}
        title={confirm.kind === "hide" ? "Hide starter?" : "Delete template?"}
        body={confirmBody()}
        confirmLabel={confirm.kind === "hide" ? "Hide" : "Delete"}
        confirmTone={confirm.kind === "hide" ? "default" : "danger"}
        pending={busy}
        onCancel={() => setConfirm({ kind: null, ids: [] })}
        onConfirm={runConfirm}
      />
    </div>
  );
}

function TemplateRow({
  template,
  checked,
  renaming,
  renameValue,
  busy,
  onToggle,
  onRenameValue,
  onBeginRename,
  onCancelRename,
  onSaveRename,
  onDelete,
  onHide,
}: {
  template: ProposalTemplate;
  checked: boolean;
  renaming: boolean;
  renameValue: string;
  busy: boolean;
  onToggle: () => void;
  onRenameValue: (value: string) => void;
  onBeginRename: () => void;
  onCancelRename: () => void;
  onSaveRename: () => void;
  onDelete: () => void;
  onHide: () => void;
}) {
  return (
    <li className="rounded-3xl bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="size-4 rounded border-ink/30"
            aria-label={`Select ${template.name}`}
          />
        </label>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => onRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSaveRename();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onCancelRename();
                  }
                }}
                className="max-w-md"
                autoFocus
                aria-label="Template name"
              />
              <Button type="button" size="sm" disabled={busy} onClick={onSaveRename}>
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancelRename}>
                Cancel
              </Button>
            </div>
          ) : (
            <p className="font-serif text-3xl">{template.name}</p>
          )}
          <p className="mt-2 text-sm text-ink/60">
            {template.sections.filter((s) => s.enabled).length} sections
            {template.builtin ? " · starter" : ""}
            <span className="text-ink/45"> · {template.kind}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" asChild>
          <Link href={`/admin/proposals/templates/${template.id}`}>Open</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy || renaming} onClick={onBeginRename}>
          Rename
        </Button>
        <form action={duplicateTemplateAction}>
          <input type="hidden" name="id" value={template.id} />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            Duplicate
          </Button>
        </form>
        {template.builtin ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onHide}>
            Hide
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-terracotta-ink hover:border-terracotta hover:text-terracotta-ink"
            disabled={busy}
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}
