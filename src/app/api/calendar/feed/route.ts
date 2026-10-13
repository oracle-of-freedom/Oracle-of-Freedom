import { calendarFeed } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return calendarFeed(new URL(request.url).searchParams.get("token") || "");
}
