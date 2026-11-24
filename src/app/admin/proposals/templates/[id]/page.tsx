import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { TemplateEditor } from "@/components/proposals/template-editor";
import { isAdmin } from "@/lib/admin-auth";
import { getFilms } from "@/lib/live-public";
import { getTemplate } from "@/lib/proposal-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();
  const t = studioCopy(await studioLang());
  const films = await getFilms("portfolio").catch(() => []);

  return (
    <main className="studio-page mx-auto max-w-7xl px-4 py-4 md:py-12">
      <AdminHeader current="proposals" title={t.proposals.editTemplateTitle} />
      <div className="mt-6">
        <TemplateEditor initial={template} films={films} />
      </div>
    </main>
  );
}
