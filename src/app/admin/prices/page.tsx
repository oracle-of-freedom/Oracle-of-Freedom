import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { AdminPanel } from "@/components/admin-panel";
import { isAdmin } from "@/lib/admin-auth";
import { defaultTiming, TIMING_FIELDS } from "@/lib/delivery";
import { deliveryDefaults } from "@/lib/delivery-copy";
import { calendarToday, studioTimeZone } from "@/lib/calendar-config";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import { catalog } from "@/lib/pricing";
import { readStored, storageMode } from "@/lib/store";
import { studioCopy } from "@/lib/studio-copy";
import { studioLang } from "@/lib/studio-locale.server";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = studioCopy(await studioLang());
  const [settings, config] = await Promise.all([readStored(), readCalendarConfig()]);
  const today = calendarToday(studioTimeZone(config));
  const defaults = deliveryDefaults();
  for (const [id, row] of Object.entries(settings.deliveries ?? {})) {
    const current = defaults[id] ?? { en: "", es: "", pt: "" };
    defaults[id] = {
      en: row.en || current.en,
      es: row.es || current.es,
      pt: row.pt || current.pt,
    };
  }
  return (
    <main className="studio-page-dock mx-auto max-w-6xl px-4 py-4 md:py-12">
      <AdminHeader current="prices" title={t.prices.title} />
      <div className="mt-4 md:mt-8">
        <AdminPanel
          catalog={catalog}
          settings={settings}
          today={today}
          mode={storageMode()}
          timingFields={TIMING_FIELDS.map((field) => ({
            key: field.key,
            token: field.token,
            label: field.label,
            hint: field.hint,
            value: settings.timings?.[field.key] ?? defaultTiming(field.key),
          }))}
          deliveryDefaults={defaults}
        />
      </div>
    </main>
  );
}
