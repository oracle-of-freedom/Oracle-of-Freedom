import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { ReviewsManager, type AdminReview } from "@/components/admin-content/reviews-manager";
import { isAdmin } from "@/lib/admin-auth";
import { emptyLiveContent } from "@/lib/live-content";
import { readLiveContent } from "@/lib/live-content-store";
import { bundledReviews, defaultPagesFor } from "@/lib/live-public";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => emptyLiveContent());

  const added: AdminReview[] = [...live.reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((review) => ({
      id: review.id,
      bundled: false,
      quote: review.quote,
      name: review.name,
      service: review.service,
      pages: review.pages,
      first: review.first,
      hidden: review.hidden,
    }));

  const older: AdminReview[] = bundledReviews().map((item) => {
    const tweak = live.reviewTweaks[item.id];
    return {
      id: item.id,
      bundled: true,
      quote: { en: item.quote.en, es: item.quote.es, pt: item.quote.pt },
      name: tweak?.name ?? item.name ?? "",
      service: tweak?.service ?? {
        en: item.shoot?.en ?? "",
        es: item.shoot?.es ?? "",
        pt: item.shoot?.pt ?? "",
      },
      pages: tweak?.pages ?? defaultPagesFor(item.id),
      first: false,
      hidden: tweak?.hidden === true,
    };
  });

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.cards.reviews.title} />
      <p className="mt-3">
        <Link href="/admin/content" className="text-sm underline underline-offset-4">
          {t.content.back}
        </Link>
      </p>
      <div className="mt-6">
        <ReviewsManager reviews={[...added, ...older]} mode={storageMode()} />
      </div>
    </main>
  );
}
