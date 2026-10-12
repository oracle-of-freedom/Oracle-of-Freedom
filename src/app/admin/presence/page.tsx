import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { PresenceEditor } from "@/components/presence-editor";
import { isAdmin } from "@/lib/admin-auth";
import { lisbonToday } from "@/lib/pricing";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";
import { readStored, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PresencePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const lang = await studioLang();
  const t = studioCopy(lang);
  const settings = await readStored();
  const mode = storageMode();

  return (
    <main className="studio-page mx-auto max-w-3xl px-4 py-4 md:py-12">
      <AdminHeader current="presence" title={t.presence.title} />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/70">{t.presence.intro}</p>
      <p className="mt-2 max-w-xl text-sm text-ink/60">{t.presence.storage[mode]}</p>
      <PresenceEditor
        initial={settings.stays ?? []}
        today={lisbonToday()}
        copy={t.presence}
        homeHref={lang === "en" ? "/" : "/es"}
      />
    </main>
  );
}
