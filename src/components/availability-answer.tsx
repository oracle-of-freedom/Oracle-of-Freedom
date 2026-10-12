import { Fragment } from "react";
import { applyTokens } from "@/lib/delivery";
import { stayLine, type PresenceStay } from "@/lib/presence";
import type { Locale } from "@/i18n/routing";

export function availabilityPlain(locale: Locale, stays: PresenceStay[], elsewhere: string) {
  return [...stays.map((stay) => stayLine(locale, stay)), elsewhere].join("\n");
}

/** FAQ answers keep their other sentences. The stay token becomes one line per stay, then the elsewhere line. */
export function AvailabilityAnswer({
  text,
  tokens,
  locale,
  stays,
  elsewhere,
}: {
  text: string;
  tokens: Record<string, string>;
  locale: Locale;
  stays: PresenceStay[];
  elsewhere: string;
}) {
  if (!text.includes("{availability}")) {
    return <p className="pt-3 text-ink/80">{applyTokens(text, tokens)}</p>;
  }

  const parts = text.split("{availability}");
  return (
    <div className="pt-3 text-ink/80">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.trim() ? (
            <p className={index > 0 ? "mt-3" : undefined}>{applyTokens(part.trim(), tokens)}</p>
          ) : null}
          {index < parts.length - 1 ? (
            <>
              {stays.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {stays.map((stay) => (
                    <li key={stay.id}>{stayLine(locale, stay)}</li>
                  ))}
                </ul>
              ) : null}
              <p className={stays.length > 0 || part.trim() ? "mt-3" : undefined}>{elsewhere}</p>
            </>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
