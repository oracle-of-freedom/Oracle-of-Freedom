"use client";

import { disableBookingInvite, enableBookingInvite } from "@/app/admin/calendar/settings-actions";
import { CopyAcceptanceLink } from "@/components/copy-acceptance-link";
import { Button } from "@/components/ui/button";
import { useStudioCopy } from "@/components/studio-lang";

export function PrivateBookingLink({
  url,
  mode = "calendar",
}: {
  url: string;
  mode?: "calendar" | "settings";
}) {
  const t = useStudioCopy();
  const copy = mode === "settings" ? t.settings : t.calendar;
  const active = Boolean(url);

  return (
    <section className="rounded-3xl bg-white/70 p-4 md:p-6">
      <h2 className="font-serif text-2xl md:text-3xl">{copy.inviteTitle}</h2>
      <p className="mt-2 text-sm text-ink/70">{copy.inviteHelp}</p>
      {active ? (
        <div className="mt-4 grid gap-3">
          <CopyAcceptanceLink url={url} copyLabel={copy.inviteCopy} copiedLabel={copy.inviteCopied} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={enableBookingInvite}>
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                {copy.inviteNew}
              </Button>
            </form>
            <form action={disableBookingInvite}>
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                {copy.inviteDisable}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <form action={enableBookingInvite} className="mt-4">
          <p className="mb-3 text-sm text-ink/60">{copy.inviteOff}</p>
          <Button type="submit" className="w-full sm:w-auto">
            {copy.inviteGenerate}
          </Button>
        </form>
      )}
    </section>
  );
}
