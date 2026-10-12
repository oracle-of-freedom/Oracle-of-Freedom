import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readCalendarConfig } from "@/lib/calendar-config-store";
import {
  googleAppFromConfig,
  googleAuthorizationUrl,
  suggestedGoogleRedirectUri,
} from "@/lib/google-calendar";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const callback = new URL(suggestedGoogleRedirectUri(requestUrl.origin));
  if (requestUrl.host !== callback.host) {
    return NextResponse.redirect(`${callback.origin}/api/admin/google/connect`);
  }
  const origin = requestUrl.origin;
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", origin));
  }
  const app = googleAppFromConfig(await readCalendarConfig(), origin);
  if (!app) {
    return NextResponse.redirect(new URL("/admin/calendar/settings?google=missing", origin));
  }
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(googleAuthorizationUrl(state, app));
  response.cookies.set("oof_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
