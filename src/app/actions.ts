"use server";

import { revalidatePath } from "next/cache";
import { newAppInput } from "@/lib/apps/input";
import { insertApp } from "@/lib/apps/queries";

export type CreateAppState = {
  errors?: Partial<Record<"name" | "bundleId" | "primaryLocale" | "form", string>>;
  createdId?: string;
};

export async function createApp(_: CreateAppState, formData: FormData): Promise<CreateAppState> {
  const parsed = newAppInput.safeParse({
    name: formData.get("name"),
    bundleId: formData.get("bundleId"),
    primaryLocale: formData.get("primaryLocale"),
    locales: formData.getAll("locales"),
  });
  if (!parsed.success) {
    const errors: CreateAppState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<CreateAppState["errors"]>;
      errors[field] ??= issue.message;
    }
    return { errors };
  }

  try {
    const app = insertApp(parsed.data);
    revalidatePath("/");
    return { createdId: app.id };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { errors: { bundleId: "An app with this bundle ID already exists" } };
    }
    throw error;
  }
}
