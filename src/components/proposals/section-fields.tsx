"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  HEADING_EMPHASIS,
  SECTION_LAYOUTS,
  defaultLayoutFor,
  newId,
  type HeadingEmphasis,
  type PriceLine,
  type ProposalImage,
  type ProposalSection,
  type SectionLayout,
  type SectionType,
} from "@/lib/proposals";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

function ImageFields({
  image,
  onChange,
  label = "Image",
}: {
  image: ProposalImage | null;
  onChange: (next: ProposalImage | null) => void;
  label?: string;
}) {
  const value = image || { alt: "" };
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-white/50 p-4">
      <p className="text-sm font-medium">{label}</p>
      <Field label="Media id (from studio upload)" hint="Paste a media UUID from Content → Photos, or leave blank and use a public path.">
        <Input
          value={value.mediaId || ""}
          onChange={(e) => onChange({ ...value, mediaId: e.target.value.trim() || undefined })}
          placeholder="uuid"
        />
      </Field>
      <Field label="Or public image path">
        <Input
          value={value.src || ""}
          onChange={(e) => onChange({ ...value, src: e.target.value.trim() || undefined })}
          placeholder="/images/portfolio/…"
        />
      </Field>
      <Field label="Alt text">
        <Input value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
      </Field>
      <Field label="Caption (optional)">
        <Input
          value={value.caption || ""}
          onChange={(e) => onChange({ ...value, caption: e.target.value || undefined })}
        />
      </Field>
      <button type="button" className="text-sm text-terracotta underline-offset-4 hover:underline" onClick={() => onChange(null)}>
        Clear image
      </button>
    </div>
  );
}

function ImagesListEditor({
  images,
  onChange,
  label = "Extra images",
}: {
  images: ProposalImage[];
  onChange: (images: ProposalImage[]) => void;
  label?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-white/40 p-4">
      <p className="text-sm font-medium">{label}</p>
      {images.map((image, index) => (
        <ImageFields
          key={`${image.mediaId || image.src || "img"}-${index}`}
          label={`Image ${index + 1}`}
          image={image}
          onChange={(next) => {
            const list = [...images];
            if (next) list[index] = next;
            else list.splice(index, 1);
            onChange(list);
          }}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...images, { alt: "" }])}>
        Add image
      </Button>
    </div>
  );
}

function PriceLinesEditor({
  lines,
  onChange,
}: {
  lines: PriceLine[];
  onChange: (lines: PriceLine[]) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Price lines</Label>
      {lines.map((line, index) => (
        <div key={line.id} className="grid gap-2 rounded-2xl border border-ink/10 p-4 sm:grid-cols-2">
          <Input
            value={line.label}
            placeholder="Label"
            onChange={(e) => {
              const priceLines = lines.map((row, i) => (i === index ? { ...row, label: e.target.value } : row));
              onChange(priceLines);
            }}
          />
          <div className="flex gap-2">
            <Input
              value={line.price}
              placeholder="US$110"
              onChange={(e) => {
                const priceLines = lines.map((row, i) => (i === index ? { ...row, price: e.target.value } : row));
                onChange(priceLines);
              }}
            />
            <button
              type="button"
              className="shrink-0 text-sm text-terracotta"
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...lines, { id: newId("price"), label: "", price: "" }])}
      >
        Add price line
      </Button>
    </div>
  );
}

