import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { LayoutsManager } from "@/components/admin-content/layouts-manager";
import { isAdmin } from "@/lib/admin-auth";
import { emptyLiveContent } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function GalleryLayoutsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.layouts.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      {storageMode() === "readonly" ? (
        <p className="mt-4 rounded-2xl bg-clay px-4 py-3 text-sm">{t.content.readonly}</p>
      ) : null}
      <div className="mt-6">
        <LayoutsManager initial={live.galleryLayouts || {}} mode={storageMode()} />
      </div>
    </main>
  );
}
