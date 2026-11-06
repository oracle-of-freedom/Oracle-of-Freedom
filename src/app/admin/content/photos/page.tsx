import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { PhotosManager, type AdminPhoto } from "@/components/admin-content/photos-manager";
import { isAdmin } from "@/lib/admin-auth";
import { emptyLiveContent, mediaSrc } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { builtInPlacement, editableBundledPhotos } from "@/lib/live-public";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

const blank = { en: "", es: "", pt: "" };

export default async function PhotosPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());

  const added: AdminPhoto[] = [...live.photos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((photo) => ({
      id: photo.id,
      src: mediaSrc(photo.mediaId),
      bundled: false,
      tweaked: false,
      hidden: false,
      pages: photo.pages,
      tabs: photo.tabs,
      first: photo.first,
      alt: photo.alt,
      defaultAlt: "",
    }));

  const older: AdminPhoto[] = editableBundledPhotos().map((image) => {
    const tweak = live.photoTweaks[image.id];
    const built = builtInPlacement(image);
    return {
      id: image.id,
      src: image.src,
      bundled: true,
      tweaked: Boolean(tweak),
      hidden: tweak?.hidden === true,
      pages: tweak ? tweak.pages : built.pages,
      tabs: tweak ? tweak.tabs : built.tabs,
      first: tweak?.first === true,
      alt: tweak ? tweak.alt : blank,
      defaultAlt: image.alt.en,
    };
  });

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.cards.photos.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      <div className="mt-6">
        <PhotosManager photos={[...added, ...older]} mode={storageMode()} />
      </div>
    </main>
  );
}
