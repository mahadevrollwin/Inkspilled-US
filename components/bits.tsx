import type { ReactNode } from "react";
import type { PostItem } from "@/lib/data";

export function Words({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, i) => {
    if (!part) return null;
    if (/^\s+$/.test(part)) return part;
    return (
      <span className="w" key={i}>
        {part}
      </span>
    );
  });
}

export function DisplayTitle({ text, italic = "text-[1.1em]" }: { text: string; italic?: string }) {
  const words = text.split(" ");
  if (words.length < 2) return text;
  return (
    <>
      {words.slice(0, -1).join(" ")} <span className={`it ${italic}`}>{words[words.length - 1].toLowerCase()}</span>
    </>
  );
}

export function PostLink({ post }: { post: PostItem }) {
  return (
    <li className="border-rule border-t transition-[padding] duration-500 ease-ink last:border-b hover:pl-[18px]">
      <a
        href={`/journal/${post.id}`}
        data-blob={post.ink}
        data-pal={post.pal}
        data-img={post.image}
        data-cursor="Read"
        data-go={`journal-${post.id}`}
        className="text-ink grid cursor-none grid-cols-1 items-baseline gap-6 py-[26px] no-underline max-[900px]:cursor-auto min-[901px]:grid-cols-[7em_minmax(0,1fr)_auto]"
      >
        <span className="label text-muted">{post.date}</span>
        <b className="font-serif text-[clamp(26px,3vw,46px)] leading-[1.08] font-normal tracking-[-0.01em]">{post.title}</b>
        <span className="label text-muted">{post.cat}</span>
      </a>
    </li>
  );
}

export function SectionHead({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
      <h2 className="font-display text-[clamp(46px,7vw,124px)] leading-[0.86] font-extrabold tracking-[-0.035em] uppercase">{title}</h2>
      {aside}
    </div>
  );
}
