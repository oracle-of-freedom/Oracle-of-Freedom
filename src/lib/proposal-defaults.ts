import {
  MAX_FULL_SECTIONS,
  PORTFOLIO_LINE,
  newId,
  todayIsoDate,
  type ProposalSection,
  type ProposalSectionOf,
  type ProposalTemplate,
  type TemplateKind,
} from "@/lib/proposals";

function sec<T extends ProposalSection["type"]>(
  type: T,
  data: ProposalSectionOf<T>["data"],
  enabled = true,
): ProposalSectionOf<T> {
  return { id: newId("sec"), type, enabled, data } as ProposalSectionOf<T>;
}

function sharedCover() {
  return sec("cover", {
    clientName: "[Client name]",
    kicker: "Prepared for [Client name]",
    headline: "A quiet record of [place or gathering]",
    headlineEmphasis: "[place or gathering]",
    subtitle: "Photo and film storytelling for the days ahead",
    heroImage: null,
    proposalDate: todayIsoDate(),
  });
}

function sharedWelcome() {
  return sec("welcome", {
    body: "Thank you for the conversation. Here is a clear offer shaped around what we talked about, so you can decide with calm.",
  });
}

function sharedNoticed(count: 2 | 3 | 4) {
  const starters = [
    {
      title: "What stands out online",
      body: "A short, specific observation about the current photos or film on their channels.",
    },
    {
      title: "What guests or guests-to-be need",
      body: "A calm note on the feeling or proof that is missing before someone books.",
    },
    {
      title: "Where the story thins",
      body: "One concrete gap between the place or event as lived and as shown.",
    },
    {
      title: "A quiet opportunity",
      body: "One clear chance to show the work with more honesty and warmth.",
    },
  ];
  return sec("noticed", {
    heading: "What we noticed",
    opportunity: "One calm line on what a honest body of work could open for [Client name].",
    cards: starters.slice(0, count).map((card) => ({
      id: newId("card"),
      ...card,
    })),
  });
}

function sharedDivider() {
  return sec(
    "divider",
    {
      line: "A short, client-specific line that bridges notice into the plan.",
      image: null,
    },
    false,
  );
}

function sharedPlan(heading: string) {
  return sec("plan", {
    heading,
    intro: "Real dates, a handful of scenes, and how a day would flow on the ground.",
    datesLabel: "Dates",
    datesBody: "[Start date] – [End date]",
    showDates: true,
    dayFlow: "Morning arrival, quiet setup, filming through the natural peaks of the day, a soft wrap before dark.",
    consent: "People who appear on camera will be briefed; consent is gathered before we film faces up close.",
    scenes: [
      { id: newId("scene"), title: "Arrival and first light", body: "Specific place or moment." },
      { id: newId("scene"), title: "The heart of the gathering", body: "Specific place or moment." },
      { id: newId("scene"), title: "A quieter corner", body: "Specific place or moment." },
    ],
  });
}

function sharedProof(imageCount: number) {
  return sec("proof", {
    heading: "Proof",
    images: Array.from({ length: imageCount }, () => ({
      alt: "Replace with a captioned still from related work",
      caption: "Click image to view",
    })),
    videoUrl: "",
    videoMediaId: "",
    portfolioLine: PORTFOLIO_LINE,
  });
}

function sharedHowIWork() {
  return sec("howIWork", {
    heading: "How I work",
    kicker: "One camera · one storyteller",
    steps: [
      {
        id: newId("step"),
        title: "Planning",
        body: "We lock dates, locations, and who needs consent. I come alone with one camera.",
      },
      {
        id: newId("step"),
        title: "Filming",
        body: "I stay light on my feet, follow the real rhythm of the day, and do not bring a crew.",
      },
      {
        id: newId("step"),
        title: "Editing and delivery",
        body: "I edit the stills and film myself and deliver in the formats we agreed.",
      },
    ],
  });
}

