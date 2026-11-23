import Link from "next/link";
import { OmMark } from "@/components/om-mark";
import { Button } from "@/components/ui/button";
import { settings, whatsappHref } from "@/lib/content";

export function ProposalExpired({ clientName }: { clientName?: string }) {
  const hello = clientName
    ? `Hello ${clientName}, this offer from Oracle of Freedom has ended. I would love to put a fresh one together.`
    : "Hello, this offer from Oracle of Freedom has ended. I would love to put a fresh one together.";

  return (
    <main className="min-h-screen bg-sand text-ink">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
        <div className="flex items-center gap-3">
          <OmMark className="h-9 w-9" />
          <p className="text-xs tracking-[0.22em] text-ink/70 uppercase">Oracle of Freedom</p>
        </div>
        <h1 className="mt-10 font-serif text-4xl text-terracotta md:text-5xl">
          This offer has ended
        </h1>
        <p className="mt-5 text-lg text-ink/80">
          Get in touch for a fresh one. Prices and dates on older links are no longer current.
        </p>
        <ul className="mt-10 space-y-3 text-base">
          <li>
            <a className="text-terracotta underline-offset-4 hover:underline" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          </li>
          <li>
            <a
              className="text-terracotta underline-offset-4 hover:underline"
              href={whatsappHref(hello)}
            >
              WhatsApp {settings.whatsappDisplay}
            </a>
          </li>
          <li>
            <Link className="text-terracotta underline-offset-4 hover:underline" href="https://oracleoffreedom.com">
              oracleoffreedom.com
            </Link>
          </li>
        </ul>
        <div className="mt-10">
          <Button asChild>
            <a href={whatsappHref(hello)}>Message Agota</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
