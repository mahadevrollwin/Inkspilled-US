/**
 * One-off import of the bundled site copy (lib/data.ts) and stand-in stills (public/ink/cells)
 * into the dataset. Safe to re-run: documents use fixed IDs and are replaced.
 *
 *   npm run seed
 */
import { createReadStream } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { DEFAULT_CONTENT } from "../../lib/data";

const client = getCliClient({ apiVersion: "2026-10-01" });
const publicDir = path.resolve(process.cwd(), "../public");

const assets = new Map<string, string>();
async function image(url: string) {
  let id = assets.get(url);
  if (!id) {
    const asset = await client.assets.upload("image", createReadStream(path.join(publicDir, url)), { filename: path.basename(url) });
    id = asset._id;
    assets.set(url, id);
  }
  return { _type: "image", asset: { _type: "reference", _ref: id } };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const isoDate = (monthYear: string) => {
  const [mon, year] = monthYear.split(" ");
  return `${year}-${String(MONTHS.indexOf(mon) + 1).padStart(2, "0")}-01`;
};
const key = (prefix: string, i: number) => `${prefix}${i}`;

async function main() {
  const { work, services, posts, process: steps, aboutImage } = DEFAULT_CONTENT;
  const docs: Record<string, unknown>[] = [];

  docs.push({
    _id: "siteSettings",
    _type: "siteSettings",
    aboutImage: await image(aboutImage),
    process: steps.map(([title, text], i) => ({ _key: key("step", i), _type: "step", title, text })),
  });

  for (const [i, w] of work.entries()) {
    docs.push({
      _id: `work-${w.id}`,
      _type: "work",
      title: w.t,
      slug: { _type: "slug", current: w.id },
      category: w.k,
      ink: w.ink,
      image: await image(w.image),
      year: w.year,
      client: w.client,
      services: w.services,
      brief: w.brief,
      idea: w.idea,
      made: w.made,
      frames: await Promise.all(w.frames.map(async (f, j) => ({ _key: key("frame", j), _type: "frame", caption: f.caption, image: await image(f.image) }))),
      order: (i + 1) * 10,
    });
  }

  for (const [i, s] of services.entries()) {
    docs.push({
      _id: `service-${s.id}`,
      _type: "service",
      name: s.name,
      slug: { _type: "slug", current: s.id },
      ink: s.ink,
      image: await image(s.image),
      desc: s.desc,
      tags: s.tags,
      intro: s.intro,
      includes: s.includes,
      formats: s.formats,
      related: s.related.map((id, j) => ({ _key: key("rel", j), _type: "reference", _ref: `work-${id}` })),
      order: (i + 1) * 10,
    });
  }

  for (const p of posts) {
    const body = [];
    for (const [j, block] of p.body.entries()) {
      if (block[0] === "fig") {
        body.push({ _key: key("b", j), _type: "figure", caption: block[1], image: await image(block[2]) });
        continue;
      }
      const style = { p: "normal", h: "h2", q: "blockquote" }[block[0]];
      body.push({
        _key: key("b", j),
        _type: "block",
        style,
        markDefs: [],
        children: [{ _key: key("s", j), _type: "span", marks: [], text: block[1] }],
      });
    }
    docs.push({
      _id: `post-${p.id}`,
      _type: "post",
      title: p.title,
      slug: { _type: "slug", current: p.id },
      category: p.cat,
      date: isoDate(p.date),
      readMinutes: p.read,
      ink: p.ink,
      pal: p.pal,
      image: await image(p.image),
      body,
    });
  }

  const tx = client.transaction();
  docs.forEach((doc) => tx.createOrReplace(doc as { _id: string; _type: string }));
  await tx.commit();
  console.log(`Seeded ${docs.length} documents and ${assets.size} images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
