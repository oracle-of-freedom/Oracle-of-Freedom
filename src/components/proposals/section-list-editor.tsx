"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Banknote,
  Calendar,
  CircleHelp,
  Clapperboard,
  Columns2,
  Copy,
  GalleryHorizontal,
  GripVertical,
  Heart,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  ListOrdered,
  ListTree,
  Mail,
  MessageCircle,
  Minus,
  MousePointerClick,
  Package,
  Plus,
  PlusCircle,
  Quote,
  ScrollText,
  Sparkles,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/proposals/confirm-dialog";
import { blankSection } from "@/components/proposals/section-fields";
import { Button } from "@/components/ui/button";
import { blockLibraryItems } from "@/lib/proposal-block-library";
import { phoneSectionOrder } from "@/lib/proposal-mobile";
import {
  duplicateSectionInList,
  insertSectionAt,
  removeSectionById,
  reorderSectionsByIds,
  setPhoneSectionOrder,
} from "@/lib/proposal-section-order";
import {
  newId,
  sectionLabel,
  type ProposalSection,
  type SectionType,
} from "@/lib/proposals";

const ICONS: Record<string, LucideIcon> = {
  image: ImageIcon,
  mail: Mail,
  sparkles: Sparkles,
  minus: Minus,
  calendar: Calendar,
  images: Images,
  "list-ordered": ListOrdered,
  package: Package,
  "plus-circle": PlusCircle,
  banknote: Banknote,
  "scroll-text": ScrollText,
  "message-circle": MessageCircle,
  "arrow-right": ArrowRight,
  heart: Heart,
  type: Type,
  "gallery-horizontal": GalleryHorizontal,
  "circle-help": CircleHelp,
  clapperboard: Clapperboard,
  quote: Quote,
  "layout-grid": LayoutGrid,
  "list-tree": ListTree,
  "mouse-pointer-click": MousePointerClick,
  "columns-2": Columns2,
};

function BlockThumb({ type }: { type: SectionType }) {
  const bars =
    type === "columns" || type === "gallery" || type === "photos" || type === "proof"
      ? 3
      : type === "timeline" || type === "faq" || type === "howIWork"
        ? 4
        : 2;
  return (
    <div
      className="grid h-12 w-full gap-1 rounded-lg bg-sand/80 p-1.5"
      style={{ gridTemplateColumns: `repeat(${Math.min(bars, 3)}, 1fr)` }}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`rounded-sm bg-ink/15 ${i === 0 ? "bg-terracotta/35" : ""}`}
        />
      ))}
    </div>
  );
}

