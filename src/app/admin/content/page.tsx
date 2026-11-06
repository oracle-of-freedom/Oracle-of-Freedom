import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { isAdmin } from "@/lib/admin-auth";
import { readLiveContent } from "@/lib/live-content-store";
import { storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const live = await readLiveContent().catch(() => null);
  const mode = storageMode();
  const cards = [
    { href: "/admin/content/reviews", ...t.content.cards.reviews, count: live?.reviews.length },
    { href: "/admin/content/photos", ...t.content.cards.photos, count: live?.photos.length },
    { href: "/admin/content/videos", ...t.content.cards.videos, count: live?.videos.length },
  ];

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="content" title={t.content.title} />
      <p className="mt-4 text-ink/70 md:mt-6 md:text-lg">{t.content.intro}</p>
      {mode === "readonly" ? (
        <p className="mt-4 rounded-2xl bg-clay px-4 py-3 text-sm">{t.content.readonly}</p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="block rounded-3xl bg-white px-5 py-5 shadow-sm">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-3xl">{card.title}</span>
                {card.count ? <span className="text-sm text-ink/55">{card.count}</span> : null}
              </span>
              <span className="mt-2 block text-ink/70">{card.body}</span>
              <span className="mt-4 inline-flex min-h-12 items-center rounded-full bg-terracotta px-5 text-sm font-medium text-white">
                {t.content.open}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
