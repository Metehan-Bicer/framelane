"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemo } from "./mode";
import { isWorkspaceId, removeWorkspace, WORKSPACE_COOKIE } from "./workspaces";

/** Throws away the visitor's demo workspace; the next page load starts again from Daybook. */
export async function startOver() {
  if (!isDemo()) return;
  const id = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (isWorkspaceId(id)) removeWorkspace(id);
  redirect("/");
}
