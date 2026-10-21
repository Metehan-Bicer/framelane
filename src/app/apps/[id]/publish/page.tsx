import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublishView } from "@/components/publish/publish-view";
import { getApp } from "@/lib/apps/queries";
import { DEFAULT_DESIGN, parseDesign } from "@/lib/design/model";
import { listFrames } from "@/lib/frames/queries";

export async function generateMetadata(props: PageProps<"/apps/[id]/publish">): Promise<Metadata> {
  const { id } = await props.params;
  const app = await getApp(id);
  return { title: app ? `Publish ${app.name}` : "Publish" };
}

export default function PublishPage(props: PageProps<"/apps/[id]/publish">) {
  return (
    <Suspense fallback={<div className="h-app bg-bg" />}>
      <PublishLoader params={props.params} />
    </Suspense>
  );
}

async function PublishLoader({ params }: { params: PageProps<"/apps/[id]/publish">["params"] }) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) notFound();

  return (
    <PublishView
      app={{
        id: app.id,
        name: app.name,
        bundleId: app.bundleId,
        primaryLocale: app.primaryLocale,
        locales: app.locales,
      }}
      design={app.design ? parseDesign(app.design) : DEFAULT_DESIGN}
      frames={(await listFrames(app.id)).map(({ id, captions, shots }) => ({ id, captions, shots }))}
    />
  );
}
