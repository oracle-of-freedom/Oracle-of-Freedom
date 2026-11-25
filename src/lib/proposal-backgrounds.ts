/**
 * Dynamic page / section backgrounds for proposals.
 * Optional; missing values keep the solid page colour from the colour scheme.
 */

import { normalizeHex, clampOpacity } from "@/lib/proposal-colours";

export type BackgroundKind = "solid" | "gradient" | "mesh" | "image" | "texture";

export type GradientStop = {
  colour: string;
  /** 0–100 */
  position: number;
};

export type ProposalBackground = {
  kind?: BackgroundKind;
  /** Solid fill (also base under texture / image overlay). */
  solid?: string;
  gradient?: {
    kind?: "linear" | "radial";
    angle?: number;
    stops?: GradientStop[];
  };
  mesh?: {
    colours?: string[];
    /** Stored so Shuffle is stable across reloads. */
    seed?: number;
    /** 0–100 blur softness. */
    softness?: number;
  };
  image?: {
    src?: string;
    mediaId?: string;
    alt?: string;
    focusX?: number;
    focusY?: number;
    zoom?: number;
    overlay?: string;
    overlayOpacity?: number;
  };
  texture?: {
    enabled?: boolean;
    /** 0–100 */
    intensity?: number;
  };
  /** Slow drift animation. Off by default; respects prefers-reduced-motion in CSS. */
  animate?: boolean;
};

export type ResolvedBackground = {
  kind: BackgroundKind;
  solid: string;
  gradient: {
    kind: "linear" | "radial";
    angle: number;
    stops: GradientStop[];
  };
  mesh: {
    colours: string[];
    seed: number;
    softness: number;
  };
  image: {
    src?: string;
    mediaId?: string;
    alt: string;
    focusX: number;
    focusY: number;
    zoom: number;
    overlay: string;
    overlayOpacity: number;
  };
  texture: {
    enabled: boolean;
    intensity: number;
  };
  animate: boolean;
};

export type BackgroundPresetId =
  | "none"
  | "sunriseOmbre"
  | "mistySage"
  | "oceanFade"
  | "duskMesh"
  | "sandWash"
  | "emberGlow"
  | "moonlit";

export type BackgroundPreset = {
  id: BackgroundPresetId;
  name: string;
  background: ProposalBackground;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "none",
    name: "Solid",
    background: { kind: "solid" },
  },
  {
    id: "sunriseOmbre",
    name: "Sunrise ombré",
    background: {
      kind: "gradient",
      gradient: {
        kind: "linear",
        angle: 165,
        stops: [
          { colour: "#f7d7b8", position: 0 },
          { colour: "#f4ece1", position: 45 },
          { colour: "#e7d6c3", position: 100 },
        ],
      },
    },
  },
  {
    id: "mistySage",
    name: "Misty sage",
    background: {
      kind: "gradient",
      gradient: {
        kind: "linear",
        angle: 180,
        stops: [
          { colour: "#e8eee4", position: 0 },
          { colour: "#f3efe6", position: 55 },
          { colour: "#dfe6d8", position: 100 },
        ],
      },
    },
  },
  {
    id: "oceanFade",
    name: "Ocean fade",
    background: {
      kind: "gradient",
      gradient: {
        kind: "radial",
        angle: 0,
        stops: [
          { colour: "#e8f2f3", position: 0 },
          { colour: "#eef3f4", position: 55 },
          { colour: "#d5e4e6", position: 100 },
        ],
      },
    },
  },
  {
    id: "duskMesh",
    name: "Dusk mesh",
    background: {
      kind: "mesh",
      solid: "#241c28",
      mesh: {
        colours: ["#5b4368", "#9a4522", "#1b1512", "#c4a35a"],
        seed: 42,
        softness: 70,
      },
    },
  },
  {
    id: "sandWash",
    name: "Sand wash",
    background: {
      kind: "gradient",
      gradient: {
        kind: "linear",
        angle: 120,
        stops: [
          { colour: "#f4ece1", position: 0 },
          { colour: "#e7d6c3", position: 60 },
          { colour: "#dcc7b0", position: 100 },
        ],
      },
      texture: { enabled: true, intensity: 18 },
    },
  },
  {
    id: "emberGlow",
    name: "Ember glow",
    background: {
      kind: "mesh",
      solid: "#2a1812",
      mesh: {
        colours: ["#b4532a", "#d9913a", "#1b1512", "#6b3a22"],
        seed: 17,
        softness: 65,
      },
    },
  },
  {
    id: "moonlit",
    name: "Moonlit",
    background: {
      kind: "mesh",
      solid: "#1a2228",
      mesh: {
        colours: ["#2f4f55", "#1b1512", "#5f8a8b", "#cbb8a0"],
        seed: 88,
        softness: 72,
      },
    },
  },
];

