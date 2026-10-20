import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/editor/editor";
import { getApp } from "@/lib/apps/queries";
import { DEFAULT_DESIGN, parseDesign } from "@/lib/design/model";
import { listFrames } from "@/lib/frames/queries";

export async function generateMetadata(props: PageProps<"/apps/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const app = await getApp(id);
  return { title: app?.name ?? "Editor" };
}

export default function EditorPage(props: PageProps<"/apps/[id]">) {
  return (
    <Suspense fallback={<div className="light-table h-dvh" />}>
      <EditorLoader params={props.params} />
    </Suspense>
  );
}

async function EditorLoader({ params }: { params: PageProps<"/apps/[id]">["params"] }) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) notFound();
  const frames = listFrames(app.id);

  return (
    <Editor
      app={{
        id: app.id,
        name: app.name,
        bundleId: app.bundleId,
        primaryLocale: app.primaryLocale,
        locales: app.locales,
      }}
      initialDesign={app.design ? parseDesign(app.design) : DEFAULT_DESIGN}
      initialFrames={frames.map(({ id, captions, shots }) => ({ id, captions, shots }))}
    />
  );
}
