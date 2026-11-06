import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { VideosManager, type AdminVideo } from "@/components/admin-content/videos-manager";
import { isAdmin } from "@/lib/admin-auth";
import { imageById } from "@/lib/content";
import { emptyLiveContent, mediaSrc } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { DEFAULT_FILM_PAGES, bundledFilms } from "@/lib/live-public";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

const blank = { en: "", es: "", pt: "" };

export default async function VideosPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());

  const added: AdminVideo[] = [...live.videos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((video) => ({
      id: video.id,
      platform: video.platform,
      url: video.url,
      posterSrc: mediaSrc(video.posterMediaId),
      bundled: false,
      tweaked: false,
      hidden: false,
      caption: video.caption,
      defaultCaption: "",
      pages: video.pages,
      first: video.first,
    }));

  const older: AdminVideo[] = bundledFilms().map((film) => {
    const tweak = live.videoTweaks[film.id];
    return {
      id: film.id,
      platform: film.platform === "youtube" ? "youtube" : "instagram",
      url: film.url,
      posterSrc: imageById(film.posterId).src,
      bundled: true,
      tweaked: Boolean(tweak),
      hidden: tweak?.hidden === true,
      caption: tweak ? tweak.caption : blank,
      defaultCaption: film.label.en,
      pages: tweak ? tweak.pages : DEFAULT_FILM_PAGES,
      first: tweak?.first === true,
    };
  });

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.cards.videos.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      <div className="mt-6">
        <VideosManager videos={[...added, ...older]} mode={storageMode()} />
      </div>
    </main>
  );
}
