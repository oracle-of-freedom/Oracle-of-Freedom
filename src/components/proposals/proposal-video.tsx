"use client";

import Image from "next/image";
import { useState } from "react";
import {
  imagePhoneHiddenClass,
  imageResponsiveStyle,
} from "@/lib/proposal-mobile";
import {
  proposalVideoHostNote,
  proposalVideoWatchHref,
  resolveProposalVideo,
  resolveProposalVideoCover,
  type ProposalVideoSource,
} from "@/lib/proposal-video";
import type { ProposalImage } from "@/lib/proposals";

function PlayMark({ note }: { note?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-night/25">
      <span className="fx-play flex h-16 w-16 items-center justify-center rounded-full bg-sand text-ink shadow-[0_8px_30px_rgba(42,24,16,0.28)]">
        <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.14-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z"
          />
        </svg>
      </span>
      {note ? (
        <span className="absolute inset-x-3 bottom-3 text-center text-[11px] leading-tight text-sand">
          {note}
        </span>
      ) : null}
    </span>
  );
}

function CoverStill({
  src,
  alt,
  placeholder,
  videoCover,
}: {
  src: string;
  alt: string;
  placeholder: boolean;
  videoCover?: ProposalImage | null;
}) {
  if (placeholder || !src) {
    return (
      <span
        className="block aspect-video w-full bg-gradient-to-br from-night via-[#2a221c] to-ember/40"
        aria-hidden="true"
      />
    );
  }
  const crop = imageResponsiveStyle(videoCover);
  const zoom = videoCover?.zoom ?? 1;
  const mobileZoom = videoCover?.mobile?.zoom;
  const hoverSafe =
    zoom === 1 && (mobileZoom == null || mobileZoom === 1)
      ? "proposal-video-hover"
      : "";
  return (
    <Image
      src={src}
      alt={alt}
      width={1280}
      height={720}
      sizes="(max-width: 767px) 100vw, 182mm"
      className={`aspect-video w-full bg-night object-cover proposal-cropped ${hoverSafe} ${imagePhoneHiddenClass(videoCover)}`.trim()}
      style={crop}
      unoptimized={src.startsWith("/api/media/") || src.includes("i.ytimg.com")}
    />
  );
}

function WatchPrintLink({ href }: { href: string }) {
  if (!href) return null;
  return (
    <p className="proposal-video-print-link">
      <a href={href}>Watch the film</a>
    </p>
  );
}

function VideoCardShell({
  source,
  cover,
  videoCover,
  children,
}: {
  source: ProposalVideoSource;
  cover: ReturnType<typeof resolveProposalVideoCover>;
  videoCover?: ProposalImage | null;
  children: React.ReactNode;
}) {
  const watchHref = proposalVideoWatchHref(source);
  return (
    <div className="proposal-video mt-8">
      {children}
      {/* Cover for print (screen card / player are hidden in @media print). */}
      <div className="proposal-video-print-cover" aria-hidden="true">
        <div className="relative overflow-hidden rounded-3xl">
          <CoverStill
            src={cover.src}
            alt=""
            placeholder={cover.placeholder}
            videoCover={videoCover}
          />
          <PlayMark note={proposalVideoHostNote(source) || undefined} />
        </div>
      </div>
      <WatchPrintLink href={watchHref} />
    </div>
  );
}

function EmbeddableCard({
  source,
  cover,
  videoCover,
}: {
  source: Extract<ProposalVideoSource, { kind: "youtube" | "vimeo" }>;
  cover: ReturnType<typeof resolveProposalVideoCover>;
  videoCover?: ProposalImage | null;
}) {
  const [playing, setPlaying] = useState(false);
  const note = proposalVideoHostNote(source);

  if (playing) {
    return (
      <VideoCardShell source={source} cover={cover} videoCover={videoCover}>
        <div className="proposal-video-player aspect-video w-full overflow-hidden rounded-3xl bg-night">
          <iframe
            title="Proposal film"
            src={`${source.embedUrl}${source.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </VideoCardShell>
    );
  }

  return (
    <VideoCardShell source={source} cover={cover} videoCover={videoCover}>
      <button
        type="button"
        aria-label="Play video"
        className="proposal-video-card group relative block w-full overflow-hidden rounded-3xl text-left shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        onClick={() => setPlaying(true)}
      >
        <CoverStill
          src={cover.src}
          alt={cover.alt}
          placeholder={cover.placeholder}
          videoCover={videoCover}
        />
        <PlayMark note={note || undefined} />
      </button>
    </VideoCardShell>
  );
}

function ExternalCard({
  source,
  cover,
  videoCover,
}: {
  source: Extract<ProposalVideoSource, { kind: "link" }>;
  cover: ReturnType<typeof resolveProposalVideoCover>;
  videoCover?: ProposalImage | null;
}) {
  const note = proposalVideoHostNote(source);
  return (
    <VideoCardShell source={source} cover={cover} videoCover={videoCover}>
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Play video"
        className="proposal-video-card group relative block overflow-hidden rounded-3xl shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <CoverStill
          src={cover.src}
          alt={cover.alt}
          placeholder={cover.placeholder}
          videoCover={videoCover}
        />
        <PlayMark note={note || undefined} />
      </a>
    </VideoCardShell>
  );
}

function FileCard({
  source,
  cover,
  videoCover,
}: {
  source: Extract<ProposalVideoSource, { kind: "file" }>;
  cover: ReturnType<typeof resolveProposalVideoCover>;
  videoCover?: ProposalImage | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <VideoCardShell source={source} cover={cover} videoCover={videoCover}>
        <div className="proposal-video-player overflow-hidden rounded-3xl bg-night">
          <video
            className="aspect-video w-full object-cover"
            controls
            playsInline
            autoPlay
            preload="metadata"
            src={source.src}
            poster={cover.placeholder ? undefined : cover.src || undefined}
          />
        </div>
      </VideoCardShell>
    );
  }

  return (
    <VideoCardShell source={source} cover={cover} videoCover={videoCover}>
      <button
        type="button"
        aria-label="Play video"
        className="proposal-video-card group relative block w-full overflow-hidden rounded-3xl text-left shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        onClick={() => setPlaying(true)}
      >
        <CoverStill
          src={cover.src}
          alt={cover.alt}
          placeholder={cover.placeholder}
          videoCover={videoCover}
        />
        <PlayMark />
      </button>
    </VideoCardShell>
  );
}

export function ProposalVideoBlock({
  videoUrl,
  videoMediaId,
  videoCover,
}: {
  videoUrl?: string;
  videoMediaId?: string;
  videoCover?: ProposalImage | null;
}) {
  const source = resolveProposalVideo({ videoUrl, videoMediaId });
  if (!source) return null;
  const cover = resolveProposalVideoCover({ source, videoCover });

  if (source.kind === "youtube" || source.kind === "vimeo") {
    return <EmbeddableCard source={source} cover={cover} videoCover={videoCover} />;
  }
  if (source.kind === "file") {
    return <FileCard source={source} cover={cover} videoCover={videoCover} />;
  }
  return <ExternalCard source={source} cover={cover} videoCover={videoCover} />;
}
