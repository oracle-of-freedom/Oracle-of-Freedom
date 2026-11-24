import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { TemplateEditor } from "@/components/proposals/template-editor";
import { isAdmin } from "@/lib/admin-auth";
import { readLiveContent } from "@/lib/live-content-store";
import { bundledReviews, getFilms } from "@/lib/live-public";
import { listProposalStudioReviews } from "@/lib/proposal-reviews";
import { getTemplate } from "@/lib/proposal-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();
  const lang = await studioLang();
  const t = studioCopy(lang);
  const live = await readLiveContent().catch(() => null);
  const reviews = listProposalStudioReviews(live, bundledReviews(), lang);
  const films = await getFilms("portfolio").catch(() => []);

  return (
    <main className="studio-page px-4 pt-3 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <AdminHeader current="proposals" title={t.proposals.editTemplateTitle} />
      </div>
      <div className="mx-auto mt-3 w-full max-w-[1600px]">
        <TemplateEditor initial={template} films={films} reviews={reviews} />
      </div>
    </main>
  );
}
