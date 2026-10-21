import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { apps, files, frames, listings } from "@/db/schema";
import { EMPTY_LISTING, type Listing } from "@/lib/app-store/listing";
import type { Caption, Design } from "@/lib/design/model";
import { readImageInfo } from "@/lib/files/image-size";

/**
 * Daybook, a fictional journaling app with screenshots, captions and metadata in English and
 * Turkish. Used by `npm run seed:demo` and by the public demo, which resets to it every night.
 */
export const DEMO_BUNDLE_ID = "com.example.daybook";

const design: Design = {
  template: "headline",
  background: { kind: "gradient", from: "#ffe3cf", to: "#f6b38f", angle: 160 },
  textColor: "#3a1d10",
  accentColor: "#d4532a",
  font: "jakarta",
  device: "midnight",
  showBadge: true,
};

const screens: { file: string; captions: Record<string, Caption> }[] = [
  {
    file: "1-today.png",
    captions: {
      "en-US": {
        badge: "Daily prompts",
        title: "Write a little, *every day*",
        subtitle: "One gentle question each morning. Two minutes is enough.",
      },
      tr: {
        badge: "Günlük sorular",
        title: "Her gün *biraz* yaz",
        subtitle: "Her sabah tek bir nazik soru. İki dakika yeter.",
      },
    },
  },
  {
    file: "2-entry.png",
    captions: {
      "en-US": {
        badge: "Photos and moods",
        title: "Keep the moments that *matter*",
        subtitle: "Add a photo, a mood and a few tags to every entry.",
      },
      tr: {
        badge: "Fotoğraf ve ruh hali",
        title: "Önemli anları *sakla*",
        subtitle: "Her kayda bir fotoğraf, ruh hali ve etiket ekle.",
      },
    },
  },
  {
    file: "3-calendar.png",
    captions: {
      "en-US": {
        badge: "Streaks",
        title: "Watch your habit *grow*",
        subtitle: "A calendar of every day you wrote, and your longest streak.",
      },
      tr: {
        badge: "Seriler",
        title: "Alışkanlığın gün gün *büyüsün*",
        subtitle: "Yazdığın her gün takvimde, en uzun serin hep görünür.",
      },
    },
  },
  {
    file: "4-insights.png",
    captions: {
      "en-US": {
        badge: "Insights",
        title: "Learn what makes you *happy*",
        subtitle: "See your mood over the week and what lifts it.",
      },
      tr: {
        badge: "Analiz",
        title: "Seni neyin *mutlu* ettiğini gör",
        subtitle: "Haftalık ruh halini ve onu neyin yükselttiğini gör.",
      },
    },
  },
];

const metadata: Record<string, Listing> = {
  "en-US": {
    ...EMPTY_LISTING,
    name: "Daybook: Daily Journal",
    subtitle: "Prompts, moods and streaks",
    promotionalText: "New: weekly insights show what lifts your mood.",
    description:
      "Daybook makes journaling a small, daily habit.\n\nEvery morning you get one gentle prompt. Write a sentence or a page, add a photo and a mood, and you are done.\n\nWATCH THE HABIT GROW\n• A calendar of every day you wrote\n• Streaks that reward showing up\n\nUNDERSTAND YOURSELF\n• Your mood across the week\n• The moments that lift it\n\nPRIVATE BY DEFAULT\nEntries stay on your device. No account needed.",
    // Spaces and a duplicate on purpose, so the keyword helper has something to tidy.
    keywords: "journal, diary,gratitude, mood tracker,habit,journal,reflection,self care,writing",
    whatsNew: "Weekly insights and a new Home Screen widget.",
    supportUrl: "https://example.com/daybook/support",
    privacyPolicyUrl: "https://example.com/daybook/privacy",
  },
  tr: {
    ...EMPTY_LISTING,
    name: "Daybook: Günlük Tut",
    subtitle: "Sorular, ruh hali ve seriler",
    promotionalText: "Yeni: haftalık analiz ruh halini neyin yükselttiğini gösteriyor.",
    description:
      "Daybook günlük tutmayı küçük, her günkü bir alışkanlığa çevirir.\n\nHer sabah tek bir nazik soru gelir. Bir cümle ya da bir sayfa yaz, fotoğraf ve ruh hali ekle, bitti.\n\nALIŞKANLIĞIN BÜYÜSÜN\n• Yazdığın her gün takvimde\n• Düzenli yazmayı ödüllendiren seriler\n\nKENDİNİ TANI\n• Haftalık ruh hali\n• Onu yükselten anlar\n\nVARSAYILAN OLARAK GİZLİ\nKayıtlar cihazında kalır. Hesap gerekmez.",
    keywords: "günlük,anı,şükran,ruh hali,alışkanlık,yazı,öz bakım",
    supportUrl: "https://example.com/daybook/support",
    privacyPolicyUrl: "https://example.com/daybook/privacy",
  },
};

type Db = BetterSQLite3Database<Record<string, unknown>>;

/** Replaces the Daybook demo app, leaving every other app untouched. */
export function seedDemo(db: Db, uploadsDir: string, screensDir: string) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const previous = db.select().from(apps).where(eq(apps.bundleId, DEMO_BUNDLE_ID)).get();
  if (previous) removeApp(db, uploadsDir, previous.id);

  const appId = crypto.randomUUID();
  db.insert(apps)
    .values({
      id: appId,
      name: "Daybook",
      bundleId: DEMO_BUNDLE_ID,
      primaryLocale: "en-US",
      locales: ["en-US", "tr"],
      design,
    })
    .run();

  screens.forEach((screen, position) => {
    const shots: Record<string, string> = {};
    for (const locale of ["en-US", "tr"]) {
      // The Dockerfile copies demo/screens next to the server; keep it out of file tracing.
      const bytes = fs.readFileSync(
        /*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ screensDir, locale, screen.file),
      );
      const info = readImageInfo(bytes);
      if (!info) throw new Error(`${screen.file} is not a PNG`);
      const id = crypto.randomUUID();
      fs.writeFileSync(path.join(uploadsDir, id), bytes);
      db.insert(files)
        .values({ id, appId, ...info })
        .run();
      shots[locale] = id;
    }
    db.insert(frames)
      .values({ id: crypto.randomUUID(), appId, position, captions: screen.captions, shots })
      .run();
  });

  for (const [locale, fields] of Object.entries(metadata)) {
    db.insert(listings).values({ appId, locale, fields }).run();
  }
  return appId;
}

/** Deletes every app and uploaded file, then adds Daybook again. Only for the public demo. */
export function resetDemo(db: Db, uploadsDir: string, screensDir: string) {
  for (const app of db.select({ id: apps.id }).from(apps).all()) removeApp(db, uploadsDir, app.id);
  fs.rmSync(uploadsDir, { recursive: true, force: true });
  return seedDemo(db, uploadsDir, screensDir);
}

function removeApp(db: Db, uploadsDir: string, appId: string) {
  for (const file of db.select().from(files).where(eq(files.appId, appId)).all()) {
    fs.rmSync(path.join(uploadsDir, file.id), { force: true });
  }
  db.delete(apps).where(eq(apps.id, appId)).run();
}
