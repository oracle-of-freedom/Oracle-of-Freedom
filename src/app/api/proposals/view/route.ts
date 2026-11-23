import { NextResponse } from "next/server";
import { sessionValid, ADMIN_COOKIE } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { recordProposalView } from "@/lib/proposal-store";
import { storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (storageMode() === "readonly") {
      return NextResponse.json({ ok: false, error: "readonly" }, { status: 503 });
    }

    const jar = await cookies();
    if (sessionValid(jar.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.json({ ok: true, counted: false, reason: "admin" });
    }

    const body = (await request.json().catch(() => null)) as { slug?: string } | null;
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug || slug.length > 80) {
      return NextResponse.json({ ok: false, error: "slug" }, { status: 400 });
    }

    const updated = await recordProposalView(slug);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "missing" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      counted: true,
      viewCount: updated.viewCount,
      lastOpenedAt: updated.lastOpenedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}
