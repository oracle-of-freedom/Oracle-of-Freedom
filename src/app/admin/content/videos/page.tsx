import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { VideosManager, type AdminVideo } from "@/components/admin-content/videos-manager";
import { isAdmin } from "@/lib/admin-auth";
import { emptyLiveContent } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());
  const videos: AdminVideo[] = [...live.videos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((video) => ({
      id: video.id,
      platform: video.platform,
      url: video.url,
      posterMediaId: video.posterMediaId,
      posterWidth: video.posterWidth,
      posterHeight: video.posterHeight,
      caption: video.caption,
      pages: video.pages,
      first: video.first,
    }));

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.cards.videos.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      <div className="mt-6">
        <VideosManager videos={videos} mode={storageMode()} />
      </div>
    </main>
  );
}
