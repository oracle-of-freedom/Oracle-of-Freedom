import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { ProposalsList } from "@/components/proposals/proposals-list";
import { isAdmin } from "@/lib/admin-auth";
import { readProposals, readTemplates } from "@/lib/proposal-store";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const mode = storageMode();
  const [proposals, templates] = await Promise.all([
    readProposals().catch(() => []),
    readTemplates().catch(() => []),
  ]);

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="proposals" title={t.proposals.title} />
      <p className="mt-4 text-ink/70 md:mt-6 md:text-lg">{t.proposals.intro}</p>
      {mode === "readonly" ? (
        <p className="mt-4 rounded-2xl bg-clay px-4 py-3 text-sm">{t.proposals.readonly}</p>
      ) : mode === "local" ? (
        <p className="mt-4 rounded-2xl bg-clay/60 px-4 py-3 text-sm">{t.proposals.storage.local}</p>
      ) : (
        <p className="mt-4 text-sm text-ink/55">{t.proposals.storage.blob}</p>
      )}
      <div className="mt-6">
        <ProposalsList proposals={proposals} templates={templates} />
      </div>
    </main>
  );
}
