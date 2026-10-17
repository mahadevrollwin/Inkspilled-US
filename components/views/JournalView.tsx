import type { CSSProperties } from "react";
import { PostLink } from "@/components/bits";
import { POSTS, findPost } from "@/lib/data";

export function JournalView({ id }: { id: string }) {
  const post = findPost(id) ?? POSTS[0];
  const others = POSTS.filter((item) => item.id !== post.id);
  const tone = { "--c": `var(--${post.ink})` } as CSSProperties;
  return (
    <>
      <div id="readbar" className="fixed top-0 left-0 z-[13] h-[3px] w-[var(--rp,0%)] bg-[linear-gradient(90deg,var(--red),var(--green),var(--blue))]" />
      <section className="gutter relative z-[3] pt-[138px] pb-[30px]">
        <div className="mx-auto grid w-full max-w-[780px] gap-[26px]">
          <a href="/#journal" data-go="journal" className="label inline-flex w-fit items-center gap-2.5 text-inherit no-underline">
            ← Journal
          </a>
          <div className="label text-muted flex items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: `var(--${post.ink})` }} />
            {post.cat} · {post.date} · {post.read} min read
          </div>
          <h1 className="font-serif m-0 text-[clamp(46px,6.6vw,108px)] leading-none font-normal tracking-[-0.02em] text-balance">{post.title}</h1>
          <div className="label text-muted">By Inkspilled Studio</div>
        </div>
      </section>
      <section className="gutter py-2.5 pb-10">
        <div className="site-wrap">
          <div id="pagePanel" data-ink={post.ink} className="relative grid h-[min(56vh,560px)] content-end p-6 [--cp:0]" />
        </div>
      </section>
      <article className="post-body gutter relative z-[3] py-[6vh] pb-[4vh]" style={tone}>
        <div className="mx-auto w-full max-w-[780px]">
          {post.body.map(([kind, value], i) => {
            if (kind === "p") return <p key={i} className="mb-[1.2em] text-[19px] leading-[1.75] text-[#2a2628]">{value}</p>;
            if (kind === "h") return <h2 key={i} className="font-display mt-[1.8em] mb-[0.6em] text-[clamp(24px,2.2vw,32px)] leading-[1.1] font-bold tracking-[-0.02em] uppercase">{value}</h2>;
            if (kind === "q") return <blockquote key={i} className="font-serif my-[1.6em] text-[clamp(30px,3.4vw,50px)] leading-[1.12] text-[var(--c)] italic text-balance">{value}</blockquote>;
            return (
              <figure key={i} className="my-[2em] grid gap-3">
                <div data-frame={post.ink} className="frame aspect-video w-full" />
                <figcaption className="label text-muted">{value}</figcaption>
              </figure>
            );
          })}
        </div>
      </article>
      <section className="gutter pt-[8vh] pb-[14vh]">
        <div className="mx-auto w-full max-w-[780px]">
          <div className="label relative z-[3]">Keep reading</div>
          <ul className="m-0 list-none p-0">
            {others.map((item) => (
              <PostLink key={item.id} post={item} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
