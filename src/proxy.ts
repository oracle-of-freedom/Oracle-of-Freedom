import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

const BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|pagespeed|headless|embedly|quora|pinterest|vkshare|w3c_validator/i;

function preferredLocale(header: string | null): "en" | "es" | "pt" {
  if (!header) return "en";
  const parts = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "");
  for (const part of parts) {
    if (part.startsWith("pt")) return "pt";
    if (part.startsWith("es")) return "es";
    if (part.startsWith("en")) return "en";
  }
  return "en";
}

function withLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

/** Production Vercel alias only — not preview/branch *.vercel.app hosts. */
export const PRODUCTION_VERCEL_HOST = "oracle-of-freedom.vercel.app";
export const CANONICAL_SITE_ORIGIN = "https://oracleoffreedom.com";

/** True when a production vercel.app /p/… hit should 308 to oracleoffreedom.com. */
export function shouldRedirectVercelProposalPath(hostname: string, pathname: string) {
  const host = hostname.split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";
  return host === PRODUCTION_VERCEL_HOST && (pathname === "/p" || pathname.startsWith("/p/"));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const hostname = hostHeader.split(",")[0]?.trim().split(":")[0]?.toLowerCase() || "";

  // Old proposal links on the production vercel.app alias land on the real domain.
  // Skip preview/branch deployments and leave /admin on whatever host it was opened on.
  if (shouldRedirectVercelProposalPath(hostname, pathname)) {
    return NextResponse.redirect(new URL(`${CANONICAL_SITE_ORIGIN}${pathname}${search}`), 308);
  }

  if (pathname === "/p" || pathname.startsWith("/p/")) {
    return NextResponse.next();
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    const stripped = pathname.slice(3);
    url.pathname = stripped.startsWith("/") ? stripped || "/" : `/${stripped}`;
    return NextResponse.redirect(url, 308);
  }
  const isBot = BOT.test(request.headers.get("user-agent") || "");
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;

  if (!isBot && pathname === "/") {
    const locale =
      cookie === "es" || cookie === "pt" || cookie === "en"
        ? cookie
        : preferredLocale(request.headers.get("accept-language"));

    if (locale !== "en") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      const redirect = NextResponse.redirect(url);
      if (cookie !== locale) return withLocaleCookie(redirect, locale);
      return redirect;
    }

    const response = handleI18n(request);
    if (cookie !== "en") return withLocaleCookie(response, "en");
    return response;
  }

  return handleI18n(request);
}

export const config = {
  // Skip paths with a dot so public files are not rewritten to /en/... .
  // That rewrite would miss public/ and the request would render as a locale
  // page. Root image names that are not files are mapped in next.config.ts
  // before [locale] is matched.
  // Proposal URLs under /p are skipped in proxy(). Do not add a bare |p here, it also matches /portfolio, /people, /places, /privacy, /portraits-engagement and every /pt/ path.
  matcher: ["/((?!api|keystatic|admin|_next|_vercel|.*\\..*).*)"],
};
