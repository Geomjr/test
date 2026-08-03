import { getUser } from "@/lib/auth/session";
import { json, unauthorized } from "@/lib/http";
import { searchAll } from "@/lib/data/search";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();

  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) return json({ hits: [] });
  return json({ hits: searchAll(user.id, q) });
}
