# Rebuild proposals to the signed-off Awake-style layout, and make sure the merge actually deploys

Work in the existing `oracle-of-freedom/Oracle-of-Freedom` repo, on an up-to-date `main`. Do not start a new app or add a new framework. Inspect the current proposal code first, then do all of the parts below in one PR.

Agota has signed off a standalone HTML/PDF of the Norte Nosara proposal. Treat that file as the visual source of truth and match it as closely as possible in the live proposal view, the print/PDF output, a reusable Studio template named **Awake style**, and the live Norte record.

**Reference files (add these to the repo before you start, then keep them in the PR):**

Copy both files from the handoff zip into `docs/reference/` (create the folder if needed). They must sit next to each other so the HTML can resolve the cover photo:

- `docs/reference/norte-nosara-proposal-awake-style.html`
- `docs/reference/norte-awake-cover-hat.jpg`

Open the HTML in a browser (and print to PDF) while you work. Do not invent stock photos. Placeholder slots stay labelled "Your photo here" or "Your video here" until Agota adds her own media.

**Standing rules**

- Brand tokens already in `src/app/globals.css`: sand `#f4ece1`, clay `#e7d6c3`, ink `#2a211c`, terracotta `#b4532a`, ember `#d9913a`, moss `#46553a`, night `#1b1512`. Fonts: `font-serif` DM Serif Display, `font-sans` Karla. Reuse `OmMark`. Do not invent a new palette or heading font.
- No em dashes in any default, seeded, migrated, or template copy.
- Prices stay in USD (the signed-off orange card shows `$1,100`, a `USD` line, and `Deposit 50% · $550`; the struck normal-rate line uses `US$1,700`). Do not change prices or the validity date 20 December 2026.
- Body type on the public proposal and in the PDF must be at least 16px (12pt). Header chrome may follow the reference (smaller kicker, date, and logo type).
- Sign-off copy is the existing `SIGN_OFF` constant in `src/lib/proposals.ts`: `With Love,` / `Agota` / `Oracle of Freedom` / `https://oracleoffreedom.com`.
- Keep typings backward compatible. Empty optional fields must not leave blank holes on the public page. Preview (prices hidden) and Download PDF must still work.
- `MAX_FULL_SECTIONS` in `src/lib/proposals.ts` is currently 10, but a full Norte deck has more sections than that. Do not silently cap or drop sections.
- Existing proposals and templates must keep a sensible look until they are edited or migrated. Do not overwrite other stored proposals (including any Awake record if one exists in Blob). The signed-off Awake PDF itself is not in the proposal system; do not invent an Awake `/p/` record unless one already exists.

## Inspect first

Read these before changing anything:

- Types: `src/lib/proposals.ts` (`SECTION_TYPES`, `ProposalSection`, `ProposalTemplate`, `TEMPLATE_KINDS`, `SIGN_OFF`, `CoverData`, `WelcomeData`, `NoticedData`, `PlanData` / `PlanScene`, `ProofData`, `DeliverablesData`, `AddonData` / `PriceLine`, `InvestmentData`, `TermsData`, `ReviewData`, `NextStepData`, `SignOffData`, `SECTION_LAYOUTS`, `HEADING_EMPHASIS`)
- Storage: `src/lib/proposal-store.ts`. Production lives in Vercel Blob `site/proposals.json` and `site/proposal-templates.json`. Local is `data/proposals.json` and `data/proposal-templates.json`. `mergeExamples()` keeps an already-saved Norte record and will **not** refresh it from the seed. `mergeBuiltins()` likewise keeps an already-saved template. `normalizeOnRead()` calls `normalizeProposalSections` and `applyNorteNosaraContentFix` from `src/lib/proposal-migrate.ts` and may persist on read.
- Seed: `src/lib/proposal-norte-nosara.ts` (`NORTE_NOSARA_EXAMPLE_ID` = `prop_norte_nosara_example`, slug `norte-nosara-example`, preview token `norte-example-preview`, `NORTE_NOSARA_TEMPLATE_ID` today is `tmpl_retreat_hotel`)
- Templates: `src/lib/proposal-defaults.ts` (`builtinTemplates()`, today `tmpl_retreat_hotel` "Retreat / Hotel", `tmpl_festival_event`, `tmpl_quick_offer`)
- Migration helper: `scripts/migrate-norte-blob.ts` (update this rather than inventing a one-off path)
- UI: `src/components/proposals/proposal-view.tsx`, `section-fields.tsx`, `proposal-editor.tsx`, `template-editor.tsx`, `proposal-pdf-button.tsx`, `proposal-video.tsx`, `proposals-list.tsx`
- Admin: `src/app/admin/proposals/` (list, `[id]`, `templates`, `actions.ts`). Studio is the admin shell at `/admin`.
- Public page: `src/app/p/[slug]/`, live example `https://oracleoffreedom.com/p/norte-nosara-example?preview=norte-example-preview`
- Print: `@media print` / `@page` in `src/app/globals.css`
- Store helpers to extend, not replace: `saveTemplate`, `duplicateTemplate`, `createProposalFromTemplate`, `duplicateProposal`, `saveProposal`, `readProposals`, `writeProposals`, `readTemplates`, `writeTemplates`

