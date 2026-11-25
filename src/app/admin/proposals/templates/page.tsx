import Link from "next/link";
import { redirect } from "next/navigation";
import { createTemplateAction } from "@/app/admin/proposals/actions";
import { AdminHeader } from "@/components/admin-header";
import { TemplatesList } from "@/components/proposals/templates-list";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin-auth";
import { readTemplates } from "@/lib/proposal-store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const templates = await readTemplates().catch(() => []);

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="proposals" title={t.proposals.templatesTitle} />
      <p className="mt-4 text-ink/70 md:mt-6 md:text-lg">{t.proposals.templatesIntro}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/proposals" className="text-sm underline underline-offset-4">
          {t.proposals.backToProposals}
        </Link>
        <form action={createTemplateAction}>
          <Button type="submit">{t.proposals.createTemplate}</Button>
        </form>
      </div>
      <div className="mt-6">
        <TemplatesList initial={templates} />
      </div>
    </main>
  );
}
