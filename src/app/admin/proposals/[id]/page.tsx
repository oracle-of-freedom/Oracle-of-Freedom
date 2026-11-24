import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { ProposalEditor } from "@/components/proposals/proposal-editor";
import { isAdmin } from "@/lib/admin-auth";
import { settings, siteUrl } from "@/lib/content";
import { readLiveContent } from "@/lib/live-content-store";
import { bundledReviews, getFilms } from "@/lib/live-public";
import { listProposalStudioReviews } from "@/lib/proposal-reviews";
import { getProposal } from "@/lib/proposal-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function ProposalEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const lang = await studioLang();
  const t = studioCopy(lang);
  const live = await readLiveContent().catch(() => null);
  const reviews = listProposalStudioReviews(live, bundledReviews(), lang);
  const films = await getFilms("portfolio").catch(() => []);

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : siteUrl() || `https://${settings.domain}`;

  return (
    <main className="studio-page px-4 pt-3 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <AdminHeader current="proposals" title={t.proposals.editTitle} />
      </div>
      <div className="mx-auto mt-3 w-full max-w-[1600px]">
        <ProposalEditor initial={proposal} origin={origin} reviews={reviews} films={films} />
      </div>
    </main>
  );
}