function asKind(value: unknown): BackgroundKind | undefined {
  return value === "solid" ||
    value === "gradient" ||
    value === "mesh" ||
    value === "image" ||
    value === "texture"
    ? value
    : undefined;
}

function asAngle(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  const wrapped = ((Math.round(n) % 360) + 360) % 360;
  return wrapped;
}

function parseStops(value: unknown): GradientStop[] | undefined {
  if (!Array.isArray(value) || !value.length) return undefined;
  const stops: GradientStop[] = [];
  for (const item of value.slice(0, 4)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const colour = normalizeHex(row.colour);
    if (!colour) continue;
    const position = clampOpacity(row.position, stops.length * 33);
    stops.push({ colour, position });
  }
  return stops.length ? stops : undefined;
}

function parseImage(value: unknown): ProposalBackground["image"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const image: NonNullable<ProposalBackground["image"]> = {};
  if (typeof record.src === "string" && record.src.trim()) {
    image.src = record.src.trim().slice(0, 500);
  }
  if (typeof record.mediaId === "string" && record.mediaId.trim()) {
    image.mediaId = record.mediaId.trim().slice(0, 64);
  }
  if (typeof record.alt === "string") image.alt = record.alt.trim().slice(0, 200);
  if (typeof record.focusX === "number" && Number.isFinite(record.focusX)) {
    image.focusX = Math.max(0, Math.min(100, record.focusX));
  }
  if (typeof record.focusY === "number" && Number.isFinite(record.focusY)) {
    image.focusY = Math.max(0, Math.min(100, record.focusY));
  }
  if (typeof record.zoom === "number" && Number.isFinite(record.zoom)) {
    image.zoom = Math.max(1, Math.min(3, record.zoom));
  }
  const overlay = normalizeHex(record.overlay);
  if (overlay) image.overlay = overlay;
  if (record.overlayOpacity != null) image.overlayOpacity = clampOpacity(record.overlayOpacity, 35);
  return Object.keys(image).length ? image : undefined;
}

export function parseProposalBackground(value: unknown): ProposalBackground | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const background: ProposalBackground = {};
  const kind = asKind(record.kind);
  const solid = normalizeHex(record.solid);
  if (kind) background.kind = kind;
  if (solid) background.solid = solid;

  if (record.gradient && typeof record.gradient === "object") {
    const g = record.gradient as Record<string, unknown>;
    const gradient: NonNullable<ProposalBackground["gradient"]> = {};
    if (g.kind === "linear" || g.kind === "radial") gradient.kind = g.kind;
    const angle = asAngle(g.angle);
    if (angle != null) gradient.angle = angle;
    const stops = parseStops(g.stops);
    if (stops) gradient.stops = stops;
    if (Object.keys(gradient).length) background.gradient = gradient;
  }

  if (record.mesh && typeof record.mesh === "object") {
    const m = record.mesh as Record<string, unknown>;
    const mesh: NonNullable<ProposalBackground["mesh"]> = {};
    if (Array.isArray(m.colours)) {
      const colours = m.colours
        .map((c) => normalizeHex(c))
        .filter((c): c is string => Boolean(c))
        .slice(0, 4);
      if (colours.length) mesh.colours = colours;
    }
    if (typeof m.seed === "number" && Number.isFinite(m.seed)) {
      mesh.seed = Math.floor(Math.abs(m.seed)) % 100000;
    }
    if (m.softness != null) mesh.softness = clampOpacity(m.softness, 60);
    if (Object.keys(mesh).length) background.mesh = mesh;
  }

  const image = parseImage(record.image);
  if (image) background.image = image;

  if (record.texture && typeof record.texture === "object") {
    const t = record.texture as Record<string, unknown>;
    const texture: NonNullable<ProposalBackground["texture"]> = {};
    if (typeof t.enabled === "boolean") texture.enabled = t.enabled;
    if (t.intensity != null) texture.intensity = clampOpacity(t.intensity, 20);
    if (Object.keys(texture).length) background.texture = texture;
  }

  if (typeof record.animate === "boolean") background.animate = record.animate;

  return Object.keys(background).length ? background : undefined;
}