function sharedDeliverables(kind: TemplateKind) {
  if (kind === "festival") {
    return sec("deliverables", {
      heading: "What's included and usage",
      cards: [
        {
          id: newId("del"),
          title: "The event",
          accent: "terracotta",
          items: ["[N] edited stills from the main programme", "[N]-second teaser cut", "Colour graded for web and social"],
        },
        {
          id: newId("del"),
          title: "The place or rooms",
          accent: "ember",
          items: ["[N] detail and atmosphere frames", "Optional room or stage coverage as agreed"],
        },
        {
          id: newId("del"),
          title: "Content library",
          accent: "moss",
          items: ["Organized folder for your team", "Formats listed for feed, stories and site"],
        },
      ],
      outOfScope: "Live multi-camera broadcast, drone, and same-day social edits are booked separately.",
      usage: "For [Client name] web, social and press for [N] years. Further licence for paid ads or third parties by agreement.",
    });
  }
  return sec("deliverables", {
    heading: "What's included and usage",
    cards: [
      {
        id: newId("del"),
        title: "Photographs",
        accent: "terracotta",
        items: ["[N] fully edited stills", "High-resolution files for print and web", "A private online gallery"],
      },
      {
        id: newId("del"),
        title: "Film",
        accent: "ember",
        items: ["One [N]-minute film", "Vertical cut for stories or reels", "Colour grade matched to the stills"],
      },
      {
        id: newId("del"),
        title: "Handover",
        accent: "moss",
        items: ["Delivery within the agreed window", "Simple usage guide in plain language"],
      },
    ],
    outOfScope: "Extra reel packs, drone, and rush delivery are booked separately at normal rates.",
    usage: "For [Client name] marketing, site and social for [N] years. Paid media and third-party licences need a further agreement.",
  });
}

function sharedAddon(enabled = false) {
  return sec(
    "addon",
    {
      heading: "Later, if you need it",
      title: "1 reel / 3 reels",
      body: "Short vertical cuts booked only when you need them, not as a second main package.",
      priceUsd: 0,
      note: "Priced at normal rates when the time comes.",
    },
    enabled,
  );
}

function sharedInvestment() {
  return sec("investment", {
    heading: "Investment",
    clientLabel: "For [Client name]",
    packagePriceUsd: 0,
    currencyNote: "USD",
    offerNote: "One package price for the work described above. Not an itemised budget.",
    depositPercent: 50,
    normalRatesLine: "Anything beyond this scope is booked separately at my normal rates.",
    compareRows: [
      { id: newId("row"), label: "Normal day rate reference", amount: "[amount]", struck: true },
      { id: newId("row"), label: "Typical package for similar scope", amount: "[amount]", struck: true },
    ],
  });
}

function sharedTerms(enabled = true) {
  return sec(
    "terms",
    {
      heading: "Terms",
      items: [
        "Deposit due to hold the dates; balance before or on delivery as agreed.",
        "Consent for people filmed is gathered on site.",
        "Drone only with permission and local rules cleared in advance.",
        "Usage as written in What's included; further licence by agreement.",
        "This offer is valid until the date on the next step.",
      ],
    },
    enabled,
  );
}

function sharedReview(enabled = false) {
  return sec(
    "review",
    {
      heading: "A word from a recent client",
      quote: "",
      name: "",
      service: "",
      metricsNote: "",
    },
    enabled,
  );
}

function sharedNextStep() {
  return sec("nextStep", {
    heading: "Next step",
    body: "If this feels right, reply to confirm the dates and I will send the deposit details.",
    ctaLabel: "Reply to confirm",
    ctaHref: "mailto:agota@oracleoffreedom.com",
    validUntilLabel: "Offer valid until",
    closingLine: "Glad we spoke. I am ready when you are.",
  });
}

function sharedPhotosStrip(enabled = false) {
  return sec(
    "photos",
    {
      heading: "",
      images: [],
    },
    enabled,
  );
}

