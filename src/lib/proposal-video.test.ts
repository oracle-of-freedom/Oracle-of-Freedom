import assert from "node:assert/strict";
import test from "node:test";
import {
  detectProposalVideoHost,
  parseYouTubeOrVimeo,
  proposalVideoHostNote,
  resolveProposalVideo,
  resolveProposalVideoCover,
  youtubeThumbnailUrl,
} from "./proposal-video";
import { parseProposal } from "./proposals";

test("Instagram and Drive links resolve as link sources, not embeds", () => {
  const ig = resolveProposalVideo({
    videoUrl: "https://www.instagram.com/reel/AbCdEfGhIjK/",
  });
  assert.equal(ig?.kind, "link");
  if (ig?.kind === "link") {
    assert.equal(detectProposalVideoHost(ig.href), "instagram");
    assert.equal(proposalVideoHostNote(ig), "Plays from Instagram");
  }

  const drive = resolveProposalVideo({
    videoUrl: "https://drive.google.com/file/d/abc123/view",
  });
  assert.equal(drive?.kind, "link");
  if (drive?.kind === "link") {
    assert.equal(proposalVideoHostNote(drive), "Plays from Google Drive");
  }
});

test("YouTube resolves with a thumbnail cover when no explicit cover is set", () => {
  const source = parseYouTubeOrVimeo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.ok(source);
  assert.equal(source?.kind, "youtube");
  if (source?.kind !== "youtube") return;
  const cover = resolveProposalVideoCover({ source, videoCover: null });
  assert.equal(cover.placeholder, false);
  assert.equal(cover.src, youtubeThumbnailUrl(source.id));
});

test("explicit video cover wins over the YouTube thumbnail", () => {
  const source = resolveProposalVideo({ videoUrl: "https://youtu.be/dQw4w9WgXcQ" });
  assert.ok(source);
  const cover = resolveProposalVideoCover({
    source: source!,
    videoCover: { src: "/images/portfolio/film.jpg", alt: "Custom still" },
  });
  assert.equal(cover.src, "/images/portfolio/film.jpg");
  assert.equal(cover.alt, "Custom still");
  assert.equal(cover.placeholder, false);
});

test("Instagram without a cover uses the brand placeholder", () => {
  const source = resolveProposalVideo({
    videoUrl: "https://www.instagram.com/reel/AbCdEfGhIjK/",
  });
  assert.ok(source);
  const cover = resolveProposalVideoCover({ source: source!, videoCover: null });
  assert.equal(cover.placeholder, true);
  assert.equal(cover.src, "");
});

test("proof videoCover survives a save round trip", () => {
  const parsed = parseProposal({
    id: "prop_test",
    slug: "test-client",
    previewToken: "tok",
    templateId: "tmpl_awake_style",
    templateKind: "custom",
    clientName: "Test",
    projectTitle: "Test",
    status: "draft",
    createdAt: "2026-11-24T00:00:00.000Z",
    updatedAt: "2026-11-24T00:00:00.000Z",
    proposalDate: "2026-11-24",
    validUntil: "2026-12-20",
    viewCount: 0,
    lastOpenedAt: "",
    sections: [
      {
        id: "proof",
        type: "proof",
        enabled: true,
        data: {
          heading: "Proof",
          images: [],
          videoUrl: "https://www.instagram.com/reel/AbCdEfGhIjK/",
          videoMediaId: "",
          videoCover: { src: "/images/portfolio/film.jpg", alt: "Reel still" },
          portfolioLine: "You can see my work here: https://oracleoffreedom.com/portfolio",
        },
      },
    ],
  });
  assert.ok(parsed);
  const proof = parsed!.sections.find((s) => s.type === "proof");
  assert.ok(proof && proof.type === "proof");
  if (!proof || proof.type !== "proof") return;
  assert.equal(proof.data.videoUrl, "https://www.instagram.com/reel/AbCdEfGhIjK/");
  assert.equal(proof.data.videoCover?.src, "/images/portfolio/film.jpg");
  assert.equal(proof.data.videoCover?.alt, "Reel still");
});
