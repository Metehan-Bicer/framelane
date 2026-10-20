import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Caption, Design } from "@/lib/design/model";

export const apps = sqliteTable("apps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bundleId: text("bundle_id").notNull().unique(),
  primaryLocale: text("primary_locale").notNull(),
  locales: text("locales", { mode: "json" }).$type<string[]>().notNull(),
  /** Shared look for every frame of the app. Null until the editor is opened. */
  design: text("design", { mode: "json" }).$type<Design>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Uploaded raw screenshots. The bytes live on disk under the data directory. */
export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  appId: text("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** One store screenshot slot. Captions and source screenshots are kept per locale. */
export const frames = sqliteTable(
  "frames",
  {
    id: text("id").primaryKey(),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    captions: text("captions", { mode: "json" }).$type<Record<string, Caption>>().notNull().default({}),
    shots: text("shots", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  },
  (table) => [index("frames_app_position").on(table.appId, table.position)],
);

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type StoredFile = typeof files.$inferSelect;
export type Frame = typeof frames.$inferSelect;