/** Full deck for retreats and hotels. Divider off by default; review off. */
export function retreatHotelSections(): ProposalSection[] {
  const sections = [
    sharedCover(),
    sharedWelcome(),
    sharedNoticed(3),
    sharedDivider(),
    sharedPlan("What I would film"),
    sharedProof(8),
    sharedHowIWork(),
    sharedDeliverables("retreat"),
    sharedAddon(false),
    sharedInvestment(),
    sharedTerms(true),
    sharedPhotosStrip(false),
    sharedReview(false),
    sharedNextStep(),
  ];
  return enforceCap(sections, true);
}

/** Full deck for festivals and events. Deliverable cards group event / place / library. */
export function festivalEventSections(): ProposalSection[] {
  const sections = [
    sharedCover(),
    sharedWelcome(),
    sharedNoticed(3),
    sharedDivider(),
    sharedPlan("What I would film"),
    sharedProof(8),
    sharedHowIWork(),
    sharedDeliverables("festival"),
    sharedAddon(false),
    sharedInvestment(),
    sharedTerms(true),
    sharedPhotosStrip(false),
    sharedReview(false),
    sharedNextStep(),
  ];
  return enforceCap(sections, true);
}

/** Quick offer: about six sections. No divider, no How I work. */
export function quickOfferSections(): ProposalSection[] {
  const plan = sharedPlan("The plan and what's included");
  plan.data.intro =
    "Dates, scenes, and what is included. Keep this short enough to scan in under a minute.";
  const deliverables = sharedDeliverables("retreat");
  const slimDeliverables: ProposalSectionOf<"deliverables"> = {
    ...deliverables,
    data: {
      ...deliverables.data,
      heading: "Included in this offer",
      cards: deliverables.data.cards.slice(0, 2),
    },
  };
  return [
    sharedCover(),
    sharedNoticed(2),
    plan,
    slimDeliverables,
    sharedProof(6),
    sharedAddon(false),
    sharedInvestment(),
    sharedReview(false),
    sharedNextStep(),
  ];
}

function enforceCap(sections: ProposalSection[], full: boolean) {
  if (!full) return sections;
  const enabled = sections.filter((s) => s.enabled);
  if (enabled.length <= MAX_FULL_SECTIONS) return sections;
  // Prefer disabling optional strips first.
  const optional: ProposalSection["type"][] = ["photos", "addon", "divider", "welcome", "terms"];
  const next = sections.map((s) => ({ ...s }));
  let count = next.filter((s) => s.enabled).length;
  for (const type of optional) {
    if (count <= MAX_FULL_SECTIONS) break;
    const hit = next.find((s) => s.type === type && s.enabled);
    if (hit) {
      hit.enabled = false;
      count -= 1;
    }
  }
  return next;
}

export function builtinTemplates(now = new Date()): ProposalTemplate[] {
  const stamp = now.toISOString();
  return [
    {
      id: "tmpl_retreat_hotel",
      name: "Retreat / Hotel",
      kind: "retreat",
      builtin: true,
      createdAt: stamp,
      updatedAt: stamp,
      sections: retreatHotelSections(),
    },
    {
      id: "tmpl_festival_event",
      name: "Festival / Event",
      kind: "festival",
      builtin: true,
      createdAt: stamp,
      updatedAt: stamp,
      sections: festivalEventSections(),
    },
    {
      id: "tmpl_quick_offer",
      name: "Quick Offer",
      kind: "quick",
      builtin: true,
      createdAt: stamp,
      updatedAt: stamp,
      sections: quickOfferSections(),
    },
  ];
}

export function emptyCustomTemplate(name = "New template"): ProposalTemplate {
  const stamp = new Date().toISOString();
  return {
    id: newId("tmpl"),
    name,
    kind: "custom",
    createdAt: stamp,
    updatedAt: stamp,
    sections: quickOfferSections(),
  };
}
