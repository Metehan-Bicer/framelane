"use client";

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { fromEasConfig, fromFastlane, toEasConfig, toFastlane, type Listings } from "@/lib/app-store/formats";
import { slug } from "@/lib/slug";

export async function readImport(file: File): Promise<Listings> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.name.endsWith(".json")) return fromEasConfig(JSON.parse(strFromU8(bytes)));
  if (file.name.endsWith(".zip")) {
    const entries = unzipSync(bytes, { filter: (entry) => entry.name.endsWith(".txt") });
    const listings = fromFastlane(Object.fromEntries(Object.entries(entries).map(([path, data]) => [path, strFromU8(data)])));
    if (Object.keys(listings).length === 0) throw new Error("No fastlane metadata found in this zip");
    return listings;
  }
  throw new Error("Import a fastlane metadata .zip or an EAS store.config.json");
}

export function downloadFastlane(listings: Listings, appName: string) {
  const files = Object.fromEntries(Object.entries(toFastlane(listings)).map(([path, text]) => [path, strToU8(text)]));
  save(new Blob([zipSync(files) as BlobPart], { type: "application/zip" }), `${slug(appName)}-metadata.zip`);
}

export function downloadEasConfig(listings: Listings) {
  const json = `${JSON.stringify(toEasConfig(listings), null, 2)}\n`;
  save(new Blob([json], { type: "application/json" }), "store.config.json");
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
