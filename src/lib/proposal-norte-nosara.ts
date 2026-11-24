import { defaultProposalDesign } from "@/lib/proposal-design";
import { PORTFOLIO_LINE, type Proposal, type ProposalSection } from "@/lib/proposals";

/** Stable ids so the example survives merges and is easy to find in admin. */
export const NORTE_NOSARA_EXAMPLE_ID = "prop_norte_nosara_example";
export const NORTE_NOSARA_EXAMPLE_SLUG = "norte-nosara-example";
export const NORTE_NOSARA_TEMPLATE_ID = "tmpl_awake_style";

/** Bump when the signed-off Norte deck changes. Reads stop patching once a record reaches this. */
export const NORTE_AWAKE_REVISION = 2;

/** Public path for the signed-off cover photograph. The reference HTML uses the same file. */
export const NORTE_COVER_IMAGE = "/images/proposals/norte-awake-cover-hat.jpg";

const ADDON_BULLETS = [
  "Each reel is cut from the clip library we build together or from footage your team films on a phone, depending on your idea or vision.",
  "Captions or subtitles and music, formatted for Instagram and TikTok, with one round of changes.",
];

export const NORTE_PLAN_SCENES = [
  "The shala during practice",
  "The Jungle Bar, from morning bowls to evening cocktails",
  "How a retreat day flows, from sunrise to evening",
  "Drone footage of the property and how it sits in town",
  "Surf coaching",
  "The rooms, the pool and the cozy corners",
  "Lifestyle footage that shows how the property really feels",
] as const;

export const NORTE_TERMS = [
  "A 50% deposit of US$550 confirms the dates, and the balance is due on delivery.",
  "My retreat packages usually include accommodation and meals during the shoot days, so I'd like to discuss that as part of this rate.",
  "Before filming, I agree with the guests and the retreat leader what can be filmed, so everyone feels comfortable.",
  "Drone filming only with your permission.",
  "You can use everything on your own website and social media. Usage is non-exclusive, and I keep the right to share selected pieces in my portfolio.",
  "This offer is valid until 20 December 2026.",
] as const;

/**
 * Example proposal for Norte Nosara, in the signed-off Awake-style order.
 * Review and proof media stay as labelled placeholders until Agota adds them.
 */
export function norteNosaraExample(now = new Date()): Proposal {
  const stamp = now.toISOString();
  const proposalDate = "2026-11-24";
  const validUntil = "2026-12-20";

  const sections: ProposalSection[] = [
    {
      id: "norte_cover",
      type: "cover",
      enabled: true,
      data: {
        clientName: "Norte Nosara",
        kicker: "",
        headline: "Video Proposal\nfor Norte Nosara",
        headlineEmphasis: "for Norte Nosara",
        subtitle:
          "Two filming days during one of your retreats, plus drone footage of the hotel and its setting",
        heroImage: { src: NORTE_COVER_IMAGE, alt: "Norte Nosara" },
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
          },
        ],
      },
    },
    {
      id: "norte_plan",
      type: "plan",
      enabled: true,
      data: {
        heading: "What we'd film",
        intro: "",
        datesLabel: "Dates",
        datesBody:
          "I'll be in the Nosara area from 9 February to 3 March 2027. The two filming days in the package would be inside whichever retreat you choose, plus some time before or after for hotel-only and drone shots.",
        showDates: true,
        dayFlow: "",
        consent: "",
        scenes: NORTE_PLAN_SCENES.map((title, index) => ({
          id: `norte_scene_${index + 1}`,
          title,
          body: "",
          showBody: false,
        })),
      },
    },
    {
      id: "norte_proof",
      type: "proof",
      enabled: true,
      data: {
        heading: "Proof",
        images: [1, 2, 3, 4].map(() => ({ alt: "Your photo here" })),
        videoUrl: "",
        videoMediaId: "",
        portfolioLine: PORTFOLIO_LINE,
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
        usageLabel: "Usage",
      },
    },
    {
      id: "norte_addon",
      type: "addon",
      enabled: true,
      data: {
        heading: "Later, if you need it",
        title: "Social media editing",
        body: "I travel, so I can't commit to a monthly package, but I can edit remotely whenever you need more content.",
        bullets: [...ADDON_BULLETS],
        priceUsd: 0,
        note: "Booked only when needed",
        priceLines: [
          { id: "norte_price_1", label: "1 reel", price: "US$110" },
          { id: "norte_price_2", label: "3 reels", price: "US$285" },
        ],
      },
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
      id: "norte_investment",
      type: "investment",
      enabled: true,
      data: {
        heading: "Investment",
        clientLabel: "For Norte Nosara",
        packagePriceUsd: 1100,
        currencyNote: "USD",
        offerNote: "",
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
        items: [...NORTE_TERMS],
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
    templateKind: "custom",
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
    design: defaultProposalDesign(),
    contentRevision: NORTE_AWAKE_REVISION,
    sections,
  };
}
