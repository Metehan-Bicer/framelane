import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  await connection();
  getDb().run(sql`select 1`);
  return Response.json({ status: "ok" });
}
