import { createClient } from "@sanity/client";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_CONTENT, type Content, type InkName, type PostBlock } from "@/lib/data";

export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "6xr0skfc";
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const CONTENT_TAG = "sanity";

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2026-10-01",
  useCdn: true,
  perspective: "published",
});

const builder = createImageUrlBuilder({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET });
const imageUrl = (source?: SanityImageSource | null) =>
  source ? builder.image(source).width(1024).height(768).fit("crop").auto("format").url() : "";

const QUERY = `{
  "settings": *[_id == "siteSettings"][0]{ aboutImage, "process": process[]{ title, text } },
  "work": *[_type == "work" && defined(slug.current)] | order(order asc, _createdAt asc){
    "id": slug.current, title, category, ink, image, year, client, services, brief, idea, made, frames[]{ caption, image }
  },
  "services": *[_type == "service" && defined(slug.current)] | order(order asc, _createdAt asc){
    "id": slug.current, name, ink, image, desc, tags, intro, includes, formats, "related": related[]->slug.current
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(date desc){
    "id": slug.current, title, category, date, readMinutes, ink, pal, image, body
  }
}`;

type Img = SanityImageSource | null;
type Span = { text?: string };
type BodyItem = { _type: string; style?: string; children?: Span[]; caption?: string; image?: Img };
type Result = {
  settings: { aboutImage?: Img; process?: { title: string; text: string }[] } | null;
  work: {
    id: string;
    title: string;
    category?: string;
    ink?: InkName;
    image?: Img;
    year?: string;
    client?: string;
    services?: string[];
    brief?: string;
    idea?: string;
    made?: string[];
    frames?: { caption: string; image?: Img }[];
  }[];
  services: {
    id: string;
    name: string;
    ink?: InkName;
    image?: Img;
    desc?: string;
    tags?: string;
    intro?: string;
    includes?: string[];
    formats?: string[];
    related?: (string | null)[];
  }[];
  posts: {
    id: string;
    title: string;
    category?: string;
    date?: string;
    readMinutes?: number;
    ink?: InkName;
    pal?: InkName;
    image?: Img;
    body?: BodyItem[];
  }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (date?: string) => {
  const m = date?.match(/^(\d{4})-(\d{2})/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
};

const STYLE: Record<string, "p" | "h" | "q"> = { normal: "p", h2: "h", blockquote: "q" };

function toBlocks(body: BodyItem[] = []): PostBlock[] {
  return body.flatMap((item): PostBlock[] => {
    if (item._type === "figure") return [["fig", item.caption ?? "", imageUrl(item.image)]];
    if (item._type !== "block") return [];
    const text = (item.children ?? []).map((span) => span.text ?? "").join("");
    return text.trim() ? [[STYLE[item.style ?? "normal"] ?? "p", text]] : [];
  });
}

function toContent(data: Result): Content {
  const work: Content["work"] = data.work.map((w) => ({
    id: w.id,
    image: imageUrl(w.image),
    t: w.title,
    k: w.category ?? "",
    ink: w.ink ?? "red",
    year: w.year ?? "",
    client: w.client ?? "",
    services: w.services ?? [],
    brief: w.brief ?? "",
    idea: w.idea ?? "",
    made: w.made ?? [],
    frames: (w.frames ?? []).map((f) => ({ caption: f.caption, image: imageUrl(f.image) })),
  }));
  const services: Content["services"] = data.services.map((s) => ({
    id: s.id,
    name: s.name,
    ink: s.ink ?? "red",
    image: imageUrl(s.image),
    desc: s.desc ?? "",
    tags: s.tags ?? "",
    intro: s.intro ?? "",
    includes: s.includes ?? [],
    formats: s.formats ?? [],
    related: (s.related ?? []).filter((id): id is string => !!id),
  }));
  const posts: Content["posts"] = data.posts.map((p) => ({
    id: p.id,
    title: p.title,
    cat: p.category ?? "",
    date: monthYear(p.date),
    read: p.readMinutes ?? 5,
    ink: p.ink ?? "red",
    pal: p.pal ?? p.ink ?? "red",
    image: imageUrl(p.image),
    body: toBlocks(p.body),
  }));
  const process = (data.settings?.process ?? []).map((step): [string, string] => [step.title, step.text]);
  return {
    work: work.length ? work : DEFAULT_CONTENT.work,
    services: services.length ? services : DEFAULT_CONTENT.services,
    posts: posts.length ? posts : DEFAULT_CONTENT.posts,
    process: process.length ? process : DEFAULT_CONTENT.process,
    aboutImage: imageUrl(data.settings?.aboutImage) || DEFAULT_CONTENT.aboutImage,
  };
}

/** Site content from Sanity; each collection falls back to the bundled copy when empty, and everything does if Sanity is unreachable. */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CONTENT_TAG);
  try {
    return toContent(await client.fetch<Result>(QUERY));
  } catch (err) {
    console.error("Sanity content fetch failed; using bundled content.", err);
    return DEFAULT_CONTENT;
  }
}
