# Proposal template format (`.oot.json`)

Oracle of Freedom proposal templates can be exported and imported as JSON files ending in `.oot.json`. This document is for writing a valid file from a brief or PDF without reading the codebase.

## File rules

- JSON object, UTF-8
- Maximum size: **1 MB**
- Required top-level fields: `name`, `kind`, `sections`
- Recommended: `formatVersion` (currently `1`)
- On import the site always assigns a **new** `id` and timestamps. Existing templates are never overwritten.
- Unknown block `type` values are skipped; the importer reports how many blocks were kept vs skipped.
- Image URLs and media ids are kept as-is (no re-upload).

## Top-level object

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `formatVersion` | number | no | Export writes `1`. Newer versions are rejected. |
| `name` | string | yes | Template title |
| `kind` | string | yes | One of: `retreat`, `festival`, `quick`, `custom` |
| `sections` | array | yes | Ordered list of blocks (desktop order) |
| `design` | object | no | Page design (margins, columns, cover, colours, backgrounds). Omit to use defaults. |
| `id` | string | no | Ignored on import (new id assigned) |
| `createdAt` / `updatedAt` | ISO string | no | Replaced on import |
| `exportedAt` | ISO string | no | Written by Export; ignored on import |
| `builtin` / `hidden` | boolean | no | Stripped on import |

## Common section fields

Every item in `sections` is an object:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable within the file; regenerated on paste into the editor if missing |
| `type` | string | Block type (see below) |
| `enabled` | boolean | Desktop visibility (default true) |
| `data` | object | Type-specific content |
| `layout` | string | Optional: `stack`, `text`, `textPhoto`, `twoColumn` |
| `headingEmphasis` | string | Optional: `default`, `large`, `xl` |
| `images` | array | Optional extra photos on the block |
| `design` | object | Optional per-block spacing / cards / background |
| `mobile` | object | Phone overrides: `hidden`, `order`, sizes, columns, `background` |

### Design colours and backgrounds

Optional on the top-level `design` object (and phone overrides under `design.mobile`). Missing values keep the current Awake sheet look.

**`design.colours`** — hex strings (`#rrggbb`) unless noted:

| Field | Notes |
| --- | --- |
| `pageBg` | Page background |
| `cardBg` | Card / block fill |
| `border` | Card border accent |
| `borderOpacity` | 0–100 |
| `heading` / `text` / `muted` | Typography |
| `accent` | Links, dividers, highlights |
| `buttonBg` / `buttonText` | CTA buttons |

**`design.background`** (also allowed on `section.design.background`):

| Field | Notes |
| --- | --- |
| `kind` | `solid` · `gradient` · `mesh` · `image` · `texture` |
| `solid` | Base fill colour |
| `gradient` | `{ kind: "linear"\|"radial", angle, stops: [{ colour, position }] }` (2–4 stops) |
| `mesh` | `{ colours, seed, softness }` soft blobs; keep `seed` stable |
| `image` | `{ src\|mediaId, overlay, overlayOpacity, focusX, focusY, zoom }` |
| `texture` | `{ enabled, intensity }` light grain |
| `animate` | Slow drift; default false; respects reduced motion |

Phone: `design.mobile.colours` and `design.mobile.background` override desktop field by field.

### Image object

```json
{
  "src": "/images/portfolio/example.jpg",
  "mediaId": "",
  "alt": "Description",
  "caption": "Optional caption",
  "focusX": 50,
  "focusY": 50,
  "zoom": 1
}
```

Use either `src` (public path or absolute URL) or `mediaId` (studio upload UUID). Crop fields are optional.

### Phone (`mobile`) on a section

```json
{
  "hidden": false,
  "order": 2,
  "headingSize": "normal",
  "bodySize": "normal",
  "marginTop": "16px",
  "columns": "1fr"
}
```

`order` is phone-only sort (lower first). Omitting `order` keeps desktop array order on phone.

---

## Block types

### `cover`

```json
{
  "type": "cover",
  "data": {
    "clientName": "Client",
    "kicker": "Prepared for Client",
    "headline": "Project title",
    "subtitle": "",
    "heroImage": null,
    "proposalDate": "2026-11-25"
  }
}
```

### `welcome`

```json
{ "type": "welcome", "data": { "body": "Opening letter…" } }
```

### `noticed`

```json
{
  "type": "noticed",
  "data": {
    "heading": "What we noticed",
    "opportunity": "",
    "cards": [{ "id": "c1", "title": "Title", "body": "Body" }]
  }
}
```

### `divider`

```json
{ "type": "divider", "data": { "line": "", "image": null } }
```

### `plan`

Dates, scenes and day flow. See an exported retreat template for a full example.

### `proof`

