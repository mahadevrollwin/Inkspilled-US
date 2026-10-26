import { DisplayTitle } from "@/components/bits";
import { WORK, findWork, pad } from "@/lib/data";

export function WorkView({ id }: { id: string }) {
  const work = findWork(id) ?? WORK[0];
  const index = Math.max(0, WORK.indexOf(work));
  const next = WORK[(index + 1) % WORK.length];
  return (
    <>
      <section className="gutter relative z-[3] pt-[138px] pb-11">
        <div className="site-wrap grid gap-[26px]">
          <a href="/#work" data-go="work" className="label inline-flex w-fit items-center gap-2.5 bg-transparent text-inherit no-underline">
            ← Selected work
          </a>
          <div className="label text-muted flex items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: `var(--${work.ink})` }} />
            Case study · {work.k} · {work.year}
          </div>
          <h1 className="font-display text-[clamp(56px,10.5vw,176px)] leading-[0.85] font-extrabold tracking-[-0.05em] uppercase">
            <DisplayTitle text={work.t} />
          </h1>
          <dl className="mt-3 grid grid-cols-2 gap-5 border-t border-rule pt-[18px] min-[901px]:grid-cols-4">
            <div>
              <dt className="font-mono mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Client</dt>
              <dd className="m-0 text-[15px]">{work.client}</dd>
            </div>
            <div>
              <dt className="font-mono mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Services</dt>
              <dd className="m-0 text-[15px]">{work.services.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-mono mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Year</dt>
              <dd className="m-0 text-[15px]">{work.year}</dd>
            </div>
            <div>
              <dt className="font-mono mb-2 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Deliverables</dt>
              <dd className="m-0 text-[15px]">{work.made.length} pieces</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="gutter py-2.5 pb-10">
        <div className="site-wrap">
          <div id="pagePanel" data-ink={work.ink} data-img={work.image} data-cursor="Play film" data-reel className="relative grid h-[min(76vh,780px)] content-end overflow-hidden rounded-block rounded-tr-none p-6 text-cream [--cp:0]">
            <div className="label relative z-[3] opacity-[var(--cp)]">Hero film · stand-in footage</div>
          </div>
        </div>
      </section>
      <section className="gutter relative z-[3] py-[9vh]">
        <div className="site-wrap grid grid-cols-1 gap-7 min-[901px]:grid-cols-2 min-[901px]:gap-14">
          <div>
            <div className="label">The brief</div>
            <p className="font-serif mt-3 text-[clamp(22px,2.3vw,36px)] leading-[1.28] text-pretty">{work.brief}</p>
          </div>
          <div>
            <div className="label">The idea</div>
            <p className="font-serif mt-3 text-[clamp(22px,2.3vw,36px)] leading-[1.28] text-pretty">{work.idea}</p>
          </div>
        </div>
      </section>
      <section className="gutter">
        <div className="site-wrap grid grid-cols-1 gap-7 min-[901px]:grid-cols-2">
          {work.frames.map((frame, i) => (
            <figure key={frame.caption} className={`m-0 grid min-w-0 gap-3 ${i === 0 ? "min-[901px]:col-span-2" : ""}`}>
              <div data-frame={work.ink} data-img={frame.image} className={`frame w-full max-w-full overflow-hidden rounded-block rounded-tr-none ${i === 0 ? "aspect-[21/9]" : "aspect-[4/3]"}`} />
              <figcaption className="label relative z-[3] text-muted">
                {pad(i + 1)} · {frame.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="gutter relative z-[3] py-[9vh]">
        <div className="site-wrap grid grid-cols-1 gap-7 min-[901px]:grid-cols-2 min-[901px]:gap-14">
          <div>
            <div className="label">What we made</div>
            <ul className="m-0 mt-4 list-none p-0">
              {work.made.map((item) => (
                <li key={item} className="font-display border-t border-rule py-4 text-[clamp(20px,1.9vw,30px)] leading-[1.2] font-bold tracking-[-0.02em] uppercase">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">Credits</div>
            <ul className="m-0 mt-4 list-none p-0">
              <Credit k="Studio" v="Inkspilled" />
              {work.services.map((service) => (
                <Credit key={service} k={service} v="Inkspilled team" />
              ))}
              <Credit k="Client" v={work.client} />
            </ul>
          </div>
        </div>
      </section>
      <section className="gutter relative z-[3] pt-[12vh] pb-[16vh]">
        <div className="site-wrap">
          <div className="label">Next project</div>
          <a href={`/work/${next.id}`} data-go={`work-${next.id}`} data-row={next.ink} data-cursor="Open" className="ink-fg mt-[18px] flex cursor-none items-center justify-between gap-5 border-y border-rule py-7 no-underline [--cp:0] max-[900px]:cursor-auto">
            <span className="font-display text-[clamp(44px,8vw,140px)] leading-[0.88] font-extrabold tracking-[-0.05em] uppercase">
              <DisplayTitle text={next.t} />
            </span>
            <span aria-hidden className="font-serif text-[clamp(40px,6vw,96px)] leading-none font-normal">
              →
            </span>
          </a>
        </div>
      </section>
    </>
  );
}

function Credit({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-4 border-t border-rule py-3">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </li>
  );
}
