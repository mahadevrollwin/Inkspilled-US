import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/sanity";

/** Sanity webhook target: POST with header `x-revalidate-secret: $SANITY_REVALIDATE_SECRET`. */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG, "max");
  return Response.json({ ok: true });
}