Section types today: `cover`, `welcome`, `noticed`, `divider`, `plan`, `proof`, `howIWork`, `deliverables`, `addon`, `investment`, `terms`, `review`, `nextStep`, `signOff`, `text`, `photos`.

---

## Part 0: Deploy root cause (do this first, and again after the PR)

**What is wrong today.** PR #81 (`3d11c7b`, the earlier Norte/editor content fix) was merged to GitHub `main` but was never deployed to Vercel. Production has been serving SHA `98cb5af` (PR #82, "Fix proxy matcher breaking /portfolio and /pt paths"). Those two PRs merged about 12 seconds apart on 24 November 2026; Vercel built #82 and missed #81. That is why the live Norte preview still showed the old layout even after #81 was on `main`. This is not a CDN cache issue (`cache-control: private, no-store`, `x-vercel-cache: MISS`).

Production Vercel project: `prj_UaEpJG9sPUDNGtrxsKmNV6LBwIrx`, team `team_s96Q6VsOZlu15m700MS0XMHs`.

**What you must do.**

1. On current `main`, confirm what production is actually serving (deployment SHA, related commit, timestamp). Do not assume GitHub `main` equals production.
2. Find out why a merged `main` commit can miss a production deploy (the #81 / #82 race is the known case). Fix or document the gap so this PR cannot land in the same way. If the Git integration needs a setting change, a workflow fix, or a manual production promote after merge, say so clearly in the PR.
3. The final merge of *this* PR must produce a **production** deployment whose SHA equals the merge commit on `main`. After merge (or in the PR notes, as the required verification step for Agota), check Vercel: a production deployment exists for that exact commit, the deployment succeeded, and `https://oracleoffreedom.com/p/norte-nosara-example?preview=norte-example-preview` is serving that SHA.
4. If a production deployment does not appear automatically, trigger one for the latest `main` SHA (Vercel promote or deploy), then verify again. Do not leave "it's on GitHub main" as the definition of done.
5. After that deploy, also confirm the Norte *content* is the new layout, not only the new code. Because `mergeExamples()` will not refresh an already-saved Norte Blob record, code alone is not enough (see Part 3).

---

## Part 1: Rebuild the proposal view to match the reference HTML

Match `docs/reference/norte-nosara-proposal-awake-style.html` in `proposal-view.tsx` and the print stylesheet. Use the existing section types. Suggested order for the Awake-style template and for the Norte record (do not include `howIWork`, `divider`, or a footer photo strip; those are not in the signed-off layout):

`cover` → `welcome` → `noticed` → `plan` → `proof` → `deliverables` → `addon` → `review` → `investment` → `terms` → `nextStep` → `signOff`

### Cover / header (copy the Awake header geometry)

- Hero height **70mm**.
- Om logo **46px**, position `top: 8mm; left: 14mm`, with the words `ORACLE OF FREEDOM` beside it (same treatment as the reference).
- Title block in a left column (about 92mm, `left: 14mm`, `bottom: 8mm`): headline, then subtitle, then date.
- Norte title: `Video Proposal` / `for Norte Nosara` (the emphasised span in ember italic). `CoverData.headline` / `headlineEmphasis`.
- Subtitle: "Two filming days during one of your retreats, plus drone footage of the hotel and its setting".
- Date: **24 November 2026**, slightly smaller than the subtitle (8pt in the reference) and pulled a little lower so it sits in the space under the subtitle. `CoverData.proposalDate`.
- Side photo: the hat image (`norte-awake-cover-hat.jpg`, same asset as the Awake proposal). CSS like the reference: `background: #1b1512 url(...) right center / auto 100% no-repeat`.
- Dark-to-photo gradient, long enough that there is no hard line where the photo meets the type: `linear-gradient(90deg, rgba(27,21,18,1) 42%, rgba(27,21,18,.6) 52%, rgba(27,21,18,0) 64%)`.
- **"Prepared for [name]" is optional and must be hidden when empty.** This is `CoverData.kicker` (and do not fall back to forcing `Prepared for {clientName}` when the kicker is blank). Norte has no contact name, and the title already says "for Norte Nosara", so the Norte kicker is empty and the line does not render. For other clients, if she fills the kicker (for example "Prepared for Sayani"), it shows above the title, as in the original Awake header.

### Welcome + Why

- Welcome (`welcome`): "Dear Norte Nosara family," then the intro body from the seed / reference. No photo slot after the intro.
- Why (`noticed`, heading "Why Norte Nosara needs this"): four cards in a 2×2 grid, left amber edge, serif titles. Do not use a full-width fifth card on Norte. Headings and bodies stay as in the signed-off HTML.

### What we'd film (`plan`)

Style this **exactly** like the Awake proposal's "What I bring to the team" block:

- Heading "What we'd film" as a standard section title (serif, terracotta, peach rule), same as every other section title.
- Two columns at **`.79fr 1.21fr`**, 5mm gap.
- Left: olive (`moss` `#46553a`) rounded lead box. Peach uppercase kicker `Dates` (`PlanData.datesLabel` / `datesBody`, `showDates: true`). Norte dates body: "I'll be in the Nosara area from 9 February to 3 March 2027. The two filming days in the package would be inside whichever retreat you choose, plus some time before or after for hotel-only and drone shots."
- Right: amber bullet list of **scene titles only** (`PlanScene.title`). No per-item boxes, no `scene.body` on Norte (`showBody: false`, bodies cleared). The seven titles, in this order:
  1. The shala during practice
  2. The Jungle Bar, from morning bowls to evening cocktails
  3. How a retreat day flows, from sunrise to evening
  4. Drone footage of the property and how it sits in town
  5. Surf coaching
  6. The rooms, the pool and the cozy corners
  7. Lifestyle footage that shows how the property really feels
- Tune padding so the olive box bottom edge lines up with the end of the bullet list (the reference uses `padding: 4.5mm 5mm 6.7mm` on the lead box).
- No photo on this section / this page.
- Do not put the consent line under this block. Consent stays in Terms.

### Proof (`proof`)

Keep the proof page: 2×2 photo slots (placeholders "Your photo here" until she adds photos), the portfolio line "You can see my work here: https://oracleoffreedom.com/portfolio", and the video slot ("Your video here"; she will add the video herself). `ProofData.images`, `videoUrl` / `videoMediaId`, `portfolioLine`.

### What's included and usage (`deliverables`)

- Heading "What's included and usage" as a standard section title.
- Three equal cards (Website, Social media, Content library) with terracotta / ember / moss top edges, as in the reference.
- Then "Delivery and changes" (`outOfScopeLabel`, not "Out of scope") and the body: "Everything is delivered within about two weeks of the shoot, with one round of changes."
- Then "Usage." (`usageLabel`) and the usage body already on the record: "You can use everything on your own website and social media. Usage is non-exclusive, and I keep the right to share selected pieces in my portfolio."

### Later, if you need it (`addon`)

- **"Later, if you need it" is a standard section title**: same font, size, terracotta colour, and peach rule as "What's included and usage", "Investment", "Terms", and so on. It sits on its own line. Do not render it as an oversized kicker (`headingEmphasis` default, not `xl`).
- Under it: "Social media editing" (`AddonData.title`).
- Body: "I travel, so I can't commit to a monthly package, but I can edit remotely whenever you need more content."
- Then two bullets (store these as structured lines or as the first part of the addon body, but they must render as bullets):
  - Each reel is cut from the clip library we build together or from footage your team films on a phone, depending on your idea or vision.
  - Captions or subtitles and music, formatted for Instagram and TikTok, with one round of changes.
- Two **equal** price boxes from `AddonData.priceLines`: "1 reel" / `US$110` and "3 reels" / `US$285`.
- "Booked only when needed" on its own line (`note`). Prices must not be buried in the paragraph. Keep the `priceLines` fallback so old records with only `priceUsd` still render.

### Review (`review`)

"A word from a recent client" comes **after the addon, still on the included/pricing page, at the bottom**. Placeholder "[REVIEW: Agota to supply]" until she adds a review (`quote` containing `[REVIEW:` already renders as a dashed placeholder in `proposal-view.tsx`; keep that). Do not leave the review on the investment page.

### Investment (`investment`)

- **"Investment" sits outside the dark panel, on its own line**, styled exactly like every other section title (terracotta serif + peach rule). Do not put the heading inside the night box, and do not give it a special cream-on-dark style or a larger size.
- Then a compact dark rounded panel (`night`) with two columns:
  - Left: a struck-through row "Normal rates (around)" with "US$1,700" struck through on the right; a thin rule; then a smaller line "Booked separately at my normal rates: around US$1,700" (`compareRows` + `normalRatesLine`).
  - Right: orange terracotta-to-ember gradient rounded card. Small caps "FOR NORTE NOSARA" (`clientLabel`), big serif `$1,100` (`packagePriceUsd`), `USD` (`currencyNote`), then `Deposit 50% · $550` (`depositPercent`). Readable sizes, no em dashes.
- The meals/stay copy does **not** live in this panel (not in `offerNote` and not in `sideNote`). It is a Terms bullet (below). The orange card should fill the right of the panel so there is no empty black pillar above or below it. The panel should hug this content (no wasted night space).

### Terms (`terms`)

Standard section title. Bullets, in this order:

1. A 50% deposit of US$550 confirms the dates, and the balance is due on delivery.
2. My retreat packages usually include accommodation and meals during the shoot days, so I'd like to discuss that as part of this rate.
3. Before filming, I agree with the guests and the retreat leader what can be filmed, so everyone feels comfortable.
4. Drone filming only with your permission.
5. You can use everything on your own website and social media. Usage is non-exclusive, and I keep the right to share selected pieces in my portfolio.
6. This offer is valid until 20 December 2026.

Do not include the sunrise-to-evening sentence, and do not include "That gives you more content at no extra cost."

### Next step, button, and sign-off

- "Next step" is a standard section title, sitting a little below Terms (the reference uses about 9.5mm after Terms).
- Body: "Choose the retreat and the two filming days, and I'll send the deposit details right away."
- "Offer valid until **20 December 2026**" (`validUntilLabel` + proposal `validUntil`).
- Closing line: "I'd love to bring Norte to life on film."
- Then the CTA button, bottom-left, terracotta pill, label **Reply to confirm**, href `mailto:agota@oracleoffreedom.com` (`NextStepData.ctaLabel` / `ctaHref`). Hide the button if `ctaLabel` is empty.
- Then the sign-off **under the button, left-aligned** (not on the right, not beside Terms). Use `SIGN_OFF`. The `signOff` section is at the very end.
- Leave comfortable vertical space between the three blocks (Next step copy, button, sign-off) so the close of the page feels breathable, not cramped. In the reference this is about 8.5mm above the button and 7.5mm above the sign-off. Everything must still fit; no clipping.

### Print / PDF and mobile

- Download PDF and browser print must produce **4 A4 pages**, `overflow` not clipping type, colours exact (`print-color-adjust: exact`). Match the signed-off PDF rhythm: page 1 cover + why + what we'd film; page 2 proof; page 3 included + later + review; page 4 investment + terms + next step + button + sign-off.
- Mobile: stack the two-column blocks (why cards, plan lead/bullets, investment panel, price boxes) cleanly. Keep body type at least 16px. No horizontal overflow.

---

## Part 2: "Awake style" template + editor design controls

### Template

Add a saved, selectable template named **Awake style** (suggested id `tmpl_awake_style`, `kind: "custom"` is fine, or a new kind if you have a clean way to add one without breaking `TEMPLATE_KINDS`). Register it in `builtinTemplates()` in `src/lib/proposal-defaults.ts` and/or seed it into `site/proposal-templates.json` the same way other builtins are merged, so it appears even on a fresh environment.

It must show up in **Studio → Proposals** (`/admin/proposals`) in the "create from template" list, and in **Studio → Proposals → templates** (`/admin/proposals/templates`), where it can be edited like the others.

Wire Norte to it: set `templateId` on `prop_norte_nosara_example` to this template (update `NORTE_NOSARA_TEMPLATE_ID` in `src/lib/proposal-norte-nosara.ts`).

The template sections, headings, and default design values should be the Awake-style layout above (with placeholder client/title fields where needed). Do not bake Norte-only sentences into the template where a generic retreat/hotel placeholder is more useful, but keep the *structure*, typography, and design defaults identical to the reference. Norte's live record holds the Norte-specific copy.

### Design controls (required, this is new)

Agota needs to adjust layout herself in the **proposal editor** and the **template editor**, without further code changes. Honour the values in `proposal-view.tsx` (and print CSS). Add a live preview in both editors, and a **Reset to default** action that restores the Awake-style (or section-type) defaults without deleting her copy.

Persist the values **on the proposal** and **on the template** (so "Save as template" / `createProposalFromTemplate` carry them). Backward compatible: missing fields use the defaults below.

Put this on a typed `design` object (proposal-level and/or per-section; per-section for anything that varies by block). Suggested fields; use clear names and keep units consistent (mm or px, documented):

**Header / cover**

- Header / hero height (default 70mm)
- Logo size (default 46px)
- Date size and date position / offset (default: smaller than the subtitle, slightly lower)
- Image focal point (background-position, default `right center`)
- Image zoom / background-size (default `auto 100%`)
- Gradient length / stops (default 42% / 52% / 64% as in the reference)
- Optional kicker ("Prepared for [name]") already hidden when empty

**Per section / element**

- Box width ratios (especially the plan olive/bullet columns, default `.79fr / 1.21fr`; also investment left/right and any other two-column blocks)
- Horizontal alignment and offset
- Padding and spacing (including the space above Next step, above the CTA, and above the sign-off)
- Per-section title: on / off, and style (at least the standard title vs hidden; do not force "Later, if you need it" to be extra large)
- Orange card top offset (so she can start the offer card lower under an in-panel title if she ever puts a title back inside; default for Awake style is "title outside, card fills the right of the panel")
- Button position (default bottom-left of the closing area)
- Sign-off alignment (default left, under the button)

**Structure (keep and complete what the editors already started)**

- Add, remove, and reorder sections
- Add, remove, and reorder image slots on any section (shared optional `images[]` is fine; hidden when empty)
- Editable headings and labels (including `outOfScopeLabel` / `usageLabel`)
- Item lists with optional sub-lines (`showBody` on scenes and similar)

All of these must be editable in `section-fields.tsx` / the editor side panel, previewed live, and saved with the proposal or template.

---

## Part 3: Patch the live Norte Blob record (idempotent)

Do not only edit the seed. Production content is the stored record for slug `norte-nosara-example` (id `prop_norte_nosara_example`) in Blob `site/proposals.json` (or `data/proposals.json` locally).

`mergeExamples()` will **not** replace that record with the seed once it already exists. You must:

1. Update `src/lib/proposal-norte-nosara.ts` so new environments match the signed-off content and design.
2. Update `applyNorteNosaraContentFix` in `src/lib/proposal-migrate.ts` (and `scripts/migrate-norte-blob.ts`) so that reading the live Norte record patches it to this layout and copy, **idempotently** (re-running must not duplicate scenes, bullets, price lines, terms items, or images).
3. Apply that patch to the existing Blob (or local) Norte record when the new code runs, via the existing on-read persist path and/or the migration script.

**Do not change** `viewCount`, `lastOpenedAt`, `slug`, `previewToken`, `status`, or `validUntil`. Keep the preview URL working: `/p/norte-nosara-example?preview=norte-example-preview`.

**Do not rewrite or delete other proposals** in `site/proposals.json`. If an Awake (or any other) proposal is in the file, leave it alone. Write back the full list after updating only the Norte record.

**Do not wipe other templates** in `site/proposal-templates.json`. `mergeBuiltins()` must add "Awake style" if missing, and must not reset Agota's edits to other templates.

Clear stale `offerNote` / `sideNote` meals copy from the Norte investment data (that sentence now lives only in Terms). Hide plan scene bodies. Remove or disable sections that are not in the signed-off layout (`howIWork`, leftover empty `photos` / footer strips, `divider`) so they do not punch holes in the 4-page print. Move `review` to sit after `addon` and before `investment`.

---

## Part 4: Acceptance checklist

Confirm all of the following in the PR description, with **before and after screenshots** (desktop, and phone if you can). Include a 4-page PDF printout of Norte after the change.

**Deploy**

- [ ] Current production SHA was recorded before the change.
- [ ] The PR explains the #81 miss (`3d11c7b` never deployed; prod was `98cb5af`) and what now guarantees a production deploy of the merge commit.
- [ ] After merge, Vercel production deployment SHA equals the new `main` commit. If it does not, a production deploy was triggered and then verified.
- [ ] Live preview `https://oracleoffreedom.com/p/norte-nosara-example?preview=norte-example-preview` is serving that SHA and shows the new layout, not the old one.

**Layout and copy (match the reference HTML)**

- [ ] Header: 70mm, 46px Om logo, no overlap, hat photo with the long gradient, date 24 November 2026 slightly smaller and lower.
- [ ] "Prepared for …" is absent on Norte and hidden whenever the kicker is empty; it appears when a name is filled on a template or another proposal.
- [ ] Why is a 2×2 card grid directly under the intro (no photo slot there).
- [ ] What we'd film: olive Dates box + bullet scenes, columns about `.79 / 1.21`, bottoms aligned, no per-item boxes, no photo.
- [ ] Proof page with photo slots and video slot still present.
- [ ] What's included + Delivery and changes + Usage.
- [ ] "Later, if you need it" is a normal section title; two reel bullets; equal US$110 / US$285 boxes; "Booked only when needed" on its own line.
- [ ] Review placeholder sits after the addon, not on the investment page.
- [ ] Investment title is outside the night panel, same style as other titles; struck US$1,700 row; orange card with `$1,100` / `USD` / `Deposit 50% · $550`; no meals copy in the panel.
- [ ] Terms include the stay/meals bullet only (no sunrise sentence, no "more content at no extra cost").
- [ ] "Reply to confirm" button is bottom-left; sign-off is directly under it, left; Next step / button / sign-off have comfortable spacing; nothing clipped.
- [ ] No em dashes. Body type at least 16px. USD as in the reference. Validity 20 December 2026. Prices unchanged.

**Template, editor, data**

- [ ] "Awake style" appears in Studio → Proposals and can be used to create a new proposal.
- [ ] Design controls listed in Part 2 are in the proposal editor and the template editor, with live preview and Reset to default, and they persist on save (proposal and template).
- [ ] Norte Blob record was patched in place (same slug and token); other proposals in `site/proposals.json` are untouched; re-running the migration does not duplicate content.
- [ ] Public page, phone width, desktop, and Download PDF (4 A4 pages) all checked. App builds. Tests that already exist still pass; add or update tests if you change store/migration behaviour.

---

## Finish

Open a PR against `main`. List schema and migration decisions (new `design` fields, template id, what `applyNorteNosaraContentFix` now does). Do not merge unless Agota asks you to. After merge, complete the Part 0 production-SHA check and paste the verification (deployment URL, SHA, and a note that the live Norte preview matches) on the PR.

The app must build before you open the PR.
