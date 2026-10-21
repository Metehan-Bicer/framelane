/**
 * Adds "Daybook", a fictional journaling app, with screenshots, captions and metadata in
 * English and Turkish. Safe to run again: it replaces the previous Daybook demo only.
 *   npm run seed:demo                         # into ./data
 *   FRAMELANE_DATA_DIR=/data npm run seed:demo # into another data directory
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { seedDemo } from "../src/lib/demo/seed";

const dataDir = process.env.FRAMELANE_DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const sqlite = new Database(path.join(dataDir, "framelane.db"));
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

const appId = seedDemo(db, path.join(dataDir, "uploads"), path.join(process.cwd(), "demo/screens"));
console.log(`Daybook demo added to ${dataDir} (app ${appId})`);
