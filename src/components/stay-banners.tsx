import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { stayLine, type PresenceStay } from "@/lib/presence";
import { cn } from "@/lib/utils";

/** Homepage stay pills: sand at half opacity, one row from md, stacked below. */
export function StayBanners({
  locale,
  stays,
  bookLabel,
  elsewhere,
  className,
  elsewhereClassName = "text-sand/90",
}: {
  locale: Locale;
  stays: PresenceStay[];
  bookLabel: string;
  elsewhere: string;
  className?: string;
  elsewhereClassName?: string;
}) {
  return (
    <>
      {stays.length > 0 ? (
        <div
          className={cn(
            "mt-5 flex max-w-xl flex-col items-start gap-2 md:grid md:max-w-none md:[grid-template-columns:repeat(var(--stay-cols),minmax(0,1fr))]",
            className,
          )}
          style={{ "--stay-cols": stays.length } as React.CSSProperties}
        >
          {stays.map((stay) => (
            <Link
              key={stay.id}
              href="/inquire"
              className="min-w-0 rounded-2xl bg-sand/50 px-4 py-3 text-ink md:h-full"
            >
              <span className="block text-base leading-snug font-medium">{stayLine(locale, stay)}</span>
              <span className="mt-1 block text-sm text-ink">{bookLabel}</span>
            </Link>
          ))}
        </div>
      ) : null}
      <p className={cn("mt-4 max-w-xl text-base leading-snug", elsewhereClassName)}>{elsewhere}</p>
    </>
  );
}
