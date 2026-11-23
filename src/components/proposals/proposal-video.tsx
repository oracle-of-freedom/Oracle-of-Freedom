"use client";

import { useEffect, useRef, useState } from "react";
import { resolveProposalVideo, type ProposalVideoSource } from "@/lib/proposal-video";

function EmbedFrame({ source }: { source: Extract<ProposalVideoSource, { kind: "youtube" | "vimeo" }> }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="proposal-video aspect-video w-full overflow-hidden rounded-3xl bg-night">
      {visible ? (
        <iframe
          title="Proposal teaser"
          src={source.embedUrl}
          className="h-full w-full"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-sand/60">Loading film…</div>
      )}
      <p className="proposal-video-print-link hidden">
        Watch the video:{" "}
        <a href={source.watchUrl} className="text-terracotta underline">
          {source.watchUrl}
        </a>
      </p>
    </div>
  );
}

function FileVideo({ source }: { source: Extract<ProposalVideoSource, { kind: "file" }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="proposal-video overflow-hidden rounded-3xl bg-night">
      <video
        ref={ref}
        className="aspect-video w-full object-cover"
        controls
        playsInline
        muted
        autoPlay={ready}
        loop
        preload={ready ? "metadata" : "none"}
        src={ready ? source.src : undefined}
      />
      <p className="proposal-video-print-link hidden">
        Watch the video on the proposal page (uploaded film).
      </p>
    </div>
  );
}

export function ProposalVideoBlock({
  videoUrl,
  videoMediaId,
}: {
  videoUrl?: string;
  videoMediaId?: string;
}) {
  const source = resolveProposalVideo({ videoUrl, videoMediaId });
  if (!source) return null;

  if (source.kind === "youtube" || source.kind === "vimeo") {
    return (
      <div className="mt-8">
        <EmbedFrame source={source} />
      </div>
    );
  }

  if (source.kind === "file") {
    return (
      <div className="mt-8">
        <FileVideo source={source} />
      </div>
    );
  }

  return (
    <div className="proposal-video mt-8 rounded-3xl bg-night/5 p-4 text-sm">
      <a className="text-terracotta underline-offset-4 hover:underline" href={source.href}>
        Watch the video
      </a>
      <p className="proposal-video-print-link mt-1 text-ink/60">{source.href}</p>
    </div>
  );
}
