import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apps = sqliteTable("apps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bundleId: text("bundle_id").notNull().unique(),
  primaryLocale: text("primary_locale").notNull(),
  locales: text("locales", { mode: "json" }).$type<string[]>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
