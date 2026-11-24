import { imageSrc, type ProposalImage } from "@/lib/proposals";

/** Parse a proposal video URL or uploaded media id. */

export type ProposalVideoSource =
  | { kind: "youtube"; id: string; watchUrl: string; embedUrl: string }
  | { kind: "vimeo"; id: string; watchUrl: string; embedUrl: string }
  | { kind: "file"; mediaId: string; src: string }
  | { kind: "link"; href: string };

export type ProposalVideoHost = "youtube" | "vimeo" | "instagram" | "drive" | "other";

export type ProposalVideoCover = {
  src: string;
  alt: string;
  /** True when the cover is a dark brand placeholder, not a real still. */
  placeholder: boolean;
};

export function parseYouTubeOrVimeo(
  raw: string,
): Extract<ProposalVideoSource, { kind: "youtube" | "vimeo" }> | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "").replace(/^player\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/")[1] ?? "";
    else if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
    else {
      const [, kind, value] = url.pathname.split("/");
      if (kind === "shorts" || kind === "embed" || kind === "live") id = value ?? "";
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      kind: "youtube",
      id,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&mute=1&rel=0`,
    };
  }

  if (host === "vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts.find((part) => /^\d{6,12}$/.test(part));
    if (!id) return null;
    return {
      kind: "vimeo",
      id,
      watchUrl: `https://vimeo.com/${id}`,
      embedUrl: `https://player.vimeo.com/video/${id}?playsinline=1&muted=1`,
    };
  }

  return null;
}

export function resolveProposalVideo(input: {
  videoUrl?: string;
  videoMediaId?: string;
}): ProposalVideoSource | null {
  const mediaId = input.videoMediaId?.trim();
  if (mediaId) {
    return { kind: "file", mediaId, src: `/api/media/${mediaId}` };
  }
  const url = input.videoUrl?.trim();
  if (!url) return null;
  const parsed = parseYouTubeOrVimeo(url);
  if (parsed) return parsed;
  if (/^https:\/\//i.test(url)) return { kind: "link", href: url };
  return null;
}

export function proposalVideoWatchHref(source: ProposalVideoSource, pageUrl = "") {
  if (source.kind === "youtube" || source.kind === "vimeo") return source.watchUrl;
  if (source.kind === "link") return source.href;
  return pageUrl;
}

export function detectProposalVideoHost(raw: string): ProposalVideoHost {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "other";
  }
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "").toLowerCase();
  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    return "youtube";
  }
  if (host === "vimeo.com" || host.endsWith(".vimeo.com")) return "vimeo";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "drive.google.com" || host === "docs.google.com") return "drive";
  return "other";
}

/** Short note under the play mark when the host is known. */
export function proposalVideoHostNote(source: ProposalVideoSource): string {
  if (source.kind === "youtube") return "Plays from YouTube";
  if (source.kind === "vimeo") return "Plays from Vimeo";
  if (source.kind === "file") return "";
  if (source.kind === "link") {
    const host = detectProposalVideoHost(source.href);
    if (host === "instagram") return "Plays from Instagram";
    if (host === "youtube") return "Plays from YouTube";
    if (host === "vimeo") return "Plays from Vimeo";
    if (host === "drive") return "Plays from Google Drive";
  }
  return "";
}

export function youtubeThumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Cover for the proposal video card.
 * Order: explicit cover field, then YouTube thumbnail, then a brand placeholder.
 */
export function resolveProposalVideoCover(input: {
  source: ProposalVideoSource;
  videoCover?: ProposalImage | null;
}): ProposalVideoCover {
  const explicit = imageSrc(input.videoCover);
  if (explicit) {
    return {
      src: explicit,
      alt: input.videoCover?.alt?.trim() || "Film still",
      placeholder: false,
    };
  }
  if (input.source.kind === "youtube") {
    return {
      src: youtubeThumbnailUrl(input.source.id),
      alt: "YouTube film still",
      placeholder: false,
    };
  }
  return {
    src: "",
    alt: "Film still",
    placeholder: true,
  };
}