function SortableRow({
  section,
  selected,
  isPhone,
  onSelect,
  onMove,
  onToggle,
  onDuplicate,
  onRequestDelete,
}: {
  section: ProposalSection;
  selected: boolean;
  isPhone: boolean;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-90" : undefined}>
      <div
        className={`flex items-center gap-1 rounded-2xl px-1.5 py-2 ${
          selected ? "bg-clay/70" : "hover:bg-sand"
        }`}
      >
        <button
          type="button"
          className="touch-none shrink-0 rounded-lg p-1.5 text-ink/45 hover:bg-white/70 hover:text-ink"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left text-sm" onClick={onSelect}>
          <span
            className={
              section.enabled && !section.mobile?.hidden ? "" : "text-ink/40 line-through"
            }
          >
            {sectionLabel(section.type)}
            {isPhone && section.mobile?.hidden ? " · hidden" : ""}
          </span>
        </button>
        <button
          type="button"
          className="rounded-lg p-1 text-xs text-ink/50 hover:bg-white/70"
          onClick={() => onMove(-1)}
          aria-label={isPhone ? "Move up on phone" : "Move up"}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-1 text-xs text-ink/50 hover:bg-white/70"
          onClick={() => onMove(1)}
          aria-label={isPhone ? "Move down on phone" : "Move down"}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="px-1 text-xs text-terracotta" onClick={onToggle}>
          {isPhone
            ? section.mobile?.hidden
              ? "Hidden"
              : "Show"
            : section.enabled
              ? "On"
              : "Off"}
        </button>
        {!isPhone ? (
          <>
            <button
              type="button"
              className="rounded-lg p-1 text-ink/45 hover:bg-white/70"
              aria-label="Duplicate block"
              title="Duplicate"
              onClick={onDuplicate}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-lg p-1 text-ink/45 hover:bg-white/70 hover:text-terracotta"
              aria-label="Delete block"
              title="Delete"
              onClick={onRequestDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

function InsertGap({ onInsert }: { onInsert: () => void }) {
  return (
    <li className="group/insert list-none">
      <div className="relative h-3">
        <button
          type="button"
          className="absolute inset-x-2 top-1/2 z-[1] flex h-6 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-ink/20 bg-white/90 text-ink/50 opacity-100 shadow-sm transition hover:border-terracotta hover:text-terracotta md:opacity-0 md:group-hover/insert:opacity-100"
          aria-label="Add block here"
          onClick={onInsert}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function SectionListEditor({
  sections,
  selectedId,
  isPhone,
  onChange,
  onSelect,
}: {
  sections: ProposalSection[];
  selectedId: string | undefined;
  isPhone: boolean;
  onChange: (sections: ProposalSection[]) => void;
  onSelect: (id: string) => void;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const displaySections = useMemo(
    () => (isPhone ? phoneSectionOrder(sections) : sections),
    [isPhone, sections],
  );
  const ids = displaySections.map((section) => section.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function openLibrary(at: number | null) {
    setInsertAt(at);
    setLibraryOpen(true);
  }

  function addBlock(type: SectionType) {
    const section = blankSection(type);
    const at = insertAt == null ? sections.length : insertAt;
    let next = insertSectionAt(sections, section, at);
    if (isPhone) {
      const phoneIds = phoneSectionOrder(sections).map((s) => s.id);
      const phoneAt = insertAt == null ? phoneIds.length : insertAt;
      phoneIds.splice(phoneAt, 0, section.id);
      next = setPhoneSectionOrder(next, phoneIds);
    }
    onChange(next);
    onSelect(section.id);
    setLibraryOpen(false);
    setInsertAt(null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    if (isPhone) onChange(setPhoneSectionOrder(sections, nextIds));
    else onChange(reorderSectionsByIds(sections, nextIds));
  }

  function moveByButtons(id: string, dir: -1 | 1) {
    const index = ids.indexOf(id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const nextIds = arrayMove(ids, index, target);
    if (isPhone) onChange(setPhoneSectionOrder(sections, nextIds));
    else onChange(reorderSectionsByIds(sections, nextIds));
  }

  function toggleVisibility(id: string) {
    onChange(
      sections.map((s) => {
        if (s.id !== id) return s;
        if (isPhone) {
          const mobile = { ...(s.mobile || {}) };
          if (mobile.hidden) delete mobile.hidden;
          else mobile.hidden = true;
          if (!Object.keys(mobile).length) {
            const { mobile: _drop, ...rest } = s;
            return rest as ProposalSection;
          }
          return { ...s, mobile };
        }
        return { ...s, enabled: !s.enabled };
      }),
    );
  }

  const deleteTarget = deleteId ? sections.find((s) => s.id === deleteId) : null;
  const library = blockLibraryItems();

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-ember uppercase">
        Sections{isPhone ? " · phone order" : ""}
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="mt-3">
            {!isPhone ? <InsertGap key="gap-start" onInsert={() => openLibrary(0)} /> : null}
            {displaySections.flatMap((section, index) => {
              const row = (
                <SortableRow
                  key={section.id}
                  section={section}
                  selected={selectedId === section.id}
                  isPhone={isPhone}
                  onSelect={() => onSelect(section.id)}
                  onMove={(dir) => moveByButtons(section.id, dir)}
                  onToggle={() => toggleVisibility(section.id)}
                  onDuplicate={() => {
                    const { sections: next, duplicatedId } = duplicateSectionInList(
                      sections,
                      section.id,
                      newId("sec"),
                    );
                    onChange(next);
                    if (duplicatedId) onSelect(duplicatedId);
                  }}
                  onRequestDelete={() => setDeleteId(section.id)}
                />
              );
              if (isPhone) return [row];
              return [
                row,
                <InsertGap
                  key={`gap-after-${section.id}`}
                  onInsert={() => openLibrary(index + 1)}
                />,
              ];
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {!isPhone ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => openLibrary(null)}
          >
            + Add block
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink/50">
          Switch to Desktop to add, duplicate or delete blocks. Phone ↑↓ and drag change phone order
          only.
        </p>
      )}

      {libraryOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-night/50"
            aria-label="Close block library"
            onClick={() => setLibraryOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add block"
            className="relative z-10 max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-sand p-4 shadow-lg md:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.2em] text-ember uppercase">Add block</p>
                <p className="mt-1 text-sm text-ink/60">
                  {insertAt == null
                    ? "Insert at the end"
                    : insertAt === 0
                      ? "Insert at the start"
                      : `Insert after block ${insertAt}`}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(false)}>
                Close
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {library.map((item) => {
                const Icon = ICONS[item.icon] || Type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    className="rounded-2xl border border-ink/10 bg-white/70 p-3 text-left transition hover:border-terracotta/40 hover:bg-white"
                    onClick={() => addBlock(item.type)}
                  >
                    <BlockThumb type={item.type} />
                    <div className="mt-2 flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{item.name}</p>
                        <p className="mt-0.5 text-xs text-ink/55">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete block?"
        body={
          deleteTarget
            ? `Remove the “${sectionLabel(deleteTarget.type)}” block from this document?`
            : ""
        }
        confirmLabel="Delete"
        confirmTone="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const next = removeSectionById(sections, deleteId);
          onChange(next);
          if (selectedId === deleteId && next[0]) onSelect(next[0].id);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
