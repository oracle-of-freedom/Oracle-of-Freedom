"use client";

import { MobileMore } from "@/components/mobile-more";
import type { Testimonial } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const moreCopy = {
  en: { more: "View more", less: "Show less" },
  es: { more: "Ver más", less: "Ver menos" },
  pt: { more: "Ver mais", less: "Ver menos" },
} as const;

export function Testimonials({
  items: all,
  locale,
  title,
  foldAfter = 4,
}: {
  /** The reviews for this page, already chosen and ordered. Load them with getReviews. */
  items: Testimonial[];
  locale: Locale;
  title: string;
  /** Show this many real quotes, then a button for the rest. */
  foldAfter?: number;
}) {
  const items = all.filter((item) => item.placeholder === false);

  if (!items.length) return null;

  const words = moreCopy[locale];

  return (
    <section className="fx-reveal mx-auto max-w-6xl px-4 py-16 md:px-6">
      <h2 className="font-serif text-4xl text-ink">{title}</h2>
      <MobileMore
        enabled={foldAfter != null}
        total={items.length}
        visible={foldAfter ?? items.length}
        more={words.more}
        less={words.less}
        scope="any"
      >
        {({ hide, hiddenClass, itemId }) => (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <RealTestimonial
                key={item.id}
                id={itemId(index)}
                className={hide(index) ? hiddenClass : undefined}
                item={item}
                locale={locale}
              />
            ))}
          </div>
        )}
      </MobileMore>
    </section>
  );
}

function RealTestimonial({
  item,
  locale,
  id,
  className,
}: {
  item: Testimonial;
  locale: Locale;
  id?: string;
  className?: string;
}) {
  const shoot = item.shoot?.[locale];
  return (
    <figure id={id} className={cn("fx-card min-w-0 rounded-3xl bg-clay/70 p-6 hover:bg-clay/90", className)}>
      <blockquote className="font-quote text-xl leading-relaxed text-pretty break-words text-ink sm:text-2xl sm:leading-snug">
        {item.quote[locale]}
      </blockquote>
      <figcaption className="mt-5">
        <span className="text-sm font-medium break-words text-ink">{item.name}</span>
        {shoot ? (
          <span className="mt-1 block text-xs font-semibold tracking-[0.16em] text-pretty text-terracotta-ink uppercase">
            {shoot}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
