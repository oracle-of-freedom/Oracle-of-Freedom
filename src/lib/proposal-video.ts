/** Parse a YouTube or Vimeo URL for proposal embeds. */

export type ProposalVideoSource =
  | { kind: "youtube"; id: string; watchUrl: string; embedUrl: string }
  | { kind: "vimeo"; id: string; watchUrl: string; embedUrl: string }
  | { kind: "file"; mediaId: string; src: string }
  | { kind: "link"; href: string };

export function parseYouTubeOrVimeo(raw: string): Extract<ProposalVideoSource, { kind: "youtube" | "vimeo" }> | null {
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

export function proposalVideoWatchHref(source: ProposalVideoSource, pageUrl: string) {
  if (source.kind === "youtube" || source.kind === "vimeo") return source.watchUrl;
  if (source.kind === "link") return source.href;
  return pageUrl;
}