Photo grid + optional video + portfolio line.

### `howIWork` / `deliverables` / `addon` / `investment` / `terms` / `review` / `nextStep` / `signOff`

Existing commercial blocks. Prefer exporting a starter template and editing those `data` objects.

### `text`

```json
{ "type": "text", "data": { "heading": "Heading", "body": "Paragraphs…" } }
```

### `photos`

```json
{ "type": "photos", "data": { "heading": "", "images": [] } }
```

### `faq`

Accordion of Q&A. Expanded in print/PDF.

```json
{
  "type": "faq",
  "enabled": true,
  "data": {
    "heading": "FAQ",
    "items": [
      { "id": "faq1", "question": "What’s included?", "answer": "Two days on site…" }
    ]
  }
}
```

### `video`

Standalone film card (portfolio film or pasted link + cover).

```json
{
  "type": "video",
  "data": {
    "heading": "Film",
    "videoUrl": "https://www.youtube.com/watch?v=…",
    "videoMediaId": "",
    "videoCover": { "src": "/images/…", "alt": "Still" },
    "caption": ""
  }
}
```

### `quote`

Large pull quote.

```json
{
  "type": "quote",
  "data": {
    "quote": "Working with Agota felt calm and clear.",
    "name": "Alex",
    "role": "Creative director",
    "image": null
  }
}
```

### `gallery`

Photo grid with 2, 3 or 4 columns.

```json
{
  "type": "gallery",
  "data": {
    "heading": "Gallery",
    "columns": 3,
    "images": [{ "src": "/images/…", "alt": "Still" }]
  }
}
```

### `timeline`

Itinerary / schedule. Vertical on phone.

```json
{
  "type": "timeline",
  "data": {
    "heading": "Schedule",
    "items": [
      { "id": "t1", "when": "Day 1 · 09:00", "title": "Arrival", "body": "Welcome and briefing." }
    ]
  }
}
```

### `cta`

Heading, short text, one or two buttons.

```json
{
  "type": "cta",
  "data": {
    "heading": "Ready?",
    "body": "Reply to lock the dates.",
    "buttons": [
      { "id": "b1", "label": "Reply to confirm", "href": "mailto:agota@oracleoffreedom.com" }
    ]
  }
}
```

### `columns`

Two or three columns (heading, text, optional image each).

```json
{
  "type": "columns",
  "data": {
    "heading": "Two paths",
    "columnCount": 2,
    "columns": [
      { "id": "col1", "heading": "Option A", "body": "…", "image": null },
      { "id": "col2", "heading": "Option B", "body": "…", "image": null }
    ]
  }
}
```

---

## Full example

```json
{
  "formatVersion": 1,
  "name": "Sample retreat outline",
  "kind": "retreat",
  "sections": [
    {
      "id": "sec-cover",
      "type": "cover",
      "enabled": true,
      "data": {
        "clientName": "Norte Nosara",
        "kicker": "Prepared for Norte Nosara",
        "headline": "Visual story for the 2027 retreat",
        "subtitle": "",
        "heroImage": null,
        "proposalDate": "2026-11-25"
      }
    },
    {
      "id": "sec-welcome",
      "type": "welcome",
      "enabled": true,
      "data": {
        "body": "Thank you for the brief. Here is a clear plan for the days on site."
      }
    },
    {
      "id": "sec-timeline",
      "type": "timeline",
      "enabled": true,
      "data": {
        "heading": "On-site flow",
        "items": [
          {
            "id": "t1",
            "when": "Friday",
            "title": "Arrival + portraits",
            "body": "Soft light sessions around the villa."
          },
          {
            "id": "t2",
            "when": "Saturday",
            "title": "Group + detail stills",
            "body": "Movement, food, and place."
          }
        ]
      },
      "mobile": { "order": 2 }
    },
    {
      "id": "sec-faq",
      "type": "faq",
      "enabled": true,
      "data": {
        "heading": "FAQ",
        "items": [
          {
            "id": "f1",
            "question": "When do we see selects?",
            "answer": "A first gallery within two weeks of the shoot."
          }
        ]
      }
    },
    {
      "id": "sec-cta",
      "type": "cta",
      "enabled": true,
      "data": {
        "heading": "Next step",
        "body": "Reply to confirm the dates and deposit.",
        "buttons": [
          {
            "id": "b1",
            "label": "Reply to confirm",
            "href": "mailto:agota@oracleoffreedom.com"
          }
        ]
      }
    },
    {
      "id": "sec-sign",
      "type": "signOff",
      "enabled": true,
      "data": { "intro": "" }
    }
  ]
}
```

Import via **Templates → Import template**, or drop the file onto the Import button. Export from any template editor with **Export** (downloads `<name>.oot.json`).
