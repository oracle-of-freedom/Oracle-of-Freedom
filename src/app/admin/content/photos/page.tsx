import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { PhotosManager, type AdminPhoto } from "@/components/admin-content/photos-manager";
import { isAdmin } from "@/lib/admin-auth";
import { emptyLiveContent } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());
  const photos: AdminPhoto[] = [...live.photos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((photo) => ({
      id: photo.id,
      mediaId: photo.mediaId,
      width: photo.width,
      height: photo.height,
      pages: photo.pages,
      tabs: photo.tabs,
      first: photo.first,
      alt: photo.alt,
    }));

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.cards.photos.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      <div className="mt-6">
        <PhotosManager photos={photos} mode={storageMode()} />
      </div>
    </main>
  );
}