export function resolveBackground(
  background?: ProposalBackground | null,
  pageFallback = "#f4ece1",
): ResolvedBackground {
  const stops =
    background?.gradient?.stops && background.gradient.stops.length >= 2
      ? background.gradient.stops
      : [
          { colour: "#f7d7b8", position: 0 },
          { colour: pageFallback, position: 50 },
          { colour: "#e7d6c3", position: 100 },
        ];
  const meshColours =
    background?.mesh?.colours && background.mesh.colours.length >= 2
      ? background.mesh.colours
      : ["#e7c4a4", "#46553a", "#f4ece1", "#b4532a"];
  return {
    kind: background?.kind || "solid",
    solid: background?.solid || pageFallback,
    gradient: {
      kind: background?.gradient?.kind || "linear",
      angle: background?.gradient?.angle ?? 180,
      stops: stops.slice(0, 4),
    },
    mesh: {
      colours: meshColours.slice(0, 4),
      seed: background?.mesh?.seed ?? 1,
      softness: background?.mesh?.softness ?? 60,
    },
    image: {
      src: background?.image?.src,
      mediaId: background?.image?.mediaId,
      alt: background?.image?.alt || "",
      focusX: background?.image?.focusX ?? 50,
      focusY: background?.image?.focusY ?? 50,
      zoom: background?.image?.zoom ?? 1,
      overlay: background?.image?.overlay || "#1b1512",
      overlayOpacity: background?.image?.overlayOpacity ?? 35,
    },
    texture: {
      enabled: Boolean(background?.texture?.enabled) || background?.kind === "texture",
      intensity: background?.texture?.intensity ?? 20,
    },
    animate: Boolean(background?.animate),
  };
}

/** Deterministic 0–1 from seed + index. */
function seeded(seed: number, index: number): number {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function shuffleMeshSeed(current?: number): number {
  const base = typeof current === "number" ? current : Date.now() % 100000;
  return (base * 1103515245 + 12345 + Math.floor(Math.random() * 999)) % 100000;
}

export function meshLayerCss(mesh: ResolvedBackground["mesh"], solid: string): string {
  const blur = 20 + (mesh.softness / 100) * 60;
  const layers = mesh.colours.map((colour, index) => {
    const x = Math.round(seeded(mesh.seed, index * 2) * 100);
    const y = Math.round(seeded(mesh.seed, index * 2 + 1) * 100);
    const size = 35 + Math.round(seeded(mesh.seed, index + 20) * 40);
    return `radial-gradient(${size}% ${size}% at ${x}% ${y}%, ${colour} 0%, transparent 70%)`;
  });
  return `${layers.join(", ")}, ${solid}`;
}

export function gradientCss(gradient: ResolvedBackground["gradient"]): string {
  const stops = [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.colour} ${stop.position}%`)
    .join(", ");
  if (gradient.kind === "radial") {
    return `radial-gradient(ellipse at center, ${stops})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

export function imageSrcFromBackground(image: ResolvedBackground["image"]): string | null {
  if (image.mediaId) return `/api/media/${image.mediaId}`;
  if (image.src) return image.src;
  return null;
}

/**
 * CSS custom properties for the proposal root or a section.
 * Print uses --p-bg-print (flat solid) separately.
 */
export function backgroundStyleVars(
  background: ResolvedBackground,
  opts?: { phone?: boolean; pageFallback?: string },
): Record<string, string> {
  const suffix = opts?.phone ? "-m" : "";
  const style: Record<string, string> = {
    [`--p-bg-print${suffix}`]: background.solid || opts?.pageFallback || "#f4ece1",
  };

  let layer = background.solid;
  if (background.kind === "gradient") layer = gradientCss(background.gradient);
  else if (background.kind === "mesh") layer = meshLayerCss(background.mesh, background.solid);
  else if (background.kind === "image") {
    const src = imageSrcFromBackground(background.image);
    if (src) {
      const overlay = background.image.overlay;
      const op = background.image.overlayOpacity / 100;
      const rgb = overlay;
      layer = `linear-gradient(${hexToRgba(rgb, op)}, ${hexToRgba(rgb, op)}), url("${src}")`;
      style[`--p-bg-image-pos${suffix}`] =
        `${background.image.focusX}% ${background.image.focusY}%`;
      style[`--p-bg-image-size${suffix}`] = `${Math.round(background.image.zoom * 100)}%`;
    }
  } else if (background.kind === "texture") {
    layer = background.solid;
  }

  style[`--p-bg-layer${suffix}`] = layer;
  style[`--p-bg-texture${suffix}`] = background.texture.enabled
    ? String(Math.max(0, Math.min(0.35, background.texture.intensity / 100)))
    : "0";
  if (background.animate && (background.kind === "gradient" || background.kind === "mesh")) {
    style[`--p-bg-animate${suffix}`] = "1";
  } else {
    style[`--p-bg-animate${suffix}`] = "0";
  }
  return style;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized || normalized.length !== 7) return `rgba(27,21,18,${alpha})`;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function backgroundFromImage(
  image: {
    src?: string;
    mediaId?: string;
    alt?: string;
    focusX?: number;
    focusY?: number;
    zoom?: number;
  } | null,
): ProposalBackground["image"] | undefined {
  if (!image) return undefined;
  return {
    src: image.src,
    mediaId: image.mediaId,
    alt: image.alt,
    focusX: image.focusX,
    focusY: image.focusY,
    zoom: image.zoom,
  };
}

export function hasBackgroundOverrides(background?: ProposalBackground | null): boolean {
  return Boolean(background && Object.keys(background).length);
}
