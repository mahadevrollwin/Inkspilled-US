import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { descriptionFor, parseSlug, staticParams, titleFor } from "@/lib/routes";

type Params = { slug?: string[] };

export function generateStaticParams() {
  return staticParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const route = parseSlug(slug);
  return {
    title: titleFor(route),
    description: descriptionFor(route),
  };
}

async function PrefetchMarker() {
  await connection();
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrefetchMarker />
    </Suspense>
  );
}
