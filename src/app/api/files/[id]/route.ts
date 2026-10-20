import { connection } from "next/server";
import { readStoredFile } from "@/lib/files/storage";

export async function GET(_request: Request, ctx: RouteContext<"/api/files/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const stored = await readStoredFile(id).catch(() => null);
  if (!stored) return new Response("Not found", { status: 404 });
  return new Response(stored.bytes, {
    headers: {
      "Content-Type": stored.record.mime,
      // Files are immutable: a new upload always gets a new id.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
