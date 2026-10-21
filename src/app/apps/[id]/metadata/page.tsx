import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MetadataEditor } from "@/components/metadata/metadata-editor";
import { getApp } from "@/lib/apps/queries";
import { DEFAULT_DESIGN, parseDesign } from "@/lib/design/model";
import { listFrames } from "@/lib/frames/queries";
import { getListings } from "@/lib/listings/queries";

export async function generateMetadata(props: PageProps<"/apps/[id]/metadata">): Promise<Metadata> {
  const { id } = await props.params;
  const app = await getApp(id);
  return { title: app ? `${app.name} metadata` : "Metadata" };
}

export default function MetadataPage(props: PageProps<"/apps/[id]/metadata">) {
  return (
    <Suspense fallback={<div className="h-app bg-bg" />}>
      <MetadataLoader params={props.params} />
    </Suspense>
  );
}

async function MetadataLoader({ params }: { params: PageProps<"/apps/[id]/metadata">["params"] }) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) notFound();

  return (
    <MetadataEditor
      app={{
        id: app.id,
        name: app.name,
        bundleId: app.bundleId,
        primaryLocale: app.primaryLocale,
        locales: app.locales,
      }}
      design={app.design ? parseDesign(app.design) : DEFAULT_DESIGN}
      frames={(await listFrames(app.id)).map(({ id, captions, shots }) => ({ id, captions, shots }))}
      initialListings={await getListings(app.id)}
    />
  );
}
