import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProposalExpired } from "@/components/proposals/proposal-expired";
import { ProposalView } from "@/components/proposals/proposal-view";
import { isAdmin } from "@/lib/admin-auth";
import { archiveIfExpired, getProposalBySlug } from "@/lib/proposal-store";
import { effectiveStatus } from "@/lib/proposals";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const proposal = await getProposalBySlug(slug).catch(() => null);
  const title = proposal
    ? `${proposal.clientName || "Proposal"} · Oracle of Freedom`
    : "Private proposal · Oracle of Freedom";
  return {
    title,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicProposalPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  let proposal = await getProposalBySlug(slug);
  if (!proposal) notFound();

  const admin = await isAdmin();
  const status = effectiveStatus(proposal);

  if (status === "expired" || proposal.status === "archived") {
    if (!admin) {
      proposal = await archiveIfExpired(proposal);
      return <ProposalExpired clientName={proposal.clientName} />;
    }
    // Admin can still open archived/expired for reference, with a banner via admin mode.
    return <ProposalView proposal={proposal} mode="admin" />;
  }

  if (proposal.status === "draft") {
    const previewOk = Boolean(preview && preview === proposal.previewToken);
    if (admin) {
      return <ProposalView proposal={proposal} mode="admin" />;
    }
    if (previewOk) {
      return <ProposalView proposal={proposal} mode="preview" />;
    }
    notFound();
  }

  // Live
  return <ProposalView proposal={proposal} mode="public" />;
}
