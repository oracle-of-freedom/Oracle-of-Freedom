import type { SectionType } from "@/lib/proposals";
import { sectionLabel } from "@/lib/proposals";

export type BlockLibraryItem = {
  type: SectionType;
  name: string;
  description: string;
  /** Lucide-style icon key used by the library UI. */
  icon: string;
};

const DESCRIPTIONS: Record<SectionType, string> = {
  cover: "Hero with client name, headline and photo",
  welcome: "Opening letter or short intro",
  noticed: "Cards about what you noticed",
  divider: "Full-bleed photo or line break",
  plan: "Dates, scenes and day flow",
  proof: "Photo grid, portfolio line and video",
  howIWork: "Numbered steps for how you work",
  deliverables: "What’s included packages",
  addon: "Optional extra with price lines",
  investment: "Package price and deposit",
  terms: "Bullet list of terms",
  review: "Client quote with optional photo",
  nextStep: "CTA and offer deadline",
  signOff: "With Love closing",
  text: "Simple heading and body",
  photos: "Horizontal photo strip",
  faq: "Expandable questions and answers",
  video: "Standalone film with cover",
  quote: "Large pull quote",
  gallery: "Multi-column photo grid",
  timeline: "Itinerary or schedule",
  cta: "Heading, text and buttons",
  columns: "Two or three text columns",
};

const ICONS: Record<SectionType, string> = {
  cover: "image",
  welcome: "mail",
  noticed: "sparkles",
  divider: "minus",
  plan: "calendar",
  proof: "images",
  howIWork: "list-ordered",
  deliverables: "package",
  addon: "plus-circle",
  investment: "banknote",
  terms: "scroll-text",
  review: "message-circle",
  nextStep: "arrow-right",
  signOff: "heart",
  text: "type",
  photos: "gallery-horizontal",
  faq: "circle-help",
  video: "clapperboard",
  quote: "quote",
  gallery: "layout-grid",
  timeline: "list-tree",
  cta: "mouse-pointer-click",
  columns: "columns-2",
};

/** Blocks shown in the Add library (every section type). */
export function blockLibraryItems(): BlockLibraryItem[] {
  return (Object.keys(DESCRIPTIONS) as SectionType[]).map((type) => ({
    type,
    name: sectionLabel(type),
    description: DESCRIPTIONS[type],
    icon: ICONS[type],
  }));
}
