import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { ProposalEditor } from "@/components/proposals/proposal-editor";
import { isAdmin } from "@/lib/admin-auth";
import { settings, siteUrl } from "@/lib/content";
import { readLiveContent } from "@/lib/live-content-store";
import { getFilms } from "@/lib/live-public";
import { getProposal } from "@/lib/proposal-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function ProposalEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => null);
  const reviews = (live?.reviews || [])
    .filter((r) => !r.hidden && r.quote.en.trim())
    .map((r) => ({
      id: r.id,
      name: r.name,
      quote: r.quote.en,
      service: r.service.en,
    }));
  const films = await getFilms("portfolio").catch(() => []);

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : siteUrl() || `https://${settings.domain}`;

  return (
    <main className="studio-page mx-auto max-w-7xl px-4 py-4 md:py-12">
      <AdminHeader current="proposals" title={t.proposals.editTitle} />
      <div className="mt-6">
        <ProposalEditor initial={proposal} origin={origin} reviews={reviews} films={films} />
      </div>
    </main>
  );
}
