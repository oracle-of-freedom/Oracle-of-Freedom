import { PORTFOLIO_LINE, newId, type Proposal, type ProposalSection } from "@/lib/proposals";

/** Stable ids so the example survives merges and is easy to find in admin. */
export const NORTE_NOSARA_EXAMPLE_ID = "prop_norte_nosara_example";
export const NORTE_NOSARA_EXAMPLE_SLUG = "norte-nosara-example";
export const NORTE_NOSARA_TEMPLATE_ID = "tmpl_retreat_hotel";

const ADDON_BODY =
  "I travel, so I can't commit to a monthly package, but I can edit remotely whenever you need more content.\n\nEach reel is cut from the clip library we build together or from footage your team films on a phone, depending on your idea or vision.\n\nCaptions or subtitles and music, formatted for Instagram and TikTok, with one round of changes.";

const INVESTMENT_SIDE_NOTE =
  "My retreat packages usually include accommodation and meals during the shoot days, so I'd like to discuss that as part of this rate. Being on site from sunrise to evening means I can catch the light, the meals and the quiet moments a day visit would miss. That gives you more content at no extra cost.";

/**
 * Example proposal for Norte Nosara, built from the Retreat / Hotel template shape.
 * Does not change starter template copy. Review and media stay as placeholders.
 */
