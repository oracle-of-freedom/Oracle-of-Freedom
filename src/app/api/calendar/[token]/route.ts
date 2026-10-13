import { calendarFeed, feedToken } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return calendarFeed(feedToken(token));
}
