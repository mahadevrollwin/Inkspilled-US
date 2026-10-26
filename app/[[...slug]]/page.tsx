import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { setContent } from "@/lib/data";
import { descriptionFor, parseSlug, staticParams, titleFor } from "@/lib/routes";
import { getContent } from "@/lib/sanity";

type Params = { slug?: string[] };

export async function generateStaticParams() {
  setContent(await getContent());
  return staticParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const [{ slug }, content] = await Promise.all([params, getContent()]);
  setContent(content);
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