export function norteNosaraExample(now = new Date()): Proposal {
  const stamp = now.toISOString();
  const proposalDate = "2026-11-23";
  const validUntil = "2026-12-20";

  const sections: ProposalSection[] = [
    {
      id: "norte_cover",
      type: "cover",
      enabled: true,
      data: {
        clientName: "Norte Nosara",
        kicker: "Prepared for Norte Nosara",
        headline: "Video Proposal for Norte Nosara",
        headlineEmphasis: "Norte Nosara",
        subtitle:
          "Two filming days during one of your retreats, plus drone footage of the hotel and its setting",
        heroImage: null,
        proposalDate,
      },
    },
    {
      id: "norte_welcome",
      type: "welcome",
      enabled: true,
      data: {
        body: "Dear Norte Nosara family,\n\nNorte has something special, and it deserves to be seen moving. Here's how I'd capture it on video, with everything in one place.",
      },
    },
    {
      id: "norte_noticed",
      type: "noticed",
      enabled: true,
      data: {
        heading: "Why Norte Nosara needs this",
        opportunity: "",
        cards: [
          {
            id: "norte_card_1",
            title: "Photos only tell half the story",
            body: "Your photos are beautiful. What they can't fully show is how the place feels: the cozy rooms, the calm, and the rhythm of a day at Norte.",
          },
          {
            id: "norte_card_2",
            title: "The location",
            body: "You're in town, not hidden away in the jungle or the mountains, and it still feels calm and peaceful. Drone footage shows that in a few seconds, in a way no photo can.",
          },
          {
            id: "norte_card_3",
            title: "Video for social and your website",
            body: "There's no video on your website yet, and no professional video on your Instagram. Video now plays an important role in how you show up on social media, and guests expect to feel the place through video before they book. Short videos reach people that photos don't.",
          },
          {
            id: "norte_card_4",
            title: "Made for a small team",
            body: "As a small, family-run place, you may not have time to edit video. You'll get ready-to-post reels and a library of cut and edited clips your team can use any time, with no extra work.",
            fullWidth: true,
          },
        ],
      },
    },
    {
      id: "norte_divider",
      type: "divider",
      enabled: false,
      data: { line: "", image: null },
    },
    {
      id: "norte_plan",
      type: "plan",
      enabled: true,
      images: [{ alt: "[EXAMPLE PHOTOS: plan photo placeholder]" }],
      data: {
        heading: "What we'd film",
        intro: "",
        datesLabel: "Dates",
        datesBody:
          "I'll be in the Nosara area from 9 February to 3 March 2027. The two filming days in the package would be inside whichever retreat you choose, plus some time before or after for hotel-only and drone shots.",
        showDates: true,
        dayFlow: "",
        consent:
          "Before filming, I agree with the guests and the retreat leader what can be filmed, so everyone feels comfortable.",
        scenes: [
          { id: "norte_scene_1", title: "The shala during practice", body: "", showBody: false },
          { id: "norte_scene_2", title: "Surf coaching", body: "", showBody: false },
          {
            id: "norte_scene_3",
            title: "The Jungle Bar, from morning bowls to evening cocktails",
            body: "",
            showBody: false,
          },
          {
            id: "norte_scene_4",
            title: "The rooms, the pool and the cozy corners",
            body: "",
            showBody: false,
          },
          {
            id: "norte_scene_5",
            title: "How a retreat day flows, from sunrise to evening",
            body: "",
            showBody: false,
          },
          {
            id: "norte_scene_6",
            title: "Lifestyle footage that shows how the property really feels",
            body: "",
            showBody: false,
          },
          {
            id: "norte_scene_7",
            title: "Drone footage of the property and how it sits in town",
            body: "",
            showBody: false,
          },
        ],
      },
    },
    {
      id: "norte_proof",
      type: "proof",
      enabled: true,
      data: {
        heading: "Proof",
        images: [
          {
            alt: "[EXAMPLE PHOTOS / VIDEO: Agota to supply]",
            caption: "[EXAMPLE PHOTOS / VIDEO: Agota to supply]",
          },
        ],
        videoUrl: "",
        videoMediaId: "",
        portfolioLine: PORTFOLIO_LINE,
      },
    },
    {
      id: "norte_how",
      type: "howIWork",
      enabled: false,
      data: {
        heading: "How I work",
        kicker: "",
        steps: [],
      },
    },
    {
      id: "norte_deliverables",
      type: "deliverables",
      enabled: true,
      data: {
        heading: "What's included and usage",
        cards: [
          {
            id: "norte_del_1",
            title: "Website",
            accent: "terracotta",
            items: ["One short film for your website"],
          },
          {
            id: "norte_del_2",
            title: "Social media",
            accent: "ember",
            items: ["3 edited vertical reels for Instagram and TikTok"],
          },
          {
            id: "norte_del_3",
            title: "Content library",
            accent: "moss",
            items: [
              "A library of cut and edited clips your team can post any time",
              "Drone footage of the property and its surroundings",
            ],
          },
        ],
        outOfScope: "Everything is delivered within about two weeks of the shoot, with one round of changes.",
        outOfScopeLabel: "Delivery and changes",
        usage:
          "You can use everything on your own website and social media. Usage is non-exclusive, and I keep the right to share selected pieces in my portfolio.",
      },
    },
    {
      id: "norte_addon",
      type: "addon",
      enabled: true,
      headingEmphasis: "xl",
      data: {
        heading: "Later, if you need it",
        title: "Social media editing",
        body: ADDON_BODY,
        priceUsd: 0,
        note: "Booked only when needed",
        priceLines: [
          { id: "norte_price_1", label: "1 reel", price: "US$110" },
          { id: "norte_price_2", label: "3 reels", price: "US$285" },
        ],
      },
    },
    {
      id: "norte_investment",
      type: "investment",
      enabled: true,
      data: {
        heading: "Investment",
        clientLabel: "For Norte Nosara",
        packagePriceUsd: 1100,
        currencyNote: "USD",
        offerNote: "",
        keyTerms: "Balance due on delivery.",
        sideNote: INVESTMENT_SIDE_NOTE,
        depositPercent: 50,
        normalRatesLine: "Booked separately at my normal rates: around US$1,700",
        compareRows: [
          {
            id: "norte_row_1",
            label: "Normal rates (around)",
            amount: "US$1,700",
            struck: true,
          },
        ],
      },
    },
    {
      id: "norte_terms",
      type: "terms",
      enabled: true,
      data: {
        heading: "Terms",
        items: [
          "A 50% deposit of US$550 confirms the dates, and the balance is due on delivery.",
          "Before filming, I agree with the guests and the retreat leader what can be filmed, so everyone feels comfortable.",
          "Drone filming only with your permission.",
          "You can use everything on your own website and social media. Usage is non-exclusive, and I keep the right to share selected pieces in my portfolio.",
          "This offer is valid until 20 December 2026.",
        ],
      },
    },
    {
      id: "norte_photos",
      type: "photos",
      enabled: false,
      data: { heading: "", images: [] },
    },
    {
      id: "norte_review",
      type: "review",
      enabled: true,
      data: {
        heading: "A word from a recent client",
        quote: "[REVIEW: Agota to supply]",
        name: "",
        service: "",
        metricsNote: "",
      },
    },
    {
      id: "norte_next",
      type: "nextStep",
      enabled: true,
      data: {
        heading: "Next step",
        body: "Choose the retreat and the two filming days, and I'll send the deposit details right away.",
        ctaLabel: "Reply to confirm",
        ctaHref: "mailto:agota@oracleoffreedom.com",
        validUntilLabel: "Offer valid until",
        closingLine: "I'd love to bring Norte to life on film.",
      },
    },
    {
      id: "norte_signoff",
      type: "signOff",
      enabled: true,
      data: { intro: "" },
    },
  ];

  return {
    id: NORTE_NOSARA_EXAMPLE_ID,
    slug: NORTE_NOSARA_EXAMPLE_SLUG,
    previewToken: "norte-example-preview",
    templateId: NORTE_NOSARA_TEMPLATE_ID,
    templateKind: "retreat",
    clientName: "Norte Nosara",
    projectTitle: "Video Proposal for Norte Nosara",
    status: "live",
    createdAt: stamp,
    updatedAt: stamp,
    proposalDate,
    validUntil,
    viewCount: 0,
    lastOpenedAt: "",
    example: true,
    sections,
  };
}

/** Keep TypeScript happy if newId is needed for future seed variants. */
export function freshSectionId(prefix: string) {
  return newId(prefix);
}