function CommonSectionControls({
  section,
  onChange,
}: {
  section: ProposalSection;
  onChange: (section: ProposalSection) => void;
}) {
  const layout = section.layout || defaultLayoutFor(section.type);
  return (
    <div className="grid gap-4 rounded-2xl border border-terracotta/20 bg-sand/40 p-4">
      <p className="text-xs tracking-[0.2em] text-ember uppercase">Section layout</p>
      <Field label="Layout" hint={`Default for this type: ${defaultLayoutFor(section.type)}`}>
        <select
          className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
          value={section.layout || ""}
          onChange={(e) => {
            const value = e.target.value as SectionLayout | "";
            onChange({
              ...section,
              layout: value ? value : undefined,
            } as ProposalSection);
          }}
        >
          <option value="">Default ({defaultLayoutFor(section.type)})</option>
          {SECTION_LAYOUTS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Heading emphasis">
        <select
          className="h-11 w-full rounded-2xl border border-ink/15 bg-white/70 px-3"
          value={section.headingEmphasis || "default"}
          onChange={(e) =>
            onChange({
              ...section,
              headingEmphasis: (e.target.value as HeadingEmphasis) === "default" ? undefined : (e.target.value as HeadingEmphasis),
            } as ProposalSection)
          }
        >
          {HEADING_EMPHASIS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>
      {layout === "textPhoto" ? (
        <p className="text-xs text-ink/50">Text + photo lays content and extra images side by side on desktop.</p>
      ) : null}
      <ImagesListEditor
        images={section.images || []}
        onChange={(images) =>
          onChange({
            ...section,
            images: images.length ? images : undefined,
          } as ProposalSection)
        }
      />
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            className="shrink-0 px-2 text-sm text-terracotta"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        Add line
      </Button>
    </div>
  );
}

export function SectionFields({
  section,
  onChange,
}: {
  section: ProposalSection;
  onChange: (section: ProposalSection) => void;
}) {
  const patch = <T extends ProposalSection>(data: T["data"]) =>
    onChange({ ...section, data } as ProposalSection);

  const typeFields = (() => {
  switch (section.type) {
    case "cover":
      return (
        <div className="grid gap-4">
          <Field label="Client name">
            <Input
              value={section.data.clientName}
              onChange={(e) => patch({ ...section.data, clientName: e.target.value })}
            />
          </Field>
          <Field label="Kicker">
            <Input value={section.data.kicker} onChange={(e) => patch({ ...section.data, kicker: e.target.value })} />
          </Field>
          <Field label="Headline">
            <Input
              value={section.data.headline}
              onChange={(e) => patch({ ...section.data, headline: e.target.value })}
            />
          </Field>
          <Field label="Headline emphasis (ember / italic)">
            <Input
              value={section.data.headlineEmphasis || ""}
              onChange={(e) => patch({ ...section.data, headlineEmphasis: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <Textarea
              value={section.data.subtitle}
              onChange={(e) => patch({ ...section.data, subtitle: e.target.value })}
            />
          </Field>
          <Field label="Proposal date">
            <Input
              type="date"
              value={section.data.proposalDate}
              onChange={(e) => patch({ ...section.data, proposalDate: e.target.value })}
            />
          </Field>
          <ImageFields
            label="Cover photograph"
            image={section.data.heroImage}
            onChange={(heroImage) => patch({ ...section.data, heroImage })}
          />
        </div>
      );
    case "welcome":
      return (
        <Field label="Letter">
          <Textarea
            className="min-h-40"
            value={section.data.body}
            onChange={(e) => patch({ ...section.data, body: e.target.value })}
          />
        </Field>
      );
    case "noticed":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          {section.data.cards.map((card, index) => (
            <div key={card.id} className="space-y-2 rounded-2xl border border-ink/10 p-4">
              <Field label={`Card ${index + 1} title`}>
                <Input
                  value={card.title}
                  onChange={(e) => {
                    const cards = section.data.cards.map((c, i) =>
                      i === index ? { ...c, title: e.target.value } : c,
                    );
                    patch({ ...section.data, cards });
                  }}
                />
              </Field>
              <Field label="Body">
                <Textarea
                  value={card.body}
                  onChange={(e) => {
                    const cards = section.data.cards.map((c, i) =>
                      i === index ? { ...c, body: e.target.value } : c,
                    );
                    patch({ ...section.data, cards });
                  }}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-terracotta"
                  checked={Boolean(card.fullWidth)}
                  onChange={(e) => {
                    const cards = section.data.cards.map((c, i) =>
                      i === index ? { ...c, fullWidth: e.target.checked } : c,
                    );
                    patch({ ...section.data, cards });
                  }}
                />
                Full width
              </label>
              <button
                type="button"
                className="text-sm text-terracotta"
                onClick={() =>
                  patch({ ...section.data, cards: section.data.cards.filter((_, i) => i !== index) })
                }
              >
                Remove card
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                ...section.data,
                cards: [
                  ...section.data.cards,
                  { id: newId("card"), title: "New observation", body: "" },
                ],
              })
            }
          >
            Add card
          </Button>
          <Field label="Opportunity line">
            <Textarea
              value={section.data.opportunity}
              onChange={(e) => patch({ ...section.data, opportunity: e.target.value })}
            />
          </Field>
        </div>
      );
    case "divider":
      return (
        <div className="grid gap-4">
          <Field label="Line">
            <Textarea value={section.data.line} onChange={(e) => patch({ ...section.data, line: e.target.value })} />
          </Field>
          <ImageFields
            image={section.data.image}
            onChange={(image) => patch({ ...section.data, image })}
          />
        </div>
      );
    case "plan":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Intro">
            <Textarea value={section.data.intro} onChange={(e) => patch({ ...section.data, intro: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-terracotta"
              checked={section.data.showDates}
              onChange={(e) => patch({ ...section.data, showDates: e.target.checked })}
            />
            Show dates block
          </label>
          <Field label="Dates label">
            <Input
              value={section.data.datesLabel}
              onChange={(e) => patch({ ...section.data, datesLabel: e.target.value })}
            />
          </Field>
          <Field label="Dates">
            <Input
              value={section.data.datesBody}
              onChange={(e) => patch({ ...section.data, datesBody: e.target.value })}
            />
          </Field>
          {section.data.scenes.map((scene, index) => (
            <div key={scene.id} className="space-y-2 rounded-2xl border border-ink/10 p-4">
              <Field label={`Scene ${index + 1}`}>
                <Input
                  value={scene.title}
                  onChange={(e) => {
                    const scenes = section.data.scenes.map((s, i) =>
                      i === index ? { ...s, title: e.target.value } : s,
                    );
                    patch({ ...section.data, scenes });
                  }}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-terracotta"
                  checked={scene.showBody !== false}
                  onChange={(e) => {
                    const scenes = section.data.scenes.map((s, i) =>
                      i === index
                        ? { ...s, showBody: e.target.checked ? undefined : false }
                        : s,
                    );
                    patch({ ...section.data, scenes });
                  }}
                />
                Show sub-line
              </label>
              <Textarea
                value={scene.body}
                onChange={(e) => {
                  const scenes = section.data.scenes.map((s, i) =>
                    i === index ? { ...s, body: e.target.value } : s,
                  );
                  patch({ ...section.data, scenes });
                }}
              />
              <button
                type="button"
                className="text-sm text-terracotta"
                onClick={() =>
                  patch({ ...section.data, scenes: section.data.scenes.filter((_, i) => i !== index) })
                }
              >
                Remove scene
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                ...section.data,
                scenes: [...section.data.scenes, { id: newId("scene"), title: "New scene", body: "" }],
              })
            }
          >
            Add scene
          </Button>
          <Field label="Day flow">
            <Textarea
              value={section.data.dayFlow}
              onChange={(e) => patch({ ...section.data, dayFlow: e.target.value })}
            />
          </Field>
          <Field label="Consent">
            <Textarea
              value={section.data.consent}
              onChange={(e) => patch({ ...section.data, consent: e.target.value })}
            />
          </Field>
        </div>
      );
    case "proof":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field
            label="Portfolio line"
            hint="Must stay exactly: You can see my work here: https://oracleoffreedom.com/portfolio"
          >
            <Input
              value={section.data.portfolioLine}
              onChange={(e) => patch({ ...section.data, portfolioLine: e.target.value })}
            />
          </Field>
          <Field label="Teaser video URL (YouTube / Vimeo)" hint="Embed player comes in Part 2; the link is stored now.">
            <Input
              value={section.data.videoUrl}
              onChange={(e) => patch({ ...section.data, videoUrl: e.target.value })}
            />
          </Field>
          <Field label="Or uploaded mp4 media id">
            <Input
              value={section.data.videoMediaId}
              onChange={(e) => patch({ ...section.data, videoMediaId: e.target.value })}
            />
          </Field>
          {section.data.images.map((image, index) => (
            <ImageFields
              key={index}
              label={`Still ${index + 1}`}
              image={image}
              onChange={(next) => {
                const images = [...section.data.images];
                if (next) images[index] = next;
                else images.splice(index, 1);
                patch({ ...section.data, images });
              }}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                ...section.data,
                images: [...section.data.images, { alt: "", caption: "Click image to view" }],
              })
            }
          >
            Add still
          </Button>
        </div>
      );
    case "howIWork":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Kicker">
            <Input value={section.data.kicker} onChange={(e) => patch({ ...section.data, kicker: e.target.value })} />
          </Field>
          {section.data.steps.map((step, index) => (
            <div key={step.id} className="space-y-2 rounded-2xl border border-ink/10 p-4">
              <Field label={`Step ${index + 1}`}>
                <Input
                  value={step.title}
                  onChange={(e) => {
                    const steps = section.data.steps.map((s, i) =>
                      i === index ? { ...s, title: e.target.value } : s,
                    );
                    patch({ ...section.data, steps });
                  }}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-terracotta"
                  checked={step.showBody !== false}
                  onChange={(e) => {
                    const steps = section.data.steps.map((s, i) =>
                      i === index
                        ? { ...s, showBody: e.target.checked ? undefined : false }
                        : s,
                    );
                    patch({ ...section.data, steps });
                  }}
                />
                Show sub-line
              </label>
              <Textarea
                value={step.body}
                onChange={(e) => {
                  const steps = section.data.steps.map((s, i) =>
                    i === index ? { ...s, body: e.target.value } : s,
                  );
                  patch({ ...section.data, steps });
                }}
              />
            </div>
          ))}
        </div>
      );
    case "deliverables":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          {section.data.cards.map((card, index) => (
            <div key={card.id} className="space-y-2 rounded-2xl border border-ink/10 p-4">
              <Field label={`Deliverable card ${index + 1}`}>
                <Input
                  value={card.title}
                  onChange={(e) => {
                    const cards = section.data.cards.map((c, i) =>
                      i === index ? { ...c, title: e.target.value } : c,
                    );
                    patch({ ...section.data, cards });
                  }}
                />
              </Field>
              <ListEditor
                label="Items"
                items={card.items}
                onChange={(items) => {
                  const cards = section.data.cards.map((c, i) => (i === index ? { ...c, items } : c));
                  patch({ ...section.data, cards });
                }}
              />
            </div>
          ))}
          <Field label="Out of scope label" hint='Default: "Out of scope"'>
            <Input
              value={section.data.outOfScopeLabel || ""}
              onChange={(e) =>
                patch({ ...section.data, outOfScopeLabel: e.target.value || undefined })
              }
            />
          </Field>
          <Field label="Out of scope">
            <Textarea
              value={section.data.outOfScope}
              onChange={(e) => patch({ ...section.data, outOfScope: e.target.value })}
            />
          </Field>
          <Field label="Usage label" hint='Default: "Usage"'>
            <Input
              value={section.data.usageLabel || ""}
              onChange={(e) => patch({ ...section.data, usageLabel: e.target.value || undefined })}
            />
          </Field>
          <Field label="Usage">
            <Textarea
              value={section.data.usage}
              onChange={(e) => patch({ ...section.data, usage: e.target.value })}
            />
          </Field>
        </div>
      );
    case "addon":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <Input value={section.data.title} onChange={(e) => patch({ ...section.data, title: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={section.data.body} onChange={(e) => patch({ ...section.data, body: e.target.value })} />
          </Field>
          <PriceLinesEditor
            lines={section.data.priceLines || []}
            onChange={(priceLines) => patch({ ...section.data, priceLines: priceLines.length ? priceLines : undefined })}
          />
          <Field label="Legacy price (USD)" hint="Used only when no price lines are set.">
            <Input
              type="number"
              value={section.data.priceUsd || ""}
              onChange={(e) => patch({ ...section.data, priceUsd: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Note">
            <Input value={section.data.note} onChange={(e) => patch({ ...section.data, note: e.target.value })} />
          </Field>
        </div>
      );
    case "investment":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="For [Client] label">
            <Input
              value={section.data.clientLabel}
              onChange={(e) => patch({ ...section.data, clientLabel: e.target.value })}
            />
          </Field>
          <Field label="Package price (USD)">
            <Input
              type="number"
              value={section.data.packagePriceUsd || ""}
              onChange={(e) => patch({ ...section.data, packagePriceUsd: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Currency line">
            <Input
              value={section.data.currencyNote}
              onChange={(e) => patch({ ...section.data, currencyNote: e.target.value })}
            />
          </Field>
          <Field label="Deposit percent" hint="Deposit amount is calculated automatically.">
            <Input
              type="number"
              value={section.data.depositPercent}
              onChange={(e) => patch({ ...section.data, depositPercent: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Key terms (offer panel)" hint="Short line on the terracotta offer panel.">
            <Input
              value={section.data.keyTerms || ""}
              onChange={(e) => patch({ ...section.data, keyTerms: e.target.value || undefined })}
            />
          </Field>
          <Field label="Side note (night panel)" hint="Accommodation / on-site context in the dark panel.">
            <Textarea
              value={section.data.sideNote || ""}
              onChange={(e) => patch({ ...section.data, sideNote: e.target.value || undefined })}
            />
          </Field>
          <Field label="Legacy offer note" hint="Prefer side note + key terms. Shown in offer panel only when side note is empty.">
            <Textarea
              value={section.data.offerNote}
              onChange={(e) => patch({ ...section.data, offerNote: e.target.value })}
            />
          </Field>
          <Field label="Booked separately line">
            <Textarea
              value={section.data.normalRatesLine}
              onChange={(e) => patch({ ...section.data, normalRatesLine: e.target.value })}
            />
          </Field>
          {section.data.compareRows.map((row, index) => (
            <div key={row.id} className="grid gap-2 rounded-2xl border border-ink/10 p-4 sm:grid-cols-2">
              <Input
                value={row.label}
                onChange={(e) => {
                  const compareRows = section.data.compareRows.map((r, i) =>
                    i === index ? { ...r, label: e.target.value } : r,
                  );
                  patch({ ...section.data, compareRows });
                }}
                placeholder="Compare label"
              />
              <Input
                value={row.amount}
                onChange={(e) => {
                  const compareRows = section.data.compareRows.map((r, i) =>
                    i === index ? { ...r, amount: e.target.value } : r,
                  );
                  patch({ ...section.data, compareRows });
                }}
                placeholder="Amount"
              />
            </div>
          ))}
        </div>
      );
    case "terms":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Terms"
            items={section.data.items}
            onChange={(items) => patch({ ...section.data, items })}
          />
        </div>
      );
    case "review":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Quote" hint="Type it, or paste from Content → Reviews. Hide this section if empty.">
            <Textarea value={section.data.quote} onChange={(e) => patch({ ...section.data, quote: e.target.value })} />
          </Field>
          <Field label="Name">
            <Input value={section.data.name} onChange={(e) => patch({ ...section.data, name: e.target.value })} />
          </Field>
          <Field label="Service">
            <Input
              value={section.data.service}
              onChange={(e) => patch({ ...section.data, service: e.target.value })}
            />
          </Field>
          <Field label="Metrics note (optional, real only)">
            <Input
              value={section.data.metricsNote}
              onChange={(e) => patch({ ...section.data, metricsNote: e.target.value })}
            />
          </Field>
        </div>
      );
    case "nextStep":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Body" hint="One action, not a menu. Sign-off stays With Love, / Agota / Oracle of Freedom.">
            <Textarea value={section.data.body} onChange={(e) => patch({ ...section.data, body: e.target.value })} />
          </Field>
          <Field label="Closing line">
            <Input
              value={section.data.closingLine}
              onChange={(e) => patch({ ...section.data, closingLine: e.target.value })}
            />
          </Field>
          <Field label="CTA label">
            <Input
              value={section.data.ctaLabel}
              onChange={(e) => patch({ ...section.data, ctaLabel: e.target.value })}
            />
          </Field>
          <Field label="CTA link">
            <Input
              value={section.data.ctaHref}
              onChange={(e) => patch({ ...section.data, ctaHref: e.target.value })}
            />
          </Field>
          <Field label="Valid-until label">
            <Input
              value={section.data.validUntilLabel}
              onChange={(e) => patch({ ...section.data, validUntilLabel: e.target.value })}
            />
          </Field>
        </div>
      );
    case "signOff":
      return (
        <Field label="Intro (optional)" hint="Sits above the fixed With Love sign-off.">
          <Textarea
            value={section.data.intro}
            onChange={(e) => patch({ ...section.data, intro: e.target.value })}
          />
        </Field>
      );
    case "text":
      return (
        <div className="grid gap-4">
          <Field label="Heading">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          <Field label="Body">
            <Textarea value={section.data.body} onChange={(e) => patch({ ...section.data, body: e.target.value })} />
          </Field>
        </div>
      );
    case "photos":
      return (
        <div className="grid gap-4">
          <Field label="Heading (optional)">
            <Input
              value={section.data.heading}
              onChange={(e) => patch({ ...section.data, heading: e.target.value })}
            />
          </Field>
          {section.data.images.map((image, index) => (
            <ImageFields
              key={index}
              label={`Photo ${index + 1}`}
              image={image}
              onChange={(next) => {
                const images = [...section.data.images];
                if (next) images[index] = next;
                else images.splice(index, 1);
                patch({ ...section.data, images });
              }}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => patch({ ...section.data, images: [...section.data.images, { alt: "" }] })}
          >
            Add photo
          </Button>
        </div>
      );
    default:
      return null;
  }
  })();

  return (
    <div className="grid gap-4">
      <CommonSectionControls section={section} onChange={onChange} />
      {typeFields}
    </div>
  );
}

export function blankSection(type: SectionType): ProposalSection {
  const id = newId("sec");
  switch (type) {
    case "cover":
      return {
        id,
        type,
        enabled: true,
        data: {
          clientName: "[Client name]",
          kicker: "Prepared for [Client name]",
          headline: "Project title",
          subtitle: "",
          heroImage: null,
          proposalDate: new Date().toISOString().slice(0, 10),
        },
      };
    case "welcome":
      return { id, type, enabled: true, data: { body: "" } };
    case "noticed":
      return {
        id,
        type,
        enabled: true,
        data: {
          heading: "What we noticed",
          opportunity: "",
          cards: [{ id: newId("card"), title: "", body: "" }],
        },
      };
    case "divider":
      return { id, type, enabled: true, data: { line: "", image: null } };
    case "plan":
      return {
        id,
        type,
        enabled: true,
        data: {
          heading: "The plan",
          intro: "",
          datesLabel: "Dates",
          datesBody: "",
          showDates: true,
          dayFlow: "",
          consent: "",
          scenes: [],
        },
      };
    case "proof":
      return {
        id,
        type,
        enabled: true,
        data: {
          heading: "Proof",
          images: [],
          videoUrl: "",
          videoMediaId: "",
          portfolioLine: "You can see my work here: https://oracleoffreedom.com/portfolio",
        },
      };
    case "howIWork":
      return {
        id,
        type,
        enabled: true,
        data: { heading: "How I work", kicker: "", steps: [] },
      };
    case "deliverables":
      return {
        id,
        type,
        enabled: true,
        data: { heading: "What's included", cards: [], outOfScope: "", usage: "" },
      };
    case "addon":
      return {
        id,
        type,
        enabled: true,
        data: { heading: "Optional add-on", title: "", body: "", priceUsd: 0, note: "" },
      };
    case "investment":
      return {
        id,
        type,
        enabled: true,
        data: {
          heading: "Investment",
          clientLabel: "For [Client name]",
          packagePriceUsd: 0,
          currencyNote: "USD",
          offerNote: "",
          depositPercent: 50,
          normalRatesLine: "",
          compareRows: [],
        },
      };
    case "terms":
      return { id, type, enabled: true, data: { heading: "Terms", items: [] } };
    case "review":
      return {
        id,
        type,
        enabled: true,
        data: { heading: "A word from a recent client", quote: "", name: "", service: "", metricsNote: "" },
      };
    case "nextStep":
      return {
        id,
        type,
        enabled: true,
        data: {
          heading: "Next step",
          body: "",
          ctaLabel: "Reply to confirm",
          ctaHref: "mailto:agota@oracleoffreedom.com",
          validUntilLabel: "Offer valid until",
          closingLine: "",
        },
      };
    case "signOff":
      return { id, type, enabled: true, data: { intro: "" } };
    case "text":
      return { id, type, enabled: true, data: { heading: "", body: "" } };
    case "photos":
      return { id, type, enabled: true, data: { heading: "", images: [] } };
  }
}
