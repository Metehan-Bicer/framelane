import { z } from "zod";
import { isAppStoreLocale } from "@/lib/app-store/locales";

const locale = z.string().refine(isAppStoreLocale, "Not an App Store Connect locale");

export const newAppInput = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(30, "App Store names are at most 30 characters"),
    bundleId: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/, "Use reverse DNS, like com.example.app"),
    primaryLocale: locale,
    locales: z.array(locale).default([]),
  })
  .transform((input) => ({
    ...input,
    locales: [...new Set([input.primaryLocale, ...input.locales])],
  }));

export type NewAppInput = z.infer<typeof newAppInput>;
