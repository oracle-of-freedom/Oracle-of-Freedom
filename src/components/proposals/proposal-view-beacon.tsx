"use client";

import { useEffect } from "react";

/**
 * Records one public open for a live proposal. Skipped when the server
 * already decided not to count (admin / preview / non-live).
 */
export function ProposalViewBeacon({ slug, enabled }: { slug: string; enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !slug) return;
    const key = `oof-proposal-view:${slug}`;
    try {
      // Soft de-dupe within the same tab session so refresh spam is quieter.
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage may be blocked; still count once per mount.
    }
    void fetch("/api/proposals/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug, enabled]);

  return null;
}
